const cloud = require('wx-server-sdk')
const { RECHARGE_PACKS, CLOUD_ENV_ID, WX_PAY_SUB_MCH_ID } = require('./config')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

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

async function getUserByOpenid(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get()
  return res.data[0] || null
}

function genOutTradeNo() {
  const ts = Date.now().toString(36)
  const rnd = Math.random().toString(36).slice(2, 8)
  return `pt${ts}${rnd}`.slice(0, 32)
}

function getPack(packId) {
  return RECHARGE_PACKS.find((item) => item.id === packId) || null
}

function resolveMchIdError() {
  return {
    success: false,
    message: '未配置微信支付商户号。请在云开发控制台 → 云函数 pay → 环境变量添加 WX_PAY_SUB_MCH_ID（值为你的商户号 mch_id），然后重新部署 pay 云函数。详见 docu/payment-setup.md',
    code: 'MCH_ID_MISSING',
  }
}

async function fulfillOrder(outTradeNo) {
  const orderRes = await db.collection('point_orders').where({ outTradeNo }).limit(1).get()
  const order = orderRes.data[0]
  if (!order) {
    return { fulfilled: false, message: '订单不存在' }
  }
  if (order.status === 'paid') {
    const user = await getUserByOpenid(order.openid)
    return { fulfilled: true, alreadyPaid: true, points: order.points, user: formatUser(user) }
  }

  const user = await getUserByOpenid(order.openid)
  if (!user) {
    return { fulfilled: false, message: '用户不存在' }
  }

  const newPoints = (user.points || 0) + order.points
  await db.collection('users').doc(user._id).update({
    data: { points: newPoints, updatedAt: db.serverDate() },
  })
  await db.collection('point_orders').doc(order._id).update({
    data: { status: 'paid', paidAt: db.serverDate() },
  })
  await db.collection('point_records').add({
    data: {
      openid: order.openid,
      title: `积分充值（${order.points}积分）`,
      amount: order.points,
      type: 'earn',
      createdAt: db.serverDate(),
    },
  })

  const updated = await db.collection('users').doc(user._id).get()
  return {
    fulfilled: true,
    alreadyPaid: false,
    points: order.points,
    user: formatUser(updated.data),
  }
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) {
    return { success: false, message: '无法获取用户身份' }
  }

  const action = event.action || 'getPackages'

  try {
    if (action === 'getPackages') {
      return {
        success: true,
        data: {
          packs: RECHARGE_PACKS.map((item) => ({
            id: item.id,
            priceYuan: item.priceYuan,
            points: item.points,
            label: item.label,
          })),
        },
      }
    }

    if (action === 'createOrder') {
      const pack = getPack(event.packId)
      if (!pack) {
        return { success: false, message: '无效的充值套餐' }
      }

      const user = await getUserByOpenid(openid)
      if (!user) {
        return { success: false, message: '请先登录' }
      }

      const outTradeNo = genOutTradeNo()
      await db.collection('point_orders').add({
        data: {
          openid,
          packId: pack.id,
          points: pack.points,
          totalFee: pack.totalFee,
          outTradeNo,
          status: 'pending',
          createdAt: db.serverDate(),
        },
      })

      if (!WX_PAY_SUB_MCH_ID) {
        return resolveMchIdError()
      }

      const orderParams = {
        body: `指间论文-${pack.label}`,
        outTradeNo,
        spbillCreateIp: '127.0.0.1',
        subMchId: WX_PAY_SUB_MCH_ID,
        totalFee: pack.totalFee,
        envId: CLOUD_ENV_ID,
        functionName: 'payCallback',
        tradeType: 'JSAPI',
        openid,
      }

      let payRes
      try {
        payRes = await cloud.cloudPay.unifiedOrder(orderParams)
      } catch (err) {
        console.error('unifiedOrder error', err)
        const errMsg = err.message || String(err)
        if (errMsg.includes('sub_mch_id')) {
          return resolveMchIdError()
        }
        return {
          success: false,
          message: '微信支付未就绪，请先在云开发控制台绑定商户号（见 docu/payment-setup.md）',
          code: 'PAY_NOT_CONFIGURED',
        }
      }

      if (!payRes || payRes.returnCode !== 'SUCCESS') {
        const msg = payRes?.returnMsg || payRes?.errCodeDes || '微信下单失败'
        if (String(msg).includes('sub_mch_id')) {
          return resolveMchIdError()
        }
        return {
          success: false,
          message: msg,
          code: 'UNIFIED_ORDER_FAILED',
        }
      }

      return {
        success: true,
        data: {
          payment: payRes.payment,
          outTradeNo,
          points: pack.points,
        },
      }
    }

    if (action === 'queryOrder') {
      const outTradeNo = (event.outTradeNo || '').trim()
      if (!outTradeNo) {
        return { success: false, message: '缺少 outTradeNo' }
      }

      const orderRes = await db.collection('point_orders')
        .where({ outTradeNo, openid })
        .limit(1)
        .get()
      const order = orderRes.data[0]
      if (!order) {
        return { success: false, message: '订单不存在' }
      }

      if (order.status === 'paid') {
        const user = await getUserByOpenid(openid)
        return {
          success: true,
          data: { status: 'paid', points: order.points, user: formatUser(user) },
        }
      }

      if (!WX_PAY_SUB_MCH_ID) {
        return resolveMchIdError()
      }

      const queryParams = {
        outTradeNo,
        subMchId: WX_PAY_SUB_MCH_ID,
      }

      let queryRes
      try {
        queryRes = await cloud.cloudPay.queryOrder(queryParams)
      } catch (err) {
        console.error('queryOrder error', err)
        return { success: false, message: '查询订单失败，请稍后重试' }
      }

      const tradeState = queryRes.tradeState || queryRes.trade_state
      if (tradeState === 'SUCCESS') {
        const result = await fulfillOrder(outTradeNo)
        if (result.user) {
          return {
            success: true,
            data: { status: 'paid', points: result.points, user: result.user },
          }
        }
        return { success: false, message: result.message || '入账失败' }
      }

      return {
        success: true,
        data: { status: tradeState || 'pending', points: 0, user: formatUser(await getUserByOpenid(openid)) },
      }
    }

    return { success: false, message: '未知 action' }
  } catch (err) {
    console.error('pay error', err)
    return { success: false, message: err.message || '服务异常' }
  }
}
