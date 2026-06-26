const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 云开发环境共享鉴权函数（多端 App 跨账号访问云资源时必需）
 * 部署后无需修改；若需限制来源 AppID，可在此校验 event 中的来源信息。
 */
exports.main = async () => ({
  errCode: 0,
  errMsg: 'ok',
})
