import { useState, useEffect } from "react";
import {
  Book,
  Globe,
  BookOpen,
  PenTool,
  MessageSquare,
  Target,
  Award,
  Heart,
  HeartOff,
  Star,
  X,
  Volume2,
} from "lucide-react";
import {
  collectWord,
  uncollectWordByText,
  isWordCollected,
  masterWord,
  unmasterWord,
  isWordMastered,
} from "../services/wordCollectionService";
import SimpleHighlightedText from "./SimpleHighlightedText";
import VocabularyLearning from "./VocabularyLearning";
import WordTooltip from "./WordTooltip";

// 高亮文本中英文部分的辅助函数
const highlightEnglishInText = (text) => {
  if (!text) return text;

  // 匹配英文单词、短语和句子的正则表达式
  const englishRegex =
    /([a-zA-Z][a-zA-Z0-9\s.,;:!?'"()\-\/]*[a-zA-Z0-9.,;:!?'"()\-\/]|[a-zA-Z]+)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = englishRegex.exec(text)) !== null) {
    // 添加匹配前的中文部分
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // 添加高亮的英文部分
    parts.push(
      <span key={match.index} className="english-highlight">
        {match[0]}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // 添加剩余的中文部分
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

const FlatLearningView = ({ result }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedWord, setSelectedWord] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [collectedWords, setCollectedWords] = useState(new Set());
  const [masteredWords, setMasteredWords] = useState(new Set());
  const [showVocabularyHighlight, setShowVocabularyHighlight] = useState(true);
  const [showVocabularyLearning, setShowVocabularyLearning] = useState(false);

  // 检查单词收藏和掌握状态
  useEffect(() => {
    const checkWordsStatus = async () => {
      if (!result?.paragraphs) return;

      const allWords = result.paragraphs.reduce((acc, paragraph) => {
        if (paragraph.vocabulary) {
          acc.push(...paragraph.vocabulary);
        }
        return acc;
      }, []);

      // 添加词库词汇
      if (result.vocabulary?.foundWords) {
        allWords.push(...result.vocabulary.foundWords);
      }

      const collectedSet = new Set();
      const masteredSet = new Set();

      for (const word of allWords) {
        const wordText = word.word;

        // 检查收藏状态
        const isCollected = await isWordCollected(wordText);
        if (isCollected) {
          collectedSet.add(wordText);
        }

        // 检查掌握状态
        const isMastered = await isWordMastered(wordText);
        if (isMastered) {
          masteredSet.add(wordText);
        }
      }

      setCollectedWords(collectedSet);
      setMasteredWords(masteredSet);
    };

    if (result) {
      checkWordsStatus();
    }
  }, [result]);

  // 初始化展开状态 - 默认展开所有模块
  useEffect(() => {
    if (result?.paragraphs) {
      const initialExpandedState = {};
      result.paragraphs.forEach((_, index) => {
        initialExpandedState[`translation-${index}`] = true;
        initialExpandedState[`vocabulary-${index}`] = true;
        initialExpandedState[`grammar-${index}`] = true;
        initialExpandedState[`sentences-${index}`] = true;
        initialExpandedState[`keyPoints-${index}`] = true;
      });
      setExpandedSections(initialExpandedState);
    }
  }, [result]);

  const handleWordHover = (wordData, position) => {
    setSelectedWord(wordData);
    setTooltipPosition(position);
  };

  const handleCloseTooltip = () => {
    setSelectedWord(null);
    setTooltipPosition(null);
  };

  const handleWordCollect = async (wordData, shouldCollect) => {
    if (shouldCollect) {
      await collectWord({
        ...wordData,
        context: wordData.context || "",
        sourceTitle: result.title || "未命名文章",
      });
      setCollectedWords((prev) => new Set(prev).add(wordData.word));
    } else {
      await uncollectWordByText(wordData.word);
      setCollectedWords((prev) => {
        const newSet = new Set(prev);
        newSet.delete(wordData.word);
        return newSet;
      });
    }
  };

  const handleWordMaster = async (wordData, shouldMaster) => {
    if (shouldMaster) {
      await masterWord(wordData.word);
      setMasteredWords((prev) => new Set(prev).add(wordData.word));
    } else {
      await unmasterWord(wordData.word);
      setMasteredWords((prev) => {
        const newSet = new Set(prev);
        newSet.delete(wordData.word);
        return newSet;
      });
    }
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
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

  // 点击外部区域关闭tooltip
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !e.target.closest(".word-tooltip") &&
        !e.target.closest(".highlighted-word")
      ) {
        handleCloseTooltip();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (!result || !result.paragraphs || result.paragraphs.length === 0) {
    return null;
  }

  return (
    <div className="flat-learning-view">
      {/* 完整原文展示 */}
      <div className="full-text-section">
        <div className="full-text-header">
          <h2>原文</h2>
        </div>
        <div className="full-text-content">
          <SimpleHighlightedText
            text={result.paragraphs.map((p) => p.original).join("\n\n")}
            vocabularyWords={result.paragraphs.reduce(
              (acc, p) => [...acc, ...(p.vocabulary || [])],
              []
            )}
            foundWords={
              showVocabularyHighlight ? result.vocabulary?.foundWords : []
            }
            onWordHover={handleWordHover}
            sourceTitle={result.title}
            masteredWords={masteredWords}
          />
        </div>
      </div>

      {/* 完整翻译展示 */}
      <div className="full-translation-section">
        <div className="full-translation-header">
          <h2>翻译</h2>
        </div>
        <div className="full-translation-content">
          {result.paragraphs.map((p) => p.translation).join("\n\n")}
        </div>
      </div>

      {/* 控制Header */}
      <div className="learning-controls-header">
        <div className="controls-left">
          <h3>学习内容</h3>
          <div className="learning-stats">
            <span className="stat-item">共 {result.paragraphs.length} 段</span>
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
              <Book size={18} />
              重点单词学习
            </button>
          )}
        </div>
      </div>

      {/* 段落内容 */}
      <div className="paragraphs-container">
        {result.paragraphs.map((paragraph, index) => (
          <div key={index} className="paragraph-section">
            <div className="paragraph-header">
              <h3>第 {index + 1} 段</h3>
            </div>

            {/* 原文 */}
            <div className="content-section original-section">
              <div className="section-header">
                <h4>
                  <Book size={18} />
                  原文
                </h4>
              </div>
              <div className="original-text">
                <SimpleHighlightedText
                  text={paragraph.original}
                  vocabularyWords={paragraph.vocabulary}
                  foundWords={
                    showVocabularyHighlight ? result.vocabulary?.foundWords : []
                  }
                  onWordHover={handleWordHover}
                  sourceTitle={result.title}
                  masteredWords={masteredWords}
                />
              </div>
            </div>

            {/* 翻译 */}
            <div className="content-section">
              <div
                className="section-header clickable"
                onClick={() => toggleSection(`translation-${index}`)}
              >
                <h4>
                  <Globe size={18} />
                  中文翻译
                </h4>
                <span className="toggle-icon">
                  {expandedSections[`translation-${index}`] ? "−" : "+"}
                </span>
              </div>
              {expandedSections[`translation-${index}`] && (
                <div className="section-content">
                  <div className="translation-text">
                    {paragraph.translation}
                  </div>
                </div>
              )}
            </div>

            {/* 重点词汇 */}
            {paragraph.vocabulary && paragraph.vocabulary.length > 0 && (
              <div className="content-section">
                <div
                  className="section-header clickable"
                  onClick={() => toggleSection(`vocabulary-${index}`)}
                >
                  <h4>
                    <BookOpen size={18} />
                    重点词汇 ({paragraph.vocabulary.length})
                  </h4>
                  <span className="toggle-icon">
                    {expandedSections[`vocabulary-${index}`] ? "−" : "+"}
                  </span>
                </div>
                {expandedSections[`vocabulary-${index}`] && (
                  <div className="section-content">
                    <div className="vocabulary-list-container">
                      <div className="vocabulary-list">
                        {paragraph.vocabulary.map((word, wordIndex) => (
                          <div key={wordIndex} className="vocabulary-item">
                            <div className="vocab-header">
                              <span className="vocab-word">{word.word}</span>
                              {word.phonetic && (
                                <span className="vocab-phonetic">
                                  {word.phonetic}
                                </span>
                              )}
                              <button
                                onClick={() =>
                                  handleWordCollect(
                                    word,
                                    !collectedWords.has(word.word)
                                  )
                                }
                                className={`vocab-collect-btn ${
                                  collectedWords.has(word.word)
                                    ? "collected"
                                    : ""
                                }`}
                                title={
                                  collectedWords.has(word.word)
                                    ? "从单词本移除"
                                    : "加入单词本"
                                }
                              >
                                {collectedWords.has(word.word) ? (
                                  <Star size={16} />
                                ) : (
                                  <Heart size={16} />
                                )}
                              </button>
                            </div>
                            <div className="vocab-meaning">{word.meaning}</div>
                            {word.usage && (
                              <div className="vocab-usage">{word.usage}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 语法要点 */}
            {paragraph.grammar && paragraph.grammar.length > 0 && (
              <div className="content-section">
                <div
                  className="section-header clickable"
                  onClick={() => toggleSection(`grammar-${index}`)}
                >
                  <h4>
                    <PenTool size={18} />
                    语法要点 ({paragraph.grammar.length})
                  </h4>
                  <span className="toggle-icon">
                    {expandedSections[`grammar-${index}`] ? "−" : "+"}
                  </span>
                </div>
                {expandedSections[`grammar-${index}`] && (
                  <div className="section-content">
                    <div className="grammar-list">
                      {paragraph.grammar.map((item, grammarIndex) => (
                        <div key={grammarIndex} className="grammar-item">
                          <div className="grammar-point">
                            {highlightEnglishInText(item.point)}
                          </div>
                          {item.sentence && (
                            <div className="grammar-sentence">
                              <span className="sentence-label">原文：</span>
                              <span className="original-sentence">
                                {item.sentence}
                              </span>
                            </div>
                          )}
                          <div className="grammar-explanation">
                            {highlightEnglishInText(item.explanation)}
                          </div>
                          {item.example && (
                            <div className="grammar-example">
                              <span className="example-label">例句：</span>
                              {highlightEnglishInText(item.example)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 句子分析 */}
            {paragraph.sentences && paragraph.sentences.length > 0 && (
              <div className="content-section">
                <div
                  className="section-header clickable"
                  onClick={() => toggleSection(`sentences-${index}`)}
                >
                  <h4>
                    <MessageSquare size={18} />
                    句子分析 ({paragraph.sentences.length})
                  </h4>
                  <span className="toggle-icon">
                    {expandedSections[`sentences-${index}`] ? "−" : "+"}
                  </span>
                </div>
                {expandedSections[`sentences-${index}`] && (
                  <div className="section-content">
                    <div className="sentences-list">
                      {paragraph.sentences.map((sentence, sentenceIndex) => (
                        <div key={sentenceIndex} className="sentence-item">
                          <div className="sentence-original">
                            {sentence.original}
                          </div>
                          <div className="sentence-translation">
                            {sentence.translation}
                          </div>
                          {sentence.structure && (
                            <div className="sentence-structure">
                              <span className="structure-label">
                                结构分析：
                              </span>
                              {sentence.structure}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 段落要点 */}
            {paragraph.keyPoints && paragraph.keyPoints.length > 0 && (
              <div className="content-section">
                <div
                  className="section-header clickable"
                  onClick={() => toggleSection(`keyPoints-${index}`)}
                >
                  <h4>
                    <Target size={18} />
                    段落要点
                  </h4>
                  <span className="toggle-icon">
                    {expandedSections[`keyPoints-${index}`] ? "−" : "+"}
                  </span>
                </div>
                {expandedSections[`keyPoints-${index}`] && (
                  <div className="section-content">
                    <ul className="key-points-list">
                      {paragraph.keyPoints.map((point, pointIndex) => (
                        <li key={pointIndex}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 单词提示框 */}
      {selectedWord && tooltipPosition && (
        <WordTooltip
          word={selectedWord}
          position={tooltipPosition}
          onClose={handleCloseTooltip}
          onCollect={handleWordCollect}
          onMaster={handleWordMaster}
          onSpeak={speakWord}
          isCollected={collectedWords.has(selectedWord.word)}
          isMastered={masteredWords.has(selectedWord.word)}
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

export default FlatLearningView;
