import { useState, useEffect } from "react";
import { BookOpen, Volume2, Star, Check } from "lucide-react";
import {
  collectWord,
  uncollectWordByText,
  isWordCollected,
  masterWord,
  unmasterWord,
  isWordMastered,
} from "../services/wordCollectionService";

const VocabularyLearning = ({
  vocabularyWords = [],
  vocabularyListName = "",
  className = "",
}) => {
  const [mastered, setMastered] = useState(new Set());
  const [studying, setStudying] = useState(new Set());
  const [collectedWords, setCollectedWords] = useState(new Set());

  // 从localStorage加载学习进度和检查单词收藏状态
  useEffect(() => {
    const savedMastered = localStorage.getItem("mastered_words");
    const savedStudying = localStorage.getItem("studying_words");

    if (savedMastered) {
      setMastered(new Set(JSON.parse(savedMastered)));
    }
    if (savedStudying) {
      setStudying(new Set(JSON.parse(savedStudying)));
    }

    // 检查单词收藏状态
    const checkCollectedStatus = async () => {
      const collectedSet = new Set();
      for (const word of vocabularyWords) {
        const isCollected = await isWordCollected(word.word);
        if (isCollected) {
          collectedSet.add(word.word);
        }
      }
      setCollectedWords(collectedSet);
    };

    if (vocabularyWords.length > 0) {
      checkCollectedStatus();
    }
  }, [vocabularyWords]);

  // 保存学习进度到localStorage
  useEffect(() => {
    localStorage.setItem("mastered_words", JSON.stringify([...mastered]));
  }, [mastered]);

  useEffect(() => {
    localStorage.setItem("studying_words", JSON.stringify([...studying]));
  }, [studying]);

  const toggleMastered = (word) => {
    setMastered((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(word)) {
        newSet.delete(word);
      } else {
        newSet.add(word);
        // 如果标记为掌握，则从学习中移除
        setStudying((studyPrev) => {
          const newStudySet = new Set(studyPrev);
          newStudySet.delete(word);
          return newStudySet;
        });
      }
      return newSet;
    });
  };

  const toggleStudying = async (wordData) => {
    const wordText = typeof wordData === "string" ? wordData : wordData.word;
    const isCurrentlyStudying = studying.has(wordText);

    try {
      if (isCurrentlyStudying) {
        // 从单词本移除
        await uncollectWordByText(wordText);
        setStudying((prev) => {
          const newSet = new Set(prev);
          newSet.delete(wordText);
          return newSet;
        });
        setCollectedWords((prev) => {
          const newSet = new Set(prev);
          newSet.delete(wordText);
          return newSet;
        });
      } else {
        // 加入单词本 - 传递完整的单词数据
        const fullWordData =
          typeof wordData === "string"
            ? vocabularyWords.find((w) => w.word === wordData)
            : wordData;

        await collectWord({
          ...fullWordData,
          context: fullWordData.context || "",
          sourceTitle: vocabularyListName || "词库单词",
        });

        setStudying((prev) => {
          const newSet = new Set(prev);
          newSet.add(wordText);
          return newSet;
        });
        setCollectedWords((prev) => new Set(prev).add(wordText));

        // 如果标记为学习中，则从掌握中移除
        setMastered((masteredPrev) => {
          const newMasteredSet = new Set(masteredPrev);
          newMasteredSet.delete(wordText);
          return newMasteredSet;
        });
      }
    } catch (error) {
      console.error("操作单词本失败:", error);
      alert("操作失败，请重试");
    }
  };

  const speakWord = (word) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  if (vocabularyWords.length === 0) {
    return (
      <div className={`vocabulary-learning empty ${className}`}>
        <div className="empty-state">
          <BookOpen size={48} className="text-gray-400" />
          <h3>暂无词汇</h3>
          <p>分析文章后，匹配的词库单词将在这里显示</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`vocabulary-learning ${className}`}>
      {/* 词汇列表 */}
      <div className="vocabulary-list">
        {vocabularyWords.map((word, index) => (
          <VocabularyCard
            key={`${word.word}-${index}`}
            word={word}
            isMastered={mastered.has(word.word)}
            isStudying={
              studying.has(word.word) || collectedWords.has(word.word)
            }
            onToggleMastered={() => toggleMastered(word.word)}
            onToggleStudying={() => toggleStudying(word)}
            onSpeak={() => speakWord(word.word)}
          />
        ))}
      </div>
    </div>
  );
};

// 单词卡片组件
const VocabularyCard = ({
  word,
  isMastered,
  isStudying,
  onToggleMastered,
  onToggleStudying,
  onSpeak,
}) => {
  return (
    <div
      className={`vocabulary-card ${isMastered ? "mastered" : ""} ${
        isStudying ? "studying" : ""
      }`}
    >
      <div className="card-main">
        <div className="word-section">
          <div className="word-info">
            <h4 className="word-text">{word.word}</h4>
            {word.phonetic && <span className="phonetic">{word.phonetic}</span>}
          </div>

          <div className="word-actions">
            <button className="speak-btn" onClick={onSpeak} title="发音">
              <Volume2 size={16} />
            </button>
          </div>
        </div>

        {word.translation && (
          <div className="translation">{word.translation}</div>
        )}

        {/* 始终显示完整详细信息 */}
        <div className="word-details">
          {/* 显示词性和释义 */}
          {word.translations && word.translations.length > 0 && (
            <div className="word-translations">
              <strong>词性释义：</strong>
              <div className="translations-list">
                {word.translations.map((trans, index) => (
                  <div key={index} className="translation-item">
                    {trans.type && (
                      <span className="translation-type">{trans.type}.</span>
                    )}
                    <span className="translation-text">
                      {trans.translation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {word.allTranslations &&
            word.allTranslations !== word.translation && (
              <div className="all-translations">
                <strong>完整释义：</strong> {word.allTranslations}
              </div>
            )}

          {word.phrases && word.phrases.length > 0 && (
            <div className="phrases">
              <strong>常用短语：</strong>
              <ul className="phrases-list">
                {word.phrases.map((phrase, index) => (
                  <li key={index} className="phrase-item">
                    <span className="phrase-text">{phrase.phrase}</span>
                    <span className="phrase-translation">
                      {" "}
                      - {phrase.translation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {word.usage && (
            <div className="usage">
              <strong>例句：</strong> {word.usage}
            </div>
          )}
        </div>

        <div className="card-actions">
          <button
            className={`action-btn mastered ${isMastered ? "active" : ""}`}
            onClick={onToggleMastered}
            title={isMastered ? "标记为未掌握" : "掌握后不再高亮"}
          >
            <Check size={16} />
            {isMastered ? "已掌握" : "掌握"}
          </button>

          <button
            className={`action-btn studying ${isStudying ? "active" : ""}`}
            onClick={onToggleStudying}
            title={isStudying ? "移出单词本" : "加入单词本"}
          >
            <Star size={16} />
            {isStudying ? "已在单词本" : "加入单词本"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VocabularyLearning;
