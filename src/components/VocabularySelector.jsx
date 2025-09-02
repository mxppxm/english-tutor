import { useState, useEffect } from "react";
import {
  BookOpen,
  Download,
  Check,
  Loader,
  Info,
  Star,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  getAvailableVocabularyLists,
  loadVocabulary,
  getSelectedVocabulary,
  setSelectedVocabulary,
} from "../services/vocabularyService";

const VocabularySelector = ({ onVocabularyChange, className = "" }) => {
  const [selectedVocab, setSelectedVocab] = useState(getSelectedVocabulary());
  const [loadingVocab, setLoadingVocab] = useState(null);
  const [loadedVocabs, setLoadedVocabs] = useState(new Set());
  const [error, setError] = useState(null);
  const [vocabularyData, setVocabularyData] = useState(null);

  const vocabularyLists = getAvailableVocabularyLists();

  useEffect(() => {
    // 初始加载选中的词库
    handleLoadVocabulary(selectedVocab);
  }, []);

  const handleLoadVocabulary = async (vocabularyId) => {
    setLoadingVocab(vocabularyId);
    setError(null);

    try {
      const data = await loadVocabulary(vocabularyId);
      setLoadedVocabs((prev) => new Set([...prev, vocabularyId]));
      setVocabularyData(data);

      // 通知父组件词库数据变化
      if (onVocabularyChange) {
        onVocabularyChange(vocabularyId, data);
      }
    } catch (err) {
      setError(`加载失败: ${err.message}`);
      console.error("词库加载错误:", err);
    } finally {
      setLoadingVocab(null);
    }
  };

  const handleSelectVocabulary = async (vocabularyId) => {
    if (vocabularyId === selectedVocab) return;

    setSelectedVocab(vocabularyId);
    setSelectedVocabulary(vocabularyId);

    // 如果词库未加载，则加载它
    if (!loadedVocabs.has(vocabularyId)) {
      await handleLoadVocabulary(vocabularyId);
    } else {
      // 词库已加载，直接通知父组件
      if (onVocabularyChange) {
        onVocabularyChange(vocabularyId, vocabularyData);
      }
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case "beginner":
        return <Users size={14} className="text-green-500" />;
      case "intermediate":
        return <BookOpen size={14} className="text-blue-500" />;
      case "advanced":
        return <TrendingUp size={14} className="text-orange-500" />;
      case "expert":
        return <Star size={14} className="text-red-500" />;
      default:
        return <BookOpen size={14} className="text-gray-500" />;
    }
  };

  const getLevelText = (level) => {
    const levelMap = {
      beginner: "入门",
      intermediate: "中级",
      advanced: "高级",
      expert: "专家",
    };
    return levelMap[level] || "中级";
  };

  const getLevelColor = (level) => {
    const colorMap = {
      beginner: "bg-green-100 text-green-800 border-green-200",
      intermediate: "bg-blue-100 text-blue-800 border-blue-200",
      advanced: "bg-orange-100 text-orange-800 border-orange-200",
      expert: "bg-red-100 text-red-800 border-red-200",
    };
    return colorMap[level] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className={`vocabulary-selector ${className}`}>
      <div className="vocabulary-header">
        <h3 className="flex items-center gap-2 text-lg font-medium text-gray-800">
          <BookOpen size={20} />
          选择词库
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          选择词库后，系统会在文章中标记相关单词，帮助您学习
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <Info size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="vocabulary-grid">
        {vocabularyLists.map((vocab) => {
          const isSelected = selectedVocab === vocab.id;
          const isLoading = loadingVocab === vocab.id;
          const isLoaded = loadedVocabs.has(vocab.id);

          return (
            <div
              key={vocab.id}
              className={`vocabulary-card ${isSelected ? "selected" : ""} ${
                isLoading ? "loading" : ""
              }`}
              onClick={() => !isLoading && handleSelectVocabulary(vocab.id)}
            >
              <div className="card-header">
                <div className="card-title-section">
                  <h4 className="card-title">{vocab.name}</h4>
                  <div className="card-meta">
                    <span
                      className={`level-badge ${getLevelColor(vocab.level)}`}
                    >
                      {getLevelIcon(vocab.level)}
                      {getLevelText(vocab.level)}
                    </span>
                    <span className="word-count">
                      约 {vocab.count?.toLocaleString()} 词
                    </span>
                  </div>
                </div>

                <div className="card-status">
                  {isLoading && (
                    <Loader size={20} className="animate-spin text-blue-500" />
                  )}
                  {isSelected && !isLoading && (
                    <Check size={20} className="text-green-500" />
                  )}
                  {!isLoaded && !isLoading && !isSelected && (
                    <Download size={20} className="text-gray-400" />
                  )}
                </div>
              </div>

              <p className="card-description">{vocab.description}</p>

              {isLoaded && !isLoading && (
                <div className="card-footer">
                  <span className="loaded-indicator">
                    <Check size={12} />
                    已加载
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedVocab && (
        <div className="selected-vocabulary-info">
          <div className="info-header">
            <Check size={16} className="text-green-500" />
            <span>
              当前使用：
              {vocabularyLists.find((v) => v.id === selectedVocab)?.name}
            </span>
          </div>
          <p className="info-description">
            文章中匹配此词库的单词将被高亮标记，并出现在重点单词学习模块中。
          </p>
        </div>
      )}
    </div>
  );
};

export default VocabularySelector;
