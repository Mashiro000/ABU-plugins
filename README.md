# ABU 官方插件库

这是 [ABU Launcher](https://github.com/Mashiro000/ABU-launcher) 的官方插件索引与构建配置。

当前提供：

- **MPV 播放器内核**：按设备架构下载的可选播放器插件；主程序默认继续使用 Android Media3/系统硬件解码。

应用会校验 HTTPS、SHA-256 与 Ed25519 签名后才允许安装。发布签名私钥不会存放在仓库中。

## 使用方式

ABU Launcher 0.03 及以上版本已默认配置本仓库。打开“设置 → 插件”即可查看并安装适用于当前设备的版本。

## 开发与投稿

- [从零开发 ABU 插件](https://github.com/Mashiro000/ABU-launcher/tree/main/plugin-sdk)
- [提交插件到官方库](CONTRIBUTING.md)
- [`plugins/`](plugins/) 中每个插件拥有独立文件夹；`plugin.json` 保存公共信息，`versions/` 保存全部历史版本。
- 每个插件目录的 `README.md` 和供应用读取的 `plugins.json` 都由脚本生成；版本按新到旧排列，应用索引只发布最新版。

提交前运行：

```bash
npm run build:index
npm run check:index
```

Pull Request 会自动检查插件目录、ID、全部版本、权限、HTTPS 下载地址、SHA-256、公钥、签名、排序和索引一致性。合并到 `main` 后，GitHub Actions 会把最新版索引同步到固定的 `catalog-v1` Release；ABU Launcher 0.03 的 `releases/latest/download/plugins.json` 地址因此始终能取得最新目录。

## 许可证

索引与仓库构建配置采用 MIT License。MPV 插件包内包含独立的第三方许可与对应源码说明。
