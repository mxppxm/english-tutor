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

        vocabularyAnalysis = foundWords
      }
    } catch (e) {
      console.warn('词库分析失败:', e)
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

// 分批分析函数，拼接所有结果
export const analyzeSentencesBatch = async (sentences, batchSize = 5) => {
  const batches = []
  for (let i = 0; i < sentences.length; i += batchSize) {
    batches.push(sentences.slice(i, i + batchSize))
  }

  let allResults = {
    sentences: [],
    title: "",
    overview: "",
    vocabulary: null,
    paragraphs: [],
  }

  for (const batch of batches) {
    const batchResult = await analyzeSentences(batch)
    if (batchResult.sentences && Array.isArray(batchResult.sentences)) {
      allResults.sentences = allResults.sentences.concat(batchResult.sentences)
    }
    if (batchResult.title && !allResults.title) allResults.title = batchResult.title
    if (batchResult.overview && !allResults.overview) allResults.overview = batchResult.overview
    if (batchResult.vocabulary && !allResults.vocabulary) allResults.vocabulary = batchResult.vocabulary
    if (batchResult.paragraphs && Array.isArray(batchResult.paragraphs)) {
      allResults.paragraphs = allResults.paragraphs.concat(batchResult.paragraphs)
    }
  }

  return allResults
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

    // 合并结果
    const analysisResult = {
      ...result
    }
    return analysisResult
  } catch (error) {
    console.error('分析失败:', error)
    throw error
  }
}
