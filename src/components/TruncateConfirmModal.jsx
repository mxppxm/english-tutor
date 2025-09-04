import React from "react";
import { AlertTriangle, Check, X } from "lucide-react";

const TruncateConfirmModal = ({
  onConfirm,
  onCancel,
  totalSentences,
  maxSentences = 10,
  deduplicationInfo = null,
}) => {
  return (
    <div className="truncate-modal-overlay">
      <div className="truncate-modal-content">
        <div className="truncate-modal-header">
          <div className="modal-icon warning">
            <AlertTriangle size={24} />
          </div>
          <h2>文本长度提醒</h2>
          <button className="close-button" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="warning-text">
            您输入的文本
            {deduplicationInfo && deduplicationInfo.hasDeduplication
              ? "经过去重后"
              : ""}
            包含 <strong>{totalSentences}</strong> 个句子， 超过了建议的{" "}
            <strong>{maxSentences}</strong> 句限制。
          </p>
          {deduplicationInfo && deduplicationInfo.hasDeduplication && (
            <div className="dedup-info">
              <p className="dedup-text">
                🔄 <strong>自动去重：</strong>原文本{" "}
                {deduplicationInfo.originalCount} 个句子 → 去重后{" "}
                {deduplicationInfo.uniqueCount} 个句子 （节省了{" "}
                {deduplicationInfo.duplicateCount} 个重复句子的分析资源）
              </p>
            </div>
          )}
          <p className="info-text">
            为了提供更好的分析效果和更快的响应速度，我们建议：
          </p>
          <ul className="suggestion-list">
            <li>
              ✂️ <strong>自动截断</strong>：保留前 {maxSentences} 句进行分析
            </li>
            <li>
              📝 <strong>手动调整</strong>：返回编辑，选择您最想分析的段落
            </li>
          </ul>
          <div className="tip-box">
            <strong>💡 小贴士：</strong>{" "}
            较短的文本可以获得更详细和精准的分析结果哦～
          </div>
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel}>
            <X size={18} />
            返回编辑
          </button>
          <button className="primary-button" onClick={onConfirm}>
            <Check size={18} />
            确定截断分析
          </button>
        </div>
      </div>
    </div>
  );
};

export default TruncateConfirmModal;
