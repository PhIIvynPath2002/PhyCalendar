# 2.0.0 · 本地免登录版

删除登录、密码设置、服务器数据库与数据 API。保留月历、订阅、付款历史、独立币种费用统计、到期/试用提醒与 .ics 导出。数据仅保存到当前设备，离线可记录；版本化 JSON 支持从 1.0 手动迁移，无自动跨设备同步。

新增 Mac Electron 独立 App 构建、Capacitor iOS Xcode 工程、PWA 完整离线缓存、MIT 许可证、中文安装与签名说明。

下载请区分：
- `source.zip`：源码、锁文件、构建脚本、Xcode 工程，不能直接当 App。
- `PWA.zip`：HTTPS 静态站点资源，PWA 过渡方案。
- `macOS-arm64/x64-unsigned.zip` / `.dmg`：仅在 Mac CI 构建成功后发布，无 Developer ID/公证，系统可能要求单次允许。
- `iOS-SIMULATOR-ONLY.zip`：只供 Mac 模拟器。
- `iOS-UNSIGNED-NOT-INSTALLABLE.zip`：未签名真机编译产物，不能直接安装到 iPhone。请用自己的 Mac/Xcode/Apple 账号签名。

升级前导出 JSON。不要先卸载 App 或清理数据。旧版 version 1 备份可导入，现版 version 2；不自动读取旧 SQLite。未知格式不会被悄悄重置为空。

提醒仍是应用内与 Apple 日历静态导出，本版没有关闭后的 App 系统通知。没有银行连接、自动扣款、自动云同步或内置演示订阅。

自动 Release 仅在构建通过后上传产物；若本页只提供源码/PWA，说明 Apple 平台构建未确认，不表示已获得真机安装包。Apple 签名、公证、TestFlight 与实机验证需满足相应条件，见安装说明。
