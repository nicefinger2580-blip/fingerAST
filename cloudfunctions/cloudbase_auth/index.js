const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 跨账号环境共享鉴权（多端 App / 其他 AppID 访问本小程序云资源时必需）
 * 文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/guide/resource-sharing/
 */
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  console.log('cloudbase_auth', {
    fromAppid: wxContext.FROM_APPID,
    fromOpenid: wxContext.FROM_OPENID,
    event,
  })

  return {
    errCode: 0,
    errMsg: '',
    auth: JSON.stringify({
      fromAppid: wxContext.FROM_APPID || '',
    }),
  }
}
