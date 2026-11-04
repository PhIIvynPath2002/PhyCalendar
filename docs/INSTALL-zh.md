# 中文安装与使用

## Mac：安装独立 App

1. 在 GitHub Releases 找到目标版本，确认 Actions 构建成功，下载标有 **macOS** 的包。M1/M2/M3/M4/M5 等 Apple 芯片选 **arm64**；Intel 选 **x64**。没有成功构建的文件时，不能把源码 ZIP 当 App。
2. DMG 打开后把 PhyCalendar 拖进“应用程序”；ZIP 解压得到 `.app`，也移入“应用程序”。打开即可使用，不需要密码或终端。
3. `unsigned` 表示没有 Developer ID 签名/Apple 公证（构建仅作本地 ad-hoc 签名，满足 Apple Silicon 运行要求），Gatekeeper 可能拦截。仅在确认来源与 SHA256 后，通过系统设置“隐私与安全性”中针对该应用的“仍要打开”完成单次允许；不同 macOS 提示可能不同。不要关闭整个 Gatekeeper、不要全局禁用安全设置。若系统明确报损坏或恶意软件，请停止并提供错误，不强行绕过。
4. 如不愿允许未公证包，可自行在 Mac 构建运行。正式对外无警告分发通常需付费 Developer ID 证书和公证，未配置时本项目不声称已完成。
5. 更新前导出 JSON；用同一 App 替换旧 App，保留 `~/Library/Application Support/PhyCalendar`，不要卸载清理数据。不自动更新或同步。

如果没有现成原生包，在 Mac 安装 Node.js 24，解压 **source.zip**，在含 package.json 的文件夹打开终端：

```sh
npm ci
npm run desktop
```

构建可双击的程序：`npm run dist:mac`，输出在 `release`。程序安装后关闭终端不影响后续使用。直接双击 `public/index.html` 不属于支持的启动方式。

## iPhone 17：两种实际可行的方案

### 免费个人开发安装（需要自己的 Mac）

准备：Mac、支持你的 iPhone 系统的 Xcode（Capacitor 8 要求 Xcode 26+）、Node.js 24、USB 数据线、一个 Apple 账号。普通 Apple 账号通常可免费用于 Xcode 的 Personal Team，不必先购买会员。

1. 从 Mac App Store 安装/更新 Xcode，首次打开接受许可、安装 iOS 组件。Xcode → Settings → Accounts 加入你自己的 Apple 账号。不要把密码发给项目作者。
2. 解压源码，在项目文件夹终端执行：

   ```sh
   npm ci
   npm run ios:sync
   npm run ios:open
   ```

3. Xcode 选择 **App target → Signing & Capabilities**，开启 Automatically manage signing，Team 选自己的 Personal Team。把 Bundle Identifier 改成唯一值，例如 `com.你的英文别名.phycalendar`；设置一次后更新时保持相同，否则会视作新 App、不会继承数据。提交公共源码时不要把你的团队 ID、证书或个人配置推回去。
4. 数据线连接并解锁 iPhone，按提示“信任这台电脑”。在 iPhone“设置 → 隐私与安全性 → 开发者模式”按系统提示开启并重启；必要时在“设置 → 通用 → VPN 与设备管理”信任自己的开发者。
5. Xcode 顶部运行设备选你的 iPhone，点击 ▶ Run。签名及安装由 Xcode 完成，打开后无需登录。
6. **免费 Personal Team 的开发签名通常约 7 天到期**，还有设备/App ID/能力等限制。到期要用 Mac 重新 Run。不同系统/账号政策以 Xcode 当前提示和 Apple 条款为准，不承诺永久安装。更新前导出 JSON，尽量原位重装并保持相同标识，不删除旧 App。

### 付费 Apple Developer Program + TestFlight / 注册设备分发

通常为 **99 美元/年或当地货币价格**，可能有地区税费，需自行向 Apple 核对并购买；项目没有代购或自动付费。

