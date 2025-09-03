# 开发指南

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

**方式一：完整开发环境（推荐）**

```bash
npm run start
# 或者
npm run dev:functions
```

这会启动：

- 前端开发服务器（端口 3000）
- Netlify Functions 本地服务器（端口 8888）
- 自动代理配置

**方式二：仅前端开发**

```bash
npm run dev
```

注意：这种方式无法测试云函数功能

### 环境说明

- **开发环境**：使用 Vite 代理将 `/api/*` 请求转发到本地云函数
- **生产环境**：直接调用 Netlify Functions (`.netlify/functions/*`)

## 🏗️ 架构重构说明

### 主要改进

1. **安全架构**

   - ✅ 提示词从前端移除，保护在云函数中
   - ✅ API 密钥通过 HTTPS 安全传输
   - ✅ 前端代码不包含敏感信息

2. **跨域解决**

   - ✅ 通过云函数代理避免 CORS 问题
   - ✅ 统一的 API 接口设计

3. **代码优化**
   - ✅ 前端 API 调用逻辑简化
   - ✅ 后端业务逻辑集中管理
   - ✅ 错误处理统一规范

### 文件结构

```
english-tutor/
├── netlify/
│   └── functions/
│       └── analyze-text.js      # AI分析云函数
├── src/
│   ├── services/
│   │   └── api.js               # 简化的前端API服务
│   └── components/
│       └── ConfigModal.jsx      # 更新的配置界面
├── netlify.toml                 # Netlify配置
├── vite.config.js              # Vite配置（包含代理）
└── package.json                # 添加了Netlify CLI
```

## 🔧 开发流程

### 本地开发

1. 运行 `npm run start`
2. 访问 http://localhost:3000
3. 配置 AI API 密钥
4. 测试功能

### 部署流程

1. 推送代码到 Git 仓库
2. Netlify 自动构建和部署
3. 检查云函数是否正常工作

## ⚙️ 配置文件说明

### netlify.toml

- 构建设置
- 云函数配置
- 重定向规则
- CORS 头设置

### vite.config.js

- 开发代理配置
- 构建优化设置

## 🐛 常见问题

### 1. 云函数本地调试失败

确保已安装 Netlify CLI：

```bash
npm install -g netlify-cli
# 或在项目中
npm install
```

### 2. API 请求失败

检查：

- 是否使用了正确的开发命令 (`npm run start`)
- API 密钥是否正确配置
- 网络连接是否正常

### 3. 模块导入错误

确保云函数中的导入语句使用 ES6 模块语法：

```javascript
import { createOpenAI } from "@ai-sdk/openai";
```

## 📝 添加新功能

### 添加新的云函数

1. 在 `netlify/functions/` 中创建新文件
2. 使用标准的 Netlify Functions 格式
3. 在前端 `api.js` 中添加对应的调用函数

### 添加新的 AI 提供商

1. 在云函数中添加新的提供商逻辑
2. 在前端配置界面中添加选项
3. 更新默认配置

## 🚀 部署注意事项

### Netlify 环境变量

虽然 API 密钥由用户在前端配置，但如果需要服务端默认配置，可以在 Netlify 控制台设置：

- `NODE_VERSION=18`

### 构建优化

- 代码已配置自动分包优化
- 静态资源设置了缓存头
- 支持 SPA 路由

## 🔍 调试技巧

### 云函数调试

在云函数中添加 console.log：

```javascript
console.log("调试信息:", data);
```

在 Netlify 控制台的 Functions 日志中查看

### 前端调试

使用浏览器开发工具查看：

- Network 标签：检查 API 请求
- Console 标签：查看错误信息
