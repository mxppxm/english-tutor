import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import InputSection from "../components/InputSection";
import ImageUpload from "../components/ImageUpload";
import ConfigModal from "../components/ConfigModal";
import HistoryModal from "../components/HistoryModal";
import PageLoading from "../components/PageLoading";
import TruncateConfirmModal from "../components/TruncateConfirmModal";
import { analyzeText, analyzeSentencesBatch } from "../services/api";
import {
  saveAnalysisToHistory,
  findHistoryByText,
} from "../services/historyService";
import { Settings, Clock, FileText, Camera } from "lucide-react";
import { preprocessText } from "../utils/textUtils";

const HomePage = () => {
  const navigate = useNavigate();
  const [inputMethod, setInputMethod] = useState("text"); // 'text' or 'image'
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [forceConfig, setForceConfig] = useState(false); // 强制显示配置弹窗
  const [showHistory, setShowHistory] = useState(false);
  const [showTruncateConfirm, setShowTruncateConfirm] = useState(false);
  const [pendingAnalysisText, setPendingAnalysisText] = useState("");
  const [pendingSentenceCount, setPendingSentenceCount] = useState(0);
  const [pendingDeduplicationInfo, setPendingDeduplicationInfo] =
    useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // 检查 API key 是否配置
  const checkApiKeyConfiguration = () => {
    const provider = localStorage.getItem("ai_provider") || "doubao";
    const apiKey = localStorage.getItem(`${provider}_api_key`);
    return !!apiKey?.trim();
  };

  // 页面加载时检查 API key
  useEffect(() => {
    const hasValidApiKey = checkApiKeyConfiguration();
    if (!hasValidApiKey) {
      setForceConfig(true);
      setShowConfig(true);
    }
  }, []);

  // 执行实际的分析逻辑
  const performAnalysis = async (textToAnalyze) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 首先检查历史记录中是否已经有相同的文本
      console.log("检查历史记录中是否存在相同文本...");
      const existingHistory = await findHistoryByText(textToAnalyze);

      if (existingHistory) {
        console.log("找到匹配的历史记录，直接使用:", existingHistory.id);

        // 显示提示信息
        const formatTime = (timestamp) => {
          const date = new Date(timestamp);
          const now = new Date();
          const diffTime = now - date;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            return (
              "今天 " +
              date.toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            );
          } else if (diffDays === 1) {
            return (
              "昨天 " +
              date.toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            );
          } else if (diffDays < 7) {
            return `${diffDays}天前`;
          } else {
            return date.toLocaleDateString("zh-CN");
          }
        };

        setSuccessMessage(
          `✨ 找到了相同文本的分析记录（${formatTime(
            existingHistory.timestamp
          )}），无需重新生成，正在为您打开...`
        );

        // 延迟一下让用户看到提示，然后跳转
        setTimeout(() => {
          navigate(`/learn/${existingHistory.id}`);
        }, 1500);

        return;
      }

      // 没有找到历史记录，进行新的分析
      console.log("未找到匹配的历史记录，开始AI分析...");

      // 检查是否配置了API
      const provider = localStorage.getItem("ai_provider") || "doubao";
      const apiKey = localStorage.getItem(`${provider}_api_key`);
      if (!apiKey) {
        setError(
          `请先配置 ${provider === "doubao" ? "豆包" : "Gemini"} API 密钥`
        );
        setShowConfig(true);
        return;
      }

      // 预处理文本：分割句子进行逐句分析（限制10句以内避免超时）
      console.log("开始文本预处理...");
      const preprocessResult = preprocessText(textToAnalyze, 50); // 此处改为50，后续自动分批
      console.log(
        `文本预处理完成: ${preprocessResult.originalSentenceCount} -> ${preprocessResult.sentenceCount} 个句子`
      );

      // 显示去重信息
      if (preprocessResult.deduplication.hasDeduplication) {
        console.log(
          `🔄 句子去重: ${preprocessResult.deduplication.originalCount} -> ${preprocessResult.deduplication.uniqueCount} 个句子`
        );
        setSuccessMessage(
          `🔄 检测到 ${preprocessResult.deduplication.duplicateCount} 个重复句子已自动去重，节省分析资源～`
        );
        // 短暂显示去重提示后清除
        setTimeout(() => setSuccessMessage(null), 3000);
      }

      console.log(
        "📝 传递给AI分析的文本（去重后）:",
        preprocessResult.processedText
      );
      console.log(
        "📝 processedText长度:",
        preprocessResult.processedText.length
      );
      console.log("📝 句子数组:", preprocessResult.sentences);

      let result;
      // 自动分批（每批最多5句，兼容单句和少量句子）
      if (preprocessResult.sentences.length > 3) {
        result = await analyzeSentencesBatch(preprocessResult.sentences, 3);
      } else {
        // 少量句子仍按原有逻辑
        result = await analyzeSentencesBatch(preprocessResult.sentences, 3);
      }

      // 在结果中添加预处理信息
      result.preprocessInfo = {
        originalSentenceCount: preprocessResult.originalSentenceCount,
        processedSentenceCount: preprocessResult.sentenceCount,
        isLimited: preprocessResult.isLimited,
        sentences: preprocessResult.sentences,
        // 新增：去重信息
        deduplication: preprocessResult.deduplication,
      };

      // 保存到历史记录
      try {
        const historyId = await saveAnalysisToHistory(result);
        console.log("已保存到历史记录，ID:", historyId);

        // 跳转到学习界面，传递历史记录ID
        if (historyId) {
          navigate(`/learn/${historyId}`);
        } else {
          // 如果没有历史记录ID，直接传递结果
          navigate("/learn", { state: { analysisResult: result } });
        }
      } catch (historyError) {
        console.warn("保存历史记录失败:", historyError);
        // 即使保存失败也要跳转到学习界面
        navigate("/learn", { state: { analysisResult: result } });
      }
    } catch (err) {
      setError(
        err.message ||
          "分析失败，请检查API配置或稍后重试"
      );
      console.error("Analysis error:", err);

      // 如果是API密钥错误，自动打开配置界面
      if (
        err.message?.includes("API密钥") ||
        err.message?.includes("api_key")
      ) {
        setTimeout(() => setShowConfig(true), 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 处理分析按钮点击
  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError("请输入要分析的英文文本");
      return;
    }

    // 先进行文本预处理，检查句子数量（包含去重处理）
    const preprocessResult = preprocessText(inputText);

    // 显示去重信息（如果有）
    if (preprocessResult.deduplication.hasDeduplication) {
      console.log(
        `🔄 预分析检测到重复句子: ${preprocessResult.deduplication.originalCount} -> ${preprocessResult.deduplication.uniqueCount} 个句子`
      );
    }

    // 用去重后的句子数量判断是否需要截断
    if (preprocessResult.deduplication.uniqueCount > 50) {
      setPendingAnalysisText(inputText);
      setPendingSentenceCount(preprocessResult.deduplication.uniqueCount);
      setPendingDeduplicationInfo(preprocessResult.deduplication);
      setShowTruncateConfirm(true);
      return;
    }

    // 句子数量在限制内，直接分析
    await performAnalysis(inputText);
  };

  // 处理截断确认
  const handleTruncateConfirm = async () => {
    setShowTruncateConfirm(false);
    await performAnalysis(pendingAnalysisText);
    setPendingAnalysisText("");
    setPendingSentenceCount(0);
    setPendingDeduplicationInfo(null);
  };

  // 处理取消截断
  const handleTruncateCancel = () => {
    setShowTruncateConfirm(false);
    setPendingAnalysisText("");
    setPendingSentenceCount(0);
    setPendingDeduplicationInfo(null);
  };

  const handleLoadExample = () => {
    const exampleText = `It was a sunny Saturday morning when we decided to visit the zoo. My classmates and I gathered at the school gate, all excited about our field trip. Our teacher, Mr. Li, [...]`;

    setInputText(exampleText);
  };

  const handleClear = () => {
    setInputText("");
    setError(null);
    setSuccessMessage(null);
  };

  // 处理从历史记录选择分析结果
  const handleSelectFromHistory = (historyResult, historyId) => {
    setShowHistory(false);
    // 跳转到学习界面
    if (historyId) {
      navigate(`/learn/${historyId}`);
    } else {
      navigate("/learn", { state: { analysisResult: historyResult } });
    }
  };

  // 处理图片OCR提取的文本
  const handleImageTextExtracted = (extractedText) => {
    console.log("📄 从图片提取到文本:", extractedText);

    // 将提取的文本设置到输入框
    setInputText(extractedText);

    // 切换到文本输入模式，让用户确认文本
    setInputMethod("text");

    // 显示成功提示
    setSuccessMessage("✅ 图片文字识别完成！请确认文本内容后开始分析。");

    // 清除其他状态
    setError(null);

    // 3秒后清除成功提示
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <div className="hero-section">
          <h1 className="hero-title">
            你的英语学习小伙伴 ✨
          </h1>
          <p className="hero-subtitle">
            贴上任何英文文本，或上传包含英文的图片，我来陪你一起细细品读～每个句子都有惊喜发现哦！
          </p>
        </div>

        {/* 输入方式切换 */}
        <div className="input-method-selector">
          <button
            className={`method-btn ${inputMethod === "text" ? "active" : ""}`}
            onClick={() => setInputMethod("text")}
            disabled={isLoading}
          >
            <FileText size={20} />
            输入文本
          </button>
          <button
            className={`method-btn ${inputMethod === "image" ? "active" : ""}`}
            onClick={() => setInputMethod("image")}
            disabled={isLoading}
          >
            <Camera size={20} />
            上传图片
          </button>
        </div>

        {/* 根据选择的输入方式显示不同的组件 */}
        {inputMethod === "text" ? (
          <InputSection
            inputText={inputText}
            setInputText={setInputText}
            onAnalyze={handleAnalyze}
            onLoadExample={handleLoadExample}
            onClear={handleClear}
            isLoading={isLoading}
            showButtonLoading={false}
          />
        ) : (
          <ImageUpload
            onTextExtracted={handleImageTextExtracted}
            isDisabled={isLoading}
          />
        )}

        {error && <div className="error-message">{error}</div>}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
      </main>

      <div className="fixed-buttons">
        <button
          className="config-button"
          onClick={() => setShowHistory(true)}
          title="查看学习足迹"
        >
          <Clock size={20} />
        </button>

        <button
          className="config-button"
          onClick={() => setShowConfig(true)}
          title="连接智能助手"
        >
          <Settings size={20} />
        </button>
      </div>

      {showConfig && (
        <ConfigModal
          isForced={forceConfig}
          onClose={() => {
            // 如果是强制模式，需要重新检查 API key
            if (forceConfig) {
              const hasValidApiKey = checkApiKeyConfiguration();
              if (hasValidApiKey) {
                setForceConfig(false);
                setShowConfig(false);
              }
            } else {
              setShowConfig(false);
            }
          }}
        />
      )}

      {showHistory && (
        <HistoryModal
          onClose={() => setShowHistory(false)}
          onSelectHistory={handleSelectFromHistory}
        />
      )}

      {showTruncateConfirm && (
        <TruncateConfirmModal
          totalSentences={pendingSentenceCount}
          maxSentences={50}
          deduplicationInfo={pendingDeduplicationInfo}
          onConfirm={handleTruncateConfirm}
          onCancel={handleTruncateCancel}
        />
      )}

      <PageLoading isVisible={isLoading} message="正在生成精讲内容..." />
    </div>
  );
};

export default HomePage;
