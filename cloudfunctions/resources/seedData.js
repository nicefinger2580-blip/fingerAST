/** 资源页初始数据，部署后可通过 action:seed 写入数据库，也可在云控制台手动添加 */

const TUTORIAL_THESIS_GUIDE = `# 本科毕业论文撰写指南

> 适用于人文社科、理工类本科生的论文写作入门，可按学校要求微调。

## 一、选题与开题

### 1.1 选题原则

- **可行**：资料可获取、方法可实施、时间可控
- **有价值**：填补空白、改进方法或解决实际问题
- **有兴趣**：便于长期坚持写作

### 1.2 开题报告结构

1. 研究背景与意义
2. 国内外研究现状（文献综述）
3. 研究内容与目标
4. 研究方法与技术路线
5. 进度安排与预期成果

---

## 二、论文标准结构

| 部分 | 说明 |
|------|------|
| 封面 / 扉页 | 按学校模板填写 |
| 摘要 + 关键词 | 中文 300 字左右，概括目的、方法、结果、结论 |
| Abstract | 英文摘要，与中文对应 |
| 目录 | 自动生成，检查页码 |
| 正文 | 引言 → 理论/现状 → 方法/设计 → 分析/实验 → 结论 |
| 参考文献 | 建议 GB/T 7714 格式 |
| 致谢 | 简洁真诚 |

---

## 三、各章节写作要点

### 3.1 摘要

- 不出现「本文」「笔者」以外的第一人称过多
- 不写公式细节、不写引用编号
- 关键词 3～5 个，分隔号用分号

### 3.2 引言

1. 宏观背景（政策、行业、技术趋势）
2. 问题提出（现有不足或研究空白）
3. 研究目的与意义
4. 论文结构安排（可选）

### 3.3 文献综述

- 按**主题**或**时间**分类梳理，避免流水账
- 指出现有研究的贡献与局限
- 自然引出你的研究切入点

### 3.4 研究方法

- 定量：说明数据来源、样本、变量、模型
- 定性：说明访谈对象、编码方式、分析框架
- 实验类：说明环境、对比方案、评价指标

### 3.5 结论

- 归纳主要发现，不引入正文未讨论的新内容
- 说明局限性与未来研究方向

---

## 四、格式与规范

### 4.1 文字格式

- 正文：小四宋体，1.5 倍行距（以学校要求为准）
- 一级标题：黑体三号；二级：黑体四号
- 图、表必须有**编号**和**题注**（如：图 3-1、表 2-1）

### 4.2 参考文献（GB/T 7714 示例）

期刊：

\`\`\`
[1] 张三, 李四. 人工智能在医疗影像中的应用[J]. 计算机学报, 2024, 47(3): 512-520.
\`\`\`

专著：

\`\`\`
[2] WANG L. Deep Learning[M]. Cambridge: MIT Press, 2023.
\`\`\`

### 4.3 查重与引用

- 直接引用需加引号并标注出处
- 间接转述也需标注参考文献
- 定稿前使用学校指定查重系统预检

---

## 五、写作流程建议

1. **先列大纲** → 与导师确认结构
2. **分章撰写** → 不要等全部资料齐全再动笔
3. **每日固定写作时间** → 哪怕 500 字也保持节奏
4. **完稿后冷处理** → 隔 2～3 天再通读修改
5. **格式统一检查** → 图表、参考文献、页眉页脚

---

## 六、常见问题

**Q：写不够字数怎么办？**  
A：补充文献综述深度、增加案例分析、完善讨论与局限，而非重复堆砌形容词。

**Q：导师反馈「逻辑不清」？**  
A：检查每段首句是否为主题句，段与段之间是否有过渡句。

**Q：实验/调研数据不足？**  
A：尽早调整方案，必要时缩小研究范围，保证结论与数据匹配。

---

*祝写作顺利。可在「创作」页使用 AI 生成初稿，再人工修改润色。*
`

