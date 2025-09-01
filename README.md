# 🎓 英文精讲助手 (English Tutor)

一个基于AI的英语学习助手，提供智能文本分析、语法精讲和句式解析，让英语学习更高效。

## ✨ 核心功能

### 🤖 AI智能分析
- **多模型支持**: 集成 OpenAI GPT 和 Google Gemini 模型
- **深度语法分析**: 专注高价值语法点，跳过基础内容
- **句式结构解析**: 详细分析复杂句子的语法构成
- **智能翻译**: 提供准确的中文对照翻译

### 📚 学习功能
- **逐段精讲**: 将长文本分段分析，便于理解
- **语法点归纳**: 系统性整理重要语法知识
- **难度分级**: 自动评估文本和语法点难度
- **实例教学**: 提供丰富的例句和使用场景

### 🎨 用户体验
- **现代化界面**: 简洁美观的用户界面
- **响应式设计**: 适配各种屏幕尺寸
- **流畅动画**: 使用 Framer Motion 提供舒适的交互体验
- **即时反馈**: 实时显示分析进度和结果

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/mxppxm/english-tutor.git
cd english-tutor
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问应用**
打开浏览器访问 `http://localhost:5173`

### 🔧 配置AI服务

首次使用需要配置AI API密钥：

1. 点击右下角的⚙️设置按钮
2. 选择AI服务提供商（OpenAI 或 Gemini）
3. 输入对应的API密钥
4. 选择合适的模型（可选）

#### OpenAI配置
- **API密钥**: 在 [OpenAI Platform](https://platform.openai.com/api-keys) 获取
- **推荐模型**: `gpt-3.5-turbo` 或 `gpt-4`
- **自定义端点**: 支持配置自定义API端点（可选）

#### Google Gemini配置
- **API密钥**: 在 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取
- **推荐模型**: `gemini-2.0-flash-exp` 或 `gemini-pro`

## 📖 使用说明

### 基本操作

1. **输入文本**: 在文本框中输入或粘贴英文内容
2. **加载示例**: 点击"加载示例"体验功能
3. **开始分析**: 点击"开始分析"按钮
4. **查看结果**: 等待AI分析完成，查看详细解析

### 功能详解

#### 📝 文本分析
- 支持各种类型的英文文本
- 自动分段处理长文本
- 识别复杂语法结构
- 提供上下文翻译

#### 🔍 语法精讲
- **重点语法**: 专注高中到大学水平的复杂语法
- **结构分析**: 详细解释语法规则和使用场景
- **避免基础**: 智能跳过简单的语法点
- **实用导向**: 重点分析对学习有帮助的内容

#### 📊 学习视图
- **扁平视图**: 简洁的逐段展示
- **增强视图**: 详细的语法和句式分析
- **段落视图**: 传统的分段学习模式

## 🛠️ 技术栈

### 前端框架
- **React 19**: 现代化的前端框架
- **Vite**: 快速的构建工具
- **CSS3**: 现代化样式

### AI集成
- **@ai-sdk/openai**: OpenAI SDK集成
- **@ai-sdk/google**: Google Gemini SDK集成
- **ai**: 统一的AI SDK接口

### UI组件
- **Framer Motion**: 流畅的动画效果
- **Lucide React**: 精美的图标库
- **React Markdown**: Markdown渲染支持

### 开发工具
- **ESLint**: 代码质量检查
- **TypeScript**: 类型安全支持

## 📁 项目结构

```
english-tutor/
├── src/
│   ├── components/          # React组件
│   │   ├── Header.jsx       # 头部组件
│   │   ├── InputSection.jsx # 输入区域
│   │   ├── EnhancedFlatView.jsx # 增强视图
│   │   ├── ConfigModal.jsx  # 配置弹窗
│   │   └── ...
│   ├── services/            # 服务层
│   │   └── api.js          # AI API调用
│   ├── types/              # TypeScript类型定义
│   ├── App.jsx             # 主应用组件
│   └── main.jsx            # 应用入口
├── public/                 # 静态资源
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 🎯 核心特性

### 智能语法筛选
- 严格排除基础语法（and、but、in、on等）
- 重点分析复杂语法结构（从句、非谓语、特殊句式）
- 深度解释语法规则和使用场景
- 提供实用的学习建议

### 高质量分析
- **准确性**: 语法术语准确，分析逻辑清晰
- **实用性**: 专注对提高英语水平有帮助的内容
- **系统性**: 将语法点归类到具体的语法系统
- **可操作性**: 提供具体的学习和练习建议

### 用户友好
- **错误处理**: 完善的错误提示和处理机制
- **状态管理**: 清晰的加载状态和进度反馈
- **数据持久**: 本地保存API配置
- **响应式**: 适配各种设备和屏幕尺寸

## 🔧 开发指南

### 脚本命令

```bash
# 开发环境
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览构建结果
npm run preview
```

### 环境变量

创建 `.env.local` 文件配置环境变量（可选）：

```env
# OpenAI配置
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

# Gemini配置
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 自定义配置

应用支持多种自定义配置：

- **AI提供商**: OpenAI 或 Google Gemini
- **模型选择**: 根据需求选择不同的AI模型
- **API端点**: 支持自定义OpenAI API端点
- **分析参数**: 可调整温度、最大token等参数

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发准则
- 遵循React最佳实践
- 保持代码简洁和可读性
- 添加适当的注释和文档
- 确保TypeScript类型安全

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构代码
- test: 测试相关
- chore: 构建或工具相关

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- **GitHub**: [mxppxm/english-tutor](https://github.com/mxppxm/english-tutor)
- **Issues**: [提交问题](https://github.com/mxppxm/english-tutor/issues)

## 🙏 致谢

感谢以下开源项目和服务：

- [React](https://reactjs.org/) - 用户界面框架
- [Vite](https://vitejs.dev/) - 构建工具
- [OpenAI](https://openai.com/) - AI服务提供商
- [Google AI](https://ai.google.dev/) - AI服务提供商
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [Lucide](https://lucide.dev/) - 图标库

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！