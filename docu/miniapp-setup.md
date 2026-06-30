# 多端应用（Android/iOS 安装包）部署指南

将小程序转为多端 App 后，云开发、登录、头像选择与微信内小程序**不完全相同**，需完成以下配置。

## 常见问题

| 现象 | 原因 |
|------|------|
| `cloud.callFunction:fail Error:rid:...` | 多端 App 未用跨账号云实例初始化，或缺少 `cloudbase_auth` |
| 无法选择微信头像 | App 内不支持 `chooseAvatar`，已改为相册选图 |
| 登录失败 | 需先 `getMiniProgramCode` 建立身份，再选头像填昵称登录 |

---

## 一、你必须手动完成的配置

### 1. 微信开放平台绑定

1. 登录 [微信开放平台](https://open.weixin.qq.com/)
2. 创建并认证 **移动应用**，记录 **移动应用 AppID**
3. 在 **微信开发者工具** → **多端应用** 中，绑定：
   - 开发小程序（`wxbb185e333780676b`）
   - 上述移动应用

### 2. 云开发环境共享 + cloudbase_auth

多端 App 访问小程序云环境属于**跨账号资源访问**：

1. 云开发控制台 → 环境 `finger01-d5giuqcdn273e2cb8` → **设置** → 开启 **环境共享**（按控制台指引授权给调用方）
2. 部署云函数 **`cloudbase_auth`**（本项目已提供 `cloudfunctions/cloudbase_auth`）
   - 右键 → **上传并部署：云端安装依赖**
3. 在云开发控制台确认该环境下存在名为 `cloudbase_auth` 的函数

> 若缺少此函数，`new wx.cloud.Cloud().init()` 会失败，表现为 `cloud.callFunction:fail`。

### 3. 填写移动应用 AppID（可选但建议）

编辑 `miniprogram/config/cloud-env.ts`：

```typescript
export const MOBILE_APP_APPID = '你的移动应用AppID'
```

当前代码跨账号访问云资源使用的是小程序 AppID（`resourceAppid`），此项预留给后续扩展。

### 4. 重新编译安装包

修改代码后需重新 **构建多端 App 安装包** 并安装到手机测试（开发者工具内小程序预览无法完全模拟 App 环境）。

---

## 二、登录逻辑（已实现）

多端 App 内：

1. **不再依赖** `chooseAvatar` / `type="nickname"`
2. 用户 **从相册选择头像** + **手动输入昵称**
3. 点击 **完成登录**
4. 后台调用 `getMiniProgramCode` 获取登录态，再注册/登录云账号

微信内小程序仍可使用 `chooseAvatar`（若可用）。

---

## 三、云初始化（已实现）

| 环境 | 初始化方式 |
|------|------------|
| 微信内小程序 | `wx.cloud.init({ env })` |
| 多端 App | `new wx.cloud.Cloud({ resourceAppid, resourceEnv }).init()` |

相关文件：

- `miniprogram/utils/cloudInstance.ts`
- `miniprogram/utils/cloud.ts`
- `miniprogram/app.ts`

---

## 四、部署清单

- [ ] 部署 `cloudbase_auth` 云函数
- [ ] 云开发控制台开启环境共享
- [ ] 开放平台绑定移动应用 + 小程序
- [ ] 重新打包 App 真机测试
- [ ] 测试：首页加载、登录、编辑资料

---

## 五、仍无法使用时

1. 查看云函数 `cloudbase_auth` 日志是否有来自 App 的调用
2. 确认手机已安装微信（`getMiniProgramCode` 依赖微信客户端）
3. 在 App 内打开 vConsole 查看 `cloud init failed` 具体报错
