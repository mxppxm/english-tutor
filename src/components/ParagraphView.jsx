import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Book,
  Globe,
  BookOpen,
  PenTool,
  MessageSquare,
  Target,
  Award,
} from "lucide-react";
import { highlightVocabularyInText } from "../services/vocabularyService";

const ParagraphView = ({ result }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    translation: true,
    vocabulary: true,
    grammar: false,
    sentences: false,
    keyPoints: false,
  });

  if (!result || !result.paragraphs || result.paragraphs.length === 0) {
    return null;
  }

  const currentParagraph = result.paragraphs[currentIndex];
  const totalParagraphs = result.paragraphs.length;

  // 处理词库高亮
  const highlightedText = useMemo(() => {
    if (!currentParagraph?.original || !result.vocabulary?.foundWords) {
      return currentParagraph?.original || "";
    }

    return highlightVocabularyInText(
      currentParagraph.original,
      result.vocabulary.foundWords
    );
  }, [currentParagraph?.original, result.vocabulary?.foundWords]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(totalParagraphs - 1, prev + 1));
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      入门级: "difficulty-beginner",
      初级: "difficulty-elementary",
      中级: "difficulty-intermediate",
      高级: "difficulty-advanced",
    };
    return colors[difficulty] || "difficulty-intermediate";
  };

  return (
    <div className="paragraph-view">
      {/* 头部信息 */}
      <div className="view-header">
        <div className="header-info">
          <h2 className="view-title">{result.title}</h2>
          <div className="header-meta">
            <span
              className={`difficulty-badge ${getDifficultyColor(
                result.difficulty
              )}`}
            >
              <Award size={14} />
              {result.difficulty}
            </span>
            {result.overview && (
              <span className="overview">{result.overview}</span>
            )}
          </div>
        </div>

        {/* 段落导航 */}
        <div className="paragraph-nav">
          <button
            className="nav-btn"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="nav-info">
            <span className="current-paragraph">第 {currentIndex + 1} 段</span>
            <span className="total-paragraphs">共 {totalParagraphs} 段</span>
          </div>

          <button
            className="nav-btn"
            onClick={goToNext}
            disabled={currentIndex === totalParagraphs - 1}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* 段落指示器 */}
      <div className="paragraph-indicators">
        {result.paragraphs.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(index)}
            title={`跳转到第 ${index + 1} 段`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* 段落内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="paragraph-content"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* 原文 */}
          <div className="content-section original-section">
            <div className="section-header">
              <h3>
                <Book size={18} />
                原文
                {result.vocabulary?.foundWords &&
                  result.vocabulary.foundWords.length > 0 && (
                    <span className="vocabulary-count-badge">
                      {result.vocabulary.foundWords.length} 个词库单词
                    </span>
                  )}
              </h3>
            </div>
            <div
              className="original-text vocabulary-highlighted"
              dangerouslySetInnerHTML={{ __html: highlightedText }}
            />
          </div>

          {/* 翻译 */}
          <div className="content-section">
            <div
              className="section-header clickable"
              onClick={() => toggleSection("translation")}
            >
              <h3>
                <Globe size={18} />
                中文翻译
              </h3>
              <span className="toggle-icon">
                {expandedSections.translation ? "−" : "+"}
              </span>
            </div>
            {expandedSections.translation && (
              <motion.div
                className="section-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="translation-text">
                  {currentParagraph.translation}
                </div>
              </motion.div>
            )}
          </div>

          {/* 重点词汇 */}
          {currentParagraph.vocabulary &&
            currentParagraph.vocabulary.length > 0 && (
              <div className="content-section">
                <div
                  className="section-header clickable"
                  onClick={() => toggleSection("vocabulary")}
                >
                  <h3>
                    <BookOpen size={18} />
                    重点词汇 ({currentParagraph.vocabulary.length})
                  </h3>
                  <span className="toggle-icon">
                    {expandedSections.vocabulary ? "−" : "+"}
                  </span>
                </div>
                {expandedSections.vocabulary && (
                  <motion.div
                    className="section-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="vocabulary-list">
                      {currentParagraph.vocabulary.map((word, index) => (
                        <div key={index} className="vocabulary-item">
                          <div className="vocab-header">
                            <span className="vocab-word">{word.word}</span>
                            {word.phonetic && (
                              <span className="vocab-phonetic">
                                {word.phonetic}
                              </span>
                            )}
                          </div>
                          <div className="vocab-meaning">{word.meaning}</div>
                          {word.usage && (
                            <div className="vocab-usage">{word.usage}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

          {/* 语法要点 */}
          {currentParagraph.grammar && currentParagraph.grammar.length > 0 && (
            <div className="content-section">
              <div
                className="section-header clickable"
                onClick={() => toggleSection("grammar")}
              >
                <h3>
                  <PenTool size={18} />
                  语法要点 ({currentParagraph.grammar.length})
                </h3>
                <span className="toggle-icon">
                  {expandedSections.grammar ? "−" : "+"}
                </span>
              </div>
              {expandedSections.grammar && (
                <motion.div
                  className="section-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="grammar-list">
                    {currentParagraph.grammar.map((item, index) => (
                      <div key={index} className="grammar-item">
                        <div className="grammar-point">{item.point}</div>
                        <div className="grammar-explanation">
                          {item.explanation}
                        </div>
                        {item.example && (
                          <div className="grammar-example">
                            <span className="example-label">例句：</span>
                            {item.example}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* 句子分析 */}
          {currentParagraph.sentences &&
            currentParagraph.sentences.length > 0 && (
              <div className="content-section">
                <div
                  className="section-header clickable"
                  onClick={() => toggleSection("sentences")}
                >
                  <h3>
                    <MessageSquare size={18} />
                    句子分析 ({currentParagraph.sentences.length})
                  </h3>
                  <span className="toggle-icon">
                    {expandedSections.sentences ? "−" : "+"}
                  </span>
                </div>
                {expandedSections.sentences && (
                  <motion.div
                    className="section-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="sentences-list">
                      {currentParagraph.sentences.map((sentence, index) => (
                        <div key={index} className="sentence-item">
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
                  </motion.div>
                )}
              </div>
            )}

          {/* 段落要点 */}
          {currentParagraph.keyPoints &&
            currentParagraph.keyPoints.length > 0 && (
              <div className="content-section">
                <div
                  className="section-header clickable"
                  onClick={() => toggleSection("keyPoints")}
                >
                  <h3>
                    <Target size={18} />
                    段落要点
                  </h3>
                  <span className="toggle-icon">
                    {expandedSections.keyPoints ? "−" : "+"}
                  </span>
                </div>
                {expandedSections.keyPoints && (
                  <motion.div
                    className="section-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <ul className="key-points-list">
                      {currentParagraph.keyPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            )}
        </motion.div>
      </AnimatePresence>

      {/* 总结部分（仅在最后一段显示） */}
      {currentIndex === totalParagraphs - 1 && result.summary && (
        <motion.div
          className="summary-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3>📊 文章总结</h3>
          {result.summary.mainIdea && (
            <div className="summary-item">
              <strong>主旨大意：</strong>
              <p>{result.summary.mainIdea}</p>
            </div>
          )}
          {result.summary.writingStyle && (
            <div className="summary-item">
              <strong>写作风格：</strong>
              <p>{result.summary.writingStyle}</p>
            </div>
          )}
          {result.summary.suggestions && (
            <div className="summary-item">
              <strong>学习建议：</strong>
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: result.summary.suggestions }}
              />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ParagraphView;
