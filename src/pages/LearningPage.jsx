import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import Header from "../components/Header";
import FlatLearningView from "../components/FlatLearningView";
import SentenceLearningView from "../components/SentenceLearningView";
import VocabularyBookModal from "../components/VocabularyBookModal";
import { getHistoryById } from "../services/historyService";

const LearningPage = () => {
  const { historyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVocabularyBook, setShowVocabularyBook] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 优先使用路由传递的数据
        if (location.state?.analysisResult) {
          setAnalysisResult(location.state.analysisResult);
          setLoading(false);
          return;
        }

        // 如果有历史记录ID，从数据库加载
        if (historyId) {
          const historyItem = await getHistoryById(parseInt(historyId, 10));
          if (historyItem) {
            setAnalysisResult(historyItem.analysisResult);
          } else {
            setError("未找到指定的历史记录");
          }
        } else {
          setError("没有找到分析结果");
        }
      } catch (err) {
        console.error("加载数据失败:", err);
        setError("加载数据失败");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [historyId, location.state]);

  const handleBack = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="app">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在准备学习内容...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Header />
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={handleBack} className="btn btn-primary">
            回到首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app learning-page">
      <Header />

      <div className="learning-header">
        <button onClick={handleBack} className="back-button">
          <ArrowLeft size={20} />
          回到首页
        </button>

        <div className="learning-title">
          <h1>{analysisResult?.title || "让我们一起学习这篇文章 📖"}</h1>
        </div>

        <button
          onClick={() => setShowVocabularyBook(true)}
          className="vocabulary-book-button"
          title="我的单词收藏"
        >
          <BookOpen size={20} />
          单词收藏
        </button>
      </div>

      <main className="learning-content">
        {analysisResult &&
          // 根据分析模式选择对应的展示组件
          (analysisResult.analysisMode === "sentence" ||
          (analysisResult.sentences &&
            analysisResult.sentences.length > 0 &&
            !analysisResult.paragraphs?.length) ? (
            <SentenceLearningView result={analysisResult} />
          ) : (
            <FlatLearningView result={analysisResult} />
          ))}
      </main>

      {showVocabularyBook && (
        <VocabularyBookModal onClose={() => setShowVocabularyBook(false)} />
      )}
    </div>
  );
};

export default LearningPage;
