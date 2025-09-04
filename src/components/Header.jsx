import { BookOpen } from "lucide-react";

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <BookOpen size={32} />
          <h1>英文精讲助手</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
