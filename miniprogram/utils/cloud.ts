import { getCloudApi } from './cloudInstance'

export interface CloudResult<T = unknown> {
  success: boolean
  message?: string
  code?: string
  data?: T
}

export function callCloud<T>(
  name: string,
  data?: Record<string, unknown>,
  options?: { slow?: boolean },
): Promise<T> {
  return getCloudApi().then(
    (cloud) =>
      new Promise((resolve, reject) => {
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
            const msg = err.errMsg || '网络异常'
            if (msg.includes('cloud.callFunction:fail')) {
              reject(new Error('云服务连接失败，多端 App 请确认已部署 cloudbase_auth 并完成环境共享配置'))
              return
            }
            reject(new Error(msg))
          },
        })
      }),
  )
}

export async function downloadAndOpenDocx(fileID: string): Promise<void> {
  const cloud = await getCloudApi()
  const dl = await cloud.downloadFile({ fileID })
  await wx.openDocument({
    filePath: dl.tempFilePath,
    fileType: 'docx',
    showMenu: true,
  })
}

export { initCloud } from './cloudInstance'
