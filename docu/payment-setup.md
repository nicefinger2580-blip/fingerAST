# 积分充值（微信支付）配置指南

小程序已接入**云开发微信支付**流程：用户选套餐 → 云函数下单 → `wx.requestPayment` → 回调入账。

## 套餐定价

| 套餐 | 价格 | 积分 |
|------|------|------|
| pack_60 | ¥6 | 60 |
| pack_200 | ¥18 | 200 |
| pack_680 | ¥50 | 680 |

修改价格请同步改两处：
- `cloudfunctions/pay/config.js`（下单金额，单位：分）
- `miniprogram/utils/constants.ts` 的 `RECHARGE_PACKS`（前端展示）

---

## 一、你需要手动完成的配置

### 1. 申请微信支付商户号

1. 前往 [微信支付商户平台](https://pay.weixin.qq.com/) 注册并完成企业/个体户认证。
2. 获取 **商户号（mch_id）**。
3. 在微信公众平台（小程序后台）→ **功能** → **微信支付** → 关联该商户号。

> 个人主体小程序通常**无法**开通微信支付，需企业或个体工商户主体。

### 2. 云开发绑定微信支付

1. 打开 [微信云开发控制台](https://console.cloud.tencent.com/tcb)。
2. 选择环境 `finger01-d5giuqcdn273e2cb8`。
3. 进入 **设置** → **全局设置** / **微信支付**（入口名称以控制台为准）。
4. 按指引**绑定商户号**，完成授权。

绑定成功后，云函数 `cloud.cloudPay.unifiedOrder` 才能正常下单。

### 3. 创建数据库集合

在云开发 → 数据库，新建：

| 集合名 | 说明 |
|--------|------|
| `point_orders` | 充值订单（outTradeNo、openid、points、status 等） |

**推荐权限**：仅云函数可读写（与 `point_records` 相同）。

### 4. 部署云函数

在微信开发者工具中，右键上传并部署（云端安装依赖）：

1. `cloudfunctions/pay`
2. `cloudfunctions/payCallback`

`pay` 云函数的 `config.json` 已声明 `cloudPay.unifiedOrder` / `cloudPay.queryOrder` 权限。

### 5. 配置商户号环境变量（必填）

云开发 `unifiedOrder` **必须**传入 `subMchId`，即使你是直连商户也要填自己的 **商户号 mch_id**。

1. 打开 [微信云开发控制台](https://console.cloud.tencent.com/tcb) → 云函数 → **pay** → **配置** → **环境变量**
2. 新增变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `WX_PAY_SUB_MCH_ID` | 你的商户号，如 `1234567890` | 在微信支付商户平台「账户中心」查看 |

也支持变量名 `WX_MCH_ID`（二选一即可）。

3. 保存后，在微信开发者工具中**重新上传并部署** `pay` 云函数。

> 若暂时无法获取商户号，也可在 `cloudfunctions/pay/config.js` 里把 `WX_PAY_SUB_MCH_ID` 的默认值直接写成商户号（不推荐提交到 Git）。

### 6. 小程序类目与合规

积分属于**虚拟商品**，需确认小程序类目与微信支付经营类目支持此类交易。若审核或支付被拒：

- 在小程序后台调整服务类目；
- 或咨询微信支付客服确认虚拟商品收款方案。

---

## 二、支付流程说明

```
用户点击充值
  → pay.createOrder（写 point_orders，调用 unifiedOrder）
  → 小程序 wx.requestPayment
  → 微信服务器回调 payCallback（积分入账 + point_records）
  → 客户端 pay.queryOrder 确认并刷新余额
```

入账逻辑具有幂等性：同一订单不会重复加积分。

---

## 三、测试建议

1. 使用**真机预览**（开发者工具内支付能力有限）。
2. 先用 **6 元套餐** 小额测试。
3. 支付后在「积分明细 → 获取记录」查看是否有「积分充值（xx积分）」。
4. 若支付成功但积分未到账，在云开发 → 云函数 → `payCallback` 查看日志。

---

## 四、常见错误

| 现象 | 原因 | 处理 |
|------|------|------|
| 提示「微信支付未就绪」 | 云开发未绑定商户号 | 完成第一节第 2 步 |
| **sub_mch_id is empty** | 未配置商户号环境变量 | 在 pay 云函数添加 `WX_PAY_SUB_MCH_ID` 并重新部署 |
| unifiedOrder 失败 | 商户号未关联小程序 AppID | 在商户平台关联 AppID |
| 支付成功积分延迟 | 回调稍慢 | 下拉刷新积分页；queryOrder 会补入账 |
| iOS 无法支付虚拟商品 | 平台政策限制 | 需合规类目或按微信最新虚拟支付规范处理 |

---

## 五、相关云函数

### pay

| action | 说明 |
|--------|------|
| `getPackages` | 获取充值套餐列表 |
| `createOrder` | 创建订单并返回 `payment` 参数（需 `packId`） |
| `queryOrder` | 查询订单并确认入账（需 `outTradeNo`） |

### payCallback

微信支付异步通知，**无需手动调用**，由微信服务器触发。
