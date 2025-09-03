// 图片OCR识别API
// 使用豆包视觉模型 doubao-seed-1-6-vision-250815 进行图片文字识别

// 调用豆包API进行图片OCR
const callDoubaoVision = async (apiKey, modelName, imageBase64) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000) // 2分钟超时

    // 强制使用支持视觉的豆包模型
    const visionModel = 'doubao-seed-1-6-vision-250815'

    try {
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: visionModel,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                            }
                        },
                        {
                            type: 'text',
                            text: '请识别图片中的所有英文文本，保持原有段落结构，只输出文本内容，不要添加任何解释。'
                        }
                    ]
                }],
                temperature: 0.1,
                max_tokens: 3000
            }),
            signal: controller.signal
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(`图片识别失败: ${errorData.error?.message || response.statusText}`)
        }

        const data = await response.json()
        return data.choices[0]?.message?.content || ''
    } finally {
        clearTimeout(timeout)
    }
}

export const handler = async (event) => {
    // 处理CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    }

    // 处理预检请求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        }
    }

    // 只允许 POST 请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' })
        }
    }

    try {
        const { image, provider, apiKey, modelName } = JSON.parse(event.body || '{}')

        console.log('🖼️ 接收到图片OCR请求...')

        // 验证必要参数
        if (!image) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: '缺少图片数据' })
            }
        }

        if (!apiKey) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: '缺少API密钥' })
            }
        }

        console.log('📝 开始调用豆包视觉模型进行图片文字识别...')
        console.log('🔍 使用模型: doubao-seed-1-6-vision-250815')
        const startTime = Date.now()

        // 调用豆包Vision API，使用专门的视觉模型
        const extractedText = await callDoubaoVision(apiKey, modelName, image)

        const endTime = Date.now()
        const processingTime = endTime - startTime

        console.log(`✅ 图片识别完成，耗时: ${processingTime / 1000}秒`)
        console.log(`📄 识别到文本长度: ${extractedText.length} 字符`)

        // 返回识别结果
        const result = {
            success: true,
            extractedText: extractedText.trim(),
            processingTime,
            timestamp: new Date().toISOString(),
            metadata: {
                provider: 'doubao',
                model: 'doubao-seed-1-6-vision-250815', // 固定使用视觉模型
                textLength: extractedText.trim().length,
                hasContent: extractedText.trim().length > 0
            }
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(result)
        }

    } catch (error) {
        console.error('🚨 图片识别错误:', error)

        let errorMessage = '图片识别失败: 未知错误'

        if (error.message?.includes('API Key') || error.message?.includes('api_key')) {
            errorMessage = 'API密钥配置错误，请检查配置'
        } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
            errorMessage = 'API请求频率限制或配额不足，请稍后重试'
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            errorMessage = '网络连接错误，请检查网络连接'
        } else if (error.message?.includes('timeout')) {
            errorMessage = '图片识别超时，请尝试上传更小的图片'
        } else if (error.name === 'AbortError') {
            errorMessage = '图片识别超时，请稍后重试'
        } else if (error.message) {
            errorMessage = `图片识别失败: ${error.message}`
        }

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: errorMessage,
                timestamp: new Date().toISOString()
            })
        }
    }
}
