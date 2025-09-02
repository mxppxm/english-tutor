import { openDB } from 'idb';

const DB_NAME = 'EnglishTutorDB';
const DB_VERSION = 1;
const STORE_NAME = 'analysisHistory';

// 初始化数据库
let dbPromise = null;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // 创建对象存储
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    // 创建索引
                    store.createIndex('timestamp', 'timestamp');
                    store.createIndex('title', 'title');
                    store.createIndex('difficulty', 'difficulty');
                }
            },
        });
    }
    return dbPromise;
};

// 保存分析结果到历史记录
export const saveAnalysisToHistory = async (analysisData) => {
    try {
        const db = await getDB();

        // 准备要保存的数据
        const historyItem = {
            timestamp: Date.now(),
            title: analysisData.title || '英文精讲',
            originalText: analysisData.originalText || '',
            analysisResult: analysisData,
            difficulty: analysisData.difficulty || '中级',
            // 添加一些摘要信息方便预览
            preview: generatePreview(analysisData.originalText || ''),
            wordCount: (analysisData.originalText || '').split(/\s+/).filter(word => word.length > 0).length
        };

        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const result = await store.add(historyItem);

        console.log('成功保存到历史记录:', result);
        return result;
    } catch (error) {
        console.error('保存历史记录失败:', error);
        throw new Error('保存历史记录失败');
    }
};

// 获取所有历史记录
export const getAllHistory = async () => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('timestamp');

        // 按时间倒序获取所有记录
        const allRecords = await index.getAll();
        return allRecords.reverse(); // 最新的在前面
    } catch (error) {
        console.error('获取历史记录失败:', error);
        throw new Error('获取历史记录失败');
    }
};

// 获取分页的历史记录
export const getHistoryByPage = async (page = 1, pageSize = 10) => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('timestamp');

        // 获取总数
        const totalCount = await store.count();

        // 计算跳过的数量
        const skip = (page - 1) * pageSize;

        // 获取所有记录（因为IndexedDB没有直接的分页API）
        const allRecords = await index.getAll();
        const reversedRecords = allRecords.reverse(); // 最新的在前面

        // 手动分页
        const paginatedRecords = reversedRecords.slice(skip, skip + pageSize);

        return {
            records: paginatedRecords,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / pageSize),
            hasMore: skip + pageSize < totalCount
        };
    } catch (error) {
        console.error('获取分页历史记录失败:', error);
        throw new Error('获取分页历史记录失败');
    }
};

// 根据ID获取特定的历史记录
export const getHistoryById = async (id) => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        const record = await store.get(id);
        return record;
    } catch (error) {
        console.error('获取历史记录失败:', error);
        throw new Error('获取历史记录失败');
    }
};

// 删除历史记录
export const deleteHistoryById = async (id) => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        await store.delete(id);
        console.log('成功删除历史记录:', id);
        return true;
    } catch (error) {
        console.error('删除历史记录失败:', error);
        throw new Error('删除历史记录失败');
    }
};

// 删除多个历史记录
export const deleteMultipleHistory = async (ids) => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const promises = ids.map(id => store.delete(id));
        await Promise.all(promises);

        console.log('成功删除多个历史记录:', ids);
        return true;
    } catch (error) {
        console.error('删除多个历史记录失败:', error);
        throw new Error('删除多个历史记录失败');
    }
};

// 清空所有历史记录
export const clearAllHistory = async () => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        await store.clear();
        console.log('成功清空所有历史记录');
        return true;
    } catch (error) {
        console.error('清空历史记录失败:', error);
        throw new Error('清空历史记录失败');
    }
};

// 搜索历史记录
export const searchHistory = async (keyword) => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        const allRecords = await store.getAll();

        // 简单的文本搜索
        const filteredRecords = allRecords.filter(record => {
            const searchText = `${record.title} ${record.originalText} ${record.preview}`.toLowerCase();
            return searchText.includes(keyword.toLowerCase());
        });

        // 按时间倒序排序
        return filteredRecords.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('搜索历史记录失败:', error);
        throw new Error('搜索历史记录失败');
    }
};

