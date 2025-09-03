// 分析提示词 - 逐句精讲分析（不返回单词）
const ANALYSIS_PROMPT = `你是英语精讲分析专家。对每个句子进行详细分析并返回JSON格式：

{
  "title": "内容主题",
  "overview": "整体概述",
  "phrases": [
    {
      "phrase": "重点短语",
      "translation": "中文意思",
      "usage": "使用场合或语境",
      "example": "使用示例",
      "type": "类型(如：动词短语、介词短语、固定搭配等)"
    }
  ],
  "sentences": [
    {
      "id": "s1",
      "original": "原句",
      "translation": "中文翻译",
      "structure": "句子结构分析(如：主谓宾、复合句等)",
      "grammar": [
        {
          "point": "语法点名称",
          "explanation": "详细解释",
          "example": "示例句子",
          "usage": "使用场合"
        }
      ],
      "breakdown": "句子成分详细分解",
      "keyPoints": "重点难点总结"
    }
  ]
}

分析要求：
1. 识别重点短语：包括常用短语、固定搭配、习语、动词短语、介词短语等
2. 对每个句子进行独立深入分析
3. 重点分析复杂语法：时态、语态、从句、非谓语、虚拟语气等
4. 提供句子结构拆解和成分分析
5. 给出学习重点和难点提示
6. 只返回JSON格式，无其他文本`

// 直接调用豆包API（带超时控制）
const callDoubaoAPI = async (apiKey, modelName, messages) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 300000) // 5分钟超时

    try {
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelName || 'deepseek-v3-1-250821',
                messages: messages,
                temperature: 0.3,
                max_tokens: 4000 // 增加token限制
            }),
            signal: controller.signal
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(`豆包API调用失败: ${errorData.error?.message || response.statusText}`)
        }

        const data = await response.json()
        return data.choices[0]?.message?.content || ''
    } finally {
        clearTimeout(timeout)
    }
}

// 直接调用 Gemini API（带超时控制）
const callGeminiAPI = async (apiKey, modelName, messages) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 300000) // 5分钟超时

    try {
        const prompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName || 'gemini-2.0-flash-exp'}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 4000, // 增加token限制
                }
            }),
            signal: controller.signal
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(`Gemini API调用失败: ${errorData.error?.message || response.statusText}`)
        }

        const data = await response.json()
        return data.candidates[0]?.content?.parts[0]?.text || ''
    } finally {
        clearTimeout(timeout)
    }
}

