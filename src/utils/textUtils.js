/**
 * 文本预处理工具函数
 */

/**
 * 将文本分割为句子
 * @param {string} text - 输入文本
 * @returns {string[]} 句子数组
 */
export const splitIntoSentences = (text) => {
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
    // 同时考虑引号内的句子结束符
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
            // 过滤掉空句子和过短的句子（少于3个字符的句子可能是误分割）
            return sentence.length > 2 && /[a-zA-Z]/.test(sentence);
        })
        .map(sentence => {
            // 确保每个句子都有适当的结束标点
            if (!/[.!?]$/.test(sentence)) {
                sentence += '.';
            }
            return sentence;
        });

    return processedSentences;
};

/**
 * 预处理文本为句子数组
 * @param {string} text - 输入文本
 * @param {number} maxSentences - 最大句子数量（可选，默认不限制）
 * @returns {object} 包含处理后文本和句子信息的对象
 */
export const preprocessText = (text, maxSentences = null) => {
    const sentences = splitIntoSentences(text);

    // 根据需要限制句子数量
    const finalSentences = maxSentences ? sentences.slice(0, maxSentences) : sentences;

    // 重新组合为文本（用于兼容性）
    const processedText = finalSentences.join(' ');

    return {
        originalText: text,
        processedText,
        sentences: finalSentences,
        sentenceCount: finalSentences.length,
        originalSentenceCount: sentences.length,
        isLimited: maxSentences ? sentences.length > maxSentences : false,
        maxSentences: maxSentences || sentences.length
    };
};

/**
 * 验证文本是否适合进行句子分析
 * @param {string} text - 输入文本
 * @returns {object} 验证结果
 */
export const validateTextForSentenceAnalysis = (text) => {
    if (!text || typeof text !== 'string') {
        return {
            isValid: false,
            error: '请输入有效的文本'
        };
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
        return {
            isValid: false,
            error: '请输入文本内容'
        };
    }

    const sentences = splitIntoSentences(trimmedText);

    if (sentences.length === 0) {
        return {
            isValid: false,
            error: '未能识别到有效的句子，请检查文本格式'
        };
    }

    // 检查是否包含英文字母
    const hasEnglish = /[a-zA-Z]/.test(trimmedText);
    if (!hasEnglish) {
        return {
            isValid: false,
            error: '请输入包含英文内容的文本'
        };
    }

    // 检查英文比例
    const englishChars = trimmedText.match(/[a-zA-Z]/g) || [];
    const totalChars = trimmedText.replace(/\s/g, '').length;
    const englishRatio = totalChars > 0 ? englishChars.length / totalChars : 0;

    if (englishRatio < 0.3) {
        return {
            isValid: false,
            error: '输入的英文内容过少，请确保主要为英文文本'
        };
    }

    return {
        isValid: true,
        sentenceCount: sentences.length,
        sentences: sentences
    };
};

/**
 * 获取文本统计信息
 * @param {string} text - 输入文本
 * @returns {object} 统计信息
 */
export const getTextStats = (text) => {
    if (!text || typeof text !== 'string') {
        return {
            wordCount: 0,
            sentenceCount: 0,
            characterCount: 0
        };
    }

    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = splitIntoSentences(text);

    return {
        wordCount: words.length,
        sentenceCount: sentences.length,
        characterCount: text.length
    };
};
