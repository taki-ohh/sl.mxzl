# hi_motif 联网更新服务端：GitHub Pages 部署说明

本文说明如何把 hi_motif 的**联网更新配置组**发布到 GitHub Pages，让玩家客户端在启动时自动拉取最新规则。

- 服务端 JSON：`hi_motif/update_server/sl、ks、摸鱼兼容规则.json`（文件名是 URL 编码后的形式，直接用即可）
- 原理：插件启动时向配置里 `updateUrls` 列出的地址发 GET 请求，校验通过且与本地有差异时自动写回 `hi_motif.json`

## 1. 服务端 JSON 的字段说明

| 字段 | 必需 | 说明 |
|---|---|---|
| `groupName` | 是（或省略） | 目标本地组名。省略时默认为请求组自己的名字（推荐省略不写） |
| `minClientVersion` | 否 | 最低客户端版本，如 `"1.1"`。**客户端插件版本低于它时整组不应用**（用于强制玩家升级插件） |
| `generatedAt` | 否 | 服务端配置产生时间（Unix 秒），仅记录日志，无逻辑作用。每次更新配置建议改一下（方便看日志确认更新发生） |
| `updateUrls` | 否 | 更新地址迁移用：响应带它时客户端会把本地 `updateUrls` 替换为该列表（换源/迁移服务器用）。平时不写 |
| `rules` | **是** | 规则数组，每条 `{name, match, enableMods, disableMods}`。**不能为空** |

校验失败（JSON 非法、rules 空、mod 名非字符串等）客户端会拒绝整组并记日志，本地规则不受影响——所以改坏了也不会弄坏玩家环境，放心改。

## 2. 部署到 GitHub Pages（推荐：专用仓库）

### 步骤

1. 在 GitHub 新建仓库，例如 `yourname/himotif-rules`（public）
2. 把服务端 JSON 上传到仓库根目录：
   - 文件名保持 `sl%E3%80%81ks%E3%80%81%E6%91%B8%E9%B1%BC%E5%85%BC%E5%AE%B9%E8%A7%84%E5%88%99.json`（这是 `sl、ks、摸鱼兼容规则` 的 URL 编码，客户端按编码后的文件名请求）
   - 也可以改用**纯英文名**（如 `rules.json`）——此时 URL 由你决定，客户端只按 `updateUrls` 里写的地址请求
3. 仓库 → **Settings → Pages → Build and deployment → Source 选 `Deploy from a branch` → Branch 选 `main` / `/(root)` → Save**
4. 等约 1 分钟生效，验证：浏览器打开
   `https://yourname.github.io/himotif-rules/sl%E3%80%81ks%E3%80%81%E6%91%B8%E9%B1%BC%E5%85%BC%E5%AE%B9%E8%A7%84%E5%88%99.json`
   能看到 JSON 内容即成功

### 玩家端怎么指向它

把 `hi_motif.json` 里组的 `updateUrls` 改成：

```json
"updateUrls": ["https://yourname.github.io/himotif-rules/sl%E3%80%81ks%E3%80%81%E6%91%B8%E9%B1%BC%E5%85%BC%E5%AE%B9%E8%A7%84%E5%88%99.json"]
```

**必须用 https**（GitHub Pages 不支持 http）。

## 3. 以后怎么更新规则

改仓库里的 JSON → commit → push。GitHub Pages 自动重新发布（约 1 分钟）。玩家**下次启动游戏**时自动拉取：

- 内容没变 → 日志无输出（no changes 静默）
- 有变化 → 自动写回玩家本地 `hi_motif.json` 对应组，其余组与字段顺序原样保留

不需要玩家做任何操作。

## 4. 换源（更换更新地址）

在新地址的 JSON 响应里带上 `updateUrls` 字段：

```json
{
    "groupName": "sl、ks、摸鱼兼容规则",
    "updateUrls": ["https://新地址/rules.json"],
    "rules": [ ... ]
}
```

客户端更新规则的同时会把本地 `updateUrls` 也替换成新地址——下次启动就走新源。适用于 GitHub Pages 换仓库名、迁到自有域名等场景。

## 5. 注意事项

- **mod 名必须与玩家本地 mod.json 的 `Name` 字段完全一致**（含大小写、标点、空格）。当前规则里引用的名字：
  - `Elite Titans Fix`（ks 通用精英泰坦）
  - `Kzhui HUD helper`（ks HUD 助手）
  - `HUD Revamp Gt ver For KS SERVER.`（ks 专属 HUD）
  - `HUD Revamp Gt ver.`（通用 HUD，摸鱼/sl 玩家可能装的版本）
  - `EliteTitansFix.SL`、`Northstar.FD.SL`（sl 专属）
  - `Northstar.FD`（摸鱼）
- 玩家没有某 mod 时启停操作对它无效果，不报错；所以 disableMods 多列几个相关名是安全的
- 客户端拉取超时 5 秒 × 3 轮，全部失败就用本地规则（玩家照常游戏）。GitHub Pages 偶尔抽风不影响玩家
- 客户端拉取的请求路径**区分大小写**（GitHub Pages 按 URL 精确匹配文件名）
- 拉取只在**启动时**发生一次；游戏过程中改服务端配置，玩家重启游戏后生效

## 6. 替代方案：不用 GitHub Pages

任何静态托管都可以，客户端只发普通 GET：

- 自有服务器/NAS：把 JSON 放到任意 http 服务目录（如 nginx）
- 裸 `ip:端口` 写法：客户端自动请求 `http://ip:端口/hi_motif/<编码后的组名>.json`（如 `111.228.12.149:8901`）
- 想用简短文件名：`updateUrls` 直接写完整地址即可，文件名随意（如 `https://xxx/rules.json`）