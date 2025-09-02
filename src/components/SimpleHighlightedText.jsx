const SimpleHighlightedText = ({
  text,
  vocabularyWords = [],
  foundWords = [],
  onWordHover,
  sourceTitle,
  masteredWords = new Set(),
}) => {
  // 合并所有词汇，避免重复，保留原始数据用于tooltip
  const getAllWords = () => {
    const wordMap = new Map();

    // 添加段落重点词汇（优先级更高）
    vocabularyWords.forEach((word) => {
      if (word && word.word) {
        wordMap.set(word.word.toLowerCase(), {
          ...word,
          isParagraphWord: true,
        });
      }
    });

    // 添加词库词汇，但不覆盖段落词汇，保留原始数据结构
    foundWords.forEach((vocabWord) => {
      if (vocabWord && vocabWord.word) {
        const wordKey = vocabWord.word.toLowerCase();
        if (!wordMap.has(wordKey)) {
          // 保留原始词库数据结构，用于tooltip显示完整信息
          wordMap.set(wordKey, {
            ...vocabWord,
            isVocabularyWord: true,
          });
        }
      }
    });

    return Array.from(wordMap.values());
  };

  const highlightText = () => {
    if (!text) return text;

    const allWords = getAllWords();
    if (allWords.length === 0) return text;

    let result = text;

    // 按单词长度降序排序，但保留原始索引
    const sortedWordsWithIndex = allWords
      .map((word, originalIndex) => ({ word, originalIndex }))
      .filter(({ word }) => !masteredWords.has(word.word))
      .sort((a, b) => b.word.word.length - a.word.word.length);

    sortedWordsWithIndex.forEach(({ word: wordData, originalIndex }) => {
      const word = wordData.word;
      // 简单的单词边界匹配
      const regex = new RegExp(
        `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi"
      );

      result = result.replace(regex, (match) => {
        // 检查是否已经被高亮
        if (match.includes("highlighted-word-")) return match;

        const wordId = `word-${originalIndex}-${Date.now()}`;
        return `<span class="highlighted-word highlighted-word-${wordId}" data-word-index="${originalIndex}">${match}</span>`;
      });
    });

    return result;
  };

  const handleClick = (e) => {
    const target = e.target;
    if (target.classList.contains("highlighted-word")) {
      const wordIndex = parseInt(target.dataset.wordIndex);
      const allWords = getAllWords();
      const wordData = allWords[wordIndex]; // 直接使用原始索引

      if (wordData && onWordHover) {
        const rect = target.getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft =
          window.pageXOffset || document.documentElement.scrollLeft;

        const position = {
          x: rect.left + scrollLeft + rect.width / 2,
          y: rect.top + scrollTop - 10,
          // 同时保存相对位置用于后续调整
          relativeTarget: target,
        };

        onWordHover(wordData, position);
      }
    }
  };

  return (
    <div
      className="highlighted-text"
      dangerouslySetInnerHTML={{ __html: highlightText() }}
      onClick={handleClick}
    />
  );
};

export default SimpleHighlightedText;
