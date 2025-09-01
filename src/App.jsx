import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import InputSection from "./components/InputSection";
import EnhancedFlatView from "./components/EnhancedFlatView";
import ConfigModal from "./components/ConfigModal";
import { analyzeText } from "./services/api";
import { Settings } from "lucide-react";

function App() {
  const [inputText, setInputText] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError("请输入要分析的英文文本");
      return;
    }

    // 检查是否配置了API
    const provider = localStorage.getItem("ai_provider") || "openai";
    const apiKey = localStorage.getItem(`${provider}_api_key`);
    if (!apiKey) {
      setError(
        `请先配置 ${provider === "openai" ? "OpenAI" : "Gemini"} API 密钥`
      );
      setShowConfig(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeText(inputText);
      setAnalysisResult(result);
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
    const exampleText = `In the past, writing software was better than doing things manually. You build software once and then it works for you forever.

But now, writing software feels worse. It's not a "write once" and "works for you forever" situation. You build something, push it to GitHub or the App Store, and immediately get issues and support tickets. You have to maintain it, fix security issues, and constantly update dependencies.

The effort-to-reward ratio has shifted. Writing software no longer provides the same leverage it once did.`;

    setInputText(exampleText);
  };

  const handleClear = () => {
    setInputText("");
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <InputSection
          inputText={inputText}
          setInputText={setInputText}
          onAnalyze={handleAnalyze}
          onLoadExample={handleLoadExample}
          onClear={handleClear}
          isLoading={isLoading}
        />

        {error && <div className="error-message">{error}</div>}

        {analysisResult && <EnhancedFlatView result={analysisResult} />}
      </main>

      <button
        className="config-button"
        onClick={() => setShowConfig(true)}
        title="API 配置"
      >
        <Settings size={20} />
      </button>

      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
    </div>
  );
}

export default App;
