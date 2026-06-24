const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const THEMES = ['blue', 'teal', 'indigo', 'amber']
const AUTH_ACTIONS = new Set(['share', 'addComment', 'toggleLike'])

function pickTheme(id) {
  let sum = 0
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i)
  return THEMES[sum % THEMES.length]
}

function formatDateTime(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatShortDate(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function getUsersByOpenids(openids) {
  const map = new Map()
  const list = [...new Set((openids || []).filter(Boolean))]
  if (list.length === 0) return map
  const res = await db.collection('users').where({
    openid: db.command.in(list.slice(0, 100)),
  }).get()
  res.data.forEach((user) => map.set(user.openid, user))
  return map
}

async function batchResolveAvatarUrls(urls) {
  const result = new Map()
  const unique = [...new Set((urls || []).filter(Boolean))]
  unique.forEach((url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      result.set(url, url)
    }
  })
  const cloudFiles = unique.filter((url) => url.startsWith('cloud://'))
  for (let i = 0; i < cloudFiles.length; i += 50) {
    const batch = cloudFiles.slice(i, i + 50)
    try {
      const res = await cloud.getTempFileURL({ fileList: batch })
      ;(res.fileList || []).forEach((item) => {
        if (item.status === 0 && item.tempFileURL) {
          result.set(item.fileID, item.tempFileURL)
        }
      })
    } catch (err) {
      console.error('getTempFileURL failed', err)
    }
  }
  return result
}

function pickResolvedAvatar(raw, map) {
  if (!raw) return ''
  if (map.has(raw)) return map.get(raw)
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  return ''
}

async function resolveAuthorInfo(paper) {
  let author = paper.authorNickName || '匿名用户'
  let authorAvatarUrl = paper.authorAvatarUrl || ''
  if (paper.openid) {
    const user = await getUserByOpenid(paper.openid)
    if (user) {
      if (user.nickName) author = user.nickName
      if (user.avatarUrl) authorAvatarUrl = user.avatarUrl
    }
  }
  const urlMap = await batchResolveAvatarUrls([authorAvatarUrl])
  return {
    author,
    authorAvatarUrl: pickResolvedAvatar(authorAvatarUrl, urlMap),
  }
}

async function buildCommentList(docs) {
  const openids = docs.map((doc) => doc.openid).filter(Boolean)
  const userMap = await getUsersByOpenids(openids)
  const items = docs.map((doc) => {
    const user = userMap.get(doc.openid)
    const rawAvatar = doc.authorAvatarUrl || user?.avatarUrl || ''
    return {
      id: doc._id,
      author: doc.authorNickName || user?.nickName || '匿名用户',
      rawAvatar,
      content: doc.content,
      date: formatShortDate(doc.createdAt),
    }
  })
  const urlMap = await batchResolveAvatarUrls(items.map((item) => item.rawAvatar))
  return items.map((item) => ({
    id: item.id,
    author: item.author,
    authorAvatarUrl: pickResolvedAvatar(item.rawAvatar, urlMap),
    content: item.content,
    date: item.date,
  }))
}

function formatExhibitCard(doc) {
  const outline = doc.outline || []
  return {
    id: doc._id,
    title: doc.title || (doc.prompt || '').slice(0, 80),
    author: doc.authorNickName || '匿名用户',
    authorAvatarUrl: doc.authorAvatarUrl || '',
    likes: doc.likes || 0,
    createdAt: formatDateTime(doc.sharedAt || doc.createdAt),
    theme: pickTheme(doc._id),
    description: doc.prompt || '',
    sectionCount: outline.length,
  }
}

function formatComment(doc) {
  return {
    id: doc._id,
    author: doc.authorNickName || '匿名用户',
    authorAvatarUrl: doc.authorAvatarUrl || '',
    content: doc.content,
    date: formatShortDate(doc.createdAt),
  }
}

function sortDocsByTimeDesc(list, field) {
  return list.sort((a, b) => {
    const ta = new Date(a[field]).getTime() || 0
    const tb = new Date(b[field]).getTime() || 0
    return tb - ta
  })
}

async function getUserByOpenid(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get()
  return res.data[0] || null
}

async function getSharedPaper(paperId) {
  const doc = await db.collection('papers').doc(paperId).get()
  const paper = doc.data
  if (!paper || paper.status !== 'shared') return null
  return paper
}

async function isLiked(paperId, openid) {
  if (!openid) return false
  const res = await db.collection('exhibit_likes')
    .where({ paperId, openid })
    .limit(1)
    .get()
  return res.data.length > 0
}

function validatePaperForShare(paper) {
  const outline = paper.outline || []
  if (outline.length === 0) {
    return '论文内容为空，无法分享'
  }
  const hasContent = outline.some((item) => item.content && String(item.content).trim())
  if (!hasContent && paper.paperType === 'full') {
    return '论文正文不完整，无法分享'
  }
  return null
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const action = event.action

  if (!action) {
    return { success: false, message: '缺少 action 参数' }
  }

  if (AUTH_ACTIONS.has(action) && !openid) {
    return { success: false, message: '请先登录' }
  }

  try {
    if (action === 'share') {
      const paperId = event.paperId
      if (!paperId) {
        return { success: false, message: '缺少 paperId' }
      }
      const doc = await db.collection('papers').doc(paperId).get()
      const paper = doc.data
      if (!paper || paper.openid !== openid) {
        return { success: false, message: '创作记录不存在' }
      }

      const invalidReason = validatePaperForShare(paper)
      if (invalidReason) {
        return { success: false, message: invalidReason }
      }

      if (paper.status === 'shared') {
        const user = await getUserByOpenid(openid)
        await db.collection('papers').doc(paperId).update({
          data: {
            authorNickName: user?.nickName || paper.authorNickName || '微信用户',
            authorAvatarUrl: user?.avatarUrl || paper.authorAvatarUrl || '',
            updatedAt: db.serverDate(),
          },
        })
        const refreshed = await db.collection('papers').doc(paperId).get()
        return {
          success: true,
          data: {
            paperId,
            alreadyShared: true,
            template: formatExhibitCard(refreshed.data),
          },
        }
      }

      const user = await getUserByOpenid(openid)
      const now = db.serverDate()
      await db.collection('papers').doc(paperId).update({
        data: {
          status: 'shared',
          sharedAt: now,
          authorNickName: user?.nickName || '微信用户',
          authorAvatarUrl: user?.avatarUrl || '',
          likes: paper.likes || 0,
          updatedAt: now,
        },
      })

      const updated = await db.collection('papers').doc(paperId).get()
      return {
        success: true,
        data: {
          paperId,
          alreadyShared: false,
          template: formatExhibitCard(updated.data),
        },
      }
    }

    if (action === 'list') {
      const sort = event.sort || 'latest'
      let query = db.collection('papers').where({ status: 'shared' })
      if (sort === 'mine') {
        if (!openid) {
          return { success: true, data: { list: [] } }
        }
        query = db.collection('papers').where({ status: 'shared', openid })
      }
      const res = await query.limit(100).get()
      let docs = res.data
      if (sort === 'hot') {
        docs.sort((a, b) => (b.likes || 0) - (a.likes || 0))
      } else {
        docs = sortDocsByTimeDesc(docs, 'sharedAt')
      }
      const list = docs.map(formatExhibitCard)
      return { success: true, data: { list } }
    }

    if (action === 'search') {
      const keyword = (event.keyword || '').trim()
      if (!keyword) {
        return { success: true, data: { list: [] } }
      }
      const res = await db.collection('papers').where({ status: 'shared' }).limit(100).get()
      const k = keyword.toLowerCase()
      const docs = sortDocsByTimeDesc(
        res.data.filter((doc) => {
          const title = (doc.title || doc.prompt || '').toLowerCase()
          const author = (doc.authorNickName || '').toLowerCase()
          const prompt = (doc.prompt || '').toLowerCase()
          return title.includes(k) || author.includes(k) || prompt.includes(k)
        }),
        'sharedAt',
      )
      return { success: true, data: { list: docs.map(formatExhibitCard) } }
    }

    if (action === 'getDetail') {
      const paperId = event.paperId
      if (!paperId) {
        return { success: false, message: '缺少 paperId' }
      }
      const paper = await getSharedPaper(paperId)
      if (!paper) {
        return { success: false, message: '模板不存在或未公开' }
      }
      const commentsRes = await db.collection('exhibit_comments')
        .where({ paperId })
        .limit(100)
        .get()
      const comments = await buildCommentList(
        sortDocsByTimeDesc(commentsRes.data, 'createdAt'),
      )
      const liked = await isLiked(paperId, openid)
      const { author, authorAvatarUrl } = await resolveAuthorInfo(paper)
      return {
        success: true,
        data: {
          template: {
            id: paper._id,
            title: paper.title || (paper.prompt || '').slice(0, 80),
            author,
            authorAvatarUrl,
            likes: paper.likes || 0,
            createdAt: formatDateTime(paper.sharedAt || paper.createdAt),
            theme: pickTheme(paper._id),
            description: paper.prompt || '',
            outline: paper.outline || [],
            comments,
          },
          liked,
        },
      }
    }

    if (action === 'addComment') {
      const paperId = event.paperId
      const content = (event.content || '').trim()
      if (!paperId) {
        return { success: false, message: '缺少 paperId' }
      }
      if (!content || content.length > 200) {
        return { success: false, message: '评论内容 1~200 字' }
      }
      const paper = await getSharedPaper(paperId)
      if (!paper) {
        return { success: false, message: '模板不存在或未公开' }
      }
      const user = await getUserByOpenid(openid)
      const rawAvatar = user?.avatarUrl || ''
      const addRes = await db.collection('exhibit_comments').add({
        data: {
          paperId,
          openid,
          authorNickName: user?.nickName || '微信用户',
          authorAvatarUrl: rawAvatar,
          content,
          createdAt: db.serverDate(),
        },
      })
      const urlMap = await batchResolveAvatarUrls([rawAvatar])
      const comment = {
        id: addRes._id,
        author: user?.nickName || '微信用户',
        authorAvatarUrl: pickResolvedAvatar(rawAvatar, urlMap),
        content,
        date: formatShortDate(new Date()),
      }
      return { success: true, data: { comment } }
    }

    if (action === 'toggleLike') {
      const paperId = event.paperId
      if (!paperId) {
        return { success: false, message: '缺少 paperId' }
      }
      const paper = await getSharedPaper(paperId)
      if (!paper) {
        return { success: false, message: '模板不存在或未公开' }
      }
      const liked = await isLiked(paperId, openid)
      if (liked) {
        const likeRes = await db.collection('exhibit_likes')
          .where({ paperId, openid })
          .limit(1)
          .get()
        if (likeRes.data[0]) {
          await db.collection('exhibit_likes').doc(likeRes.data[0]._id).remove()
        }
        const newLikes = Math.max(0, (paper.likes || 0) - 1)
        await db.collection('papers').doc(paperId).update({
          data: { likes: newLikes, updatedAt: db.serverDate() },
        })
        return { success: true, data: { liked: false, likes: newLikes } }
      }
      await db.collection('exhibit_likes').add({
        data: { paperId, openid, createdAt: db.serverDate() },
      })
      const newLikes = (paper.likes || 0) + 1
      await db.collection('papers').doc(paperId).update({
        data: { likes: newLikes, updatedAt: db.serverDate() },
      })
      return { success: true, data: { liked: true, likes: newLikes } }
    }

    return { success: false, message: '未知 action' }
  } catch (err) {
    console.error('exhibit error', err)
    return { success: false, message: err.message || '服务异常' }
  }
}
