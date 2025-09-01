import { useState, useEffect } from "react";
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

const EnhancedFlatView = ({ result }) => {
  const [expandedParagraphs, setExpandedParagraphs] = useState({});

  useEffect(() => {
    // 初始化所有段落为展开状态
    if (result && result.paragraphs) {
      const initialState = {};
      result.paragraphs.forEach((_, index) => {
        initialState[`para-${index}`] = true;
      });
      setExpandedParagraphs(initialState);
    }
  }, [result]);

  // 处理鼠标悬停显示tooltip

  if (!result) {
    return null;
  }

  if (!result.paragraphs || result.paragraphs.length === 0) {
    return (
      <div className="flat-view">
        <div className="flat-header">
          <h2 className="flat-title">{result.title || "分析结果"}</h2>
          <div className="flat-meta">
            <span className="overview">暂无分析内容</span>
          </div>
        </div>
        <div className="no-content">
          <p>没有可显示的分析内容，请重新尝试分析。</p>
        </div>
      </div>
    );
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
          const paragraphId = `para-${index}`;
          const isExpanded = expandedParagraphs[paragraphId];

          return (
            <div key={index} className="paragraph-block">
              {/* 段落标题栏 */}
              <div
                className="paragraph-header"
                onClick={() => toggleParagraph(paragraphId)}
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

                  {/* 重点词汇功能已移除，将由本地词库替代 */}

                  {/* 语法要点 */}
                  {paragraph.grammar && paragraph.grammar.length > 0 && (
                    <div className="paragraph-section grammar-section">
                      <div className="section-title">
                        <PenTool size={16} />
                        <span>语法要点</span>
                      </div>
                      <div className="grammar-list">
                        {paragraph.grammar.map((item, idx) => (
                          <div key={idx} className="grammar-card enhanced">
                            <div className="grammar-header">
                              <div className="grammar-title">{item.point}</div>
                              <div className="grammar-badge">语法重点</div>
                            </div>
                            <div className="grammar-desc">
                              {item.explanation}
                            </div>
                            {item.usage && (
                              <div className="grammar-usage">
                                <span className="usage-label">使用场景：</span>
                                {item.usage}
                              </div>
                            )}

                            {/* 原文例句 */}
                            <div className="grammar-original-example">
                              <span className="original-example-label">
                                原文例句：
                              </span>
                              <div className="original-example-text">
                                "{paragraph.original}"
                              </div>
                            </div>

                            {item.example && (
                              <div className="grammar-example">
                                <span className="example-label">
                                  扩展例句：
                                </span>
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
                          <div key={idx} className="sentence-card enhanced">
                            <div className="sentence-header">
                              <div className="sentence-original">
                                {sentence.original}
                              </div>
                            </div>
                            <div className="sentence-translation">
                              {sentence.translation}
                            </div>
                            {sentence.structure && (
                              <div className="sentence-analysis">
                                <span className="analysis-label">
                                  语法结构：
                                </span>
                                {sentence.structure}
                              </div>
                            )}
                            {sentence.breakdown && (
                              <div className="sentence-breakdown">
                                <span className="breakdown-label">
                                  句子分析：
                                </span>
                                {sentence.breakdown}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedFlatView;
