import { openDB } from "idb";

// 数据库名称和版本
const DB_NAME = "EnglishTutorWordCollection";
const DB_VERSION = 3; // 增加版本号以支持新字段
const STORE_NAME = "collectedWords";
const MASTERED_STORE_NAME = "masteredWords";

// 打开数据库
async function openWordCollectionDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            console.log(`数据库升级: 从版本 ${oldVersion} 到版本 ${DB_VERSION}`);

            // 收藏单词存储
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                    autoIncrement: true,
                });

                // 创建索引
                store.createIndex("word", "word", { unique: false });
                store.createIndex("timestamp", "timestamp", { unique: false });
                store.createIndex("category", "category", { unique: false });
            }

            // 掌握单词存储
            if (!db.objectStoreNames.contains(MASTERED_STORE_NAME)) {
                const masteredStore = db.createObjectStore(MASTERED_STORE_NAME, {
                    keyPath: "word",
                });

                // 创建索引
                masteredStore.createIndex("timestamp", "timestamp", { unique: false });
            }

            // 从版本2升级到版本3：添加新字段支持
            if (oldVersion < 3) {
                console.log("升级到版本3：添加完整单词信息支持");
                // IndexedDB会自动处理新字段的添加，无需特殊迁移
                // 已存在的记录在读取时会自动获得undefined值，我们在显示时会处理这种情况
            }
        },
    });
}

// 收藏单词
export async function collectWord(wordData) {
    try {
        const db = await openWordCollectionDB();

        // 检查单词是否已经存在
        const existing = await getCollectedWordByText(wordData.word);
        if (existing) {
            throw new Error("该单词已在单词本中");
        }

        const collectedWord = {
            word: wordData.word,
            meaning: wordData.meaning,
            translation: wordData.translation, // 基本翻译
            allTranslations: wordData.allTranslations, // 完整释义
            translations: wordData.translations, // 词性和释义数组
            phonetic: wordData.phonetic || "",
            usage: wordData.usage || "",
            phrases: wordData.phrases || [], // 常用短语
            context: wordData.context || "", // 单词出现的原文上下文
            sourceTitle: wordData.sourceTitle || "", // 来源文章标题
            raw: wordData.raw, // 保留原始数据
            timestamp: Date.now(),
            category: wordData.category || "默认分类",
            reviewCount: 0,
            lastReviewTime: null,
            isMastered: false,

        };

        const id = await db.add(STORE_NAME, collectedWord);
        return { ...collectedWord, id };
    } catch (error) {
        console.error("收藏单词失败:", error);
        throw error;
    }
}

// 获取所有收藏的单词
export async function getAllCollectedWords() {
    try {
        const db = await openWordCollectionDB();
        const words = await db.getAll(STORE_NAME);
        return words.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error("获取收藏单词失败:", error);
        return [];
    }
}

// 根据单词文本获取收藏的单词
export async function getCollectedWordByText(word) {
    try {
        const db = await openWordCollectionDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const index = tx.store.index("word");

        // 查找完全匹配的单词
        const words = await index.getAll(word.toLowerCase());
        return words.length > 0 ? words[0] : null;
    } catch (error) {
        console.error("查找收藏单词失败:", error);
        return null;
    }
}

// 检查单词是否已收藏
export async function isWordCollected(word) {
    const collectedWord = await getCollectedWordByText(word);
    return !!collectedWord;
}

// 取消收藏单词
export async function uncollectWord(wordId) {
    try {
        const db = await openWordCollectionDB();
        await db.delete(STORE_NAME, wordId);
        return true;
    } catch (error) {
        console.error("取消收藏失败:", error);
        throw error;
    }
}

// 取消收藏单词（通过单词文本）
export async function uncollectWordByText(word) {
    try {
        const collectedWord = await getCollectedWordByText(word);
        if (collectedWord) {
            await uncollectWord(collectedWord.id);
            return true;
        }
        return false;
    } catch (error) {
        console.error("取消收藏失败:", error);
        throw error;
    }
}

// 更新单词信息
export async function updateCollectedWord(wordId, updates) {
    try {
        const db = await openWordCollectionDB();
        const word = await db.get(STORE_NAME, wordId);
        if (!word) {
            throw new Error("单词不存在");
        }

        const updatedWord = { ...word, ...updates };
        await db.put(STORE_NAME, updatedWord);
        return updatedWord;
    } catch (error) {
        console.error("更新单词失败:", error);
        throw error;
    }
}

// 标记单词为已复习
export async function markWordAsReviewed(wordId) {
    try {
        const updates = {
            reviewCount: (await getCollectedWordById(wordId))?.reviewCount + 1 || 1,
            lastReviewTime: Date.now(),
        };
        return await updateCollectedWord(wordId, updates);
    } catch (error) {
        console.error("标记复习失败:", error);
        throw error;
    }
}

// 标记单词为已掌握
export async function markWordAsMastered(wordId, isMastered = true) {
    try {
        return await updateCollectedWord(wordId, { isMastered });
    } catch (error) {
        console.error("标记掌握状态失败:", error);
        throw error;
    }
}

// 根据ID获取单词
export async function getCollectedWordById(wordId) {
    try {
        const db = await openWordCollectionDB();
        return await db.get(STORE_NAME, wordId);
    } catch (error) {
        console.error("获取单词失败:", error);
        return null;
    }
}

