// 词库服务
// 基于 https://github.com/KyleBing/english-vocabulary 的词库数据

// 预定义的词库配置
export const VOCABULARY_LISTS = {
    HighSchool: {
        id: 'HighSchool',
        name: '高中词汇',
        description: '高中英语核心词汇',
        file: '/vocabularies/HighSchool.json',
        level: 'beginner',
        count: 3500
    },
    CET4: {
        id: 'CET4',
        name: 'CET-4 四级词汇',
        description: '大学英语四级考试词汇',
        file: '/vocabularies/CET4.json',
        level: 'intermediate',
        count: 4500
    },
    CET6: {
        id: 'CET6',
        name: 'CET-6 六级词汇',
        description: '大学英语六级考试词汇',
        file: '/vocabularies/CET6.json',
        level: 'intermediate',
        count: 2500
    },
    IELTS: {
        id: 'IELTS',
        name: '考研词汇',
        description: '研究生入学考试核心词汇',
        file: '/vocabularies/IELTS.json',
        level: 'advanced',
        count: 5500
    },
    TOEFL: {
        id: 'TOEFL',
        name: 'TOEFL 托福词汇',
        description: 'TOEFL 考试核心词汇',
        file: '/vocabularies/TOEFL.json',
        level: 'advanced',
        count: 8000
    },
    SAT: {
        id: 'SAT',
        name: 'SAT 词汇',
        description: 'SAT 考试核心词汇',
        file: '/vocabularies/SAT.json',
        level: 'expert',
        count: 5000
    }
};

// 本地缓存的词库数据
const vocabularyCache = new Map();

/**
 * 获取可用的词库列表
 */
export function getAvailableVocabularyLists() {
    return Object.values(VOCABULARY_LISTS);
}

/**
 * 从本地加载词库数据
 * @param {string} vocabularyId 词库ID
 * @returns {Promise<Array>} 词汇数组
 */
export async function loadVocabulary(vocabularyId) {
    // 检查缓存
    if (vocabularyCache.has(vocabularyId)) {
        return vocabularyCache.get(vocabularyId);
    }

    const config = VOCABULARY_LISTS[vocabularyId];
    if (!config) {
        throw new Error(`未找到词库: ${vocabularyId}`);
    }

    try {
        console.log(`正在加载词库: ${config.name}...`);

        // 从public目录加载本地文件
        const response = await fetch(config.file);
        if (!response.ok) {
            throw new Error(`加载词库失败: ${response.status}`);
        }

        const vocabularyData = await response.json();

        // 数据格式标准化处理
        // KyleBing的词库格式: 
        // {
        //   "word": "capacity",
        //   "translations": [{"translation": "容量，能力", "type": "n"}],
        //   "phrases": [{"phrase": "production capacity", "translation": "生产能力"}]
        // }
        const normalizedData = vocabularyData.map(item => {
            // 提取主翻译（取第一个翻译）
            const mainTranslation = item.translations && item.translations.length > 0
                ? item.translations[0].translation
                : '';

            // 组合所有翻译和词性
            const allTranslations = item.translations
                ? item.translations.map(t => `${t.translation} (${t.type || ''})`).join('; ')
                : '';

            return {
                word: (item.word || '').toLowerCase().trim(),
                translation: mainTranslation,
                allTranslations: allTranslations,
                phonetic: item.phonetic || '',
                definition: allTranslations || mainTranslation,
                phrases: item.phrases || [],
                wordType: item.translations && item.translations[0] ? item.translations[0].type : '',
                // 保留原始数据
                raw: item
            };
        }).filter(item => item.word); // 过滤空词汇

        // 缓存数据
        vocabularyCache.set(vocabularyId, normalizedData);

        console.log(`词库 ${config.name} 加载完成，共 ${normalizedData.length} 个单词`);
        return normalizedData;

    } catch (error) {
        console.error(`加载词库 ${config.name} 失败:`, error);
        throw new Error(`加载词库失败: ${error.message}`);
    }
}

/**
 * 在文本中查找词库中的单词
 * @param {string} text 要分析的文本
 * @param {Array} vocabulary 词库数据
 * @returns {Array} 找到的词汇信息
 */
export function findVocabularyInText(text, vocabulary) {
    if (!text || !vocabulary || vocabulary.length === 0) {
        return [];
    }

    // 创建词汇映射表，提高查找效率
    const vocabMap = new Map();
    vocabulary.forEach(item => {
        if (item.word) {
            vocabMap.set(item.word.toLowerCase(), item);
        }
    });

    // 文本预处理 - 提取单词
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // 替换标点符号为空格
        .split(/\s+/)
        .filter(word => word.length > 1); // 过滤单字符

    const foundWords = [];
    const uniqueWords = new Set();

    words.forEach(word => {
        if (vocabMap.has(word) && !uniqueWords.has(word)) {
            uniqueWords.add(word);
            const vocabInfo = vocabMap.get(word);
            foundWords.push({
                ...vocabInfo,
                positions: findWordPositions(text, word)
            });
        }
    });

    return foundWords.sort((a, b) => a.word.localeCompare(b.word));
}

/**
 * 查找单词在文本中的位置
 * @param {string} text 原文本
 * @param {string} word 要查找的单词
 * @returns {Array} 位置数组
 */
function findWordPositions(text, word) {
    const positions = [];
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
        positions.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0]
        });
    }

    return positions;
}

/**
 * 高亮标记文本中的词库单词
 * @param {string} text 原文本
 * @param {Array} vocabularyWords 词库单词列表
 * @returns {string} 标记后的HTML
 */
export function highlightVocabularyInText(text, vocabularyWords) {
    if (!text || !vocabularyWords || vocabularyWords.length === 0) {
        return text;
    }

    let highlightedText = text;

    // 按单词长度排序，避免短单词覆盖长单词的标记
    const sortedWords = vocabularyWords
        .sort((a, b) => b.word.length - a.word.length);

    sortedWords.forEach(vocabItem => {
        const regex = new RegExp(`\\b(${vocabItem.word})\\b`, 'gi');
        highlightedText = highlightedText.replace(
            regex,
            `<span class="vocabulary-highlight" data-word="${vocabItem.word}" data-translation="${vocabItem.translation || ''}" title="${vocabItem.translation || ''}">$1</span>`
        );
    });

    return highlightedText;
}

/**
 * 获取用户选择的词库设置
 */
export function getSelectedVocabulary() {
    return localStorage.getItem('selected_vocabulary') || 'HighSchool';
}

/**
 * 保存用户选择的词库设置
 * @param {string} vocabularyId 词库ID
 */
export function setSelectedVocabulary(vocabularyId) {
    localStorage.setItem('selected_vocabulary', vocabularyId);
}

/**
 * 清除词库缓存
 * @param {string} vocabularyId 可选，清除指定词库缓存，不传则清除所有
 */
export function clearVocabularyCache(vocabularyId = null) {
    if (vocabularyId) {
        vocabularyCache.delete(vocabularyId);
    } else {
        vocabularyCache.clear();
    }
}
