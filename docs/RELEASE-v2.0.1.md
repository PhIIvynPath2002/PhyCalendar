# 2.0.1 · Mac 构建操作修正

针对用户在主目录直接运行 npm 导致 ENOENT / 缺少锁文件的情况：

- 新增根目录“构建Mac应用.command”，从任何当前目录启动均先定位项目，检查 package.json、锁文件及 Node/npm，再安装并构建；安装失败不会继续下一步。
- 重写中文步骤，说明先用 cd + Finder 拖入项目文件夹，检查两个文件，再执行 npm ci && npm run dist:mac。
- 保留免登录、本地数据格式 version 2 与原生 App 标识，不修改订阅/付款或存储路径。

此次交付源码与本地构建工程；没有新增已验证的 Mac DMG 或 iPhone IPA。构建助手只是操作辅助，不是原生安装包。完整 Mac 构建仍需在 macOS 执行。仓库保持 Private，CI 未启用。
