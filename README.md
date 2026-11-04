# 个人订阅日历 · PhyCalendar 2.0.1

中文、免登录、离线优先的个人订阅管理工具。MIT 许可证（由项目所有者选择）。公开的是程序，真实记录只留在使用者自己的设备，不会上传到 GitHub 或共同数据库。没有注册、密码、后台服务、自动跨设备同步或遥测。

**请先阅读 [中文安装与 iPhone 签名说明](docs/INSTALL-zh.md)**、[版本更新说明](docs/RELEASE-v2.0.0.md)、[验证记录](VALIDATION.md)。不要直接双击 public/index.html。

## 功能

月历、当天完整列表、订阅新增/编辑/删除、账号别名与备注、月付/年付/固定天数/一次性、试用期、预计续费、实际付款历史、人民币/美元独立统计、应用内到期提醒、JSON 备份/恢复、Apple 日历静态 .ics 导出。无内置演示订阅；测试中的价格仅为演示，不代表真实售价。

- 月付以原始日期锚定，1/31 → 2/28 → 3/31；闰日年付在闰年恢复 2/29。
- 预计不会变成已付款，只有手动确认才记账；调整价格保留历史，调整日期/周期建立新计划。
- 取消续费后停止预计，保留已付周期的结束提醒。状态手动管理，不因预计日期已过而误判扣费。
- 实际费用按付款日统计，未来 30 天含今天至第 29 天；年度预计指未来 12 个月尚未付款的自动续费。币种独立，不做汇率转换。
- 下一次扣款日和当前周期到期日分别标注；确认付款对应所选计划日起到下一边界的周期，不含结束日，一次性只记录当天。

## 平台与产物

| 平台 | 方案 | 产物与限制 |
|---|---|---|
| Mac Apple Silicon | Electron 独立 App | arm64 `.app` ZIP / DMG；构建成功才发布；无 Developer ID/公证时标注 unsigned |
| Mac Intel | Electron 独立 App | x64 `.app` ZIP / DMG；与 arm64 分开，不混称通用包 |
| iPhone 17 | Capacitor 原生容器 + WKWebView | 完整 Xcode 工程；真机安装需自己的 Apple 签名，不把 unsigned ZIP 当安装包 |
| iOS Simulator | Xcode 编译 | `SIMULATOR-ONLY.zip` 只供开发，不可安装到 iPhone |
| iPhone / Mac 过渡 | 离线 PWA | HTTPS 首次加载和资源缓存后可离线；不是 IPA 或 macOS 原生安装包 |

原生容器复用 Web 界面，并非全部用 Swift 重写。Mac 包含完整运行时，不需要用户开终端或运行 Node 服务；iOS 将所有页面资源打入包内。项目最低版本以依赖与当前构建 SDK 为准；Capacitor 8 工程目标 iOS 15+，构建需兼容的现代 Xcode（官方要求 Xcode 26+）；真机 iPhone 17 请安装支持其系统版本的最新稳定 Xcode。Electron 45 支持的 macOS 最低版本应以其官方发行要求与发布构建为准，不承诺旧系统；本项目面向受支持的新版本 macOS。

## 开发与构建

Mac 新手可先双击项目根目录的 **构建Mac应用.command**；它自动定位目录并构建，失败就停止。终端操作务必先按中文安装说明进入项目文件夹，不能在用户主目录 `~` 直接运行 npm。

安装 Node.js 24（锁文件支持 `npm ci`）：

```sh
npm ci
npm test
npm run build
npm start
```

`npm start` 仅为静态网页预览，浏览器打开 `http://localhost:3000`。服务器只有静态文件路由，没有 `/api` 或用户数据访问。浏览器数据在本机 IndexedDB；关闭该预览服务后，已缓存 PWA 可离线打开，但新设备首次访问仍需有静态站点。

