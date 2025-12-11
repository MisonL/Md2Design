<div align="center">
  <h1>Md2Design</h1>
  <p>从 Markdown 到精美卡片的所见即所得工具 · A WYSIWYG card generator from Markdown</p>
  <p>
    <a href="#中文">中文</a> · <a href="#english">English</a>
  </p>
  <p>
    <a href="https://LuN3cy.github.io/Md2Design/" target="_blank">Live Demo</a>
  </p>
</div>

---

## 中文

### 介绍
Md2Design 帮你把普通的 Markdown 内容快速转换成可分享的精美卡片，支持自动分页、拖拽图片、字体上传、水印与页码，以及一键导出 PNG/JPG。

### 特性速览
- 自动分页：在内容中使用 `\n---\n` 作为分页分隔符（提示见编辑器底部）
- 图片支持：粘贴或上传图片，作为可拖拽、可缩放的浮动图层
- 布局与尺寸：`1:1`、`4:3`、`3:2`、`16:9`、自定义尺寸，支持横竖屏
- 视觉样式：圆角、边框、阴影、背景填充（纯色/渐变，内置多组渐变预设）
- 字体排版：预设字体 + 自定义本地字体上传，支持可变字体范围权重
- 水印与页码：开启水印内容与位置、页码位置等
- 一键导出：PNG/JPG、`1x-4x` 倍数；
  - 多图导出：优先使用浏览器文件系统 API 导出到文件夹；不支持则自动打包 ZIP
  - 长图导出：将所有卡片竖直拼接为一张长图
- 主题与语言：支持浅色/深色主题、中文/英文切换

### 快速开始
```bash
npm install
npm run dev
# 打包构建
npm run build
```

### 使用指南
- 在编辑器中编写 Markdown 文本，使用 `\n---\n` 进行分页
- 工具栏支持粗体/斜体/列表/引用/标题/链接/图片，或直接粘贴图片到编辑器
- 图片会以「浮动层」的形式出现在预览卡片中，可自由拖拽、缩放与裁剪
- 右侧侧边栏可调整布局、颜色、字体、阴影、水印等样式
- 顶部栏可切换主题与语言，并打开导出弹窗设置格式、倍数与模式

### 快捷键
- 撤销：`Ctrl/Cmd + Z`
- 重做：`Shift + Ctrl/Cmd + Z`

### 技术栈
- React 19、Vite、TypeScript
- Tailwind CSS v4
- 状态管理：Zustand + Zundo（带撤销/重做）
- 动效与交互：Framer Motion、React RND
- 渲染与导出：React Markdown、html-to-image、JSZip

### 部署
本项目已配置 GitHub Actions 自动部署至 GitHub Pages。默认发布到 `gh-pages` 分支，并在 `vite.config.ts` 中设置了 `base: '/Md2Design/'` 以支持子路径访问。

---

## English

### Overview
Md2Design turns plain Markdown into shareable, beautifully styled cards. It supports auto pagination, draggable images, custom fonts, watermark and page numbers, plus one-click PNG/JPG export.

### Highlights
- Auto pagination using `\n---\n` separators (hint shown in the editor)
- Images: paste or upload as floating layers; drag, resize and crop freely
- Layout & size: `1:1`, `4:3`, `3:2`, `16:9`, or custom dimensions; portrait/landscape
- Visual style: corner radius, border, shadow, and background (solid/gradient with presets)
- Typography: preset fonts and local custom font upload; variable font weights supported
- Watermark & page number: toggle content/position and number positions
- Export: PNG/JPG with `1x–4x` scale
  - Multiple images: uses File System Access API to export into a folder; falls back to ZIP when unavailable
  - Continuous image: stitches all cards vertically into one long image
- Theme & language: light/dark theme switch and Chinese/English toggle

### Quick Start
```bash
npm install
npm run dev
# Build for production
npm run build
```

### Usage
- Write Markdown in the editor and separate pages with `\n---\n`
- Use the toolbar to insert formatting or images, or simply paste images
- Images appear as floating layers on the card; drag, resize and crop as needed
- Adjust layout, colors, fonts, shadows, watermark in the right sidebar
- Use the top bar to switch theme/language and open the export modal

### Shortcuts
- Undo: `Ctrl/Cmd + Z`
- Redo: `Shift + Ctrl/Cmd + Z`

### Tech Stack
- React 19, Vite, TypeScript
- Tailwind CSS v4
- State: Zustand + Zundo (undo/redo)
- Motion & interaction: Framer Motion, React RND
- Rendering & export: React Markdown, html-to-image, JSZip

### Deployment
GitHub Actions is preconfigured to deploy to GitHub Pages. Artifacts are published to the `gh-pages` branch, with `base: '/Md2Design/'` in `vite.config.ts` for subpath hosting.

---

## 联系作者 · Contact
- 公众号：<a href="https://mp.weixin.qq.com/s/sAIYq8gaezAumyIbGHiJ_w" target="_blank">LuN3cy的实验房</a>
- 小红书：<a href="https://www.xiaohongshu.com/user/profile/61bbb882000000001000e80d" target="_blank">LuN3cy</a>
- Bilibili：<a href="https://b23.tv/i42oxgt" target="_blank">LuN3cy</a>
