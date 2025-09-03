import { useState, useCallback, useEffect } from "react";
import {
  Book,
  Globe,
  BookOpen,
  PenTool,
  MessageCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Star,
  StarOff,
  X,
  Volume2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SimpleHighlightedText from "./SimpleHighlightedText";
import VocabularyLearning from "./VocabularyLearning";
import WordTooltip from "./WordTooltip";
import {
  addWordToCollection,
  removeWordFromCollection,
  getAllCollectedWords,
} from "../services/wordCollectionService";

const SentenceLearningView = ({ result }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [showVocabularyHighlight, setShowVocabularyHighlight] = useState(true);
  const [collectedWords, setCollectedWords] = useState(new Set());
  const [hoveredWord, setHoveredWord] = useState(null);
  const [showVocabularyLearning, setShowVocabularyLearning] = useState(false);
  const [allExpanded, setAllExpanded] = useState(true);

  // 初始化已收藏的单词
  useEffect(() => {
    const loadCollectedWords = async () => {
      try {
        const words = await getAllCollectedWords();
        setCollectedWords(new Set(words.map((w) => w.word.toLowerCase())));
      } catch (error) {
        console.error("加载收藏单词失败:", error);
      }
    };
    loadCollectedWords();
  }, []);

  // 初始化展开状态 - 默认展开所有模块
  useEffect(() => {
    if (result?.sentences) {
      const initialExpandedState = {};
      result.sentences.forEach((_, index) => {
        initialExpandedState[`sentence-${index}`] = true; // 句子整体展开状态
        initialExpandedState[`structure-${index}`] = true;
        initialExpandedState[`vocabulary-${index}`] = true;
        initialExpandedState[`grammar-${index}`] = true;
        initialExpandedState[`keypoints-${index}`] = true;
      });
      setExpandedSections(initialExpandedState);
    }
  }, [result]);

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const toggleAllSections = () => {
    if (result?.sentences) {
      const newExpandedState = {};
      const newAllExpanded = !allExpanded;

      result.sentences.forEach((_, index) => {
        newExpandedState[`sentence-${index}`] = newAllExpanded; // 句子整体展开状态
        newExpandedState[`structure-${index}`] = newAllExpanded;
        newExpandedState[`vocabulary-${index}`] = newAllExpanded;
        newExpandedState[`grammar-${index}`] = newAllExpanded;
        newExpandedState[`keypoints-${index}`] = newAllExpanded;
      });

      setExpandedSections(newExpandedState);
      setAllExpanded(newAllExpanded);
    }
  };

  const speakSentence = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.6; // 更慢的语速，提高清晰度
      utterance.pitch = 1.0; // 标准音调
      utterance.volume = 1.0; // 最大音量，确保清晰
      speechSynthesis.speak(utterance);
    }
  };

  const speakWord = (word) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.7; // 单词发音稍快一点，但也更清晰
      utterance.pitch = 1.0; // 标准音调
      utterance.volume = 1.0; // 最大音量，确保清晰
      speechSynthesis.speak(utterance);
    }
  };

  // 处理单词悬停
  const handleWordHover = useCallback((word, position) => {
    if (word && word.word) {
      setHoveredWord({
        word: word.word,
        meaning: word.meaning || word.translation || "",
        phonetic: word.phonetic || "",
        translations: word.translations || [],
        phrases: word.phrases || [],
        usage: word.usage || "",
        position: position,
      });
    } else {
      setHoveredWord(null);
    }
  }, []);

  // 处理单词收藏
  const handleWordCollection = async (word, isCollected) => {
    try {
      if (isCollected) {
        await removeWordFromCollection(word.word);
        setCollectedWords((prev) => {
          const newSet = new Set(prev);
          newSet.delete(word.word.toLowerCase());
          return newSet;
        });
      } else {
        // 传递完整的单词信息，包括所有详细数据
        await addWordToCollection({
          word: word.word,
          phonetic: word.phonetic || "",
          meaning: word.meaning || "",
          translation: word.translation || word.meaning || "",
          allTranslations: word.allTranslations || "",
          translations: word.translations || [],
          phrases: word.phrases || [],
          usage: word.usage || "",
          raw: word.raw || null, // 保留原始数据
          sourceTitle: result.title,
          context: word.example || word.context || "",
        });
        setCollectedWords(
          (prev) => new Set([...prev, word.word.toLowerCase()])
        );
      }
    } catch (error) {
      console.error("单词收藏操作失败:", error);
    }
  };

  // 点击外部区域关闭tooltip
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !e.target.closest(".word-tooltip") &&
        !e.target.closest(".highlighted-word")
      ) {
        setHoveredWord(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (!result || !result.sentences || !Array.isArray(result.sentences)) {
    return (
      <div className="sentence-learning-view">
        <div className="error-message">暂无句子分析数据或数据格式不正确</div>
      </div>
    );
  }

  return (
    <div className="sentence-learning-view">
      {/* 完整原文展示 */}
      <div className="full-text-section">
        <div className="full-text-header">
          <h2>完整原文</h2>
        </div>
        <div className="full-text-content">
          <SimpleHighlightedText
            text={result.sentences.map((s) => s.original).join(" ")}
            vocabularyWords={result.sentences.reduce(
              (acc, s) => [...acc, ...(s.vocabulary || [])],
              []
            )}
            foundWords={
              showVocabularyHighlight ? result.vocabulary?.foundWords : []
            }
            onWordHover={handleWordHover}
            sourceTitle={result.title}
            masteredWords={collectedWords}
          />
        </div>
      </div>

      {/* 完整翻译展示 */}
      <div className="full-translation-section">
        <div className="full-translation-header">
          <h2>翻译</h2>
        </div>
        <div className="full-translation-content">
          {result.sentences.map((s) => s.translation).join(" ")}
        </div>
      </div>

      {/* 控制Header */}
      <div className="learning-controls-header">
        <div className="controls-left">
          <h3>学习内容</h3>
          <div className="learning-stats">
            <span className="stat-item">共 {result.sentences.length} 句</span>
            {result.vocabulary?.vocabularyName && (
              <span className="stat-item">
                当前词库: {result.vocabulary.vocabularyName}
              </span>
            )}
            {result.vocabulary?.foundWords && (
              <span className="stat-item">
                词库单词: {result.vocabulary.foundWords.length} 个
              </span>
            )}
          </div>
        </div>

        <div className="controls-right">
          <button
            onClick={toggleAllSections}
            className="expand-all-button"
            title={allExpanded ? "收起所有模块" : "展开所有模块"}
          >
            {allExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            {allExpanded ? "收起全部" : "展开全部"}
          </button>

          <div className="control-switch">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={showVocabularyHighlight}
                onChange={(e) => setShowVocabularyHighlight(e.target.checked)}
                className="switch-input"
              />
              <span className="switch-slider"></span>
              词库单词高亮
            </label>
          </div>

          {result.vocabulary?.foundWords && (
            <button
              onClick={() => setShowVocabularyLearning(true)}
              className="vocabulary-learning-button"
              title="重点单词学习"
            >
              <BookOpen size={18} />
              重点单词学习
            </button>
          )}
        </div>
      </div>

      {/* 句子内容 */}
      <div className="sentences-container">
        {result.sentences.map((sentence, index) => (
          <div key={sentence.id || index} className="sentence-section">
            <div
              className="sentence-header clickable"
              onClick={() => toggleSection(`sentence-${index}`)}
            >
              <div className="sentence-header-content">
                <h3>第 {index + 1} 句</h3>
                <div className="sentence-preview">{sentence.original}</div>
              </div>
              <div className="sentence-header-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakSentence(sentence.original);
                  }}
                  className="speak-sentence-btn"
                  title="朗读句子"
                >
                  <Volume2 size={16} />
                </button>
                <span className="toggle-icon">
                  {expandedSections[`sentence-${index}`] ? "−" : "+"}
                </span>
              </div>
            </div>

            {expandedSections[`sentence-${index}`] && (
              <>
                {/* 原句和翻译 */}
                <div className="content-section original-translation-section">
                  <div className="section-header">
                    <h4>
                      <Book size={18} />
                      原句与翻译
                    </h4>
                  </div>
                  <div className="section-content">
                    <div className="original-text">
                      <SimpleHighlightedText
                        text={sentence.original}
                        vocabularyWords={sentence.vocabulary}
                        foundWords={
                          showVocabularyHighlight
                            ? result.vocabulary?.foundWords
                            : []
                        }
                        onWordHover={handleWordHover}
                        sourceTitle={result.title}
                        masteredWords={collectedWords}
                      />
                    </div>
                    <div className="translation-text">
                      {sentence.translation}
                    </div>
                  </div>
                </div>

                {/* 句子结构 */}
                {sentence.structure && (
                  <div className="content-section">
                    <div
                      className="section-header clickable"
                      onClick={() => toggleSection(`structure-${index}`)}
                    >
                      <h4>
                        <PenTool size={18} />
                        句子结构
                      </h4>
                      <span className="toggle-icon">
                        {expandedSections[`structure-${index}`] ? "−" : "+"}
                      </span>
                    </div>
                    {expandedSections[`structure-${index}`] && (
                      <div className="section-content">
                        <div className="structure-content">
                          {sentence.structure}
                        </div>
                        {sentence.breakdown && (
                          <div className="breakdown-content">
                            <h5>成分分解：</h5>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {sentence.breakdown}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 重点词汇 */}
                {sentence.vocabulary && sentence.vocabulary.length > 0 && (
                  <div className="content-section">
                    <div
                      className="section-header clickable"
                      onClick={() => toggleSection(`vocabulary-${index}`)}
                    >
                      <h4>
                        <BookOpen size={18} />
                        重点词汇
                      </h4>
                      <span className="toggle-icon">
                        {expandedSections[`vocabulary-${index}`] ? "−" : "+"}
                      </span>
                    </div>
                    {expandedSections[`vocabulary-${index}`] && (
                      <div className="section-content">
                        <div className="vocabulary-grid">
                          {sentence.vocabulary.map((word, wordIndex) => {
                            const isCollected = collectedWords.has(
                              word.word.toLowerCase()
                            );
                            return (
                              <div key={wordIndex} className="vocab-card">
                                <div className="vocab-word-header">
                                  <div className="vocab-word-info">
                                    <span className="vocab-word">
                                      {word.word}
                                    </span>
                                    {word.phonetic && (
                                      <span className="vocab-phonetic">
                                        {word.phonetic}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    className={`collect-btn ${
                                      isCollected ? "collected" : ""
                                    }`}
                                    onClick={() =>
                                      handleWordCollection(word, isCollected)
                                    }
                                    title={
                                      isCollected ? "取消收藏" : "收藏单词"
                                    }
                                  >
                                    {isCollected ? (
                                      <Star size={16} />
                                    ) : (
                                      <StarOff size={16} />
                                    )}
                                  </button>
                                </div>
                                <div className="vocab-meaning">
                                  {word.meaning}
                                </div>
                                {word.usage && (
                                  <div className="vocab-usage">
                                    <strong>用法：</strong>
                                    {word.usage}
                                  </div>
                                )}
                                {word.example && (
                                  <div className="vocab-example">
                                    <strong>例句：</strong>
                                    {word.example}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 语法点 */}
                {sentence.grammar && sentence.grammar.length > 0 && (
                  <div className="content-section">
                    <div
                      className="section-header clickable"
                      onClick={() => toggleSection(`grammar-${index}`)}
                    >
                      <h4>
                        <PenTool size={18} />
                        语法要点
                      </h4>
                      <span className="toggle-icon">
                        {expandedSections[`grammar-${index}`] ? "−" : "+"}
                      </span>
                    </div>
                    {expandedSections[`grammar-${index}`] && (
                      <div className="section-content">
                        <div className="grammar-list">
                          {sentence.grammar.map(
                            (grammarPoint, grammarIndex) => (
                              <div key={grammarIndex} className="grammar-item">
                                <div className="grammar-point">
                                  <h5>{grammarPoint.point}</h5>
                                </div>
                                <div className="grammar-explanation">
                                  {grammarPoint.explanation}
                                </div>
                                {grammarPoint.example && (
                                  <div className="grammar-example">
                                    <strong>例句：</strong>
                                    {grammarPoint.example}
                                  </div>
                                )}
                                {grammarPoint.usage && (
                                  <div className="grammar-usage">
                                    <strong>使用场合：</strong>
                                    {grammarPoint.usage}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 重点难点 */}
                {sentence.keyPoints && (
                  <div className="content-section">
                    <div
                      className="section-header clickable"
                      onClick={() => toggleSection(`keypoints-${index}`)}
                    >
                      <h4>
                        <Lightbulb size={18} />
                        重点难点
                      </h4>
                      <span className="toggle-icon">
                        {expandedSections[`keypoints-${index}`] ? "−" : "+"}
                      </span>
                    </div>
                    {expandedSections[`keypoints-${index}`] && (
                      <div className="section-content">
                        <div className="keypoints-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {sentence.keyPoints}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* 悬浮单词提示 */}
      {hoveredWord && hoveredWord.position && (
        <WordTooltip
          word={hoveredWord}
          position={hoveredWord.position}
          onClose={() => setHoveredWord(null)}
          onCollect={(word, shouldCollect) => {
            // 简化的收藏处理逻辑
            handleWordCollection(word, !shouldCollect);
          }}
          onMaster={() => {}} // SentenceLearningView 暂不支持掌握功能
          onSpeak={speakWord}
          isCollected={collectedWords.has(hoveredWord.word?.toLowerCase())}
          isMastered={false}
        />
      )}

      {/* 重点单词学习弹窗 */}
      {showVocabularyLearning && result.vocabulary?.foundWords && (
        <VocabularyLearningModal
          vocabularyWords={result.vocabulary.foundWords}
          vocabularyName={result.vocabulary.vocabularyName}
          onClose={() => setShowVocabularyLearning(false)}
        />
      )}
    </div>
  );
};

// 重点单词学习弹窗组件
const VocabularyLearningModal = ({
  vocabularyWords,
  vocabularyName,
  onClose,
}) => {
  useEffect(() => {
    // 防止滚动穿透 - 禁用body滚动
    document.body.style.overflow = "hidden";

    return () => {
      // 组件卸载时恢复body滚动
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-container vocabulary-learning-modal">
        <div className="modal-header fixed-header">
          <h2>
            重点单词学习
            {vocabularyName && (
              <span className="vocabulary-name-badge">{vocabularyName}</span>
            )}
            <span className="word-count-badge">
              {vocabularyWords.length} 个单词
            </span>
          </h2>
          <button onClick={onClose} className="close-button" title="关闭">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="modal-content">
          <VocabularyLearning
            vocabularyWords={vocabularyWords}
            vocabularyListName={vocabularyName}
          />
        </div>
      </div>
    </div>
  );
};

export default SentenceLearningView;
