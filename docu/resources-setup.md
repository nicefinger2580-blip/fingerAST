# 资源页配置指南

资源 Tab 数据由云函数 `resources` 管理，存储在云数据库集合 **`resources`** 中。

## 一、首次部署

1. 云开发控制台 → 数据库 → 新建集合 **`resources`**
2. 权限建议：**所有用户可读，仅管理端可写**（或「仅创建者可读写」，内容通过控制台手动添加）
3. 微信开发者工具 → 右键 `cloudfunctions/resources` → **上传并部署：云端安装依赖**
4. 首次打开资源页时会**自动写入示例数据**；也可在云函数测试中手动触发：

```json
{ "action": "seed" }
```

如需追加示例（不重复写入相同标题）：

```json
{ "action": "seed", "force": false }
```

## 二、Tab 与分类

| category | Tab 名称 | 说明 |
|----------|----------|------|
| `0` | 开源素材 | 按 subType 分组展示 |
| `1` | 实用工具 | 软件/网站下载链接 |
| `2` | 编写教程 | Markdown 正文，点击进入详情阅读 |

### 开源素材 subType

| subType | 分组标题 | 用途 |
|---------|----------|------|
| `prompt` | 提示词素材 | `content` 存提示词全文 |
| `image_site` | 图片素材网站 | `url` 存网站链接 |
| `icon_site` | 图标素材网站 | `url` 存网站链接 |
| `opensource` | 开源项目 | `url` 存项目主页 |

## 三、手动添加一条资源

云开发控制台 → 数据库 → `resources` → **添加记录**，示例：

### 提示词素材

```json
{
  "category": 0,
  "subType": "prompt",
  "title": "我的自定义提示词",
  "desc": "简短描述，显示在列表卡片上",
  "tag": "提示词",
  "tagColor": "blue",
  "count": "常用",
  "icon": "✨",
  "sort": 50,
  "url": "",
  "content": "这里写完整提示词文本……",
  "enabled": true
}
```

### 图片/图标/开源网站

```json
{
  "category": 0,
  "subType": "image_site",
  "title": "站点名称",
  "desc": "站点简介",
  "tag": "图片",
  "tagColor": "purple",
  "count": "免费",
  "icon": "🖼️",
  "sort": 50,
  "url": "https://example.com",
  "content": "",
  "enabled": true
}
```

`subType` 可选：`image_site` / `icon_site` / `opensource`

### 实用工具

```json
{
  "category": 1,
  "subType": "tool",
  "title": "软件名称",
  "desc": "用途说明",
  "tag": "工具",
  "tagColor": "teal",
  "count": "免费",
  "icon": "🛠️",
  "sort": 50,
  "url": "https://example.com/download",
  "content": "",
  "enabled": true
}
```

### 编写教程（Markdown）

```json
{
  "category": 2,
  "subType": "tutorial",
  "title": "教程标题",
  "desc": "列表摘要",
  "tag": "教程",
  "tagColor": "blue",
  "count": "推荐阅读",
  "icon": "📖",
  "sort": 50,
  "url": "",
  "content": "# 一级标题\n\n正文支持 **加粗**、列表、代码块等 Markdown 语法。",
  "enabled": true
}
```

## 四、字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `category` | 是 | 0/1/2 |
| `subType` | 是 | 见上表 |
| `title` | 是 | 标题 |
| `desc` | 是 | 卡片描述 |
| `tag` | 否 | 角标文字，如「免费」「教程」 |
| `tagColor` | 否 | `blue` / `teal` / `purple` / `amber` |
| `count` | 否 | 右下角辅助信息 |
| `icon` | 否 | Emoji 图标，默认 📁 |
| `sort` | 否 | 排序，数字越小越靠前 |
| `url` | 外链必填 | 网站地址，详情页可复制 |
| `content` | 提示词/教程必填 | 提示词全文或 Markdown |
| `enabled` | 是 | `true` 才显示，`false` 隐藏 |

## 五、云函数 API

| action | 参数 | 说明 |
|--------|------|------|
| `list` | `category`: 0/1/2 | 获取列表（category=0 时额外返回 groups 分组） |
| `getDetail` | `id` | 获取详情（含完整 content） |
| `seed` | `force`: 可选 | 写入/追加示例数据 |

## 六、已内置示例

- **开源素材**：2 条提示词、3 个图片站、3 个图标站、3 个开源项目
- **实用工具**：VS Code、Obsidian、draw.io、Grammarly、DeepL
- **编写教程**：《本科毕业论文撰写指南》完整 Markdown + SCI 投稿提纲

修改示例内容：在控制台找到对应记录直接编辑 `content` / `url` / `title` 等字段即可。
