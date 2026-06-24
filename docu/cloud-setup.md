# 云开发部署指南

环境 ID：`finger01-d5giuqcdn273e2cb8`

## 一、创建数据库集合

在云开发控制台 → 数据库，新建以下集合（权限见下）：

| 集合名 | 说明 |
|--------|------|
| `users` | 用户信息（openid、昵称、积分、签到等） |
| `papers` | 论文生成记录（提示词、大纲、状态；分享后 `status=shared`） |
| `point_records` | 积分变动记录 |
| `exhibit_comments` | 展览模板评论 |
| `exhibit_likes` | 展览模板点赞记录 |

### 推荐权限

- `users`：仅创建者可读写（或自定义：read/write doc._openid == auth.openid）
- `papers`：仅创建者可读写
- `exhibit_comments`：仅创建者可读写（通过云函数写入）
- `exhibit_likes`：仅创建者可读写（通过云函数写入）

## 二、配置云函数环境变量

在云开发控制台 → 云函数 → 每个函数 → 配置 → 环境变量，添加：

| 变量名 | 值 | 适用函数 |
|--------|-----|----------|
| `DEEPSEEK_API_KEY` | [DeepSeek 开放平台](https://platform.deepseek.com/) API Key | `generatePaper` |

> 也兼容旧变量名 `DASHSCOPE_API_KEY`（若已配置可暂不改名）。
>
> 获取步骤：DeepSeek 开放平台 → API Keys → 创建 Key。
>
> API Key **不要**提交到 Git 仓库。

本地 `.env` 文件仅供参考，云函数运行时请使用控制台环境变量。

## 三、部署云函数

在微信开发者工具中：

1. 右键 `cloudfunctions/login` → **上传并部署：云端安装依赖**
2. 右键 `cloudfunctions/generatePaper` → **上传并部署：云端安装依赖**
3. 右键 `cloudfunctions/exportDocx` → **上传并部署：云端安装依赖**
4. 右键 `cloudfunctions/exhibit` → **上传并部署：云端安装依赖**

> **重要**：`generatePaper` 和 `exportDocx` 目录下已有 `config.json`，超时设为 **60 秒**（默认仅 3 秒，AI 生成会超时）。部署后若仍报 `-504003`，请到云开发控制台 → 云函数 → 对应函数 → **配置** → 手动将超时改为 60 秒并保存。

或在项目根目录执行（需已安装 @cloudbase/cli）：

```bash
cd cloudfunctions/login && npm install
cd ../generatePaper && npm install
cd ../exportDocx && npm install
cd ../exhibit && npm install
```

## 四、云函数说明

### exhibit（展厅）

分享后的论文 `papers.status` 变为 `shared`，首页展厅通过本云函数读取。

| action | 说明 | 需登录 |
|--------|------|--------|
| `share` | 分享到展厅（需 `paperId`） | 是 |
| `list` | 展厅列表（`sort`: `latest` \| `hot` \| `mine`） | 否（`mine` 需登录） |
| `search` | 搜索展厅模板（需 `keyword`） | 否 |
| `getDetail` | 模板详情（评论、点赞状态） | 否 |
| `addComment` | 发表评论 | 是 |
| `toggleLike` | 点赞/取消 | 是 |

### login

- `action: 'login'` — 登录/注册（传入 nickName、avatarUrl）
- `action: 'getProfile'` — 获取最新用户信息
- `action: 'getPapers'` — 获取创作历史列表
- `action: 'getPaper'` — 获取单条创作详情（需 `paperId`）
- `action: 'deletePaper'` — 删除创作记录（需 `paperId`）
- `action: 'getPointRecords'` — 获取积分变动记录
- `action: 'signin'` — 每日签到

### generatePaper

- 入参：`prompt`（论文提示词，最多 1500 字，可含格式规范）
- 调用 `deepseek-v4-flash` 生成**完整论文全文**（非仅大纲），严格遵循提示词中的格式要求
- 扣除 5 积分，写入 `papers` 集合（`outline` 字段存各章节正文）
- **超时建议 120 秒**（`config.json` 已配置，部署后请在控制台确认）

### exportDocx

- 入参：`paperId`（推荐）或 `prompt` + `outline`
- 生成 docx 上传云存储，扣除 30 积分，返回 `fileID` 供小程序打开
- 支持导出自己创作的模板，以及他人已分享到展览的模板

## 五、云存储

`exportDocx` 会自动上传至路径 `exports/{openid}/{timestamp}.docx`，无需手动创建文件夹。

建议在云存储安全规则中限制：用户仅可读写自己的 export 目录。

## 六、模型配置

- 模型：`deepseek-v4-flash`
- 接口：DeepSeek 官方 OpenAI 兼容 API
- Base URL：`https://api.deepseek.com`
- 文档：https://api-docs.deepseek.com/
