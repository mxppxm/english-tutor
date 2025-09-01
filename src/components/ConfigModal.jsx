import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { X, Save, Key, Sparkles, Brain } from "lucide-react";

const ConfigModal = ({ onClose }) => {
  const [provider, setProvider] = useState("openai");
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState("gpt-3.5-turbo");
  const [openaiEndpoint, setOpenaiEndpoint] = useState(
    "https://api.openai.com/v1"
  );
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-2.0-flash-exp");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    // 从本地存储加载配置
    const savedProvider = localStorage.getItem("ai_provider") || "openai";
    const savedOpenaiKey = localStorage.getItem("openai_api_key") || "";
    const savedOpenaiModel =
      localStorage.getItem("openai_model") || "gpt-3.5-turbo";
    const savedOpenaiEndpoint =
      localStorage.getItem("openai_endpoint") || "https://api.openai.com/v1";
    const savedGeminiKey = localStorage.getItem("gemini_api_key") || "";
    const savedGeminiModel =
      localStorage.getItem("gemini_model") || "gemini-2.0-flash-exp";

    setProvider(savedProvider);
    setOpenaiKey(savedOpenaiKey);
    setOpenaiModel(savedOpenaiModel);
    setOpenaiEndpoint(savedOpenaiEndpoint);
    setGeminiKey(savedGeminiKey);
    setGeminiModel(savedGeminiModel);
  }, []);

  const handleSave = () => {
    // 验证当前选择的提供商是否有API密钥
    const currentApiKey = provider === "openai" ? openaiKey : geminiKey;
    if (!currentApiKey.trim()) {
      alert(`请输入 ${provider === "openai" ? "OpenAI" : "Gemini"} 的API密钥`);
      return;
    }

    // 保存到本地存储
    localStorage.setItem("ai_provider", provider);
    localStorage.setItem("openai_api_key", openaiKey);
    localStorage.setItem("openai_model", openaiModel);
    localStorage.setItem("openai_endpoint", openaiEndpoint);
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
          <div className="modal-header">
            <h2>
              <Key size={24} />
              API 配置
            </h2>
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            {/* AI 提供商选择 */}
            <div className="form-group">
              <label>选择 AI 提供商</label>
              <div className="provider-tabs">
                <button
                  className={`provider-tab ${
                    provider === "openai" ? "active" : ""
                  }`}
                  onClick={() => setProvider("openai")}
                >
                  <Sparkles size={18} />
                  OpenAI (国际版)
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

            {/* OpenAI 配置 */}
            {provider === "openai" && (
              <>
                <div className="form-group">
                  <label htmlFor="openaiKey">API 密钥</label>
                  <div className="input-group">
                    <input
                      type={showApiKey ? "text" : "password"}
                      id="openaiKey"
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
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
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      获取API密钥
                    </a>
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="openaiModel">模型选择</label>
                  <select
                    id="openaiModel"
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    className="form-select"
                  >
                    <option value="gpt-3.5-turbo">
                      GPT-3.5 标准版 (快速、经济)
                    </option>
                    <option value="gpt-3.5-turbo-16k">
                      GPT-3.5 长文本版 (16K上下文)
                    </option>
                    <option value="gpt-4">GPT-4 标准版 (更智能)</option>
                    <option value="gpt-4-turbo-preview">
                      GPT-4 增强版 (最新、128K上下文)
                    </option>
                    <option value="gpt-4o">GPT-4o 全能版 (多模态)</option>
                    <option value="gpt-4o-mini">
                      GPT-4o 轻量版 (经济实惠)
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="openaiEndpoint">API 端点（可选）</label>
                  <input
                    type="text"
                    id="openaiEndpoint"
                    value={openaiEndpoint}
                    onChange={(e) => setOpenaiEndpoint(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="form-input"
                  />
                  <small className="form-hint">
                    如果使用代理或自定义端点，请在此输入。默认使用官方端点。
                  </small>
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