const SEED_ITEMS = [
  // ===== 开源素材 category: 0 =====
  {
    category: 0,
    subType: 'prompt',
    title: '计算机类论文提示词模板',
    desc: '含题目、章节结构、字数与 GB/T 7714 引用要求，可直接用于 AI 生成',
    tag: '提示词',
    tagColor: 'blue',
    count: '常用',
    icon: '✨',
    sort: 10,
    content: '【题目】基于机器学习的智慧城市建设中交通流量预测模型研究\n【格式】硕士学位论文；含中英文摘要；正文约8000字；章节：绪论/相关理论与技术/模型设计/实验与分析/总结与展望/参考文献；图表需编号；引用 GB/T 7714',
    url: '',
  },
  {
    category: 0,
    subType: 'prompt',
    title: '社会科学类综述提示词',
    desc: '适用于人文社科本科/硕士综述型论文结构生成',
    tag: '提示词',
    tagColor: 'teal',
    count: '常用',
    icon: '✨',
    sort: 11,
    content: '【题目】新媒体时代大学生社交焦虑的成因分析与干预策略研究\n【格式】本科毕业论文；摘要300字+关键词3-5个；正文约6000字；参考文献15篇；章节：摘要/引言/文献综述/研究方法/分析与讨论/结论/参考文献；引用格式 GB/T 7714',
    url: '',
  },
  {
    category: 0,
    subType: 'image_site',
    title: 'Unsplash',
    desc: '高质量免费摄影图库，可商用，适合论文配图与封面素材',
    tag: '图片',
    tagColor: 'purple',
    count: '免费',
    icon: '🖼️',
    sort: 20,
    url: 'https://unsplash.com',
    content: '',
  },
  {
    category: 0,
    subType: 'image_site',
    title: 'Pexels',
    desc: '免费图片与视频素材，分类清晰，下载方便',
    tag: '图片',
    tagColor: 'purple',
    count: '免费',
    icon: '🖼️',
    sort: 21,
    url: 'https://www.pexels.com',
    content: '',
  },
  {
    category: 0,
    subType: 'image_site',
    title: 'Pixabay',
    desc: '海量免版权图片、插画与矢量图',
    tag: '图片',
    tagColor: 'purple',
    count: '免费',
    icon: '🖼️',
    sort: 22,
    url: 'https://pixabay.com',
    content: '',
  },
  {
    category: 0,
    subType: 'icon_site',
    title: 'Iconfont 阿里巴巴矢量图标库',
    desc: '国内最常用的图标库，支持 SVG/PNG，论文图表图标首选',
    tag: '图标',
    tagColor: 'amber',
    count: '免费',
    icon: '🎨',
    sort: 30,
    url: 'https://www.iconfont.cn',
    content: '',
  },
  {
    category: 0,
    subType: 'icon_site',
    title: 'Iconify',
    desc: '聚合多个开源图标集，统一搜索与下载',
    tag: '图标',
    tagColor: 'amber',
    count: '开源',
    icon: '🎨',
    sort: 31,
    url: 'https://iconify.design',
    content: '',
  },
  {
    category: 0,
    subType: 'icon_site',
    title: 'Flaticon',
    desc: '扁平风格图标丰富，需注意部分需署名',
    tag: '图标',
    tagColor: 'amber',
    count: '部分免费',
    icon: '🎨',
    sort: 32,
    url: 'https://www.flaticon.com',
    content: '',
  },
  {
    category: 0,
    subType: 'opensource',
    title: 'Overleaf',
    desc: '在线 LaTeX 协作写作，海量论文模板',
    tag: '开源',
    tagColor: 'teal',
    count: '推荐',
    icon: '📦',
    sort: 40,
    url: 'https://www.overleaf.com',
    content: '',
  },
  {
    category: 0,
    subType: 'opensource',
    title: 'Zotero',
    desc: '开源文献管理工具，支持 GB/T 7714 等引用格式',
    tag: '开源',
    tagColor: 'teal',
    count: '推荐',
    icon: '📦',
    sort: 41,
    url: 'https://www.zotero.org',
    content: '',
  },
  {
    category: 0,
    subType: 'opensource',
    title: 'Pandoc',
    desc: '通用文档格式转换，Markdown/Word/LaTeX 互转',
    tag: '开源',
    tagColor: 'teal',
    count: '工具',
    icon: '📦',
    sort: 42,
    url: 'https://pandoc.org',
    content: '',
  },
  // ===== 实用工具 category: 1 =====
  {
    category: 1,
    subType: 'tool',
    title: 'Visual Studio Code',
    desc: '轻量代码编辑器，Markdown/LaTeX 插件丰富',
    tag: '编辑器',
    tagColor: 'blue',
    count: '免费',
    icon: '🛠️',
    sort: 10,
    url: 'https://code.visualstudio.com',
    content: '',
  },
  {
    category: 1,
    subType: 'tool',
    title: 'Obsidian',
    desc: '本地 Markdown 知识库，适合整理文献笔记与写作大纲',
    tag: '笔记',
    tagColor: 'purple',
    count: '免费',
    icon: '🛠️',
    sort: 11,
    url: 'https://obsidian.md',
    content: '',
  },
  {
    category: 1,
    subType: 'tool',
    title: 'draw.io (diagrams.net)',
    desc: '免费流程图、架构图、ER 图绘制，可导出 SVG/PDF',
    tag: '作图',
    tagColor: 'teal',
    count: '免费',
    icon: '🛠️',
    sort: 12,
    url: 'https://www.diagrams.net',
    content: '',
  },
  {
    category: 1,
    subType: 'tool',
    title: 'Grammarly',
    desc: '英文论文语法检查与润色（浏览器插件 + 桌面版）',
    tag: '英文',
    tagColor: 'amber',
    count: 'Freemium',
    icon: '🛠️',
    sort: 13,
    url: 'https://www.grammarly.com',
    content: '',
  },
  {
    category: 1,
    subType: 'tool',
    title: 'DeepL 翻译',
    desc: '高质量机器翻译，适合学术文献初译与润色参考',
    tag: '翻译',
    tagColor: 'blue',
    count: '免费/付费',
    icon: '🛠️',
    sort: 14,
    url: 'https://www.deepl.com',
    content: '',
  },
  // ===== 编写教程 category: 2 =====
  {
    category: 2,
    subType: 'tutorial',
    title: '本科毕业论文撰写指南',
    desc: '从选题、结构、格式到查重的完整写作流程',
    tag: '教程',
    tagColor: 'blue',
    count: '推荐阅读',
    icon: '📖',
    sort: 10,
    url: '',
    content: TUTORIAL_THESIS_GUIDE,
  },
  {
    category: 2,
    subType: 'tutorial',
    title: 'SCI 论文投稿流程概览',
    desc: '期刊选择、投稿系统使用与修回应对要点（提纲）',
    tag: '教程',
    tagColor: 'purple',
    count: '提纲',
    icon: '📖',
    sort: 11,
    url: '',
    content: `# SCI 论文投稿流程概览

## 1. 选刊

- 根据研究方向、影响因子、审稿周期筛选
- 阅读 Aim & Scope，确认与论文匹配
- 参考已发表相似论文的期刊

## 2. 准备稿件

- 按期刊 Template 排版（Word 或 LaTeX）
- 检查图表分辨率与引用格式
- 撰写 Cover Letter

## 3. 投稿与修回

- 注册投稿系统，按步骤上传主文、图表、补充材料
- 收到审稿意见后逐条 Response，态度专业
- 重大修改需在规定时间内提交修订稿

---

*完整教程内容可自行在数据库中补充。*`,
  },
]

module.exports = {
  SEED_ITEMS,
  TUTORIAL_THESIS_GUIDE,
}