```sh
npm run desktop       # 在 Mac 开发运行独立 Electron 窗口
npm run dist:mac      # 在 Mac 构建 arm64 / x64 ZIP 与 DMG
npm run ios:sync      # 生成网页并同步到已提交的 iOS 工程
npm run ios:open      # 在 Mac 打开 Xcode
sh scripts/build-ios.sh # 在 Mac 编译模拟器和未签名设备工程，仅做构建验证
npm run package:source # 从当前 Git HEAD 导出已审查源码与 PWA 包（需 Git 工作副本）
```

`ios/App/App.xcodeproj` 已生成并提交，SPM 依赖版本锁定在工程与 npm 锁文件。`ios:sync` 会更新生成资源，不会读取或打包用户记录。`docs/ci/build.yml.example` 提供待手动启用的测试、网页打包、Mac 安装包、iOS 编译与 Release 工作流；发布任务仅在所有必需构建成功后执行。先将模板复制为 `.github/workflows/build.yml` 并提交后，推送 `v2.*` 标签可触发发布；本次按你的选择仅交付本地工程，未启用 CI。无签名证书也能编译验证，但不生成可安装的真机 IPA。

macOS 托管 CI 默认仅在**公开仓库**执行，防止私有仓库产生未确认的付费消耗；GitHub 标准托管 runner 对公开仓库通常免费，具体依平台政策。不启用大规格 runner、不购买资源。工作流使用短期 `github.token`，不需要上传个人访问令牌；仅 Release job 有 `contents: write`。如果连接集成没有 Actions/管理权限，须仓库所有者手动启用 Actions 或提交工作流，见安装说明。

## 本地数据与更新

- Mac：Electron 的 `app.getPath('userData')` 下 IndexedDB（默认 `~/Library/Application Support/PhyCalendar/`），与应用代码目录分离。单实例运行，替换 App 不删除此目录。
- iOS：Capacitor Preferences 写入当前 App 沙盒的 UserDefaults。单 WebView/单场景，写入串行；不依赖网页缓存保存原生记录。
- PWA：当前 HTTPS 源的 IndexedDB。网址/浏览器/PWA 数据空间不同；浏览器可拒绝永久存储或回收数据，不能把它当唯一备份。
- 数据版本为 2。版本 1 JSON 导入时完整校验后升级；未来版本/损坏数据拒绝载入，不自动覆盖为空。浏览器以 IndexedDB 事务检查 revision 防多窗口覆盖；写入失败提示未保存。
- 每次写入保留一个 previous 快照（IndexedDB 中 `previous`，原生 Preferences 的 `phycalendar-state-previous`），用于开发者故障恢复；它不代替异地 JSON 备份。
- 没有自动同步/合并。跨设备手动导出 JSON，再导入另一设备，导入完整替换该设备记录。恢复前强制先导出当前备份。
- 更新前务必导出；保持 App 标识与同一安装路径/数据目录，原位升级，不先卸载。卸载、浏览器清理、无痕模式、换域名均可能造成不可访问或数据丢失。
- 从 1.0 服务器版升级：先在旧程序“备份与使用”导出 JSON，再在 2.0 导入；不会自动读取旧 SQLite，也不删除原数据。

## 提醒与隐私

到期提醒在 App 中展示；**本版没有后台系统推送或本地通知调度**。关闭 App 后不会由程序自行弹提醒。可导出未来 12 个月的 `.ics`，导入 Apple 日历的专用 iCloud 日历；这是静态副本，更新时清理旧专用日历再导入，避免重复。通知权限和专注模式仍可能影响系统日历提醒，重要项目需实测。

无登录意味着同一设备使用者可查看记录，依靠系统锁屏保护。JSON 明文含账号备注，ICS 含服务与金额，请私密保存。程序不联网读取账单，不保存服务密码。源码/Release 只包含程序、构建脚本及空白初始状态。不要将 `data/`、导出 JSON、证书、Apple 密钥或用户数据目录提交 Git。安全处理见 [SECURITY.md](SECURITY.md)。

当前支持 CNY/USD、1900—2200 年、2000 个订阅、50000 笔付款、8 MB 以内 JSON 导入。没有银行连接、自动扣款、云数据库、汇率、分期付款或自动 iCloud 同步。
