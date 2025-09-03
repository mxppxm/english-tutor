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
        `输入了 ${stats.sentenceCount} 个句子，句子较多需要更长分析时间，请耐心等待`
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
          className={`text-input ${inputError ? "error" : ""}`}
          value={inputText}
          onChange={handleInputChange}
          placeholder="在这里粘贴或输入你想要精讲的英文文本，系统会对每个句子进行详细分析..."
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
              ? `${textStats.sentenceCount} 个句子 · ${textStats.wordCount} 个单词`
              : "请输入文本（将进行逐句精讲分析）"}
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
