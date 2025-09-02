import { useState, useEffect, useCallback } from 'react';

/**
 * 自定义 Hook 用于管理 URL 状态
 * 支持 URL 参数的读取和更新，同步浏览器历史记录
 */
export const useUrlState = () => {
    const [urlParams, setUrlParams] = useState(() => {
        // 初始化时从 URL 读取参数
        const params = new URLSearchParams(window.location.search);
        return Object.fromEntries(params.entries());
    });

    // 更新 URL 参数
    const updateUrlParam = useCallback((key, value) => {
        const newParams = { ...urlParams };

        if (value === null || value === undefined || value === '') {
            delete newParams[key];
        } else {
            newParams[key] = value;
        }

        setUrlParams(newParams);

        // 更新浏览器 URL
        const searchParams = new URLSearchParams();
        Object.entries(newParams).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') {
                searchParams.set(k, v);
            }
        });

        const newUrl = `${window.location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        window.history.pushState({}, '', newUrl);
    }, [urlParams]);

    // 批量更新多个参数
    const updateUrlParams = useCallback((newParams) => {
        const mergedParams = { ...urlParams, ...newParams };

        // 清理空值
        Object.keys(mergedParams).forEach(key => {
            if (mergedParams[key] === null || mergedParams[key] === undefined || mergedParams[key] === '') {
                delete mergedParams[key];
            }
        });

        setUrlParams(mergedParams);

        // 更新浏览器 URL
        const searchParams = new URLSearchParams();
        Object.entries(mergedParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                searchParams.set(key, value);
            }
        });

        const newUrl = `${window.location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        window.history.pushState({}, '', newUrl);
    }, [urlParams]);

    // 清除指定参数
    const removeUrlParam = useCallback((key) => {
        updateUrlParam(key, null);
    }, [updateUrlParam]);

    // 清除所有参数
    const clearUrlParams = useCallback(() => {
        setUrlParams({});
        window.history.pushState({}, '', window.location.pathname);
    }, []);

    // 监听浏览器前进后退
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            setUrlParams(Object.fromEntries(params.entries()));
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // 获取指定参数
    const getUrlParam = useCallback((key, defaultValue = null) => {
        return urlParams[key] || defaultValue;
    }, [urlParams]);

    return {
        urlParams,
        getUrlParam,
        updateUrlParam,
        updateUrlParams,
        removeUrlParam,
        clearUrlParams
    };
};

/**
 * 历史记录相关的 URL 状态管理
 */
export const useHistoryUrlState = () => {
    const { updateUrlParam, removeUrlParam, getUrlParam } = useUrlState();

    // 设置当前查看的历史记录ID
    const setHistoryId = useCallback((id) => {
        if (id) {
            updateUrlParam('history', id);
        } else {
            removeUrlParam('history');
        }
    }, [updateUrlParam, removeUrlParam]);

    return {
        // 当前状态
        currentHistoryId: getUrlParam('history'),

        // 状态更新方法
        setHistoryId
    };
};
