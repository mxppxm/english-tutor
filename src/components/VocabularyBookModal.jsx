import { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  BookOpen,
  Heart,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Star,
  Trash2,
} from "lucide-react";
import {
  getAllCollectedWords,
  searchCollectedWords,
  uncollectWord,
} from "../services/wordCollectionService";

const VocabularyBookModal = ({ onClose }) => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true); // 初始为 true，避免闪烁
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const wordsPerPage = 10;

  // 加载单词
  const loadWords = useCallback(async () => {
    try {
      // 只在首次加载或者数据为空时显示加载状态
      if (words.length === 0) {
        setLoading(true);
      }

      let allWords;

      if (searchTerm) {
        allWords = await searchCollectedWords(searchTerm);
      } else {
        allWords = await getAllCollectedWords();
      }

      setWords(allWords);
    } catch (error) {
      console.error("加载收藏单词失败:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, words.length]);

  useEffect(() => {
    loadWords();

    // 防止滚动穿透 - 禁用body滚动
    document.body.style.overflow = "hidden";

    return () => {
      // 组件卸载时恢复body滚动
      document.body.style.overflow = "unset";
    };
  }, [loadWords]);

  useEffect(() => {
    if (searchTerm === "") {
      // 如果搜索词为空，立即执行
      setCurrentPage(1);
      loadWords();
    } else {
      // 如果有搜索词，延迟执行避免频繁请求
      const timeoutId = setTimeout(() => {
        setCurrentPage(1);
        loadWords();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, loadWords]);

  // 分页计算
  const totalPages = Math.ceil(words.length / wordsPerPage);
  const currentWords = words.slice(
    (currentPage - 1) * wordsPerPage,
    currentPage * wordsPerPage
  );

  // 直接从单词本移除
  const handleRemoveWord = async (wordId) => {
    try {
      await uncollectWord(wordId);
      setWords((prevWords) => prevWords.filter((word) => word.id !== wordId));
    } catch (error) {
      alert("移除失败啦: " + error.message);
    }
  };

  // 语音播放
  const speakWord = (wordText) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  // 处理页面切换
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container vocabulary-book-modal">
        {/* 头部 */}
        <div className="vocabulary-modal-header fixed-header">
          <div className="header-background-decoration"></div>
          <div className="header-content">
            <div className="header-main">
              <div className="header-icon-wrapper">
                <BookOpen className="header-icon" />
              </div>
              <div className="header-text">
                <h2 className="header-title">我的单词收藏夹 ✨</h2>
                <span className="header-subtitle">
                  每个单词都是学习的小成就
                </span>
              </div>
              <div className="header-stats">
                <div className="stats-badge">
                  <span className="stats-number">
                    {loading ? "—" : words.length}
                  </span>
                  <span className="stats-label">个单词</span>
                </div>
              </div>
            </div>

            <button onClick={onClose} className="header-close-btn" title="关闭">
              <X className="close-icon" />
            </button>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="vocabulary-toolbar">
          {/* 搜索框 */}
          <div className="vocabulary-search">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="找找看学过哪些单词..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 单词列表 */}
        <div className="vocabulary-content">
          {loading ? (
            <div className="vocabulary-loading">
              <div className="vocabulary-loading-spinner"></div>
            </div>
          ) : words.length === 0 ? (
            <div className="vocabulary-empty">
              <Heart className="vocabulary-empty-icon" />
              <p>还没有收藏任何单词呢～</p>
              <p className="text-sm text-gray-500">
                在阅读文章时点击单词旁的"收藏"按钮，把喜欢的单词加进来吧
              </p>
            </div>
          ) : (
            <div className="vocabulary-list">
              {/* 单词项 */}
              {currentWords.map((word) => (
                <VocabularyCard
                  key={word.id}
                  word={word}
                  onRemove={() => handleRemoveWord(word.id)}
                  onSpeak={() => speakWord(word.word)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="vocabulary-pagination">
            <div className="vocabulary-pagination-info">
              第 {currentPage} 页 / 共 {totalPages} 页 (已收藏 {words.length}{" "}
              个单词)
            </div>
            <div className="vocabulary-pagination-controls">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="vocabulary-pagination-btn"
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
                      className={`vocabulary-page-number ${
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
                className="vocabulary-pagination-btn"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 单词卡片组件 - 复用重点单词学习的样式
const VocabularyCard = ({ word, onRemove, onSpeak }) => {
  return (
    <div className="vocabulary-card">
      <div className="card-main">
        <div className="word-section">
          <div className="word-info">
            <h4 className="word-text">{word.word}</h4>
            {word.phonetic && <span className="phonetic">{word.phonetic}</span>}
          </div>

          <div className="word-actions">
            <button className="speak-btn" onClick={onSpeak} title="发音">
              <Volume2 size={16} />
            </button>
          </div>
        </div>

        {(word.translation || word.meaning) && (
          <div className="translation">{word.translation || word.meaning}</div>
        )}

        {/* 始终显示完整详细信息 */}
        <div className="word-details">
          {/* 显示词性和释义 */}
          {word.translations && word.translations.length > 0 && (
            <div className="word-translations">
              <strong>词性释义：</strong>
              <div className="translations-list">
                {word.translations.map((trans, index) => (
                  <div key={index} className="translation-item">
                    {trans.type && (
                      <span className="translation-type">{trans.type}.</span>
                    )}
                    <span className="translation-text">
                      {trans.translation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {word.allTranslations &&
            word.allTranslations !== (word.translation || word.meaning) && (
              <div className="all-translations">
                <strong>完整释义：</strong> {word.allTranslations}
              </div>
            )}

          {word.phrases && word.phrases.length > 0 && (
            <div className="phrases">
              <strong>常用短语：</strong>
              <ul className="phrases-list">
                {word.phrases.map((phrase, index) => (
                  <li key={index} className="phrase-item">
                    <span className="phrase-text">{phrase.phrase}</span>
                    <span className="phrase-translation">
                      {" "}
                      - {phrase.translation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {word.usage && (
            <div className="usage">
              <strong>例句：</strong> {word.usage}
            </div>
          )}
        </div>

        <div className="card-actions">
          <button
            className="action-btn remove"
            onClick={onRemove}
            title="从收藏中移除"
          >
            <Trash2 size={16} />
            移除
          </button>
        </div>
      </div>
    </div>
  );
};

export default VocabularyBookModal;
