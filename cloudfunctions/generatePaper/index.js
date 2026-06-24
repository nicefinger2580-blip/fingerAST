const cloud = require('wx-server-sdk')
const { COST } = require('./config')
const { callDeepSeek, parsePaper } = require('./ai')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const SYSTEM_PROMPT = `你是专业中文学术论文写作助手，负责根据用户的自由提示词生成完整论文正文。

【写作原则】
1. 以用户提示词为准，理解其主题、范围与隐含要求，灵活组织论文结构与内容
2. 若用户在提示词中明确了字数、章节、格式、引用规范等，必须严格遵循
3. 若用户仅给出主题或简短描述，则采用中文学术论文常规结构：摘要、关键词、引言、正文各章、结论、参考文献（可虚拟列出）

【写作要求】
1. 输出完整论文正文，每个章节必须有实质段落内容，禁止只输出标题
2. 语言学术、严谨，逻辑连贯，段落完整
3. sections 按阅读顺序排列；level=1 章，level=2 节，level=3 条
4. 每个 section 的 content 为完整正文（可多段落，段落间用 \\n 分隔）
5. 仅输出 JSON，不要 markdown 代码块，不要任何解释性文字

【JSON 格式】
{
  "title": "论文标题",
  "sections": [
    {"title": "摘要", "level": 1, "content": "摘要正文..."},
    {"title": "关键词", "level": 1, "content": "关键词1；关键词2；..."},
    {"title": "1 引言", "level": 1, "content": "引言正文..."},
    {"title": "1.1 研究背景", "level": 2, "content": "小节正文..."}
  ]
}`

async function getUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get()
  return res.data[0] || null
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const prompt = (event.prompt || '').trim()

  if (!openid) {
    return { success: false, message: '请先登录' }
  }
  if (!prompt || prompt.length > 1500) {
    return { success: false, message: '提示词无效（最多1500字）' }
  }

  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    return { success: false, message: '服务端未配置 DEEPSEEK_API_KEY' }
  }

  try {
    const user = await getUser(openid)
    if (!user) {
      return { success: false, message: '用户未注册，请先登录' }
    }
    if (user.points < COST.generate) {
      return { success: false, message: '积分不足', code: 'INSUFFICIENT_POINTS' }
    }

    const content = await callDeepSeek(apiKey, [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `请根据以下提示词撰写完整论文：\n\n${prompt}`,
      },
    ], { maxTokens: 12000, temperature: 0.4 })

    let paper
    try {
      paper = parsePaper(content)
    } catch (e) {
      console.error('parse paper failed', content?.slice?.(0, 500))
      return { success: false, message: e.message || 'AI 返回格式异常，请重试' }
    }

    const { title: paperTitle, sections } = paper
    const displayTitle = paperTitle.slice(0, 80)

    const newPoints = user.points - COST.generate
    await db.collection('users').doc(user._id).update({
      data: {
        points: newPoints,
        historyCount: (user.historyCount || 0) + 1,
        updatedAt: db.serverDate(),
      },
    })

    await db.collection('point_records').add({
      data: {
        openid,
        title: 'AI 生成论文全文',
        amount: COST.generate,
        type: 'spend',
        createdAt: db.serverDate(),
      },
    })

    const paperRes = await db.collection('papers').add({
      data: {
        openid,
        prompt,
        title: displayTitle,
        outline: sections,
        paperType: 'full',
        status: 'generated',
        createdAt: db.serverDate(),
      },
    })

    const userDoc = await db.collection('users').doc(user._id).get()

    return {
      success: true,
      data: {
        paperId: paperRes._id,
        prompt,
        title: displayTitle,
        outline: sections,
        user: {
          _id: userDoc.data._id,
          openid: userDoc.data.openid,
          nickName: userDoc.data.nickName,
          avatarUrl: userDoc.data.avatarUrl,
          points: userDoc.data.points,
          signedDays: userDoc.data.signedDays || 0,
          signedDates: userDoc.data.signedDates || [],
          historyCount: userDoc.data.historyCount || 0,
        },
      },
    }
  } catch (err) {
    console.error('generatePaper error', err)
    return { success: false, message: err.message || '生成失败' }
  }
}
