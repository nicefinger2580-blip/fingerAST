const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

async function getUserByOpenid(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get()
  return res.data[0] || null
}

async function fulfillOrder(outTradeNo) {
  const orderRes = await db.collection('point_orders').where({ outTradeNo }).limit(1).get()
  const order = orderRes.data[0]
  if (!order || order.status === 'paid') return

  const user = await getUserByOpenid(order.openid)
  if (!user) return

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
}

exports.main = async (event) => {
  console.log('payCallback event', event)

  try {
    const returnCode = event.returnCode || event.return_code
    const resultCode = event.resultCode || event.result_code
    const outTradeNo = event.outTradeNo || event.out_trade_no

    if (returnCode === 'SUCCESS' && resultCode === 'SUCCESS' && outTradeNo) {
      await fulfillOrder(outTradeNo)
    }
  } catch (err) {
    console.error('payCallback fulfill error', err)
  }

  return { errcode: 0, errmsg: 'SUCCESS' }
}
