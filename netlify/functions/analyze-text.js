// 简化的句子分割函数（后端使用）
function splitTextIntoSentences(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }

    // 清理文本：移除多余的空白符和换行符
    const cleanText = text.trim().replace(/\s+/g, ' ');

    // 常见缩写词列表（避免误分割）
    const abbreviations = [
        'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr',
        'vs', 'etc', 'e.g', 'i.e', 'a.m', 'p.m',
        'U.S', 'U.K', 'U.N', 'E.U', 'A.I',
        'St', 'Ave', 'Blvd', 'Rd', 'Ltd', 'Inc', 'Corp'
    ];

    // 为缩写词添加临时标记，避免在这些位置分割
    let markedText = cleanText;
    abbreviations.forEach(abbr => {
        const regex = new RegExp(`\\b${abbr}\\.`, 'gi');
        markedText = markedText.replace(regex, `${abbr}__ABBR__`);
    });

    // 使用句号、问号、感叹号分割句子
    const sentenceRegex = /[.!?]+(?=\s+[A-Z]|$)/g;
    const sentences = markedText.split(sentenceRegex);

    // 处理分割后的句子
    const processedSentences = sentences
        .map(sentence => {
            // 恢复缩写词中的句号
            return sentence.replace(/__ABBR__/g, '.');
        })
        .map(sentence => sentence.trim())
        .filter(sentence => {
            // 过滤掉空句子和过短的句子
            return sentence.length > 2 && /[a-zA-Z]/.test(sentence);
        })
        .map(sentence => {
            // 确保每个句子都有适当的结束标点
            if (!/[.!?]$/.test(sentence)) {
                sentence += '.';
            }
            return sentence;
        })
        // 去重：移除重复的句子
        .filter((sentence, index, array) => {
            const normalizedSentence = sentence.toLowerCase().trim();
            return array.findIndex(s => s.toLowerCase().trim() === normalizedSentence) === index;
        });

    console.log(`✅ 文本分割完成: ${processedSentences.length} 个句子`)
    return processedSentences;
}

// 强制JSON格式提示词
const ANALYSIS_PROMPT = `⚠️ 紧急系统指令：你必须严格按照以下要求操作，任何偏差都会导致系统崩溃！

🔴 **绝对禁令** - 以下内容完全禁止出现在你的回复中：
- 任何解释文字（如"下面是分析"、"好的"、"根据你的要求"等）
- Markdown代码块标记（\`\`\`json、\`\`\`等）
- 换行符或格式化空格（除JSON结构需要）
- 注释或说明文字
- 任何非JSON字符

🟢 **唯一允许的回复格式**：
纯JSON字符串，直接以{开始，以}结束，无任何其他内容。

**任务**：分析编号的英语句子，对每个编号句子生成对应的分析。

**必须严格遵守的JSON结构**：
{"title":"内容主题","overview":"整体概述","sentences":[{"id":"s1","original":"第1句完整原文","translation":"中文翻译","structure":"句子结构分析","phrases":[{"phrase":"重点短语","translation":"中文意思","usage":"使用说明","example":"例句","exampleTranslation":"例句翻译","type":"短语类型"}],"grammar":[{"point":"语法点名称","explanation":"详细解释","example":"语法例句","exampleTranslation":"例句翻译","usage":"使用场合"}],"breakdown":"句子成分分解","keyPoints":"重点总结"},{"id":"s2","original":"第2句完整原文","translation":"中文翻译","structure":"句子结构分析","phrases":[],"grammar":[],"breakdown":"句子成分分解","keyPoints":"重点总结"}]}

🚨 **强制要求**：
1. 回复必须以{开始，以}结束
2. 必须能通过JSON.parse()直接解析
3. 输入几个编号句子就输出几个sentence对象
4. 每个句子的"original"字段必须是对应编号的完整原文
5. 所有字符串值内的双引号必须转义
6. 数组最后一个元素后不要加逗号
7. 对象最后一个属性后不要加逗号

🔄 **测试检查**：在回复前，确保你的输出能通过以下测试：
- JSON.parse(你的回复) 不会抛出错误
- 你的回复不包含任何解释文字
- 你的回复直接以{开始

⛔ **错误示例**（绝对不要这样回复）：
好的，下面是分析结果：
\`\`\`json
{"title":"..."}
\`\`\`

✅ **正确示例**（严格按此格式）：
{"title":"示例","overview":"概述","sentences":[{"id":"s1","original":"This is example.","translation":"这是例子。","structure":"主谓宾","phrases":[],"grammar":[],"breakdown":"主语：This，谓语：is，宾语：example","keyPoints":"基础句型"}]}

现在开始分析，记住：只返回纯JSON，任何其他内容都会导致系统错误！`

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

