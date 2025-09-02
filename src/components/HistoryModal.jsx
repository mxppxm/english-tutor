import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  Search,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  getHistoryByPage,
  deleteHistoryById,
  searchHistory,
} from "../services/historyService";

const HistoryModal = ({ onClose, onSelectHistory }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // 加载历史记录
  const loadHistory = useCallback(
    async (page = 1) => {
      try {
        // 只在首次加载或者数据为空时显示加载状态
        if (historyData.length === 0) {
          setLoading(true);
        }

        let result;
        if (searchTerm) {
          // 搜索模式
          const searchResults = await searchHistory(searchTerm);
          result = {
            records: searchResults.slice(
              (page - 1) * pageSize,
              page * pageSize
            ),
            totalCount: searchResults.length,
            currentPage: page,
            totalPages: Math.ceil(searchResults.length / pageSize),
          };
        } else {
          // 默认分页加载
          result = await getHistoryByPage(page, pageSize);
        }

        setHistoryData(result.records);
        setCurrentPage(result.currentPage);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error("加载历史记录失败:", error);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, pageSize, historyData.length]
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (searchTerm === "") {
      // 如果搜索词为空，立即执行
      setCurrentPage(1);
      loadHistory(1);
    } else {
      // 如果有搜索词，延迟执行避免频繁请求
      const timeoutId = setTimeout(() => {
        setCurrentPage(1);
        loadHistory(1);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, loadHistory]);

  // 处理页面切换
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadHistory(newPage);
    }
  };

  // 删除单个历史记录
  const handleDelete = async (id) => {
    if (window.confirm("确定要删除这条历史记录吗？")) {
      try {
        await deleteHistoryById(id);
        loadHistory(currentPage);
      } catch (error) {
        alert("删除失败: " + error.message);
      }
    }
  };

  // 选择历史记录
  const handleSelectHistory = (item) => {
    onSelectHistory(item.analysisResult, item.id);
    onClose();
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return (
        "昨天 " +
        date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
      );
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString("zh-CN");
    }
  };

  return (
    <div className="modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="modal-container history-modal"
        style={{ height: "80vh", maxHeight: "600px" }}
      >
        {/* 头部 */}
        <div className="modal-header fixed-header">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2>学习历史</h2>
          </div>

          <div className="header-buttons">
            <button onClick={onClose} title="关闭">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="history-toolbar">
          {/* 搜索框 */}
          <div className="history-search">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="搜索历史记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 历史记录列表 */}
        <div className="history-content">
          {loading ? (
            <div className="history-loading">
              <div className="history-loading-spinner"></div>
            </div>
          ) : historyData.length === 0 ? (
            <div className="history-empty">
              <BookOpen className="history-empty-icon" />
              <p>暂无历史记录</p>
            </div>
          ) : (
            <div className="history-list">
              {/* 历史记录项 */}
              {historyData.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="flex items-start gap-3 w-full">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleSelectHistory(item)}
                    >
                      <div className="history-item-header">
                        <div className="flex items-start justify-between">
                          <h3 className="history-item-title flex-1">
                            {item.title}
                          </h3>
                        </div>
                        <div className="history-item-meta mt-1">
                          <span className="text-xs text-gray-500">
                            {formatTime(item.timestamp)}
                          </span>
                        </div>
                      </div>

                      <p className="history-item-preview">{item.preview}</p>

                      <div className="history-item-stats">
                        <span>{item.wordCount} 个单词</span>
                        <div className="flex gap-4">
                          <span>
                            语法点:{" "}
                            {item.analysisResult?.paragraphs?.reduce(
                              (sum, p) => sum + (p.grammar?.length || 0),
                              0
                            ) || 0}
                          </span>
                          <span>
                            句子分析:{" "}
                            {item.analysisResult?.paragraphs?.reduce(
                              (sum, p) => sum + (p.sentences?.length || 0),
                              0
                            ) || 0}
                          </span>
                          {item.analysisResult?.vocabulary?.foundCount && (
                            <span>
                              重点词汇:{" "}
                              {item.analysisResult.vocabulary.foundCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                      title="删除历史记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="history-pagination">
            <div className="history-pagination-info">
              第 {currentPage} 页，共 {totalPages} 页
            </div>
            <div className="history-pagination-controls">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="history-pagination-btn"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* 页码 */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`history-page-number ${
                        currentPage === page ? "active" : ""
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="history-pagination-btn"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HistoryModal;
