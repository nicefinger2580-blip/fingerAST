const cloud = require('wx-server-sdk')
const { COST } = require('./config')
const { createDocxBuffer } = require('./docxBuilder')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

async function getUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get()
  return res.data[0] || null
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { paperId, prompt, title, outline } = event

  if (!openid) {
    return { success: false, message: '请先登录' }
  }

  try {
    const user = await getUser(openid)
    if (!user) {
      return { success: false, message: '用户未注册' }
    }
    if (user.points < COST.exportDocx) {
      return { success: false, message: '积分不足', code: 'INSUFFICIENT_POINTS' }
    }

    let paperPrompt = prompt
    let paperTitle = title
    let paperOutline = outline

    if (paperId) {
      const paperDoc = await db.collection('papers').doc(paperId).get()
      const paper = paperDoc.data
      if (!paper) {
        return { success: false, message: '论文记录不存在' }
      }
      const isOwner = paper.openid === openid
      const isShared = paper.status === 'shared'
      if (!isOwner && !isShared) {
        return { success: false, message: '无权导出该模板' }
      }
      paperPrompt = paper.prompt
      paperTitle = paper.title
      paperOutline = paper.outline
    }

    if (!paperOutline || !Array.isArray(paperOutline) || paperOutline.length === 0) {
      return { success: false, message: '缺少可导出的论文内容' }
    }

    const exportOutline = paperOutline.filter((item) => item.checked !== false)
    const buffer = await createDocxBuffer(
      paperTitle || paperPrompt,
      paperPrompt,
      exportOutline.length ? exportOutline : paperOutline,
    )

    const cloudPath = `exports/${openid}/${Date.now()}.docx`
    const uploadRes = await cloud.uploadFile({
      cloudPath,
      fileContent: buffer,
    })

    const newPoints = user.points - COST.exportDocx
    await db.collection('users').doc(user._id).update({
      data: { points: newPoints, updatedAt: db.serverDate() },
    })

    await db.collection('point_records').add({
      data: {
        openid,
        title: '导出 docx 文档',
        amount: COST.exportDocx,
        type: 'spend',
        createdAt: db.serverDate(),
      },
    })

    if (paperId) {
      await db.collection('papers').doc(paperId).update({
        data: { exportedAt: db.serverDate(), exportFileId: uploadRes.fileID },
      })
    }

    const userDoc = await db.collection('users').doc(user._id).get()

    return {
      success: true,
      data: {
        fileID: uploadRes.fileID,
        cloudPath,
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
    console.error('exportDocx error', err)
    return { success: false, message: err.message || '导出失败' }
  }
}
