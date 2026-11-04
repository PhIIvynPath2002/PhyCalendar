# 2.0 验证记录（2026-11-04）

已在 Linux / Node.js 24 实际运行：

- 锁文件已生成，源码 ZIP 的全新解压目录完成 `npm ci`、11 项测试、网页构建和 iOS 工程同步，均通过。
- `npm test`：11 项全部通过，无跳过，覆盖原月底/闰年规则、预计与实际分离、取消续费保留权益、跨币种统计、ICS、免登录 CRUD、付款去重、价格修改保留历史、版本冲突、v1 升级、未知/损坏格式不覆盖。
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser` 通过：没有登录输入/个人数据 API 请求；断网后重载、新增、JSON/ICS 导出；完全关闭浏览器再离线重开仍保留订阅与付款；独立浏览器空间初始为空；通过真实界面导入 v1 JSON；拒绝未来未知版本；320/393/430/768/1440px 无横向溢出。测试演示数据只在临时目录，测试后删除。
- `npx cap add ios` 生成 Xcode 工程成功，`ios:sync` 可同步内置资源，三个插件被 SPM 工程识别。

当前机器是 Linux，无法调用 Xcode 或运行 macOS/iOS App。此文件本身不证明 Apple 构建通过；原生安装包只有在 GitHub Actions 的 Apple 构建任务成功后才允许发布，执行结果以对应 Actions run 为准。没有 Apple 证书、没有签名 IPA、没有真机测试或公证。

尚需实机验证：iPhone 原生 Preferences 保存/重启恢复、系统分享导出与文件导入，Mac 打包 App 的首次安全提示与升级保留，PWA 主屏幕离线重启，Apple 日历导入与通知。不能把移动 Chromium 模拟尺寸当作 Safari/真机验证。

按所有者最新选择，仓库暂时保持 Private；本次仅交付本地构建工程，CI 以 `docs/ci/build.yml.example` 模板提供，未运行 Apple CI。2.0 Release 的源码/PWA包不代表原生安装包。

## 2.0.1 构建操作修正

- bash 语法检查通过；构建助手从 /tmp 启动会自动进入项目目录，含中文和空格的路径也通过。
- 缺失锁文件时提前退出，未安装依赖或执行构建。原2.0.0源码包的manifest和锁文件均已核实存在。
- 此修正未改变业务逻辑或数据格式；完整macOS构建仍未在当前Linux机器执行，不能将构建助手当作已验证的Mac安装包。
