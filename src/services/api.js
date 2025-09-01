import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'

const ANALYSIS_PROMPT = `你是一个专业的英语语法和句式分析AI助手。请专注分析给定英文文本的语法结构和复杂句式，提供深度的语法学习指导。

请严格按照以下JSON格式返回：

{
  "title": "标题中文翻译",
  "overview": "简短概述",
  "difficulty": "中级",
  "paragraphs": [
    {
      "id": "p1",
      "original": "原文",
      "translation": "中文翻译",
      "grammar": [
        {
          "point": "语法点名称",
          "explanation": "详细的语法规则解释（50-80字）",
          "example": "例句",
          "usage": "使用场景和注意事项"
        }
      ],
      "sentences": [
        {
          "original": "复杂句子",
          "translation": "翻译",
          "structure": "详细的语法结构分析",
          "breakdown": "句子成分逐层分析",
          "difficulty": "难度级别（初级/中级/高级）"
        }
      ]
    }
  ]
}

**专业分析要求：**

1. **语法点深度分析**：
   - **严格排除基础语法**（以下内容一律不分析）：
     * 基础连词：and, but, or, so, yet, for等
     * 简单介词：in, on, at, by, with, from等
     * 基础助动词：be, do, have的一般用法
     * 基础时态：一般现在时、一般过去时的常规用法
     * 基础代词：this, that, these, those, it等
     * 基础冠词：a, an, the的常规用法
     * 基础比较级：better than, more...than的简单比较
   
   - **必须分析的高价值语法结构**：
     * 从句系统：定语从句、状语从句、名词性从句
     * 非谓语动词：分词结构、不定式用法、动名词
     * 特殊句式：倒装、强调、省略、虚拟语气
     * 复杂时态：完成时、进行时的深层用法和语法意义
     * 语态变化：主被动转换的深层语法逻辑
     * 句式结构：并列句的复杂逻辑关系、从句嵌套
     * 语法搭配：固定搭配、习惯用法、特殊语法现象
   
   - **分析深度要求**：
     * 解释语法规则的形成原理和深层逻辑
     * 说明使用场景和语境的细微差别
     * 提供变式和拓展用法
     * 指出常见错误和注意事项
     * 重点分析对理解和写作有实际帮助的语法点

2. **句子结构精细分析**：
   - **跳过简单句**：主语+谓语+宾语的基本结构不分析
   - **重点分析复杂句**：
     * 复合句：并列复合句的逻辑关系
     * 复杂句：主从句的修饰关系
     * 特殊结构：倒装、强调、省略的句式变化
   
   - **分析维度**：
     * 主干识别：找出句子的核心结构
     * 修饰成分：分析定语、状语、补语的层次
     * 逻辑关系：解释句子间的因果、转折、递进等关系
     * 语法难点：重点说明容易混淆的语法点

3. **教学价值最大化**：
   - **针对性强**：专注高中到大学水平的语法难点
   - **实用性高**：重点分析写作和阅读中的高频语法
   - **系统性好**：将语法点归类到具体的语法系统中
   - **可操作性**：提供模仿和练习的具体建议

4. **质量标准**：
   - **语法点筛选标准**：严格执行排除清单，只分析高中大学水平的复杂语法
   - **价值导向**：每个语法点必须对提高英语水平有实际帮助
   - **语法点数量**：每段1-3个真正有价值的语法点（宁缺毋滥）
   - **句子分析数量**：每段1-2个复杂句的深度分析
   - **解释详细度**：语法解释50-80字，句子分析60-100字
   - **准确性要求**：语法术语准确，分析逻辑清晰
   - **避免低价值内容**：如果段落只包含基础语法，grammar数组应为空

5. **格式要求**：
   - 只返回JSON，无其他文本
   - 除original/example字段外全用中文
   - 确保JSON格式正确且完整
   - 如果段落只有简单句，grammar和sentences数组可以为空`

