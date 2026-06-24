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
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
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
  const dl = await wx.cloud.downloadFile({ fileID })
  await wx.openDocument({
    filePath: dl.tempFilePath,
    fileType: 'docx',
    showMenu: true,
  })
}