// 按分类获取单词
export async function getWordsByCategory(category) {
    try {
        const db = await openWordCollectionDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const index = tx.store.index("category");
        const words = await index.getAll(category);
        return words.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error("按分类获取单词失败:", error);
        return [];
    }
}

// 搜索单词
export async function searchCollectedWords(searchTerm) {
    try {
        const allWords = await getAllCollectedWords();
        const searchLower = searchTerm.toLowerCase();

        return allWords.filter(word =>
            word.word.toLowerCase().includes(searchLower) ||
            word.meaning.toLowerCase().includes(searchLower) ||
            word.usage.toLowerCase().includes(searchLower) ||
            word.context.toLowerCase().includes(searchLower)
        );
    } catch (error) {
        console.error("搜索单词失败:", error);
        return [];
    }
}

// 获取单词本统计信息
export async function getWordCollectionStats() {
    try {
        const allWords = await getAllCollectedWords();

        const totalWords = allWords.length;
        const masteredWords = allWords.filter(word => word.isMastered).length;
        const reviewedWords = allWords.filter(word => word.reviewCount > 0).length;

        const categoryStats = allWords.reduce((stats, word) => {
            stats[word.category] = (stats[word.category] || 0) + 1;
            return stats;
        }, {});



        return {
            totalWords,
            masteredWords,
            reviewedWords,
            unreviewed: totalWords - reviewedWords,
            masteryRate: totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0,
            categoryStats,
        };
    } catch (error) {
        console.error("获取统计信息失败:", error);
        return {
            totalWords: 0,
            masteredWords: 0,
            reviewedWords: 0,
            unreviewed: 0,
            masteryRate: 0,
            categoryStats: {},
        };
    }
}

// 导出单词本
export async function exportWordCollection() {
    try {
        const words = await getAllCollectedWords();
        return JSON.stringify({
            exportTime: new Date().toISOString(),
            version: "1.0",
            words: words,
        }, null, 2);
    } catch (error) {
        console.error("导出单词本失败:", error);
        throw error;
    }
}

// 导入单词本
export async function importWordCollection(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        if (!data.words || !Array.isArray(data.words)) {
            throw new Error("无效的数据格式");
        }

        const db = await openWordCollectionDB();
        let successCount = 0;
        let errorCount = 0;

        for (const word of data.words) {
            try {
                // 检查是否已存在
                const existing = await getCollectedWordByText(word.word);
                if (!existing) {
                    delete word.id; // 删除原ID，让数据库自动生成新ID
                    await db.add(STORE_NAME, word);
                    successCount++;
                } else {
                    errorCount++; // 已存在的单词不导入
                }
            } catch (err) {
                errorCount++;
                console.warn("导入单词失败:", word.word, err);
            }
        }

        return { successCount, errorCount };
    } catch (error) {
        console.error("导入单词本失败:", error);
        throw error;
    }
}

// 清空单词本
export async function clearWordCollection() {
    try {
        const db = await openWordCollectionDB();
        await db.clear(STORE_NAME);
        return true;
    } catch (error) {
        console.error("清空单词本失败:", error);
        throw error;
    }
}

// ==================== 掌握单词相关功能 ====================

// 标记单词为已掌握
export async function masterWord(word) {
    try {
        const db = await openWordCollectionDB();
        const masteredWord = {
            word: word.toLowerCase(),
            timestamp: Date.now(),
            originalWord: word,
        };

        await db.put(MASTERED_STORE_NAME, masteredWord);
        return true;
    } catch (error) {
        console.error("标记掌握失败:", error);
        throw error;
    }
}

// 取消掌握单词
export async function unmasterWord(word) {
    try {
        const db = await openWordCollectionDB();
        await db.delete(MASTERED_STORE_NAME, word.toLowerCase());
        return true;
    } catch (error) {
        console.error("取消掌握失败:", error);
        throw error;
    }
}

// 检查单词是否已掌握
export async function isWordMastered(word) {
    try {
        const db = await openWordCollectionDB();
        const masteredWord = await db.get(MASTERED_STORE_NAME, word.toLowerCase());
        return !!masteredWord;
    } catch (error) {
        console.error("检查掌握状态失败:", error);
        return false;
    }
}

// 获取所有已掌握的单词
export async function getAllMasteredWords() {
    try {
        const db = await openWordCollectionDB();
        const words = await db.getAll(MASTERED_STORE_NAME);
        return words.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error("获取掌握单词失败:", error);
        return [];
    }
}

// 批量检查单词掌握状态
export async function checkWordsMasteryStatus(words) {
    try {
        const db = await openWordCollectionDB();
        const masteredWords = new Set();

        for (const word of words) {
            const masteredWord = await db.get(MASTERED_STORE_NAME, word.toLowerCase());
            if (masteredWord) {
                masteredWords.add(word.toLowerCase());
            }
        }

        return masteredWords;
    } catch (error) {
        console.error("批量检查掌握状态失败:", error);
        return new Set();
    }
}

// ==================== 导出别名 ====================

// 为了兼容 SentenceLearningView 组件，导出别名
export async function addWordToCollection(wordData) {
    return await collectWord(wordData);
}

export async function removeWordFromCollection(word) {
    return await uncollectWordByText(word);
}
