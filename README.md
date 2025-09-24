# 🎵 Music Decoder - 跨端音乐文件管理与转换界面

一个基于 Vue 3 + Electron 的跨平台桌面应用，提供现代化、可视化的文件扫描、批量处理、进度展示与统计功能；前端采用响应式设计，兼顾桌面与移动端的良好使用体验。

重要说明（合规）
- 本项目仅用于学习与研究 UI/UX、跨端可视化与桌面应用工程化实践。
- 仅可在你对音频内容拥有合法权利与授权的前提下进行处理与转换。
- 本仓库不包含、也不提供任何用于绕过版权保护或 DRM 的指令、二进制或操作教程；任何第三方工具的引用均为可选集成，请遵循其许可证与当地法律。

核心特性
- 目录选择与批量扫描：统计文件数量、大小与类型分布
- 批量任务与可视化进度：单文件/批量处理、实时百分比与当前进度项
- 错误提示与结果汇总：成功/失败统计、一键导出记录
- 跨端 UI：响应式布局，适配桌面与移动端
- 工程化：Vite + TypeScript + Vue 3，Electron 打包发布

技术栈
- 前端：Vue 3 + TypeScript + Pinia + Vue Router + Vite
- 桌面：Electron（electron-builder 打包）

快速开始（复刻与开发）
1) 环境要求
- Node.js >= 18，建议安装 Git

2) 克隆与安装
- git clone https://github.com/ziyange/Music-decode.git
- cd Music-decode && npm install

3) 本地开发
- npm run electron-dev  // 启动前端与 Electron 主进程联调

4) 构建与打包（仅示例）
- npm run electron-build  // 生成安装包产物位于 dist-electron/
- npm run dist            // 本地打包但不发布

可选的第三方工具集成（合规前提）
- 本项目在架构上预留了对第三方开源工具（例如 ncmdump）进行调用的接口，以便在合法授权范围内处理你拥有权利的音频文件。
- 第三方工具不包含在本仓库内，亦不提供下载链接或使用指令；如需了解该工具，请访问其官方仓库主页并遵循许可证与法律使用。
- 若你决定自行集成：请将二进制放置在 app/ 目录，并在构建时通过 electron-builder 的 extraResources 机制打包；注意本仓库的 .gitignore 已排除二进制上传。

使用说明（界面与流程参考）
- 请参见本地文档：Music Decoder使用方法.md（仅作界面与流程参考，避免任何可能涉及绕过加密的场景）。

项目结构（节选）
- src/            前端源代码（组件、视图、状态、工具）
- electron/       Electron 主进程与预加载脚本
- app/            可选的外部工具放置目录（默认不包含）
- dist-electron/  打包产物（已在 .gitignore 排除）

常用脚本
- npm run dev              // 仅前端开发服务器
- npm run electron-dev     // Electron + 前端联调（推荐）
- npm run type-check       // 类型检查
- npm run lint             // 代码检查
- npm run build            // 构建 Web 产物
- npm run electron-build   // 构建安装包

发布与 Releases
- 建议仅发布源代码与合法可分发的说明文档；如需发布安装包，请确保安装包中不包含任何用于绕过版权保护的组件或说明。
- Releases: https://github.com/ziyange/Music-decode/releases

问题反馈与计划
- Issues: https://github.com/ziyange/Music-decode/issues
- 欢迎提交 bug 与功能建议，建议使用下方的模板（我们将在仓库中提供基础模板）。

贡献与许可证
- 欢迎以合规方式贡献 UI、工程脚手架、跨端适配、性能优化等改进。
- 许可证：MIT（仅指本仓库内代码，不涵盖任何第三方二进制与资源）。

致谢
- Vue、Electron、Vite 等优秀开源生态
- 社区贡献者
