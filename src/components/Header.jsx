import { BookOpen } from "lucide-react";

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <BookOpen size={32} />
          <h1>英文精讲助手</h1>
        </div>
        <p className="tagline">智能AI分析 · 逐段精讲 · 让英语学习更轻松高效</p>
      </div>
    </header>
  );
};

export default Header;