// 超强JSON修复函数
function fixIncompleteJSON(jsonStr) {
    console.log('🔧 开始修复JSON，原始长度:', jsonStr.length)

    jsonStr = jsonStr.trim()

    // 1. 清理控制字符（这是导致"Bad control character"错误的原因）
    // 只保留可打印字符、换行符、制表符和空格
    jsonStr = jsonStr.split('').filter(char => {
        const code = char.charCodeAt(0)
        return code >= 32 || code === 9 || code === 10 || code === 13
    }).join('')

    // 2. 修复常见的中文引号问题
    jsonStr = jsonStr.replace(/"/g, '"').replace(/"/g, '"')

    // 3. 修复引号嵌套问题 - 先标记然后修复
    // 找到所有 "key": "value中包含引号的情况
    jsonStr = jsonStr.replace(/"([^"]*)":\s*"([^"]*"[^"]*[^"]*)"([^"}]*)/g, (match, key, value, after) => {
        // 转义value中的引号
        const cleanValue = value.replace(/"/g, '\\"')
        return `"${key}": "${cleanValue}"${after}`
    })

    // 4. 修复 "key": 值没有引号的情况
    jsonStr = jsonStr.replace(/:\s*([^"\s[{][^,}]]*?)(?=\s*[,}]])/g, (match, content) => {
        content = content.trim()
        if (!content.match(/^(true|false|null|\d+(\.\d+)?|\[|\{|".*")$/) && content.length > 0) {
            content = content.replace(/"/g, '\\"')
            return `: "${content}"`
        }
        return match
    })

    // 5. 修复缺少逗号的问题 - 更智能的检测
    // 处理 "key": "value" "nextkey": 的情况
    jsonStr = jsonStr.replace(/"\s*\n?\s*"/g, '",\n"')
    jsonStr = jsonStr.replace(/}\s*\n?\s*"/g, '},\n"')
    jsonStr = jsonStr.replace(/]\s*\n?\s*"/g, '],\n"')

    // 处理对象和数组后缺少逗号
    jsonStr = jsonStr.replace(/}(\s*)"/g, '},$1"')
    jsonStr = jsonStr.replace(/](\s*)"/g, '],$1"')

    // 6. 修复引号内的引号导致的问题
    // 查找 "usage":让他人记住重要信息" 这样的模式
    jsonStr = jsonStr.replace(/"([^"]*)":\s*([^"][^,}]*?)"/g, '"$1": "$2"')

    // 7. 修复多余的逗号
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1')
    jsonStr = jsonStr.replace(/,\s*,/g, ',')

    // 8. 修复未闭合的括号
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

    // 9. 最终清理
    fixed = fixed.replace(/,\s*([\]}])/g, '$1')

    // 10. 移除可能的双逗号
    fixed = fixed.replace(/,,+/g, ',')

    console.log('🔧 JSON修复完成，修复后长度:', fixed.length)

    // 如果修复后的长度变化很大，记录详细信息
    if (Math.abs(fixed.length - jsonStr.length) > 100) {
        console.log('⚠️ JSON修复变化较大，长度差异:', fixed.length - jsonStr.length)
    }

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

        console.log('📝 接收到分析请求...')
        console.log('使用AI提供商:', provider)

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
            // 兼容模式：整体文本分析 - 需要先分割成句子
            const MAX_TEXT_LENGTH = 5000
            if (text && text.length > MAX_TEXT_LENGTH) {
                processedText = text.substring(0, MAX_TEXT_LENGTH) + '...'
                console.log('文本过长，已截断处理')
            }

            // 将完整文本分割为句子进行分析
            const textToAnalyze = processedText || text
            const sentencesFromText = splitTextIntoSentences(textToAnalyze)

            // 使用逐句分析格式
            analysisContent = `请逐句分析以下英语句子：\n\n${sentencesFromText.map((sentence, index) => `${index + 1}. ${sentence}`).join('\n')}`
            isLegacyMode = true
            console.log(`✅ 兼容模式：分析 ${sentencesFromText.length} 个句子`)
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

            // 第一次尝试
            if (provider === 'doubao') {
                responseText = await callDoubaoAPI(apiKey, modelName, messages)
            } else {
                responseText = await callGeminiAPI(apiKey, modelName, messages)
            }

            // 检查AI是否遵守了指令
            const trimmedResponse = responseText.trim()
            const isValidResponse = trimmedResponse.startsWith('{') &&
                !trimmedResponse.includes('```') &&
                !trimmedResponse.includes('下面是') &&
                !trimmedResponse.includes('好的') &&
                !trimmedResponse.includes('根据') &&
                !trimmedResponse.includes('分析结果')

            if (!isValidResponse) {
                console.log('🚨 AI第一次回复违规，发送严厉警告并重试')

                // 构建更严厉的重试消息
                const retryMessages = [
                    {
                        role: 'system',
                        content: `🔴 CRITICAL ERROR! 你的回复违反了系统要求！

🚨 ABSOLUTE REQUIREMENT: 只返回纯JSON，任何其他内容都会导致系统崩溃！

输出格式：{"title":"...","overview":"...","sentences":[...]}

绝对禁止：解释文字、markdown标记、中文说明

THIS IS YOUR FINAL CHANCE!`
                    },
                    {
                        role: 'user',
                        content: `严格按照JSON格式重新分析，只返回JSON：\n\n${analysisContent}`
                    }
                ]

                // 重试调用
                if (provider === 'doubao') {
                    responseText = await callDoubaoAPI(apiKey, modelName, retryMessages)
                } else {
                    responseText = await callGeminiAPI(apiKey, modelName, retryMessages)
                }

                console.log('🔄 重试调用完成')
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
            console.log('🔍 AI原始响应长度:', responseText.length)
            console.log('🔍 AI响应前200字符:', responseText.substring(0, 200))

            // 🚨 强制验证：AI必须返回纯JSON
            if (!responseText.startsWith('{')) {
                console.log('⚠️ AI违规：回复不是以{开始，尝试强制提取JSON')
                // 强制提取JSON部分
                const jsonStart = responseText.indexOf('{')
                const jsonEnd = responseText.lastIndexOf('}')
                if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                    responseText = responseText.substring(jsonStart, jsonEnd + 1)
                    console.log('🔧 强制提取的JSON长度:', responseText.length)
                } else {
                    throw new Error('AI响应中未找到有效的JSON结构')
                }
            }

            // 验证是否包含违规内容
            if (responseText.includes('```') || responseText.includes('下面是') || responseText.includes('好的')) {
                console.log('⚠️ AI违规：回复包含禁止内容，尝试清理')
                // 再次尝试提取纯JSON
                const jsonMatch = responseText.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                    responseText = jsonMatch[0]
                    console.log('🔧 清理后的JSON长度:', responseText.length)
                }
            }

            // 清理AI响应中的markdown代码块格式
            function cleanAIResponse(text) {
                // 移除开头和结尾的```json和```
                text = text.replace(/^```json\s*/i, '').replace(/```\s*$/g, '')
                // 移除开头和结尾的```
                text = text.replace(/^```\s*/g, '').replace(/```\s*$/g, '')
                // 移除可能的多余空行
                text = text.trim()
                return text
            }

            // 多种解析策略
            const parseStrategies = [
                // 策略1：直接解析（已经是纯JSON）
                () => JSON.parse(responseText),

                // 策略2：清理markdown格式后解析
                () => {
                    const cleaned = cleanAIResponse(responseText)
                    return JSON.parse(cleaned)
                },

                // 策略3：提取```json代码块
                () => {
                    const jsonCodeBlock = responseText.match(/```json\s*([\s\S]*?)```/i)
                    if (jsonCodeBlock && jsonCodeBlock[1]) {
                        return JSON.parse(jsonCodeBlock[1].trim())
                    }
                    throw new Error('No JSON code block found')
                },

                // 策略4：提取任意代码块
                () => {
                    const codeBlock = responseText.match(/```\s*([\s\S]*?)```/)
                    if (codeBlock && codeBlock[1]) {
                        let content = codeBlock[1].trim()
                        // 移除可能的语言标识符
                        content = content.replace(/^json\s*/i, '')
                        if (content.startsWith('{') && content.includes('"title"')) {
                            return JSON.parse(content)
                        }
                    }
                    throw new Error('No valid code block found')
                },

                // 策略5：查找JSON对象
                () => {
                    const jsonMatch = responseText.match(/\{[\s\S]*?\}(?=\s*$|\s*```|\s*\n|$)/)
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0])
                    }
                    throw new Error('No JSON object found')
                },

                // 策略6：修复不完整的JSON
                () => {
                    let fixedJson = fixIncompleteJSON(cleanAIResponse(responseText))
                    return JSON.parse(fixedJson)
                },

                // 策略7：强力修复AI格式问题
                () => {
                    let cleaned = cleanAIResponse(responseText)

                    // 修复常见的AI格式问题
                    // 1. 修复没有引号的中文值
                    cleaned = cleaned.replace(/:\s*([^"\s[{,}][^,}]*?)(?=\s*[,}])/g, (match, value) => {
                        value = value.trim()
                        // 如果不是数字、布尔值、null且没有引号，则添加引号
                        if (!value.match(/^(true|false|null|\d+(\.\d+)?|\[|\{)/) && !value.startsWith('"')) {
                            return `: "${value}"`
                        }
                        return match
                    })

                    // 2. 修复行尾的值（最后一个属性）
                    cleaned = cleaned.replace(/:\s*([^"\s[{,}][^}]*?)(?=\s*})/g, (match, value) => {
                        value = value.trim()
                        if (!value.match(/^(true|false|null|\d+(\.\d+)?|\[|\{)/) && !value.startsWith('"')) {
                            return `: "${value}"`
                        }
                        return match
                    })

                    // 3. 转义已存在字符串中的未转义双引号
                    cleaned = cleaned.replace(/"([^"\\]*)"/g, (match, content) => {
                        if (content.includes('"')) {
                            content = content.replace(/"/g, '\\"')
                            return `"${content}"`
                        }
                        return match
                    })

                    return JSON.parse(cleaned)
                },

                // 策略8：分段救援解析
                () => {
                    console.log('🆘 尝试救援策略：分段截断解析')
                    const cleaned = cleanAIResponse(responseText)

                    // 尝试找到完整的sentences数组部分
                    const sentencesMatch = cleaned.match(/"sentences":\s*\[([\s\S]*?)\]/g)
                    if (sentencesMatch) {
                        // 构建最小可用结构
                        const partialResult = {
                            title: "部分解析结果",
                            overview: "由于JSON格式问题，仅解析了部分内容",
                            sentences: []
                        }

                        try {
                            // 尝试解析sentences数组
                            const sentencesStr = sentencesMatch[0]
                            const sentencesFixed = fixIncompleteJSON(`{${sentencesStr}}`)
                            const sentencesObj = JSON.parse(sentencesFixed)
                            partialResult.sentences = sentencesObj.sentences || []

                            console.log('🆘 救援成功，解析到', partialResult.sentences.length, '个句子')
                            return partialResult
                        } catch (e) {
                            console.log('🆘 救援策略也失败:', e.message)
                            throw e
                        }
                    }

                    throw new Error('救援策略：无法找到sentences数组')
                },

                // 策略9：极简兜底策略
                () => {
                    console.log('🚨 最后兜底：返回基础结构')
                    // 只返回一个基本结构，确保程序不会崩溃
                    return {
                        title: "解析失败",
                        overview: "AI响应格式错误，无法完整解析。原始响应长度: " + responseText.length,
                        sentences: [{
                            id: "error_1",
                            original: "JSON parsing failed - response format error",
                            translation: "JSON解析失败 - 响应格式错误",
                            structure: "解析错误：AI返回的JSON格式不正确",
                            phrases: [],
                            grammarPoints: []
                        }]
                    }
                }
            ]

            let lastError = null
            for (let i = 0; i < parseStrategies.length; i++) {
                try {
                    console.log(`🔧 尝试解析策略 ${i + 1}/${parseStrategies.length}`)
                    result = parseStrategies[i]()
                    console.log(`✅ 解析策略 ${i + 1} 成功`)
                    break
                } catch (error) {
                    console.log(`❌ 解析策略 ${i + 1} 失败:`, error.message)
                    lastError = error
                    continue
                }
            }

            if (!result) {
                console.log('🚨 所有解析策略都失败了')
                console.log('🔍 最后错误:', lastError?.message)
                // 保存失败的内容供调试
                console.log('🔍 解析失败的内容（前500字符）:', responseText.substring(0, 500))
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