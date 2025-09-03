import { useState, useEffect } from "react";
import { FileText, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import {
  getTextStats,
  validateTextForSentenceAnalysis,
  preprocessText,
} from "../utils/textUtils";

const InputSection = ({
  inputText,
  setInputText,
  onAnalyze,
  onLoadExample,
  onClear,
  isLoading,
  showButtonLoading = true, // 默认显示按钮 loading
}) => {
  const [textStats, setTextStats] = useState({
    wordCount: 0,
    sentenceCount: 0,
  });
  const [inputError, setInputError] = useState("");
  const [sentenceWarning, setSentenceWarning] = useState("");

  useEffect(() => {
    const stats = getTextStats(inputText);
    setTextStats(stats);

    // 给出句子数量提示
    if (stats.sentenceCount > 15) {
      setSentenceWarning(
        `这篇文章有 ${stats.sentenceCount} 个句子呢，内容很丰富！处理起来需要多一点时间，泡杯茶等等我吧 ☕`
      );
    } else {
      setSentenceWarning("");
    }
  }, [inputText]);

  // 验证输入是否适合句子分析
  const validateInput = (text) => {
    const validation = validateTextForSentenceAnalysis(text);

    if (!validation.isValid) {
      setInputError(validation.error);
      return false;
    }

    setInputError("");
    return true;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);
    validateInput(value);
  };

  const handleAnalyze = () => {
    if (validateInput(inputText)) {
      onAnalyze();
    }
  };

  return (
    <section className="input-section">
      <div className="section-header">
        <h2>来，把文章给我看看 📝</h2>
        <div className="action-buttons">
          <button
            className="btn btn-secondary"
            onClick={onLoadExample}
            disabled={isLoading}
          >
            <FileText size={16} />
            试试这个例子
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClear}
            disabled={isLoading || !inputText}
          >
            <Trash2 size={16} />
            重新开始
          </button>
        </div>
      </div>

      <div className="input-container">
        <textarea
          className={`text-input ${inputError ? "error" : ""}`}
          value={inputText}
          onChange={handleInputChange}
          placeholder="把你想学习的英文文章贴到这里吧～不管是新闻、小说还是学术文章，我都陪你慢慢读懂每一句话..."
          disabled={isLoading}
        />

        {/* 错误提示 */}
        {inputError && <div className="input-error">{inputError}</div>}

        {/* 句子数量警告 */}
        {sentenceWarning && (
          <div className="input-warning">
            <AlertTriangle size={16} />
            {sentenceWarning}
          </div>
        )}

        <div className="input-footer">
          <span className="word-count">
            {textStats.sentenceCount > 0
              ? `发现了 ${textStats.sentenceCount} 个句子，${textStats.wordCount} 个单词，准备好了吗？`
              : "把文字贴进来，我们一起探索每个句子的奥秘吧 ～"}
          </span>

          <button
            className={`btn btn-primary ${
              isLoading && showButtonLoading ? "loading" : ""
            }`}
            onClick={handleAnalyze}
            disabled={isLoading || !inputText.trim() || inputError}
          >
            {isLoading && showButtonLoading ? (
              <>
                <span className="spinner"></span>
                正在努力分析中...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                开始分析
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

export default InputSection;
