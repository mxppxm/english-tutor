import { Volume2 } from "lucide-react";

const ExampleSentence = ({
  example,
  translation,
  label = "例句",
  className = "",
}) => {
  // 发音功能
  const speakExample = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.6; // 例句稍慢一些，便于理解
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      speechSynthesis.speak(utterance);
    }
  };

  if (!example) return null;

  return (
    <div className={`example-sentence ${className}`}>
      <div className="example-header">
        <span className="example-label">{label}:</span>
        <button
          onClick={() => speakExample(example)}
          className="speak-example-btn"
          title="朗读例句"
        >
          <Volume2 size={12} />
        </button>
      </div>
      <div className="example-content">
        <div className="example-text">{example}</div>
        {translation && (
          <div className="example-translation">{translation}</div>
        )}
      </div>
    </div>
  );
};

export default ExampleSentence;
