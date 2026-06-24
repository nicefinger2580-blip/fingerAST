const https = require('https')
const { DEEPSEEK_BASE_URL, MODEL } = require('./config')

function callDeepSeek(apiKey, messages, options = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      messages,
      thinking: { type: 'disabled' },
      response_format: { type: 'json_object' },
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 12000,
    })
    const url = new URL(`${DEEPSEEK_BASE_URL}/chat/completions`)
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: options.timeout ?? 110000,
      },
      (res) => {
        let raw = ''
        res.on('data', (chunk) => { raw += chunk })
        res.on('end', () => {
          try {
            const json = JSON.parse(raw)
            if (json.error) {
              const msg = json.error.message || '模型调用失败'
              if (/incorrect api key|invalid api.?key|authentication/i.test(msg)) {
                reject(new Error(
                  'API Key 无效：请使用 DeepSeek 开放平台 Key。获取地址：https://platform.deepseek.com/',
                ))
                return
              }
              reject(new Error(msg))
              return
            }
            const content = json.choices?.[0]?.message?.content
            if (!content) {
              reject(new Error('模型未返回有效内容'))
              return
            }
            resolve(content)
          } catch (e) {
            reject(new Error('解析模型响应失败'))
          }
        })
      },
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('生成超时，请稍后重试'))
    })
    req.write(body)
    req.end()
  })
}

function extractJson(text) {
  let jsonStr = text.trim()
  const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) jsonStr = fence[1].trim()
  const start = jsonStr.indexOf('{')
  const end = jsonStr.lastIndexOf('}')
  if (start >= 0 && end > start) {
    jsonStr = jsonStr.slice(start, end + 1)
  }
  return JSON.parse(jsonStr)
}

function parsePaper(text) {
  const parsed = extractJson(text)
  const paperTitle = String(parsed.title || parsed.paperTitle || '').trim()
  const list = parsed.sections || parsed.outline || parsed.chapters
  if (!Array.isArray(list)) throw new Error('论文 JSON 格式不正确')

  const sections = list.map((item, index) => ({
    id: `s${index + 1}`,
    title: String(item.title || item.name || '').trim(),
    level: Number(item.level) || 1,
    content: String(item.content || item.body || item.text || '').trim(),
    checked: true,
  })).filter((item) => item.title)

  if (sections.length === 0) {
    throw new Error('未生成论文章节')
  }

  const withContent = sections.filter((item) => item.content)
  if (withContent.length === 0) {
    throw new Error('未生成论文正文，请重试')
  }

  return {
    title: paperTitle || sections[0].title,
    sections: withContent,
  }
}

module.exports = { callDeepSeek, parsePaper }
