import { useState } from "react";
import {
  Book,
  Globe,
  BookOpen,
  PenTool,
  MessageSquare,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const FlatView = ({ result }) => {
  const [expandedParagraphs, setExpandedParagraphs] = useState({});

  if (!result || !result.paragraphs || result.paragraphs.length === 0) {
    return null;
  }

  const toggleParagraph = (paragraphId) => {
    setExpandedParagraphs((prev) => ({
      ...prev,
      [paragraphId]: !prev[paragraphId],
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
    <div className="flat-view">
      {/* 头部信息 */}
      <div className="flat-header">
        <h2 className="flat-title">{result.title || "英文精讲"}</h2>
        <div className="flat-meta">
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

      {/* 所有段落平铺展示 */}
      <div className="paragraphs-container">
        {result.paragraphs.map((paragraph, index) => {
          const isExpanded = expandedParagraphs[`para-${index}`] !== false; // 默认展开

          return (
            <motion.div
              key={index}
              className="paragraph-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* 段落标题栏 */}
              <div
                className="paragraph-header"
                onClick={() => toggleParagraph(`para-${index}`)}
              >
                <h3>
                  <span className="paragraph-number">第 {index + 1} 段</span>
                </h3>
                <button className="expand-btn">
                  {isExpanded ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="paragraph-body">
                  {/* 原文和翻译并排 */}
                  <div className="text-comparison">
                    <div className="text-column original-column">
                      <div className="column-header">
                        <Book size={16} />
                        <span>原文</span>
                      </div>
                      <div className="text-content original-text">
                        {paragraph.original}
                      </div>
                    </div>

                    <div className="text-column translation-column">
                      <div className="column-header">
                        <Globe size={16} />
                        <span>翻译</span>
                      </div>
                      <div className="text-content translation-text">
                        {paragraph.translation}
                      </div>
                    </div>
                  </div>

                  {/* 重点词汇 */}
                  {paragraph.vocabulary && paragraph.vocabulary.length > 0 && (
                    <div className="paragraph-section vocabulary-section">
                      <div className="section-title">
                        <BookOpen size={16} />
                        <span>重点词汇</span>
                      </div>
                      <div className="vocabulary-grid">
                        {paragraph.vocabulary.map((word, idx) => (
                          <div key={idx} className="vocab-card">
                            <div className="vocab-main">
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
                    </div>
                  )}

                  {/* 语法要点 */}
                  {paragraph.grammar && paragraph.grammar.length > 0 && (
                    <div className="paragraph-section grammar-section">
                      <div className="section-title">
                        <PenTool size={16} />
                        <span>语法要点</span>
                      </div>
                      <div className="grammar-list">
                        {paragraph.grammar.map((item, idx) => (
                          <div key={idx} className="grammar-card">
                            <div className="grammar-title">{item.point}</div>
                            <div className="grammar-desc">
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
                    </div>
                  )}

                  {/* 句子分析 */}
                  {paragraph.sentences && paragraph.sentences.length > 0 && (
                    <div className="paragraph-section sentences-section">
                      <div className="section-title">
                        <MessageSquare size={16} />
                        <span>句子分析</span>
                      </div>
                      <div className="sentences-list">
                        {paragraph.sentences.map((sentence, idx) => (
                          <div key={idx} className="sentence-card">
                            <div className="sentence-original">
                              {sentence.original}
                            </div>
                            <div className="sentence-translation">
                              {sentence.translation}
                            </div>
                            {sentence.structure && (
                              <div className="sentence-analysis">
                                <span className="analysis-label">结构：</span>
                                {sentence.structure}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 段落要点 */}
                  {paragraph.keyPoints && paragraph.keyPoints.length > 0 && (
                    <div className="paragraph-section keypoints-section">
                      <div className="section-title">
                        <Target size={16} />
                        <span>学习要点</span>
                      </div>
                      <ul className="keypoints-list">
                        {paragraph.keyPoints.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 总结部分 */}
      {result.summary && (
        <div className="summary-card">
          <h3 className="summary-title">📊 文章总结</h3>
          <div className="summary-content">
            {result.summary.mainIdea && (
              <div className="summary-item">
                <strong>主旨大意</strong>
                <p>{result.summary.mainIdea}</p>
              </div>
            )}
            {result.summary.writingStyle && (
              <div className="summary-item">
                <strong>写作风格</strong>
                <p>{result.summary.writingStyle}</p>
              </div>
            )}
            {result.summary.suggestions && (
              <div className="summary-item">
                <strong>学习建议</strong>
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{
                    __html: result.summary.suggestions,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlatView;
