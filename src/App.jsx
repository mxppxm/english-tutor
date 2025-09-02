import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import LearningPage from "./pages/LearningPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn/:historyId" element={<LearningPage />} />
        <Route path="/learn" element={<LearningPage />} />
      </Routes>
    </Router>
  );
}

export default App;
