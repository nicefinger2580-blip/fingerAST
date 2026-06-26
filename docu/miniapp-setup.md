# 多端应用（Android/iOS 安装包）部署指南

将小程序转为多端 App 后，云开发、登录、头像选择与微信内小程序**不完全相同**，需完成以下配置。

---

## 一、问题原因（你遇到的报错）

| 现象 | 原因 |
|------|------|
| `cloud.callFunction:fail Error:rid:...` | 多端 App 内未正确初始化云开发（缺 appid/env、未登录态、未环境共享） |
| 无法微信头像登录 | App 内不支持 `chooseAvatar`，需相册选图 + `wx.weixinAppLogin` |
| 头像无法上传 | 云存储上传依赖云开发登录态，需先完成 App 微信登录 |

---

## 二、必须手动完成的配置（按顺序）

### 1. 注册并绑定「移动应用」

1. 登录 [微信开放平台](https://open.weixin.qq.com/) → **管理中心** → **移动应用** → 创建应用并过审。
2. 记录 **移动应用 AppID**（形如 `wxXXXXXXXX`）。
3. 在 **微信开发者工具** → **多端应用** → 绑定该移动应用账号。

### 2. 填写项目中的移动应用 AppID

编辑 `miniprogram/config/cloud-env.ts`：

```typescript
export const MOBILE_APP_APPID = 'wx你的移动应用AppID'
```

> 留空会回退为小程序 AppID，极易导致云开发鉴权失败。

### 3. 云开发环境共享

1. 微信开发者工具 → **云开发** → **更多** → **环境共享** → **添加共享**。
2. 填入 **移动应用 AppID**（与上一步相同）。
3. 共享环境 `finger01-d5giuqcdn273e2cb8`。

### 4. 部署 `cloudbase_auth` 云函数

右键 `cloudfunctions/cloudbase_auth` → **上传并部署：云端安装依赖**。

多端 App 跨账号访问云资源时会调用此函数做鉴权。

### 5. 重新打包 App

修改 `project.miniapp.json` 后需**重新构建 APK/IPA** 并安装到手机（不能只热重载小程序代码）。

已开启的扩展 SDK：
- Android：`network: true`、`media: true`
- iOS：`WeAppNetwork: true`、`WeAppOpenFuns: true`、`WeAppMedia: true`

### 6.（可选）未登录访问

若希望**未登录也能浏览首页**，在云开发控制台 → **设置** → **权限设置** → 开启 **未登录用户访问云资源**，并为各云函数配置安全规则（见[官方文档](https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/new-capability/cloud/cloud.html)）。

推荐做法仍是：**先登录再使用**，与现有积分/创作逻辑一致。

---

## 三、App 内正确使用流程

1. 打开 App → **我的** → **登录**
2. 从**相册选择头像**、填写昵称
3. 点击 **微信授权登录** → 跳转微信 App 授权（`wx.weixinAppLogin`）
4. 授权成功后云开发建立登录态，首页、积分、上传头像即可正常使用

---

## 四、代码已做的适配

| 模块 | 改动 |
|------|------|
| `app.ts` | 多端使用 `new wx.cloud.Cloud({ appid, resourceAppid, resourceEnv })` |
| `utils/cloud.ts` | 统一走 `getCloud()`，兼容小程序与 App |
| `utils/auth.ts` | App 内 `wx.weixinAppLogin` + `ensureCloudSession` |
| 登录/资料页 | App 内用 `chooseMedia` 选头像，替代 `chooseAvatar` |

---

## 五、常见问题

| 错误 | 处理 |
|------|------|
| `sendOpenReq:fail launch wechat fail` | 多端应用未绑定移动应用 / 手机未安装微信 |
| `10001007` 未绑定移动应用 | 完成第二节第 1 步 |
| 云函数仍失败 | 确认环境共享、`cloudbase_auth` 已部署、`MOBILE_APP_APPID` 已填写 |
| 小程序与 App 用户数据不一致 | App 与小程序 openid 可能不同，需开放平台绑定并用 unionid 关联（进阶） |

---

## 六、调试注意

- `wx.weixinAppLogin` **不能在「移动应用助手」里调试**，必须安装真机 APK/IPA。
- 修改 `cloud-env.ts` 或 `project.miniapp.json` 后需**重新打包**。
