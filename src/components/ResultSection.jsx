import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Book,
  Globe,
  BookOpen,
  PenTool,
  MessageCircle,
  Lightbulb,
  Hash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ResultSection = ({ result }) => {
  const [activeView, setActiveView] = useState("all");
  const [expandedSections, setExpandedSections] = useState({
    original: true,
    translation: true,
    phrases: true,
    vocabulary: true,
    grammar: true,
    sentences: true,
    suggestions: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const viewOptions = [
    { id: "all", label: "全部" },
    { id: "translation", label: "翻译" },
    { id: "phrases", label: "短语" },
    { id: "vocabulary", label: "词汇" },
    { id: "grammar", label: "语法" },
  ];

  const shouldShowSection = (sectionType) => {
    if (activeView === "all") return true;
    return sectionType === activeView;
  };

  return (
    <motion.section
      className="result-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-header">
        <h2>精讲内容</h2>
        <div className="view-options">
          {viewOptions.map((option) => (
            <button
              key={option.id}
              className={`view-btn ${activeView === option.id ? "active" : ""}`}
              onClick={() => setActiveView(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="result-content">
        <AnimatePresence mode="wait">
          {/* 原文展示 */}
          {shouldShowSection("all") && result.originalText && (
            <motion.div
              className="content-block"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div
                className="block-header"
                onClick={() => toggleSection("original")}
              >
                <h3>
                  <Book size={20} />
                  原文
                </h3>
                {expandedSections.original ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
              {expandedSections.original && (
                <div className="block-content">
                  <div className="original-text">{result.originalText}</div>
                </div>
              )}
            </motion.div>
          )}

          {/* 翻译 */}
          {shouldShowSection("translation") && result.translation && (
            <motion.div
              className="content-block"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div
                className="block-header"
                onClick={() => toggleSection("translation")}
              >
                <h3>
                  <Globe size={20} />
                  中文翻译
                </h3>
                {expandedSections.translation ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
              {expandedSections.translation && (
                <div className="block-content">
                  <div className="translation-text">{result.translation}</div>
                </div>
              )}
            </motion.div>
          )}

          {/* 重点短语 */}
          {shouldShowSection("phrases") &&
            result.phrases &&
            result.phrases.length > 0 && (
              <motion.div
                className="content-block"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div
                  className="block-header"
                  onClick={() => toggleSection("phrases")}
                >
                  <h3>
                    <Hash size={20} />
                    重点短语
                  </h3>
                  {expandedSections.phrases ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
                {expandedSections.phrases && (
                  <div className="block-content">
                    <div className="phrases-grid">
                      {result.phrases.map((phrase, index) => (
                        <motion.div
                          key={index}
                          className="phrase-card"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="phrase-header">
                            <span className="phrase-text">{phrase.phrase}</span>
                            {phrase.type && (
                              <span className="phrase-type">{phrase.type}</span>
                            )}
                          </div>
                          <div className="phrase-translation">
                            {phrase.translation}
                          </div>
                          {phrase.usage && (
                            <div className="phrase-usage">
                              <span className="usage-label">用法:</span>{" "}
                              {phrase.usage}
                            </div>
                          )}
                          {phrase.example && (
                            <div className="phrase-example">
                              <span className="example-label">例句:</span>{" "}
                              {phrase.example}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          {/* 重点词汇 */}
          {shouldShowSection("vocabulary") &&
            result.vocabulary &&
            result.vocabulary.length > 0 && (
              <motion.div
                className="content-block"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div
                  className="block-header"
                  onClick={() => toggleSection("vocabulary")}
                >
                  <h3>
                    <BookOpen size={20} />
                    重点词汇
                  </h3>
                  {expandedSections.vocabulary ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
                {expandedSections.vocabulary && (
                  <div className="block-content">
                    <div className="vocabulary-grid">
                      {result.vocabulary.map((word, index) => (
                        <motion.div
                          key={index}
                          className="vocabulary-card"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="word-header">
                            <span className="word">{word.word}</span>
                            {word.phonetic && (
                              <span className="phonetic">{word.phonetic}</span>
                            )}
                          </div>
                          <div className="word-meaning">{word.meaning}</div>
                          {word.example && (
                            <div className="word-example">
                              <span className="example-label">例句:</span>{" "}
                              {word.example}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          {/* 语法要点 */}
          {shouldShowSection("grammar") &&
            result.grammar &&
            result.grammar.length > 0 && (
              <motion.div
                className="content-block"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div
                  className="block-header"
                  onClick={() => toggleSection("grammar")}
                >
                  <h3>
                    <PenTool size={20} />
                    语法要点
                  </h3>
                  {expandedSections.grammar ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
                {expandedSections.grammar && (
                  <div className="block-content">
                    <div className="grammar-list">
                      {result.grammar.map((point, index) => (
                        <motion.div
                          key={index}
                          className="grammar-item"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="grammar-title">{point.title}</div>
                          <div className="grammar-explanation">
                            {point.explanation}
                          </div>
                          {point.example && (
                            <div className="grammar-example">
                              <span className="example-original">
                                {point.example}
                              </span>
                              {point.exampleTranslation && (
                                <span className="example-translation">
                                  {point.exampleTranslation}
                                </span>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          {/* 句子精讲 */}
          {shouldShowSection("all") &&
            result.sentences &&
            result.sentences.length > 0 && (
              <motion.div
                className="content-block"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div
                  className="block-header"
                  onClick={() => toggleSection("sentences")}
                >
                  <h3>
                    <MessageCircle size={20} />
                    句子精讲
                  </h3>
                  {expandedSections.sentences ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
                {expandedSections.sentences && (
                  <div className="block-content">
                    <div className="sentence-list">
                      {result.sentences.map((sentence, index) => (
                        <motion.div
                          key={index}
                          className="sentence-item"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="sentence-original">
                            {sentence.original}
                          </div>
                          <div className="sentence-translation">
                            {sentence.translation}
                          </div>
                          {sentence.keyPoints && (
                            <div className="sentence-points">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {sentence.keyPoints}
                              </ReactMarkdown>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          {/* 学习建议 */}
          {shouldShowSection("all") && result.suggestions && (
            <motion.div
              className="content-block"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div
                className="block-header"
                onClick={() => toggleSection("suggestions")}
              >
                <h3>
                  <Lightbulb size={20} />
                  学习建议
                </h3>
                {expandedSections.suggestions ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
              {expandedSections.suggestions && (
                <div className="block-content">
                  <div className="suggestions-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result.suggestions}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default ResultSection;
