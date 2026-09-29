# 向 ABU 官方插件库投稿

本仓库接受第三方 JavaScript 插件。开发 API、示例和本地安装方式请先阅读 [ABU Plugin SDK 开发指南](https://github.com/Mashiro000/ABU-launcher/tree/main/plugin-sdk)。

## 收录范围

可以提交 `ui`、`data_source`、`subtitle`、`system` 类型的沙箱插件。包含 APK、DEX、`.so` 或申请 `player` 类型的插件具有原生代码执行能力，目前只由 ABU 维护者发布。

插件必须：

- 源码公开，许可证清晰，发布包能对应到一个公开提交或标签。
- 不包含广告欺骗、恶意代码、静默遥测、凭据收集或规避宿主权限的逻辑。
- 只请求实际需要的权限，并在 README 中解释敏感权限用途。
- 使用 HTTPS；网络访问域名与 `manifest.json` 的 `networkDomains` 一致。
- 支持遥控器操作，并能正确处理拒绝权限、网络失败和空数据。
- 使用稳定且唯一的插件 ID。首次发布后不得换 ID 冒充升级。

官方库收录表示该版本经过基本审核，不代表 ABU 团队接管插件的维护或为插件内容背书。

## 第一次投稿

### 1. 开发并本地测试

使用 SDK 构建 `.abu-plugin`，通过 ABU Launcher 的“设置 → 插件 → 从本地导入插件”测试安装、启停、页面、返回键和权限拒绝流程。

### 2. 创建并保管签名密钥

在 `ABU-launcher` 仓库根目录运行：

```bash
node tools/sign-plugin.mjs path/to/plugin.abu-plugin path/to/private-key.pem
```

首次运行会生成 Ed25519 私钥，并输出：

```json
{
  "publicKey": "Base64 公钥",
  "signature": "Base64 签名"
}
```

私钥代表你的发布身份：

- 不要提交到 Git、网盘公开目录或插件包。
- 做至少一个离线备份。
- 每次更新必须继续使用同一把密钥。
- 私钥遗失后无法证明新版本来自同一发布者；换钥必须人工审核并向用户提示。

### 3. 发布插件文件

在你自己的公开 GitHub 仓库创建 Release，上传 `.abu-plugin`。记录文件 URL、字节数与 SHA-256：

```powershell
Get-Item plugin.abu-plugin | Select-Object Length
Get-FileHash plugin.abu-plugin -Algorithm SHA256
```

Release 同时应链接对应源码、许可证和用户说明。不要使用会变化的 `latest/download` 作为插件资产地址；使用包含固定标签的永久 URL。

### 4. 创建插件目录

Fork 本仓库，为每个插件创建独立目录：

```text
plugins/<插件ID>/
├── plugin.json
├── README.md                 # 由构建脚本生成
└── versions/
    ├── 1.1.0.json
    └── 1.0.0.json
```

可以复制 [`plugins/plugin-template/`](plugins/plugin-template/) 中的两个模板。`plugin.json` 保存所有版本共享的身份、作者、公钥和权限；`versions/<版本号>.json` 保存这个版本的发布日期、源码和下载资产。

`plugin.json`：

```json
{
  "id": "com.example.hello",
  "name": "Hello ABU",
  "description": "插件功能说明",
  "kind": "ui",
  "author": "作者名称",
  "homepage": "https://github.com/example/hello-abu",
  "source": "https://github.com/example/hello-abu",
  "publicKey": "Base64 Ed25519 公钥",
  "permissions": []
}
```

`versions/1.0.0.json`：

```json
{
  "version": "1.0.0",
  "releasedAt": "2026-09-29",
  "source": "https://github.com/example/hello-abu/tree/v1.0.0",
  "assets": [
    {
      "abi": "universal",
      "url": "https://github.com/example/hello-abu/releases/download/v1.0.0/hello-1.0.0.abu-plugin",
      "size": 12345,
      "sha256": "64位十六进制 SHA-256",
      "signature": "Base64 Ed25519 签名"
    }
  ]
}
```

普通 JavaScript 插件使用 `universal`。只有官方 native 插件才按 `arm64-v8a`、`armeabi-v7a`、`x86_64` 分包。构建脚本根据版本号自动从新到旧排序，因此不用手工维护顺序。

### 5. 生成并检查索引

```bash
npm run build:index
npm run check:index
```

生成后的插件 `README.md` 和根目录 `plugins.json` 必须一同提交。CI 会再次执行相同检查。

### 6. 提交 Pull Request

填写 PR 模板中的源码、Release、测试设备、权限用途、网络域名和数据处理说明。维护者可能要求修改或补充测试。合并后自动化会更新固定的 `catalog-v1` 索引 Release，应用会在下一次刷新插件仓库时显示该插件。

## 更新已有插件

1. 保持插件 `id` 和 `publicKey` 不变。
2. 提升 `version`，使用同一私钥签署新的包。
3. 创建新的固定标签 Release，不覆盖旧资产。
4. 在原插件目录的 `versions/` 中新增 `<新版本>.json`，不要覆盖或删除旧版本。
5. 运行生成与检查命令，提交 PR。

旧 Release 应保留，以便已安装用户回滚和复核历史版本。

## 安全问题与撤回

发现恶意行为、密钥泄露或严重漏洞时，请不要只提交普通 Issue 公开利用细节；先通过 ABU Launcher 主仓库维护者公开资料联系项目负责人。官方库可以紧急移除索引项，但不会自动删除用户设备上已安装的插件。
