import { useState, useEffect } from "react";
import { FileText, Trash2, Sparkles } from "lucide-react";

const InputSection = ({
  inputText,
  setInputText,
  onAnalyze,
  onLoadExample,
  onClear,
  isLoading,
}) => {
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const words = inputText
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  }, [inputText]);

  return (
    <section className="input-section">
      <div className="section-header">
        <h2>输入英文文本</h2>
        <div className="action-buttons">
          <button
            className="btn btn-secondary"
            onClick={onLoadExample}
            disabled={isLoading}
          >
            <FileText size={16} />
            加载示例
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClear}
            disabled={isLoading || !inputText}
          >
            <Trash2 size={16} />
            清空
          </button>
        </div>
      </div>

      <div className="input-container">
        <textarea
          className="text-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="在这里粘贴或输入你想要精讲的英文文本..."
          disabled={isLoading}
        />

        <div className="input-footer">
          <span className="word-count">
            {wordCount > 0 ? `${wordCount} 个单词` : "请输入文本"}
          </span>

          <button
            className={`btn btn-primary ${isLoading ? "loading" : ""}`}
            onClick={onAnalyze}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                生成中...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                生成精讲
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

export default InputSection;
