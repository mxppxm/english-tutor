# English Tutor - AI 英语学习助手

一个基于现代 AI 技术的英语学习工具，提供深度语法分析和词库学习功能。

## 🚀 项目特性

### 核心功能

- **AI 语法分析**：专业的英语语法和句式深度分析
- **词库学习**：支持多种考试词库（CET4/6、IELTS、TOEFL、SAT 等）
- **智能匹配**：自动匹配文章中的重点词汇
- **历史记录**：保存学习历史，支持复习

### 技术架构

- **前端**：React 19 + Vite + Tailwind CSS
- **后端**：Netlify Functions (云函数)
- **AI 支持**：豆包 AI、Google Gemini
- **数据存储**：IndexedDB (本地存储)

### 安全特性

- ✅ **提示词保护**：所有 AI 提示词在后端云函数中加密保护
- ✅ **API 密钥安全**：通过 HTTPS 加密传输到云函数
- ✅ **跨域解决**：通过后端代理避免 CORS 问题
- ✅ **前端代码安全**：前端代码中不包含任何敏感信息

## 🛠️ 开发环境

### 环境要求

- Node.js 18+
- npm 或 yarn
- Netlify CLI (用于本地开发)

### 本地开发

1. **安装依赖**

   ```bash
   npm install
   ```

2. **启动开发服务器（推荐）**

   ```bash
   npm run start
   # 或者
   npm run dev:functions
   ```

   这将启动 Netlify 开发环境，支持云函数本地调试

3. **仅前端开发**
   ```bash
   npm run dev
   ```

### 可用脚本

```bash
# 开发
npm run dev              # 仅前端开发服务器
npm run dev:functions    # Netlify 完整开发环境（推荐）
npm run start           # 同 dev:functions

# 构建
npm run build           # 构建前端
npm run build:functions # Netlify 完整构建

# 其他
npm run lint           # 代码检查
npm run preview        # 预览构建结果
```

## 🌐 部署

### Netlify 部署（推荐）

1. **连接仓库**

   - 在 Netlify 控制台中连接你的 Git 仓库

2. **配置环境变量**
   在 Netlify 控制台的 Environment Variables 中设置：

   ```
   NODE_VERSION=18
   ```

3. **自动部署**
   - 推送代码到主分支即可自动部署
   - 构建设置：`npm run build`
   - 发布目录：`dist`

### 手动部署

```bash
# 构建项目
npm run build:functions

# 部署 dist 目录到你的静态托管服务
```

## 🔧 配置说明

### AI 提供商配置

项目支持两种 AI 提供商：

#### 豆包 AI (字节跳动)

- 获取 API Key：[火山引擎控制台](https://console.volcengine.com/ark)
- 支持模型：
  - `deepseek-v3-1-250821` (默认，最新高性能)
  - `doubao-pro-32k`
  - `doubao-pro-4k`
  - `doubao-lite-32k`
  - `doubao-lite-4k`

#### Google Gemini

- 获取 API Key：[Google AI Studio](https://makersuite.google.com/app/apikey)
- 支持模型：
  - `gemini-2.0-flash-exp`
  - `gemini-1.5-flash`
  - `gemini-1.5-pro`
  - `gemini-1.0-pro`

### 词库配置

支持的词库类型：

- CET4 (大学英语四级)
- CET6 (大学英语六级)
- IELTS (雅思)
- TOEFL (托福)
- SAT (学术能力评估测试)
- HighSchool (高中英语)

## 🏗️ 架构说明

### 前后端分离架构

```
前端 (React)
    ↓ API 请求
云函数 (Netlify Functions)
    ↓ AI API 调用
AI 服务商 (豆包/Gemini)
```

### 安全设计

1. **提示词保护**：所有 AI 提示词在云函数中定义，前端无法访问
2. **API 密钥安全**：用户 API 密钥通过 HTTPS 传输到云函数，不存储在后端
3. **跨域解决**：通过云函数代理 AI 请求，避免浏览器跨域限制
4. **代码分离**：敏感业务逻辑在云函数中处理，前端只负责界面展示

### 文件结构

```
english-tutor/
├── src/                     # 前端源码
│   ├── components/          # React 组件
│   ├── services/           # API 服务
│   ├── pages/              # 页面组件
│   └── styles/             # 样式文件
├── netlify/
│   └── functions/          # 云函数
├── public/                 # 静态资源
├── netlify.toml           # Netlify 配置
└── package.json           # 项目配置
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
