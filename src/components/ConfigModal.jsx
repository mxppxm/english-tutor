import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Save, Key, Sparkles, Brain, BookOpen } from "lucide-react";
import VocabularySelector from "./VocabularySelector";

const ConfigModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("api");
  const [provider, setProvider] = useState("doubao");
  const [doubaoKey, setDoubaoKey] = useState("");
  const [doubaoModel, setDoubaoModel] = useState("doubao-pro-32k");
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-2.0-flash-exp");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    // 从本地存储加载配置
    const savedProvider = localStorage.getItem("ai_provider") || "doubao";
    const savedDoubaoKey = localStorage.getItem("doubao_api_key") || "";
    const savedDoubaoModel =
      localStorage.getItem("doubao_model") || "doubao-pro-32k";
    const savedGeminiKey = localStorage.getItem("gemini_api_key") || "";
    const savedGeminiModel =
      localStorage.getItem("gemini_model") || "gemini-2.0-flash-exp";

    setProvider(savedProvider);
    setDoubaoKey(savedDoubaoKey);
    setDoubaoModel(savedDoubaoModel);
    setGeminiKey(savedGeminiKey);
    setGeminiModel(savedGeminiModel);
  }, []);

  const handleSave = () => {
    // 验证当前选择的提供商是否有API密钥
    const currentApiKey = provider === "doubao" ? doubaoKey : geminiKey;
    if (!currentApiKey.trim()) {
      alert(`请输入 ${provider === "doubao" ? "豆包" : "Gemini"} 的API密钥`);
      return;
    }

    // 保存到本地存储
    localStorage.setItem("ai_provider", provider);
    localStorage.setItem("doubao_api_key", doubaoKey);
    localStorage.setItem("doubao_model", doubaoModel);
    localStorage.setItem("gemini_api_key", geminiKey);
    localStorage.setItem("gemini_model", geminiModel);

    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-container"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header fixed-header">
            <h2>
              {activeTab === "api" ? <Key size={24} /> : <BookOpen size={24} />}
              {activeTab === "api" ? "API 配置" : "词库配置"}
            </h2>
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* 标签页导航 */}
          <div className="modal-tabs">
            <button
              className={`modal-tab ${activeTab === "api" ? "active" : ""}`}
              onClick={() => setActiveTab("api")}
            >
              <Key size={18} />
              API 设置
            </button>
            <button
              className={`modal-tab ${
                activeTab === "vocabulary" ? "active" : ""
              }`}
              onClick={() => setActiveTab("vocabulary")}
            >
              <BookOpen size={18} />
              词库设置
            </button>
          </div>

          <div className="modal-body">
            {/* API 配置页面 */}
            {activeTab === "api" && (
              <>
                {/* AI 提供商选择 */}
                <div className="form-group">
                  <label>选择 AI 提供商</label>
                  <div className="provider-tabs">
                    <button
                      className={`provider-tab ${
                        provider === "doubao" ? "active" : ""
                      }`}
                      onClick={() => setProvider("doubao")}
                    >
                      <Sparkles size={18} />
                      豆包 (字节跳动)
                    </button>
                    <button
                      className={`provider-tab ${
                        provider === "gemini" ? "active" : ""
                      }`}
                      onClick={() => setProvider("gemini")}
                    >
                      <Brain size={18} />
                      谷歌 Gemini
                    </button>
                  </div>
                </div>

                {/* 豆包 配置 */}
                {provider === "doubao" && (
                  <>
                    <div className="form-group">
                      <label htmlFor="doubaoKey">API 密钥</label>
                      <div className="input-group">
                        <input
                          type={showApiKey ? "text" : "password"}
                          id="doubaoKey"
                          value={doubaoKey}
                          onChange={(e) => setDoubaoKey(e.target.value)}
                          placeholder="您的豆包API密钥..."
                          className="form-input"
                        />
                        <button
                          className="toggle-visibility"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? "隐藏" : "显示"}
                        </button>
                      </div>
                      <small className="form-hint">
                        您的API密钥将安全地存储在浏览器本地。
                        <a
                          href="https://console.volcengine.com/ark"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          获取API密钥
                        </a>
                      </small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="doubaoModel">模型选择</label>
                      <select
                        id="doubaoModel"
                        value={doubaoModel}
                        onChange={(e) => setDoubaoModel(e.target.value)}
                        className="form-select"
                      >
                        <option value="doubao-pro-32k">
                          豆包-Pro-32K (专业版、长上下文)
                        </option>
                        <option value="doubao-pro-4k">
                          豆包-Pro-4K (专业版、标准上下文)
                        </option>
                        <option value="doubao-lite-32k">
                          豆包-Lite-32K (轻量版、长上下文)
                        </option>
                        <option value="doubao-lite-4k">
                          豆包-Lite-4K (轻量版、标准上下文)
                        </option>
                      </select>
                    </div>
                  </>
                )}

                {/* Gemini 配置 */}
                {provider === "gemini" && (
                  <>
                    <div className="form-group">
                      <label htmlFor="geminiKey">API 密钥</label>
                      <div className="input-group">
                        <input
                          type={showApiKey ? "text" : "password"}
                          id="geminiKey"
                          value={geminiKey}
                          onChange={(e) => setGeminiKey(e.target.value)}
                          placeholder="AIza..."
                          className="form-input"
                        />
                        <button
                          className="toggle-visibility"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? "隐藏" : "显示"}
                        </button>
                      </div>
                      <small className="form-hint">
                        您的API密钥将安全地存储在浏览器本地。
                        <a
                          href="https://makersuite.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          获取API密钥
                        </a>
                      </small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="geminiModel">模型选择</label>
                      <select
                        id="geminiModel"
                        value={geminiModel}
                        onChange={(e) => setGeminiModel(e.target.value)}
                        className="form-select"
                      >
                        <option value="gemini-2.0-flash-exp">
                          Gemini 2.0 闪电版 (实验版、最新最快)
                        </option>
                        <option value="gemini-1.5-flash">
                          Gemini 1.5 闪电版 (快速、经济)
                        </option>
                        <option value="gemini-1.5-flash-8b">
                          Gemini 1.5 轻量版 (8B参数)
                        </option>
                        <option value="gemini-1.5-pro">
                          Gemini 1.5 专业版 (强大、长文本)
                        </option>
                        <option value="gemini-1.0-pro">
                          Gemini 1.0 专业版 (稳定版)
                        </option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            {/* 词库配置页面 */}
            {activeTab === "vocabulary" && (
              <div className="vocabulary-config">
                <VocabularySelector
                  onVocabularyChange={(vocabularyId, vocabularyData) => {
                    console.log(
                      "词库已切换:",
                      vocabularyId,
                      vocabularyData?.length
                    );
                  }}
                  className="config-vocabulary-selector"
                />

                <div className="vocabulary-tips">
                  <h4>🎯 词库功能说明</h4>
                  <ul>
                    <li>选择词库后，系统会在文章分析中自动标记匹配的单词</li>
                    <li>标记的单词会在"重点单词学习"模块中显示</li>
                    <li>您可以对找到的单词进行学习标记和掌握记录</li>
                    <li>词库数据会缓存在浏览器中，提高加载速度</li>
                  </ul>

                  <div className="vocabulary-note">
                    <strong>提示：</strong>
                    首次选择词库时需要从网络加载数据，请耐心等待。
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} />
              保存配置
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfigModal;
