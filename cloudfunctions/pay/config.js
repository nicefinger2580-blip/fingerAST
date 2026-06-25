/** 积分充值套餐（金额单位：分） */
const RECHARGE_PACKS = [
  { id: 'pack_60', priceYuan: 6, totalFee: 600, points: 60, label: '60积分' },
  { id: 'pack_200', priceYuan: 18, totalFee: 1800, points: 200, label: '200积分' },
  { id: 'pack_680', priceYuan: 50, totalFee: 5000, points: 680, label: '680积分' },
]

/** 云环境 ID，与 docu/cloud-setup.md 一致 */
const CLOUD_ENV_ID = process.env.TCB_ENV || process.env.SCF_NAMESPACE || 'finger01-d5giuqcdn273e2cb8'

/**
 * 微信支付商户号（必填）
 * 云开发 unifiedOrder 的 subMchId 不能为空，直连商户也填自己的 mch_id。
 * 优先级：云函数环境变量 WX_PAY_SUB_MCH_ID / WX_MCH_ID > 下方默认值
 */
const WX_PAY_SUB_MCH_ID =
  process.env.WX_PAY_SUB_MCH_ID ||
  process.env.WX_MCH_ID ||
  '' // 也可在此直接填写，如 '1234567890'

module.exports = {
  RECHARGE_PACKS,
  CLOUD_ENV_ID,
  WX_PAY_SUB_MCH_ID,
}
