import { isMiniAppHost } from './platform'

export interface CloudResult<T = unknown> {
  success: boolean
  message?: string
  code?: string
  data?: T
}

type CloudLike = {
  callFunction: WechatMiniprogram.Cloud['callFunction']
  uploadFile: WechatMiniprogram.Cloud['uploadFile']
  downloadFile: WechatMiniprogram.Cloud['downloadFile']
}

export function getCloud(): CloudLike {
  if (isMiniAppHost()) {
    const app = getApp<IAppOption>()
    if (!app.cloudInstance) {
      throw new Error('云开发未初始化，请先完成微信登录')
    }
    return app.cloudInstance as unknown as CloudLike
  }
  if (!wx.cloud) {
    throw new Error('当前环境不支持云开发')
  }
  return wx.cloud as unknown as CloudLike
}

export function callCloud<T>(
  name: string,
  data?: Record<string, unknown>,
  options?: { slow?: boolean },
): Promise<T> {
  return new Promise((resolve, reject) => {
    let cloud: CloudLike
    try {
      cloud = getCloud()
    } catch (err) {
      reject(err instanceof Error ? err : new Error('云开发不可用'))
      return
    }

    cloud.callFunction({
      name,
      data: data || {},
      slow: options?.slow,
      success: (res) => {
        const result = res.result as CloudResult<T>
        if (!result || !result.success) {
          reject(new Error(result?.message || '请求失败'))
          return
        }
        resolve(result.data as T)
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络异常'))
      },
    })
  })
}

export async function downloadAndOpenDocx(fileID: string): Promise<void> {
  const cloud = getCloud()
  const dl = await cloud.downloadFile({ fileID })
  await wx.openDocument({
    filePath: dl.tempFilePath,
    fileType: 'docx',
    showMenu: true,
  })
}
