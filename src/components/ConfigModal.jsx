import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Save, Key, Sparkles, Brain, BookOpen } from "lucide-react";
import VocabularySelector from "./VocabularySelector";

const ConfigModal = ({ isForced = false, onClose }) => {
  const [activeTab, setActiveTab] = useState("api");
  const [provider, setProvider] = useState("doubao");
  const [doubaoKey, setDoubaoKey] = useState("");
  const [doubaoModel, setDoubaoModel] = useState("deepseek-v3-1-250821");
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-2.0-flash-exp");
  const [showApiKey, setShowApiKey] = useState(false);
  const [filterCommonWords, setFilterCommonWords] = useState(true);

  useEffect(() => {
    // 从本地存储加载配置
    const savedProvider = localStorage.getItem("ai_provider") || "doubao";
    const savedDoubaoKey = localStorage.getItem("doubao_api_key") || "";
    const savedDoubaoModel =
      localStorage.getItem("doubao_model") || "deepseek-v3-1-250821";
    const savedGeminiKey = localStorage.getItem("gemini_api_key") || "";
    const savedGeminiModel =
      localStorage.getItem("gemini_model") || "gemini-2.0-flash-exp";
    const savedFilterCommonWords =
      localStorage.getItem("filter_common_words") !== "false"; // 默认为true

    setProvider(savedProvider);
    setDoubaoKey(savedDoubaoKey);
    setDoubaoModel(savedDoubaoModel);
    setGeminiKey(savedGeminiKey);
    setGeminiModel(savedGeminiModel);
    setFilterCommonWords(savedFilterCommonWords);

    // 如果是强制模式，确保显示 API 配置标签页
    if (isForced) {
      setActiveTab("api");
    }
  }, [isForced]);

  const handleSave = () => {
    // 验证当前选择的提供商是否有API密钥
    const currentApiKey = provider === "doubao" ? doubaoKey : geminiKey;
    if (!currentApiKey.trim()) {
      alert(
        `别忘了输入 ${
          provider === "doubao" ? "豆包" : "Gemini"
        } 的 API 密钥哦～`
      );
      return;
    }

    // 保存到本地存储
    localStorage.setItem("ai_provider", provider);
    localStorage.setItem("doubao_api_key", doubaoKey);
    localStorage.setItem("doubao_model", doubaoModel);
    localStorage.setItem("gemini_api_key", geminiKey);
    localStorage.setItem("gemini_model", geminiModel);
    localStorage.setItem("filter_common_words", filterCommonWords.toString());

    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={isForced ? undefined : onClose}
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
              {activeTab === "api"
                ? "让我们连接智能助手 🤖"
                : "选择学习词库 📚"}
              {isForced && activeTab === "api" && (
                <span className="required-badge">必须配置</span>
              )}
            </h2>
            {!isForced && (
              <button className="close-button" onClick={onClose}>
                <X size={20} />
              </button>
            )}
          </div>

          {/* 标签页导航 */}
          <div className="modal-tabs">
            <button
              className={`modal-tab ${activeTab === "api" ? "active" : ""}`}
              onClick={() => setActiveTab("api")}
            >
              <Key size={18} />
              连接助手
            </button>
            <button
              className={`modal-tab ${
                activeTab === "vocabulary" ? "active" : ""
              }`}
              onClick={() => !isForced && setActiveTab("vocabulary")}
              disabled={isForced}
              style={{
                opacity: isForced ? 0.5 : 1,
                cursor: isForced ? "not-allowed" : "pointer",
              }}
            >
              <BookOpen size={18} />
              词库伴侣
            </button>
          </div>

          <div className="modal-body">
            {/* API 配置页面 */}
            {activeTab === "api" && (
              <>
                {isForced && (
                  <div className="forced-config-notice">
                    <div className="notice-content">
                      <Key size={20} />
                      <div>
                        <h4>嗨！我需要一个智能助手 👋</h4>
                        <p>
                          要给你做精彩的文本分析，我需要连接到 AI
                          服务。选择一个你喜欢的 AI 助手，
                          输入对应的密钥，我们就可以开始学习之旅啦！
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* AI 提供商选择 */}
                <div className="form-group">
                  <label>选择你的 AI 学习伙伴</label>
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
                          placeholder="把你的豆包 API 密钥粘贴到这里..."
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
                        别担心，你的 API 密钥只存在本地浏览器，很安全哦～
                        <a
                          href="https://console.volcengine.com/ark"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          还没有密钥？点这里获取
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
                        <option value="deepseek-v3-1-250821">
                          DeepSeek V3.1 (最新版本、高性能)
                        </option>
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
                        放心，你的 API 密钥只存在本地浏览器，绝对安全～
                        <a
                          href="https://makersuite.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          需要获取密钥？点击这里
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
                  <h4>🎯 词库小助手说明</h4>
                  <ul>
                    <li>选好词库后，我会在文章里自动帮你找出重点单词</li>
                    <li>找到的单词会在"重点单词学习"区域等你来学习</li>
                    <li>你可以标记每个单词的学习状态，记录自己的进步</li>
                    <li>词库数据会保存在本地，下次打开更快哦</li>
                  </ul>

                  <div className="vocabulary-note">
                    <strong>小提示：</strong>
                    第一次选择词库时需要下载数据，稍等一下就好啦～
                  </div>
                </div>

                {/* 过滤设置 */}
                <div className="vocabulary-filter-settings">
                  <h4>📝 智能过滤</h4>
                  <div className="filter-option">
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        checked={filterCommonWords}
                        onChange={(e) => setFilterCommonWords(e.target.checked)}
                        className="switch-input"
                      />
                      <span className="switch-slider"></span>
                      过滤简单常见单词
                    </label>
                    <p className="filter-description">
                      开启后会自动忽略 "the"、"and"、"my"、"is" 这些简单单词，
                      让我们专注学习真正有用的词汇。建议保持开启哦～
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {!isForced && (
              <button className="btn btn-secondary" onClick={onClose}>
                稍后再说
              </button>
            )}
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} />
              {isForced ? "保存，开始学习！" : "保存设置"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfigModal;
