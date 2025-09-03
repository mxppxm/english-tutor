import {
  loadVocabulary,
  findVocabularyInText,
  getSelectedVocabulary,
  VOCABULARY_LISTS
} from './vocabularyService'

// API基础URL配置
const API_BASE_URL = import.meta.env.PROD
  ? '/.netlify/functions'  // 生产环境使用 Netlify Functions
  : 'http://localhost:3000/.netlify/functions'  // 开发环境使用本地 Netlify Dev

// 通用API请求函数
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  try {
    const response = await fetch(url, defaultOptions)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API请求失败:', error)

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接')
    }

    throw error
  }
}

// 逐句分析函数 - 新的句子级分析接口
export const analyzeSentences = async (sentences) => {
  try {
    // 获取用户配置
    const provider = localStorage.getItem('ai_provider') || 'doubao'
    const apiKey = localStorage.getItem(`${provider}_api_key`)
    const modelName = localStorage.getItem(`${provider}_model`)

    if (!apiKey) {
      throw new Error(`请先配置 ${provider === 'doubao' ? '豆包' : 'Gemini'} API Key`)
    }

    console.log('开始逐句分析，使用提供商:', provider, '句子数量:', sentences.length)

    // 调用后端分析接口 - 发送句子数组
    const result = await apiRequest('/analyze-text', {
      method: 'POST',
      body: JSON.stringify({
        sentences,
        provider,
        apiKey,
        modelName
      })
    })

    console.log('逐句分析完成')

    // 集成词库匹配功能
    let vocabularyAnalysis = null
    try {
      const selectedVocabId = getSelectedVocabulary()
      console.log('开始词库分析，选中词库:', selectedVocabId)

      if (selectedVocabId && VOCABULARY_LISTS[selectedVocabId]) {
        // 加载词库数据
        const vocabularyData = await loadVocabulary(selectedVocabId)
        console.log(`词库 ${selectedVocabId} 加载完成，共 ${vocabularyData.length} 个单词`)

        // 在所有句子中查找词库单词
        const allText = sentences.join(' ')
        const foundWords = findVocabularyInText(allText, vocabularyData)
        console.log(`在文章中找到 ${foundWords.length} 个词库单词`)

        vocabularyAnalysis = {
          vocabularyId: selectedVocabId,
          vocabularyName: VOCABULARY_LISTS[selectedVocabId].name,
          totalWords: vocabularyData.length,
          foundWords: foundWords,
          foundCount: foundWords.length,
          coverage: vocabularyData.length > 0 ? Math.round((foundWords.length / vocabularyData.length) * 100) : 0
        }

        console.log('词库分析完成:', vocabularyAnalysis)
      } else {
        console.log('未选择词库或词库不存在')
      }
    } catch (vocabError) {
      console.warn('词库分析失败:', vocabError)
      // 词库分析失败不影响主要功能，只记录警告
    }

    // 合并结果
    const analysisResult = {
      ...result,
      vocabulary: vocabularyAnalysis
    }

    console.log('最终分析结果包含词库信息:', !!analysisResult.vocabulary)
    return analysisResult

  } catch (error) {
    console.error('分析失败:', error)
    throw error
  }
}

// 分析文本函数 - 简洁的接口（兼容旧版本）
export const analyzeText = async (text) => {
  try {
    // 获取用户配置
    const provider = localStorage.getItem('ai_provider') || 'doubao'
    const apiKey = localStorage.getItem(`${provider}_api_key`)
    const modelName = localStorage.getItem(`${provider}_model`)

    if (!apiKey) {
      throw new Error(`请先配置 ${provider === 'doubao' ? '豆包' : 'Gemini'} API Key`)
    }

    console.log('开始分析文本，使用提供商:', provider)

    // 调用后端分析接口
    const result = await apiRequest('/analyze-text', {
      method: 'POST',
      body: JSON.stringify({
        text,
        provider,
        apiKey,
        modelName
      })
    })

    console.log('后端分析完成')

    // 集成词库匹配功能
    let vocabularyAnalysis = null
    try {
      const selectedVocabId = getSelectedVocabulary()
      console.log('开始词库分析，选中词库:', selectedVocabId)

      if (selectedVocabId && VOCABULARY_LISTS[selectedVocabId]) {
        // 加载词库数据
        const vocabularyData = await loadVocabulary(selectedVocabId)
        console.log(`词库 ${selectedVocabId} 加载完成，共 ${vocabularyData.length} 个单词`)

        // 在文本中查找词库单词
        const foundWords = findVocabularyInText(text, vocabularyData)
        console.log(`在文章中找到 ${foundWords.length} 个词库单词`)

        vocabularyAnalysis = {
          vocabularyId: selectedVocabId,
          vocabularyName: VOCABULARY_LISTS[selectedVocabId].name,
          totalWords: vocabularyData.length,
          foundWords: foundWords,
          foundCount: foundWords.length,
          coverage: vocabularyData.length > 0 ? Math.round((foundWords.length / vocabularyData.length) * 100) : 0
        }

        console.log('词库分析完成:', vocabularyAnalysis)
      } else {
        console.log('未选择词库或词库不存在')
      }
    } catch (vocabError) {
      console.warn('词库分析失败:', vocabError)
      // 词库分析失败不影响主要功能，只记录警告
    }

    // 合并结果
    const analysisResult = {
      ...result,
      vocabulary: vocabularyAnalysis
    }

    console.log('最终分析结果包含词库信息:', !!analysisResult.vocabulary)
    return analysisResult

  } catch (error) {
    console.error('分析失败:', error)
    throw error
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
        exampleTranslation: "编写软件比手动做事更好。"
      },
      {
        title: "一般现在时",
        explanation: "works for you 使用一般现在时表示持续的状态",
        example: "it works for you forever",
        exampleTranslation: "它永远为你工作。"
      }
    ],
    sentences: [
      {
        original: "In the past, writing software was better than doing things manually.",
        translation: "在过去，编写软件比手动做事更好。",
        phrases: [
          {
            phrase: "in the past",
            translation: "在过去",
            usage: "用于表示过去的时间，常用于句首",
            example: "In the past, people communicated by letters.",
            exampleTranslation: "在过去，人们通过信件交流。",
            type: "时间状语"
          },
          {
            phrase: "better than",
            translation: "比...更好",
            usage: "比较级结构，用于对比两个事物",
            example: "This method is better than the old one.",
            exampleTranslation: "这种方法比旧的方法更好。",
            type: "比较结构"
          }
        ],
        keyPoints: "- **In the past**: 时间状语，表示过去的情况\n- **比较级结构**: was better than 用于比较"
      },
      {
        original: "You build software once and then it works for you forever.",
        translation: "你构建一次软件，然后它就会永远为你工作。",
        phrases: [
          {
            phrase: "work for you",
            translation: "为你工作/效劳",
            usage: "表示某事物对某人有益或起作用",
            example: "This strategy will work for you.",
            exampleTranslation: "这个策略对你会有用。",
            type: "动词短语"
          }
        ],
        keyPoints: "- **once**: 表示一次性的动作\n- **forever**: 表示永久持续的状态"
      }
    ],
    suggestions: "## 学习建议\n\n1. **重点掌握比较级结构**：文中使用了 'was better than' 这样的比较结构，这是英语中非常常见的表达方式。\n\n2. **注意时态运用**：文章对比了过去和现在的情况，注意 'was' (过去时) 的使用。\n\n3. **积累常用词汇**：'manually', 'forever' 等都是日常交流中的高频词汇。\n\n4. **练习建议**：\n   - 尝试用比较级结构造句\n   - 练习描述过去与现在的对比"
  }
}