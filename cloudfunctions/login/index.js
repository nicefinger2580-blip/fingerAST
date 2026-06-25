const cloud = require('wx-server-sdk')
const { COST } = require('./config')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const CHINA_TZ_OFFSET = 8 * 60 * 60 * 1000

function toChinaParts(dateInput) {
  const ms = (dateInput instanceof Date ? dateInput : new Date(dateInput)).getTime()
  if (Number.isNaN(ms)) return null
  const d = new Date(ms + CHINA_TZ_OFFSET)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    date: d.getUTCDate(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    seconds: d.getUTCSeconds(),
  }
}

function todayStr() {
  const p = toChinaParts(new Date())
  const pad = (n) => String(n).padStart(2, '0')
  return `${p.year}-${pad(p.month)}-${pad(p.date)}`
}

function resolveSigninDate(clientDate) {
  const value = (clientDate || '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return todayStr()
}

function formatUser(doc) {
  if (!doc) return null
  return {
    _id: doc._id,
    openid: doc.openid,
    nickName: doc.nickName,
    avatarUrl: doc.avatarUrl,
    points: doc.points,
    signedDays: doc.signedDays || 0,
    signedDates: doc.signedDates || [],
    historyCount: doc.historyCount || 0,
  }
}

function formatDateTime(value) {
  const p = toChinaParts(value)
  if (!p) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${p.year}-${pad(p.month)}-${pad(p.date)} ${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`
}

function formatPaperSummary(doc) {
  const outline = doc.outline || []
  return {
    id: doc._id,
    title: doc.title || (doc.prompt || '').slice(0, 80),
    createdAt: formatDateTime(doc.createdAt),
    sectionCount: outline.length,
    status: doc.status === 'shared' ? 'shared' : 'generated',
  }
}

function formatPaperDetail(doc) {
  return {
    id: doc._id,
    title: doc.title || (doc.prompt || '').slice(0, 80),
    prompt: doc.prompt || '',
    outline: doc.outline || [],
    createdAt: formatDateTime(doc.createdAt),
    status: doc.status || 'generated',
    exportFileId: doc.exportFileId || '',
  }
}

function formatPointRecord(doc) {
  return {
    id: doc._id,
    title: doc.title,
    time: formatDateTime(doc.createdAt),
    amount: doc.amount,
    type: doc.type,
  }
}

function sortByCreatedAtDesc(list) {
  return list.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime() || 0
    const tb = new Date(b.createdAt).getTime() || 0
    return tb - ta
  })
}

async function getUserByOpenid(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get()
  return res.data[0] || null
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

async function countFollowers(followeeOpenid) {
  const res = await db.collection('user_follows').where({ followeeOpenid }).count()
  return res.total || 0
}

async function countFollowing(followerOpenid) {
  const res = await db.collection('user_follows').where({ followerOpenid }).count()
  return res.total || 0
}

async function isFollowingUser(followerOpenid, followeeOpenid) {
  if (!followerOpenid || !followeeOpenid || followerOpenid === followeeOpenid) return false
  const res = await db.collection('user_follows')
    .where({ followerOpenid, followeeOpenid })
    .limit(1)
    .get()
  return res.data.length > 0
}

function formatShortDate(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function getPaperById(paperId, openid) {
  const doc = await db.collection('papers').doc(paperId).get()
  const paper = doc.data
  if (!paper || paper.openid !== openid) return null
  return paper
}

async function addPointRecord(openid, title, amount, type) {
  await db.collection('point_records').add({
    data: {
      openid,
      title,
      amount: Math.abs(amount),
      type,
      createdAt: db.serverDate(),
    },
  })
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) {
    return { success: false, message: '无法获取用户身份' }
  }

  const action = event.action || 'login'

  try {
    if (action === 'getProfile') {
      const user = await getUserByOpenid(openid)
      if (!user) {
        return { success: false, message: '用户未注册', code: 'NOT_REGISTERED' }
      }
      return { success: true, data: { user: formatUser(user) } }
    }

    if (action === 'checkSession') {
      const user = await getUserByOpenid(openid)
      if (!user) {
        return { success: true, data: { user: null, registered: false } }
      }
      const now = db.serverDate()
      await db.collection('users').doc(user._id).update({
        data: { lastLoginAt: now, updatedAt: now },
      })
      const updated = await db.collection('users').doc(user._id).get()
      return { success: true, data: { user: formatUser(updated.data), registered: true } }
    }

    if (action === 'getPapers') {
      const res = await db.collection('papers').where({ openid }).limit(100).get()
      const list = sortByCreatedAtDesc(res.data).map(formatPaperSummary)
      return { success: true, data: { list } }
    }

    if (action === 'getPaper') {
      const paperId = event.paperId
      if (!paperId) {
        return { success: false, message: '缺少 paperId' }
      }
      const paper = await getPaperById(paperId, openid)
      if (!paper) {
        return { success: false, message: '记录不存在' }
      }
      return { success: true, data: { paper: formatPaperDetail(paper) } }
    }

    if (action === 'deletePaper') {
      const paperId = event.paperId
      if (!paperId) {
        return { success: false, message: '缺少 paperId' }
      }
      const paper = await getPaperById(paperId, openid)
      if (!paper) {
        return { success: false, message: '记录不存在' }
      }
      await db.collection('papers').doc(paperId).remove()
      const user = await getUserByOpenid(openid)
      if (user) {
        await db.collection('users').doc(user._id).update({
          data: {
            historyCount: Math.max(0, (user.historyCount || 0) - 1),
            updatedAt: db.serverDate(),
          },
        })
      }
      return { success: true, data: { paperId } }
    }

    if (action === 'getPointRecords') {
      const res = await db.collection('point_records').where({ openid }).limit(200).get()
      const sorted = sortByCreatedAtDesc(res.data)
      const earnList = []
      const spendList = []
      let totalEarn = 0
      let totalSpend = 0
      sorted.forEach((doc) => {
        const item = formatPointRecord(doc)
        if (item.type === 'earn') {
          earnList.push(item)
          totalEarn += item.amount
        } else {
          spendList.push(item)
          totalSpend += item.amount
        }
      })
      return {
        success: true,
        data: { earnList, spendList, totalEarn, totalSpend },
      }
    }

    if (action === 'signin') {
      const user = await getUserByOpenid(openid)
      if (!user) {
        return { success: false, message: '请先登录' }
      }
      const today = resolveSigninDate(event.clientDate)
      const signedDates = user.signedDates || []
      if (signedDates.includes(today)) {
        return { success: false, message: '今日已签到', code: 'ALREADY_SIGNED' }
      }
      const newDates = [...signedDates, today]
      const reward = COST.signinReward
      const newPoints = user.points + reward
      await db.collection('users').doc(user._id).update({
        data: {
          points: newPoints,
          signedDays: (user.signedDays || 0) + 1,
          signedDates: newDates,
          updatedAt: db.serverDate(),
        },
      })
      await addPointRecord(openid, '每日签到', reward, 'earn')
      const updated = await db.collection('users').doc(user._id).get()
      return {
        success: true,
        data: { user: formatUser(updated.data), reward },
      }
    }

    if (action === 'updateProfile') {
      const nickName = (event.nickName || '').trim().slice(0, 32)
      const avatarUrl = (event.avatarUrl || '').trim()
      if (!nickName && !avatarUrl) {
        return { success: false, message: '无更新内容' }
      }
      const user = await getUserByOpenid(openid)
      if (!user) {
        return { success: false, message: '用户未注册，请先登录' }
      }
      const update = { updatedAt: db.serverDate() }
      if (nickName) update.nickName = nickName
      if (avatarUrl) update.avatarUrl = avatarUrl
      await db.collection('users').doc(user._id).update({ data: update })
      const updated = await db.collection('users').doc(user._id).get()
      return { success: true, data: { user: formatUser(updated.data) } }
    }

    if (action === 'toggleFollow') {
      const targetOpenid = (event.targetOpenid || '').trim()
      if (!targetOpenid) {
        return { success: false, message: '缺少 targetOpenid' }
      }
      if (targetOpenid === openid) {
        return { success: false, message: '不能关注自己' }
      }
      const targetUser = await getUserByOpenid(targetOpenid)
      if (!targetUser) {
        return { success: false, message: '用户不存在' }
      }
      const existing = await db.collection('user_follows')
        .where({ followerOpenid: openid, followeeOpenid: targetOpenid })
        .limit(1)
        .get()
      if (existing.data[0]) {
        await db.collection('user_follows').doc(existing.data[0]._id).remove()
        return {
          success: true,
          data: {
            following: false,
            followerCount: await countFollowers(targetOpenid),
          },
        }
      }
      await db.collection('user_follows').add({
        data: {
          followerOpenid: openid,
          followeeOpenid: targetOpenid,
          createdAt: db.serverDate(),
        },
      })
      return {
        success: true,
        data: {
          following: true,
          followerCount: await countFollowers(targetOpenid),
        },
      }
    }

    if (action === 'listFollowing') {
      const followRes = await db.collection('user_follows')
        .where({ followerOpenid: openid })
        .limit(100)
        .get()
      const sorted = sortByCreatedAtDesc(followRes.data)
      if (sorted.length === 0) {
        return { success: true, data: { list: [], total: 0 } }
      }
      const followeeOpenids = sorted.map((item) => item.followeeOpenid).filter(Boolean)
      const userMap = await getUsersByOpenids(followeeOpenids)
      const rawAvatars = followeeOpenids.map((id) => userMap.get(id)?.avatarUrl || '')
      const urlMap = await batchResolveAvatarUrls(rawAvatars)
      const list = sorted.map((item) => {
        const user = userMap.get(item.followeeOpenid)
        const rawAvatar = user?.avatarUrl || ''
        return {
          openid: item.followeeOpenid,
          nickName: user?.nickName || '微信用户',
          avatarUrl: pickResolvedAvatar(rawAvatar, urlMap),
          followedAt: formatShortDate(item.createdAt),
        }
      })
      return { success: true, data: { list, total: list.length } }
    }

    if (action === 'getUserPublicProfile') {
      const targetOpenid = (event.targetOpenid || '').trim()
      if (!targetOpenid) {
        return { success: false, message: '缺少 targetOpenid' }
      }
      const user = await getUserByOpenid(targetOpenid)
      if (!user) {
        return { success: false, message: '用户不存在' }
      }
      const urlMap = await batchResolveAvatarUrls([user.avatarUrl || ''])
      const [followerCount, followingCount, following] = await Promise.all([
        countFollowers(targetOpenid),
        countFollowing(targetOpenid),
        isFollowingUser(openid, targetOpenid),
      ])
      return {
        success: true,
        data: {
          profile: {
            openid: targetOpenid,
            nickName: user.nickName || '微信用户',
            avatarUrl: pickResolvedAvatar(user.avatarUrl || '', urlMap),
            followerCount,
            followingCount,
            isSelf: openid === targetOpenid,
            following,
          },
        },
      }
    }

    if (action === 'login') {
      const unionid = wxContext.UNIONID || ''
      const appid = wxContext.APPID || ''
      const nickName = (event.nickName || '').trim().slice(0, 32)
      const avatarUrl = (event.avatarUrl || '').trim()
      const existing = await getUserByOpenid(openid)
      const now = db.serverDate()

      if (existing) {
        const update = {
          lastLoginAt: now,
          updatedAt: now,
        }
        if (nickName) update.nickName = nickName
        if (avatarUrl) update.avatarUrl = avatarUrl
        if (unionid && !existing.unionid) update.unionid = unionid
        if (appid) update.appid = appid
        await db.collection('users').doc(existing._id).update({ data: update })
        const updated = await db.collection('users').doc(existing._id).get()
        return { success: true, data: { user: formatUser(updated.data), isNew: false } }
      }

      if (!nickName) {
        return { success: false, message: '请先授权微信昵称与头像' }
      }

      const newUser = {
        openid,
        unionid: unionid || '',
        appid: appid || '',
        nickName,
        avatarUrl: avatarUrl || '',
        points: COST.registerReward,
        signedDays: 0,
        signedDates: [],
        historyCount: 0,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      }
      const addRes = await db.collection('users').add({ data: newUser })
      await addPointRecord(openid, '新用户注册奖励', COST.registerReward, 'earn')
      const created = await db.collection('users').doc(addRes._id).get()
      return {
        success: true,
        data: { user: formatUser(created.data), isNew: true },
      }
    }

    return { success: false, message: '未知 action' }
  } catch (err) {
    console.error('login error', err)
    return { success: false, message: err.message || '服务异常' }
  }
}
