import { Volume2, Star, Heart, HeartOff } from "lucide-react";

const WordTooltip = ({
  word,
  position,
  onClose,
  onCollect,
  onMaster,
  onSpeak,
  isCollected,
  isMastered,
}) => {
  if (!word || !position) return null;

  const handleCollect = async () => {
    await onCollect(word, !isCollected);
  };

  const handleMaster = async () => {
    await onMaster(word, !isMastered);
  };

  const handleSpeak = () => {
    onSpeak(word.word);
  };

  return (
    <div
      className="word-tooltip"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        zIndex: 200,
        transform: "translateX(-50%)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="tooltip-content">
        <div className="tooltip-header">
          <div className="tooltip-word-section">
            <span className="tooltip-word">{word.word}</span>
            {word.raw && word.raw.phonetic ? (
              <span className="tooltip-phonetic">[{word.raw.phonetic}]</span>
            ) : (
              word.phonetic && (
                <span className="tooltip-phonetic">[{word.phonetic}]</span>
              )
            )}
          </div>
          <button
            className="tooltip-speak-btn"
            onClick={handleSpeak}
            title="发音"
          >
            <Volume2 size={16} />
          </button>
        </div>

        {/* 显示词性和释义 - 统一格式 */}
        <div className="tooltip-meanings">
          {word.raw &&
          word.raw.translations &&
          word.raw.translations.length > 0 ? (
            word.raw.translations.map((trans, index) => (
              <div key={index} className="tooltip-meaning-line">
                {trans.type && (
                  <span className="meaning-type-inline">{trans.type}.</span>
                )}
                <span className="meaning-text">{trans.translation}</span>
              </div>
            ))
          ) : word.translations && word.translations.length > 0 ? (
            word.translations.map((trans, index) => (
              <div key={index} className="tooltip-meaning-line">
                {trans.type && (
                  <span className="meaning-type-inline">{trans.type}.</span>
                )}
                <span className="meaning-text">{trans.translation}</span>
              </div>
            ))
          ) : word.allTranslations ? (
            <div className="tooltip-meaning-line">
              <span className="meaning-text">{word.allTranslations}</span>
            </div>
          ) : word.translation ? (
            <div className="tooltip-meaning-line">
              <span className="meaning-text">{word.translation}</span>
            </div>
          ) : word.meaning ? (
            <div className="tooltip-meaning-line">
              <span className="meaning-text">{word.meaning}</span>
            </div>
          ) : null}
        </div>

        {/* 显示所有短语 */}
        {((word.raw && word.raw.phrases && word.raw.phrases.length > 0) ||
          (word.phrases && word.phrases.length > 0)) && (
          <div className="tooltip-phrases">
            <div className="phrases-label">常用短语：</div>
            {(word.raw && word.raw.phrases ? word.raw.phrases : word.phrases)
              .slice(0, 3)
              .map((phrase, index) => (
                <div key={index} className="tooltip-phrase">
                  <span className="phrase-text">{phrase.phrase}</span>
                  <span className="phrase-translation">
                    {phrase.translation}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* 原有的用法示例 */}
        {word.usage && (
          <div className="tooltip-usage">
            <span className="usage-label">例句：</span>
            {word.usage}
          </div>
        )}

        <div className="tooltip-actions">
          <button
            onClick={handleMaster}
            className={`action-btn mastered ${isMastered ? "active" : ""}`}
            title={
              isMastered
                ? "取消掌握"
                : "掌握后不再高亮显示（已掌握的单词不会被标记为重点）"
            }
          >
            <Star size={16} />
            {isMastered ? "已掌握" : "掌握"}
          </button>
          <button
            onClick={handleCollect}
            className={`action-btn studying ${isCollected ? "active" : ""}`}
            title={isCollected ? "从单词本移除" : "加入单词本"}
          >
            {isCollected ? <HeartOff size={16} /> : <Heart size={16} />}
            {isCollected ? "移出单词本" : "加入单词本"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordTooltip;