// 获取 AI 模型实例
const getAIModel = () => {
  const provider = localStorage.getItem('ai_provider') || 'openai'
  const apiKey = localStorage.getItem(`${provider}_api_key`)
  const modelName = localStorage.getItem(`${provider}_model`)

  if (!apiKey) {
    throw new Error(`请先配置 ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API Key`)
  }

  if (provider === 'gemini') {
    const google = createGoogleGenerativeAI({
      apiKey: apiKey
    })
    return google(modelName || 'gemini-2.0-flash-exp')
  } else {
    const openai = createOpenAI({
      apiKey: apiKey,
      baseURL: localStorage.getItem('openai_endpoint') || undefined
    })
    return openai(modelName || 'gpt-3.5-turbo')
  }
}

// 尝试修复不完整的JSON
function fixIncompleteJSON(jsonStr) {
  // 移除可能的尾部垃圾字符
  jsonStr = jsonStr.trim()

  // 计算括号数量
  let openBraces = (jsonStr.match(/\{/g) || []).length
  let closeBraces = (jsonStr.match(/\}/g) || []).length
  let openBrackets = (jsonStr.match(/\[/g) || []).length
  let closeBrackets = (jsonStr.match(/\]/g) || []).length

  // 补充缺失的括号
  let fixed = jsonStr

  // 补充缺失的方括号
  while (openBrackets > closeBrackets) {
    fixed += ']'
    closeBrackets++
  }

  // 补充缺失的大括号
  while (openBraces > closeBraces) {
    fixed += '}'
    closeBraces++
  }

  // 移除多余的逗号
  fixed = fixed.replace(/,\s*([\]}])/g, '$1')

  // 修复未闭合的字符串
  // 检查最后一个引号是否闭合
  const lastQuoteIndex = fixed.lastIndexOf('"')
  if (lastQuoteIndex > -1) {
    // 检查这个引号前面有多少个未转义的引号
    const beforeLastQuote = fixed.substring(0, lastQuoteIndex)
    const unescapedQuotes = (beforeLastQuote.match(/(?<!\\)"/g) || []).length
    if (unescapedQuotes % 2 === 1) {
      // 奇数个引号，说明最后的字符串未闭合
      // 找到最后一个逗号或括号的位置
      const lastDelimiter = Math.max(
        fixed.lastIndexOf(','),
        fixed.lastIndexOf('['),
        fixed.lastIndexOf('{'),
        fixed.lastIndexOf(':')
      )
      if (lastDelimiter > lastQuoteIndex) {
        // 在引号后面插入闭合引号
        fixed = fixed.substring(0, lastDelimiter) + '"' + fixed.substring(lastDelimiter)
      } else {
        // 直接在末尾加引号
        fixed = fixed + '"'
      }
    }
  }

  console.log('Fixed JSON:', fixed)
  return fixed
}

export const analyzeText = async (text) => {
  try {
    const provider = localStorage.getItem('ai_provider') || 'openai'
    console.log('Using provider:', provider)

    const model = getAIModel()

    // 生成文本
    let responseText = ''

    try {
      const response = await generateText({
        model: model,
        messages: [
          {
            role: 'system',
            content: ANALYSIS_PROMPT
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        maxTokens: 4000,
      })

      console.log('Full AI Response:', JSON.stringify(response, null, 2))

      // 递归提取文本内容的辅助函数
      const extractTextFromResponse = (obj) => {
        if (typeof obj === 'string') {
          return obj
        }

        if (obj && typeof obj === 'object') {
          // 直接检查text属性
          if (obj.text) {
            return obj.text
          }

          // 检查content属性
          if (obj.content) {
            return extractTextFromResponse(obj.content)
          }

          // 检查Gemini格式: candidates[0].content.parts[0].text
          if (obj.candidates && Array.isArray(obj.candidates) && obj.candidates[0]) {
            return extractTextFromResponse(obj.candidates[0])
          }

          // 检查parts数组
          if (obj.parts && Array.isArray(obj.parts) && obj.parts[0]) {
            return extractTextFromResponse(obj.parts[0])
          }

          // 递归检查所有属性
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key]) {
              const result = extractTextFromResponse(obj[key])
              if (result && typeof result === 'string' && result.trim()) {
                return result
              }
            }
          }
        }

        return null
      }

      responseText = extractTextFromResponse(response) || ''
      console.log('Extracted Response Text:', responseText)

    } catch (genError) {
      console.error('Generation Error:', genError)
      console.error('Error details:', JSON.stringify(genError, null, 2))

      // 递归提取函数也需要在这里定义，因为作用域问题
      const extractTextFromResponse = (obj) => {
        if (typeof obj === 'string') {
          return obj
        }

        if (obj && typeof obj === 'object') {
          if (obj.text) return obj.text
          if (obj.content) return extractTextFromResponse(obj.content)
          if (obj.candidates && Array.isArray(obj.candidates) && obj.candidates[0]) {
            return extractTextFromResponse(obj.candidates[0])
          }
          if (obj.parts && Array.isArray(obj.parts) && obj.parts[0]) {
            return extractTextFromResponse(obj.parts[0])
          }

          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key]) {
              const result = extractTextFromResponse(obj[key])
              if (result && typeof result === 'string' && result.trim()) {
                return result
              }
            }
          }
        }

        return null
      }

      // 尝试从错误对象中提取响应内容
      const possibleSources = [
        genError.response,
        genError.data,
        genError.body,
        genError
      ]

      for (const source of possibleSources) {
        if (source && typeof source === 'object') {
          const extracted = extractTextFromResponse(source)
          if (extracted && extracted.trim()) {
            responseText = extracted
            console.log('Extracted from error source:', responseText)
            break
          }
        }
      }

      // 如果仍然没有获取到响应文本，抛出错误
      if (!responseText || !responseText.trim()) {
        throw new Error(`AI API调用失败: ${genError.message || '未知错误'}`)
      }
    }

    // 解析 JSON 响应
    let result
    try {
      // 清理响应文本
      responseText = responseText.trim()
      console.log('Processing response text:', responseText.substring(0, 200) + '...')

      // 多种解析策略
      const parseStrategies = [
        // 1. 直接解析
        () => JSON.parse(responseText),

        // 2. 提取 ```json ... ``` 代码块
        () => {
          const jsonCodeBlock = responseText.match(/```json\s*([\s\S]*?)```/i)
          if (jsonCodeBlock && jsonCodeBlock[1]) {
            let jsonStr = jsonCodeBlock[1].trim()
            console.log('Found JSON code block:', jsonStr.substring(0, 200) + '...')
            return JSON.parse(jsonStr)
          }
          throw new Error('No JSON code block found')
        },

        // 3. 提取 ``` ... ``` 通用代码块（可能没有json标识）
        () => {
          const codeBlock = responseText.match(/```\s*([\s\S]*?)```/)
          if (codeBlock && codeBlock[1]) {
            let content = codeBlock[1].trim()
            // 如果内容看起来像JSON，尝试解析
            if (content.startsWith('{') && content.includes('"title"')) {
              console.log('Found generic code block with JSON content:', content.substring(0, 200) + '...')
              return JSON.parse(content)
            }
          }
          throw new Error('No valid code block found')
        },

        // 4. 提取第一个完整的JSON对象
        () => {
          const jsonMatch = responseText.match(/\{[\s\S]*?\}(?=\s*$|\s*```|\s*\n|$)/)
          if (jsonMatch) {
            let jsonStr = jsonMatch[0]
            console.log('Found JSON object:', jsonStr.substring(0, 200) + '...')
            return JSON.parse(jsonStr)
          }
          throw new Error('No JSON object found')
        },

        // 5. 尝试修复并解析
        () => {
          let fixedJson = fixIncompleteJSON(responseText)
          console.log('Trying fixed JSON:', fixedJson.substring(0, 200) + '...')
          return JSON.parse(fixedJson)
        }
      ]

      let lastError = null
      for (let i = 0; i < parseStrategies.length; i++) {
        try {
          console.log(`Trying parse strategy ${i + 1}...`)
          result = parseStrategies[i]()
          console.log(`Successfully parsed with strategy ${i + 1}`)
          break
        } catch (error) {
          console.log(`Strategy ${i + 1} failed:`, error.message)
          lastError = error
          continue
        }
      }

      if (!result) {
        throw lastError || new Error('All parsing strategies failed')
      }

      console.log('Final parsed result:', result)

      // 验证结果结构
      if (!result || typeof result !== 'object') {
        throw new Error('解析结果不是有效的对象')
      }

      if (!result.title && !result.paragraphs) {
        throw new Error('解析结果缺少必要的字段')
      }

    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Response Text:', responseText)
      console.error('Response Text Length:', responseText.length)
      console.error('First 1000 chars:', responseText.substring(0, 1000))

      throw new Error(`AI响应解析失败。可能的原因：
1. AI返回的内容格式不正确
2. 网络传输出现问题
3. API配置错误

请检查：
- API密钥是否正确
- 网络连接是否正常
- 选择的模型是否支持

错误详情: ${parseError.message}`)
    }

    // 确保返回的数据结构完整
    return {
      title: result.title || '英文精讲',
      overview: result.overview || '',
      difficulty: result.difficulty || '中级',
      paragraphs: result.paragraphs || [],
      summary: result.summary || {
        mainIdea: '',
        writingStyle: '',
        suggestions: ''
      },
      // 保留原始文本
      originalText: text
    }
  } catch (error) {
    console.error('Analysis error:', error)

    if (error.message?.includes('API Key') || error.message?.includes('api_key')) {
      throw new Error('API密钥配置错误，请检查配置')
    } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      throw new Error('API请求频率限制或配额不足，请稍后重试')
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('网络连接错误，请检查网络连接')
    } else if (error.message?.includes('model') || error.message?.includes('不存在')) {
      throw new Error('AI模型配置错误，请检查模型名称')
    } else if (error.message?.includes('timeout')) {
      throw new Error('请求超时，请稍后重试')
    } else {
      throw new Error(`分析失败: ${error.message || '未知错误'}`)
    }
  }
}

// 用于测试的模拟数据
export const getMockAnalysis = (text) => {
  return {
    originalText: text,
    translation: "在过去，编写软件比手动做事更好。你构建一次软件，然后它就会永远为你工作。",
    vocabulary: [
      {
        word: "manually",
        phonetic: "/ˈmænjuəli/",
        meaning: "手动地，手工地",
        example: "You have to do it manually."
      },
      {
        word: "forever",
        phonetic: "/fərˈevər/",
        meaning: "永远，永久",
        example: "Nothing lasts forever."
      },
      {
        word: "build",
        phonetic: "/bɪld/",
        meaning: "构建，建造",
        example: "We need to build a better system."
      }
    ],
    grammar: [
      {
        title: "比较级结构",
        explanation: "was better than 表示过去的比较，用于对比两种情况",
        example: "Writing software was better than doing things manually",
        exampleTranslation: "编写软件比手动做事更好"
      },
      {
        title: "一般现在时",
        explanation: "works for you 使用一般现在时表示持续的状态",
        example: "it works for you forever",
        exampleTranslation: "它永远为你工作"
      }
    ],
    sentences: [
      {
        original: "In the past, writing software was better than doing things manually.",
        translation: "在过去，编写软件比手动做事更好。",
        keyPoints: "- **In the past**: 时间状语，表示过去的情况\n- **比较级结构**: was better than 用于比较"
      },
      {
        original: "You build software once and then it works for you forever.",
        translation: "你构建一次软件，然后它就会永远为你工作。",
        keyPoints: "- **once**: 表示一次性的动作\n- **forever**: 表示永久持续的状态"
      }
    ],
    suggestions: "## 学习建议\n\n1. **重点掌握比较级结构**：文中使用了 'was better than' 这样的比较结构，这是英语中非常常见的表达方式。\n\n2. **注意时态运用**：文章对比了过去和现在的情况，注意 'was' (过去时) 的使用。\n\n3. **积累常用词汇**：'manually', 'forever' 等都是日常交流中的高频词汇。\n\n4. **练习建议**：\n   - 尝试用比较级结构造句\n   - 练习描述过去与现在的对比"
  }
}
