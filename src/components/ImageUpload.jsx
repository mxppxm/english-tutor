import { useState, useRef } from "react";
import { Upload, X, AlertCircle, Loader2 } from "lucide-react";
import { validateImageFile, preprocessImageForOCR } from "../utils/imageUtils";
import { recognizeImageText } from "../services/api";

const ImageUpload = ({ onTextExtracted, isDisabled = false }) => {
  const [uploadState, setUploadState] = useState("idle"); // idle, processing, error
  const [error, setError] = useState("");
  // 固定的处理选项，优化OCR识别效果
  const processingOptions = {
    enhanceContrast: true,
    contrastFactor: 1.3,
    convertToGray: true,
    sharpen: false,
  };

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // 重置状态
  const resetState = () => {
    setUploadState("idle");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 处理文件选择 - 直接进行OCR识别
  const handleFileSelect = async (file) => {
    setError("");

    // 验证文件
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setUploadState("processing");

    try {
      console.log("🖼️ AI 小助手开始识别图片啦...");

      // 预处理图片
      const preprocessResult = await preprocessImageForOCR(
        file,
        processingOptions
      );

      if (!preprocessResult.success) {
        throw new Error(preprocessResult.error);
      }

      console.log("✅ 图片处理完成啦");
      console.log("📊 处理信息:", preprocessResult.metadata);

      // 直接调用OCR API
      const ocrResult = await recognizeImageText(
        preprocessResult.processedImage
      );

      if (ocrResult.success && ocrResult.extractedText) {
        // 格式化识别的文本
        const formattedText = formatOCRText(ocrResult.extractedText);
        console.log("✅ AI识别完成啦，发现文字了");
        console.log("📄 原始识别文本:", ocrResult.extractedText);
        console.log("📝 格式化后文本:", formattedText);

        // 直接传递格式化后的文本到输入框
        onTextExtracted(formattedText);
        resetState(); // 重置组件状态，准备下次使用
      } else {
        throw new Error("咦，没有发现文字呢～ 请确保图片中有清晰的英文文字哦");
      }
    } catch (err) {
      console.error("🚨 咦，识别遇到了小问题:", err);
      setError(err.message || "识别遇到了小问题，让我们重试一下吧");
      setUploadState("error");
    }
  };

  // 拖拽处理
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      setError("请拖拽图片文件（JPG、PNG、WebP格式）");
    }
  };

  // 文件输入处理
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 格式化OCR识别的文本
  const formatOCRText = (text) => {
    if (!text) return text;

    // 1. 处理多余的空格和换行
    let formatted = text
      .split("\n") // 按行分割
      .map((line) => line.trim()) // 去掉每行首尾空格
      .filter((line) => line.length > 0) // 去掉空行
      .join(" "); // 用单个空格连接

    // 2. 处理单词间的多余空格
    formatted = formatted.replace(/\s+/g, " ");

    // 3. 修复常见OCR错误的标点符号
    formatted = formatted
      .replace(/\s+([,.!?;:])/g, "$1") // 移除标点前的空格
      .replace(/([.!?])\s*([A-Z])/g, "$1 $2") // 确保句子间有空格
      .replace(/([,;:])\s*([a-zA-Z])/g, "$1 $2"); // 确保逗号冒号后有空格

    // 4. 处理引号
    formatted = formatted
      .replace(/\s*"\s*/g, '"') // 规范化双引号
      .replace(/\s*'\s*/g, "'"); // 规范化单引号

    return formatted.trim();
  };

  // 渲染上传区域
  const renderUploadZone = () => (
    <div
      ref={dropZoneRef}
      className={`image-drop-zone ${isDisabled ? "disabled" : ""}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isDisabled && fileInputRef.current?.click()}
    >
      <Upload size={48} className="upload-icon" />
      <h3>上传图片识别文字</h3>
      <p>拖拽图片到这里，或点击选择文件</p>
      <p className="format-hint">
        支持 JPG、PNG、WebP 格式，建议图片清晰且文字较大
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: "none" }}
        disabled={isDisabled}
      />
    </div>
  );

  // 渲染处理中状态
  const renderProcessing = () => (
    <div className="processing-container">
      <div className="processing-content">
        <Loader2 size={48} className="spinning processing-icon" />
        <h3>正在用心识别图片文字呢～</h3>
        <p>AI 小助手正在认真读取你的图片，稍等一下下哦 ✨</p>
        <button className="btn btn-secondary" onClick={resetState}>
          取消
        </button>
      </div>
    </div>
  );

  // 渲染错误状态
  const renderError = () => (
    <div className="error-container">
      <AlertCircle size={24} className="error-icon" />
      <p className="error-message">{error}</p>
      <button className="btn btn-secondary" onClick={resetState}>
        重新开始
      </button>
    </div>
  );

  return (
    <div className="image-upload-component">
      {uploadState === "error" && renderError()}
      {uploadState === "idle" && renderUploadZone()}
      {uploadState === "processing" && renderProcessing()}

      {/* 通用错误提示 */}
      {error && uploadState !== "error" && (
        <div className="inline-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
