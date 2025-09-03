import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import InputSection from "../components/InputSection";
import ConfigModal from "../components/ConfigModal";
import HistoryModal from "../components/HistoryModal";
import PageLoading from "../components/PageLoading";
import { analyzeText, analyzeSentences } from "../services/api";
import {
  saveAnalysisToHistory,
  findHistoryByText,
} from "../services/historyService";
import { Settings, Clock } from "lucide-react";
import { preprocessText } from "../utils/textUtils";

const HomePage = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [forceConfig, setForceConfig] = useState(false); // 强制显示配置弹窗
  const [showHistory, setShowHistory] = useState(false);
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

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError("请输入要分析的英文文本");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 首先检查历史记录中是否已经有相同的文本
      console.log("检查历史记录中是否存在相同文本...");
      const existingHistory = await findHistoryByText(inputText);

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

      // 预处理文本：分割句子进行逐句分析（限制8句以内避免超时）
      console.log("开始文本预处理...");
      const preprocessResult = preprocessText(inputText, 8);
      console.log(
        `文本预处理完成: ${preprocessResult.originalSentenceCount} -> ${preprocessResult.sentenceCount} 个句子`
      );

      // 使用逐句分析功能
      const result = await analyzeSentences(preprocessResult.sentences);

      // 在结果中添加预处理信息
      result.preprocessInfo = {
        originalSentenceCount: preprocessResult.originalSentenceCount,
        processedSentenceCount: preprocessResult.sentenceCount,
        isLimited: preprocessResult.isLimited,
        sentences: preprocessResult.sentences,
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
      setError(err.message || "分析失败，请检查API配置或稍后重试");
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

  const handleLoadExample = () => {
    const exampleText = `It was a sunny Saturday morning when we decided to visit the zoo. My classmates and I gathered at the school gate, all excited about our field trip. Our teacher, Mr. Li, checked the attendance and reminded us about the safety rules. At the zoo entrance, we saw beautiful flowers and tall trees creating a welcoming atmosphere. The monkeys in the first enclosure were incredibly playful and entertaining. They were jumping from branch to branch while some were eating bananas. A baby elephant was spraying water with its trunk, delighting all the visitors. The lions were resting majestically under the shade of large oak trees. Colorful parrots in the aviary were singing melodious songs that filled the air. This educational trip taught us valuable lessons about wildlife conservation.`;

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

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <div className="hero-section">
          <h1 className="hero-title">英语文本精讲分析器</h1>
          <p className="hero-subtitle">
            输入英文文本，获得逐句详细分析：翻译、词汇、语法结构和重点难点
          </p>
        </div>

        <InputSection
          inputText={inputText}
          setInputText={setInputText}
          onAnalyze={handleAnalyze}
          onLoadExample={handleLoadExample}
          onClear={handleClear}
          isLoading={isLoading} // 用于禁用控件，但不显示按钮 loading
          showButtonLoading={false} // 新增参数：不显示按钮 loading 状态
        />

        {error && <div className="error-message">{error}</div>}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
      </main>

      <div className="fixed-buttons">
        <button
          className="config-button"
          onClick={() => setShowHistory(true)}
          title="学习历史"
        >
          <Clock size={20} />
        </button>

        <button
          className="config-button"
          onClick={() => setShowConfig(true)}
          title="API 配置"
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

      <PageLoading isVisible={isLoading} message="正在生成精讲内容..." />
    </div>
  );
};

export default HomePage;