- TestFlight：需要开发者会员、App Store Connect App 记录、合法签名和上传。内部测试需相应团队角色；外部测试通常需 Beta App Review。每个测试构建有效期最长 **90 天**，到期需上传新构建，不是一次发布永久可用。
- Ad Hoc：需要会员、注册自己的设备 UDID、对应 provisioning profile 及合法签名，再通过 Apple 支持的分发流程安装。证书/profile 到期需要更新，常见期限约一年，具体看签发信息；不能把任意 IPA 当作所有人通用安装包。
- App Store：需要会员、签名、隐私申报和审核，不保证容器 App 一定过审。本项目未完成商店审核。
- GitHub 的 `iOS-UNSIGNED-NOT-INSTALLABLE.zip` **只是编译产物，不能在 iPhone 点开安装**。`SIMULATOR-ONLY.zip` 只适用于 Mac 的 iOS Simulator，也不能安装到真机。不会以“未签名 IPA”冒充正式安装包。

证书、`.p12`、私钥、`.mobileprovision`、App Store Connect `.p8`、Apple 密码不得放进仓库/Release。将来若配置签名 CI，应通过 GitHub Environments/Secrets 和临时 keychain/provisioning 安装，限制发布权限、完成后清理。本版工作流没有配置签名、不会要求你上传这些秘密。

参考（请以 Apple 当前条款为准）：
- https://developer.apple.com/support/compare-memberships/
- https://developer.apple.com/programs/enroll/
- https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
- https://capacitorjs.com/docs/ios

### PWA 过渡：不需要 Apple 付费签名

PWA 不是原生 IPA。把 `npm run build` 生成的 dist 静态文件放到 HTTPS 静态站点；它不包含也不接收任何人的记录。可选择 GitHub Pages；需要仓库所有者在 Settings → Pages 选择 GitHub Actions 或发布目录，本项目没有自动开通付费站点。公开仓库的标准 GitHub Pages 通常免费，以 GitHub 条款为准。

iPhone Safari 打开该 HTTPS 地址，等待页面资源缓存后，分享 → 添加到主屏幕 → 有“作为 Web App 打开”时启用。从主屏幕重新打开一次，试着断网并新增临时记录，然后关闭再打开检查。Mac Safari 也可添加到程序坞。

PWA 数据与原生 App、其他浏览器独立，不能说安装后自动拥有旧数据。使用 JSON 手动迁移。首次没联网加载/缓存成功不能离线使用；浏览器可能回收网站数据，应定期导出。不要求购买域名，可先用提供的 HTTPS 子域名。

## JSON 与 1.0 升级

旧版服务器 App 先启动并导出 version 1 JSON，然后在新版“备份与使用 → 导入备份”。不要上传 SQLite 或导出的真实 JSON 到 GitHub。先查看记录数，再导出当前设备备份，最后确认替换。此操作仅影响当前设备，不合并、不自动同步。导入 version 2 同样支持，未知未来版本拒绝导入。

请每月、更新/换设备/卸载前备份。导出后确认文件在“文件”或 Finder 中实际存在；iOS 导出会显示系统分享面板，选择“存储到文件”。JSON 包含账号备注，不要公开。

## Apple 日历提醒

在“备份与使用”导出 .ics。在 Mac 日历新建一个 iCloud 专用“订阅提醒”日历，文件 → 导入，选该日历。Mac 与 iPhone 登录同一个 Apple 账号并开启 iCloud 日历后，系统日历才会同步这些静态事件。下次重新导入前，先核实并删除旧专用日历，再新建导入，避免重复；不要删除其他日历。重要事件请检查通知权限、专注模式并做测试。

## 自行运行 GitHub 构建

公开源码不等于工作流已成功运行。若 Actions 没运行：仓库 → Actions → 允许工作流（若提示），选择 Build and release → Run workflow。发布可通过推送 `v2.*` 标签触发。要给 workflow 的短期 GITHUB_TOKEN 允许本仓库内容写入供 Release 使用，workflow 已将权限限定在发布 job。

源码包含 `docs/ci/build.yml.example` 模板，本次未启用 Actions。启用前在公开仓库中创建 `.github/workflows`，将模板复制为 `.github/workflows/build.yml` 后提交；私有仓库默认跳过全部构建，避免未经确认的费用。如果集成账号没有创建工作流或读取 Actions 的权限，仓库所有者需要从源码包中取出 `docs/ci/build.yml.example`，改名为 `.github/workflows/build.yml` 自行提交，或授权该 GitHub App 所需权限，再重新运行。未通过构建的安装包不能发布为成功版本。签名条件不足时可以完成未签名编译，真机 Run 仍由你自己的 Mac 完成。
