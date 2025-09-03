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
 * 句子去重处理
 * @param {string[]} sentences - 句子数组
 * @returns {object} 去重结果包含unique sentences和mapping信息
 */
const deduplicateSentences = (sentences) => {
    const uniqueSentences = [];
    const sentenceMap = new Map(); // 记录每个句子的首次出现位置
    const duplicateInfo = new Map(); // 记录重复句子的所有位置
    const originalToUniqueMap = []; // 原始位置到去重后位置的映射

    sentences.forEach((sentence, originalIndex) => {
        // 标准化句子用于比较（去除多余空格，统一大小写）
        const normalizedSentence = sentence.trim().toLowerCase();

        if (sentenceMap.has(normalizedSentence)) {
            // 这是重复句子
            const firstIndex = sentenceMap.get(normalizedSentence);
            originalToUniqueMap[originalIndex] = firstIndex;

            // 记录重复信息
            if (!duplicateInfo.has(normalizedSentence)) {
                duplicateInfo.set(normalizedSentence, [firstIndex]);
            }
            duplicateInfo.get(normalizedSentence).push(originalIndex);
        } else {
            // 这是新句子
            const uniqueIndex = uniqueSentences.length;
            sentenceMap.set(normalizedSentence, uniqueIndex);
            originalToUniqueMap[originalIndex] = uniqueIndex;
            uniqueSentences.push(sentence);
        }
    });

    // 构建重复句子详细信息
    const duplicates = [];
    duplicateInfo.forEach((positions, normalizedSentence) => {
        if (positions.length > 1) {
            duplicates.push({
                sentence: sentences[positions[0]], // 使用原始句子（保持大小写）
                normalizedSentence,
                positions,
                count: positions.length
            });
        }
    });

    return {
        uniqueSentences,
        originalToUniqueMap,
        duplicates,
        originalCount: sentences.length,
        uniqueCount: uniqueSentences.length,
        duplicateCount: sentences.length - uniqueSentences.length
    };
};

/**
 * 预处理文本为句子数组
 * @param {string} text - 输入文本
 * @param {number} maxSentences - 最大句子数量（可选，默认不限制）
 * @returns {object} 包含处理后文本和句子信息的对象
 */
export const preprocessText = (text, maxSentences = null) => {
    const sentences = splitIntoSentences(text);

    // 句子去重处理
    const deduplicateResult = deduplicateSentences(sentences);

    console.log(`句子去重完成: ${deduplicateResult.originalCount} -> ${deduplicateResult.uniqueCount} 个句子`);
    if (deduplicateResult.duplicateCount > 0) {
        console.log(`发现 ${deduplicateResult.duplicateCount} 个重复句子，已去重:`,
            deduplicateResult.duplicates.map(d => `"${d.sentence}" (${d.count}次)`).join(', '));
    }

    // 根据需要限制句子数量（在去重后进行限制）
    const limitedSentences = maxSentences ?
        deduplicateResult.uniqueSentences.slice(0, maxSentences) :
        deduplicateResult.uniqueSentences;

    // 重新组合为文本（用于兼容性），确保句子间有正确分隔
    // 确保每个句子都以句号结尾，然后用空格连接
    const processedText = limitedSentences
        .map(sentence => {
            const trimmed = sentence.trim();
            // 确保句子以标点符号结尾
            if (!/[.!?]$/.test(trimmed)) {
                return trimmed + '.';
            }
            return trimmed;
        })
        .join(' ');

    console.log(`✅ 文本预处理完成: ${limitedSentences.length} 个句子`);

    return {
        originalText: text,
        processedText,
        sentences: limitedSentences,
        sentenceCount: limitedSentences.length,
        originalSentenceCount: sentences.length,
        isLimited: maxSentences ? deduplicateResult.uniqueSentences.length > maxSentences : false,
        maxSentences: maxSentences || deduplicateResult.uniqueSentences.length,
        // 新增：去重相关信息
        deduplication: {
            originalCount: deduplicateResult.originalCount,
            uniqueCount: deduplicateResult.uniqueCount,
            duplicateCount: deduplicateResult.duplicateCount,
            duplicates: deduplicateResult.duplicates,
            originalToUniqueMap: deduplicateResult.originalToUniqueMap,
            hasDeduplication: deduplicateResult.duplicateCount > 0
        }
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
            error: '呀，这里好像没有文字诶～请输入一些内容吧'
        };
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
        return {
            isValid: false,
            error: '这里看起来还是空的～快给我点文字来分析吧'
        };
    }

    const sentences = splitIntoSentences(trimmedText);

    if (sentences.length === 0) {
        return {
            isValid: false,
            error: '嗯...我没找到完整的句子，可以试试加点标点符号吗？'
        };
    }

    // 检查是否包含英文字母
    const hasEnglish = /[a-zA-Z]/.test(trimmedText);
    if (!hasEnglish) {
        return {
            isValid: false,
            error: '咦，这里好像没有英文呢～我是专门看英文的哦'
        };
    }

    // 检查英文比例
    const englishChars = trimmedText.match(/[a-zA-Z]/g) || [];
    const totalChars = trimmedText.replace(/\s/g, '').length;
    const englishRatio = totalChars > 0 ? englishChars.length / totalChars : 0;

    if (englishRatio < 0.3) {
        return {
            isValid: false,
            error: '英文内容有点少呢～我更擅长分析英文文章哦'
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
