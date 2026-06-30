import { CLOUD_ENV_ID, MINIPROGRAM_APPID } from '../config/cloud-env'
import { isMiniApp } from './platform'

type CloudApi = Pick<
  WechatMiniprogram.Cloud,
  'callFunction' | 'uploadFile' | 'downloadFile' | 'getTempFileURL'
>

let initPromise: Promise<void> | null = null
let sharedCloud: CloudApi | null = null

export function initCloud(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    if (!wx.cloud) {
      throw new Error('当前环境不支持云开发')
    }

    if (isMiniApp()) {
      const CloudCtor = (wx.cloud as WechatMiniprogram.Cloud & {
        Cloud?: new (options: {
          resourceAppid: string
          resourceEnv: string
        }) => CloudApi & { init(): Promise<void> }
      }).Cloud

      if (!CloudCtor) {
        throw new Error('当前基础库不支持跨账号云开发，请升级多端 App SDK')
      }

      const instance = new CloudCtor({
        resourceAppid: MINIPROGRAM_APPID,
        resourceEnv: CLOUD_ENV_ID,
      })
      await instance.init()
      sharedCloud = instance
      return
    }

    wx.cloud.init({ env: CLOUD_ENV_ID, traceUser: true })
    sharedCloud = wx.cloud
  })()

  initPromise.catch(() => {
    initPromise = null
  })

  return initPromise
}

export async function getCloudApi(): Promise<CloudApi> {
  await initCloud()
  if (!sharedCloud) {
    throw new Error('云开发未初始化')
  }
  return sharedCloud
}