// 尝试修复不完整的JSON
function fixIncompleteJSON(jsonStr) {
    jsonStr = jsonStr.trim()

    let openBraces = (jsonStr.match(/\{/g) || []).length
    let closeBraces = (jsonStr.match(/\}/g) || []).length
    let openBrackets = (jsonStr.match(/\[/g) || []).length
    let closeBrackets = (jsonStr.match(/\]/g) || []).length

    let fixed = jsonStr

    while (openBrackets > closeBrackets) {
        fixed += ']'
        closeBrackets++
    }

    while (openBraces > closeBraces) {
        fixed += '}'
        closeBraces++
    }

    fixed = fixed.replace(/,\s*([\]}])/g, '$1')

    return fixed
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
        const { text, sentences, provider, apiKey, modelName } = JSON.parse(event.body || '{}')

        // 支持两种模式：句子数组或整体文本
        if (!text && (!sentences || !Array.isArray(sentences))) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: '缺少待分析的文本或句子数组' })
            }
        }

        if (!apiKey) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: '缺少API密钥' })
            }
        }

        console.log('使用AI提供商:', provider)

        // 准备分析内容
        let analysisContent = ''
        let isLegacyMode = false
        let processedText = text // 在外层声明变量

        if (sentences && Array.isArray(sentences)) {
            // 新模式：逐句分析 - 支持完整句子数量
            analysisContent = `请逐句分析以下英语句子：\n\n${sentences.map((sentence, index) => `${index + 1}. ${sentence}`).join('\n')}`
            console.log(`逐句分析模式，共 ${sentences.length} 个句子`)
        } else {
            // 兼容模式：整体文本分析
            const MAX_TEXT_LENGTH = 5000
            if (text && text.length > MAX_TEXT_LENGTH) {
                processedText = text.substring(0, MAX_TEXT_LENGTH) + '...'
                console.log('文本过长，已截断处理')
            }
            analysisContent = processedText || text
            isLegacyMode = true
            console.log('兼容模式：整体文本分析')
        }

        // 生成文本
        let responseText = ''

        try {
            console.log('准备调用AI API...')
            const messages = [
                {
                    role: 'system',
                    content: ANALYSIS_PROMPT
                },
                {
                    role: 'user',
                    content: analysisContent
                }
            ]

            console.log(`开始调用 ${provider} API...`)
            const startTime = Date.now()

            if (provider === 'doubao') {
                responseText = await callDoubaoAPI(apiKey, modelName, messages)
            } else {
                responseText = await callGeminiAPI(apiKey, modelName, messages)
            }

            const endTime = Date.now()
            console.log(`AI响应获取成功，耗时: ${(endTime - startTime) / 1000}秒`)

        } catch (genError) {
            console.error('AI生成错误:', genError)

            // 更详细的错误处理
            if (genError.name === 'AbortError') {
                throw new Error('AI API请求超时（5分钟），请尝试减少文本长度或稍后重试')
            } else if (genError.message?.includes('fetch')) {
                throw new Error('网络连接错误，请检查网络状态后重试')
            } else {
                throw new Error(`AI API调用失败: ${genError.message || '未知错误'}`)
            }
        }

        // 解析 JSON 响应
        let result
        try {
            responseText = responseText.trim()

            // 多种解析策略
            const parseStrategies = [
                () => JSON.parse(responseText),
                () => {
                    const jsonCodeBlock = responseText.match(/```json\s*([\s\S]*?)```/i)
                    if (jsonCodeBlock && jsonCodeBlock[1]) {
                        return JSON.parse(jsonCodeBlock[1].trim())
                    }
                    throw new Error('No JSON code block found')
                },
                () => {
                    const codeBlock = responseText.match(/```\s*([\s\S]*?)```/)
                    if (codeBlock && codeBlock[1]) {
                        let content = codeBlock[1].trim()
                        if (content.startsWith('{') && content.includes('"title"')) {
                            return JSON.parse(content)
                        }
                    }
                    throw new Error('No valid code block found')
                },
                () => {
                    const jsonMatch = responseText.match(/\{[\s\S]*?\}(?=\s*$|\s*```|\s*\n|$)/)
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0])
                    }
                    throw new Error('No JSON object found')
                },
                () => {
                    let fixedJson = fixIncompleteJSON(responseText)
                    return JSON.parse(fixedJson)
                }
            ]

            let lastError = null
            for (let i = 0; i < parseStrategies.length; i++) {
                try {
                    result = parseStrategies[i]()
                    break
                } catch (error) {
                    lastError = error
                    continue
                }
            }

            if (!result) {
                throw lastError || new Error('All parsing strategies failed')
            }

            // 验证结果结构
            if (!result || typeof result !== 'object') {
                throw new Error('解析结果不是有效的对象')
            }

            if (!result.title && !result.paragraphs && !result.sentences) {
                throw new Error('解析结果缺少必要的字段')
            }

        } catch (parseError) {
            console.error('JSON解析错误:', parseError)
            throw new Error(`AI响应解析失败: ${parseError.message}`)
        }

        // 确保返回的数据结构完整
        const analysisResult = {
            title: result.title || '英文精讲',
            overview: result.overview || '',
            // 重点短语
            phrases: result.phrases || [],
            // 新的句子级分析结构
            sentences: result.sentences || [],
            // 兼容旧格式
            paragraphs: result.paragraphs || [],
            originalText: text || (sentences ? sentences.join(' ') : ''),
            analysisMode: sentences ? 'sentence' : 'paragraph',
            processed: isLegacyMode && text && processedText !== text
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(analysisResult)
        }

    } catch (error) {
        console.error('分析错误:', error)

        let errorMessage = '分析失败: 未知错误'

        if (error.message?.includes('API Key') || error.message?.includes('api_key')) {
            errorMessage = 'API密钥配置错误，请检查配置'
        } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
            errorMessage = 'API请求频率限制或配额不足，请稍后重试'
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            errorMessage = '网络连接错误，请检查网络连接'
        } else if (error.message?.includes('model') || error.message?.includes('不存在')) {
            errorMessage = 'AI模型配置错误，请检查模型名称'
        } else if (error.message?.includes('timeout')) {
            errorMessage = '请求超时，请稍后重试'
        } else if (error.message) {
            errorMessage = `分析失败: ${error.message}`
        }

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: errorMessage })
        }
    }
}