// 根据难度级别获取历史记录
export const getHistoryByDifficulty = async (difficulty) => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('difficulty');

        const records = await index.getAll(difficulty);
        return records.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('按难度获取历史记录失败:', error);
        throw new Error('按难度获取历史记录失败');
    }
};

// 获取统计信息
export const getHistoryStats = async () => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        const allRecords = await store.getAll();

        // 计算统计信息
        const totalCount = allRecords.length;
        const totalWords = allRecords.reduce((sum, record) => sum + (record.wordCount || 0), 0);

        // 按难度分组统计
        const difficultyStats = allRecords.reduce((stats, record) => {
            const difficulty = record.difficulty || '中级';
            stats[difficulty] = (stats[difficulty] || 0) + 1;
            return stats;
        }, {});

        // 按月份分组统计（最近6个月）
        const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
        const monthlyStats = allRecords
            .filter(record => record.timestamp > sixMonthsAgo)
            .reduce((stats, record) => {
                const date = new Date(record.timestamp);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                stats[monthKey] = (stats[monthKey] || 0) + 1;
                return stats;
            }, {});

        return {
            totalCount,
            totalWords,
            averageWords: totalCount > 0 ? Math.round(totalWords / totalCount) : 0,
            difficultyStats,
            monthlyStats
        };
    } catch (error) {
        console.error('获取统计信息失败:', error);
        throw new Error('获取统计信息失败');
    }
};

// 导出历史记录为JSON
export const exportHistoryAsJSON = async () => {
    try {
        const allHistory = await getAllHistory();
        const exportData = {
            exportTime: new Date().toISOString(),
            version: '1.0',
            count: allHistory.length,
            data: allHistory
        };

        return JSON.stringify(exportData, null, 2);
    } catch (error) {
        console.error('导出历史记录失败:', error);
        throw new Error('导出历史记录失败');
    }
};

// 从JSON导入历史记录
export const importHistoryFromJSON = async (jsonString) => {
    try {
        const importData = JSON.parse(jsonString);

        if (!importData.data || !Array.isArray(importData.data)) {
            throw new Error('无效的导入数据格式');
        }

        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        let successCount = 0;
        let errorCount = 0;

        for (const item of importData.data) {
            try {
                // 移除id字段，让数据库自动生成新的id
                const { id, ...itemWithoutId } = item;
                await store.add(itemWithoutId);
                successCount++;
            } catch (error) {
                console.warn('导入单条记录失败:', error);
                errorCount++;
            }
        }

        console.log(`导入完成: 成功 ${successCount} 条，失败 ${errorCount} 条`);
        return { successCount, errorCount };
    } catch (error) {
        console.error('导入历史记录失败:', error);
        throw new Error('导入历史记录失败: ' + error.message);
    }
};

// 生成文本预览（前100个字符）
const generatePreview = (text) => {
    if (!text) return '';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
};

// 根据原文查找历史记录（查找相同的文本）
export const findHistoryByText = async (text) => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        const allRecords = await store.getAll();

        // 规范化文本进行比较（去除多余空格、换行等）
        const normalizeText = (str) => {
            return str.trim()
                .replace(/\s+/g, ' ')  // 多个空格替换为单个空格
                .replace(/\n\s*\n/g, '\n')  // 多个换行替换为单个换行
                .toLowerCase();
        };

        const normalizedInputText = normalizeText(text);

        // 查找匹配的记录
        const matchingRecords = allRecords.filter(record => {
            if (!record.originalText) return false;
            const normalizedRecordText = normalizeText(record.originalText);
            return normalizedRecordText === normalizedInputText;
        });

        // 按时间倒序排序，返回最新的记录
        const sortedRecords = matchingRecords.sort((a, b) => b.timestamp - a.timestamp);

        console.log(`找到 ${matchingRecords.length} 条匹配的历史记录`);

        return sortedRecords.length > 0 ? sortedRecords[0] : null;
    } catch (error) {
        console.error('查找历史记录失败:', error);
        return null;
    }
};

// 获取数据库状态
export const getDatabaseInfo = async () => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        const count = await store.count();

        return {
            dbName: DB_NAME,
            version: DB_VERSION,
            storeName: STORE_NAME,
            recordCount: count
        };
    } catch (error) {
        console.error('获取数据库信息失败:', error);
        return null;
    }
};
