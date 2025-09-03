#!/usr/bin/env node

// 自定义开发服务器，解决 Netlify CLI 30秒超时问题
import express from 'express'
import cors from 'cors'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

const app = express()
const PORT = 3000
const VITE_PORT = 5173

// 启用 CORS 和 JSON 解析
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 构建项目
console.log('🔨 构建项目...')
const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: projectRoot,
    stdio: 'inherit'
})

let buildCompleted = false
buildProcess.on('close', (code) => {
    if (code === 0) {
        console.log('✅ 项目构建完成')
        buildCompleted = true
    } else {
        console.error('❌ 项目构建失败')
        process.exit(1)
    }
})

// 等待构建完成
const waitForBuild = async () => {
    while (!buildCompleted) {
        await new Promise(resolve => setTimeout(resolve, 100))
    }
}

await waitForBuild()

// 导入分析函数
let analyzeHandler
try {
    const analyzeModule = await import('../netlify/functions/analyze-text.js')
    analyzeHandler = analyzeModule.handler
    console.log('✅ 成功加载分析函数')
} catch (error) {
    console.error('❌ 加载分析函数失败:', error)
    process.exit(1)
}

// 导入图片识别函数
let imageOcrHandler
try {
    const imageOcrModule = await import('../netlify/functions/image-ocr.js')
    imageOcrHandler = imageOcrModule.handler
    console.log('✅ 成功加载图片识别函数')
} catch (error) {
    console.error('❌ 加载图片识别函数失败:', error)
    process.exit(1)
}

// API 路由
app.post('/.netlify/functions/analyze-text', async (req, res) => {
    console.log('📝 接收到分析请求...')

    try {
        const event = {
            httpMethod: 'POST',
            body: JSON.stringify(req.body),
            headers: req.headers
        }

        const result = await analyzeHandler(event)

        res.status(result.statusCode || 200)

        // 设置响应头
        if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => {
                res.setHeader(key, value)
            })
        }

        res.send(result.body)

    } catch (error) {
        console.error('❌ 函数执行错误:', error)
        res.status(500).json({ error: '服务器内部错误' })
    }
})

// 图片识别 API 路由
app.post('/.netlify/functions/image-ocr', async (req, res) => {
    console.log('🖼️ 接收到图片识别请求...')

    try {
        const event = {
            httpMethod: 'POST',
            body: JSON.stringify(req.body),
            headers: req.headers
        }

        const result = await imageOcrHandler(event)

        res.status(result.statusCode || 200)

        // 设置响应头
        if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => {
                res.setHeader(key, value)
            })
        }

        res.send(result.body)

    } catch (error) {
        console.error('❌ 图片识别函数执行错误:', error)
        res.status(500).json({ error: '图片识别服务器内部错误' })
    }
})

// 处理 OPTIONS 请求
app.options('/.netlify/functions/analyze-text', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.status(200).send('')
})

app.options('/.netlify/functions/image-ocr', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.status(200).send('')
})

// 静态文件服务（直接服务dist目录）
app.use(express.static(join(projectRoot, 'dist')))

// 处理SPA路由，返回index.html
app.use((req, res, next) => {
    // 如果请求的是API路径，跳过
    if (req.path.startsWith('/.netlify/functions/')) {
        return next()
    }

    // 如果请求的是静态文件且文件存在，跳过
    if (req.path.includes('.') && req.path !== '/') {
        return next()
    }

    // 对于其他路径，返回index.html（SPA路由）
    res.sendFile(join(projectRoot, 'dist', 'index.html'))
})

// 启动服务器
app.listen(PORT, () => {
    console.log(`
🌟 自定义开发服务器已启动！

  ➜  Local:       http://localhost:${PORT}
  ➜  分析API:     http://localhost:${PORT}/.netlify/functions/analyze-text
  ➜  图片识别:     http://localhost:${PORT}/.netlify/functions/image-ocr
  
✨ 特性：
  • ✅ 无 30 秒函数超时限制
  • 🚀 支持长时间 AI 分析
  • 🖼️ 支持图片文字识别
  • 🔧 完整的 CORS 支持
  
按 Ctrl+C 停止服务器
`)
})

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...')
    process.exit(0)
})

process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭服务器...')
    process.exit(0)
})
