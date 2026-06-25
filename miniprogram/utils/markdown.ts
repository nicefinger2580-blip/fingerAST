/** 轻量 Markdown → HTML（inline 样式，供 rich-text 展示） */
export function markdownToHtml(md: string): string {
  if (!md) return ''

  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let inCode = false
  let codeBuf: string[] = []
  let inUl = false
  let inOl = false
  let inBlockquote = false

  const closeLists = () => {
    if (inUl) {
      html.push('</ul>')
      inUl = false
    }
    if (inOl) {
      html.push('</ol>')
      inOl = false
    }
  }

  const closeBlockquote = () => {
    if (inBlockquote) {
      html.push('</blockquote>')
      inBlockquote = false
    }
  }

  const inline = (text: string) =>
    escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:#f5f7fa;padding:2px 6px;border-radius:4px;">$1</code>')

  const hStyle = ['', '22px', '19px', '17px', '16px', '15px', '14px']

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    if (line.trim().startsWith('```')) {
      if (inCode) {
        html.push(
          `<pre style="background:#f5f7fa;padding:12px;border-radius:8px;font-size:13px;line-height:1.6;overflow:auto;"><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`,
        )
        codeBuf = []
        inCode = false
      } else {
        closeLists()
        closeBlockquote()
        inCode = true
      }
      continue
    }

    if (inCode) {
      codeBuf.push(line)
      continue
    }

    if (/^---+$/.test(line.trim())) {
      closeLists()
      closeBlockquote()
      html.push('<hr style="border:none;border-top:1px solid #eef0f4;margin:16px 0;"/>')
      continue
    }

    const hMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (hMatch) {
      closeLists()
      closeBlockquote()
      const level = hMatch[1].length
      html.push(
        `<h${level} style="font-size:${hStyle[level]};font-weight:700;margin:16px 0 8px;color:#1a2332;">${inline(hMatch[2])}</h${level}>`,
      )
      continue
    }

    const bqMatch = line.match(/^>\s?(.*)$/)
    if (bqMatch) {
      closeLists()
      if (!inBlockquote) {
        html.push('<blockquote style="border-left:4px solid #3B7CFF;padding-left:12px;margin:12px 0;color:#6b7a8f;">')
        inBlockquote = true
      }
      html.push(`<p style="margin:4px 0;">${inline(bqMatch[1])}</p>`)
      continue
    }
    closeBlockquote()

    const ulMatch = line.match(/^[-*]\s+(.+)$/)
    if (ulMatch) {
      if (!inUl) {
        closeLists()
        html.push('<ul style="margin:8px 0 8px 20px;padding:0;">')
        inUl = true
      }
      html.push(`<li style="margin:4px 0;color:#6b7a8f;">${inline(ulMatch[1])}</li>`)
      continue
    }

    const olMatch = line.match(/^\d+\.\s+(.+)$/)
    if (olMatch) {
      if (!inOl) {
        closeLists()
        html.push('<ol style="margin:8px 0 8px 20px;padding:0;">')
        inOl = true
      }
      html.push(`<li style="margin:4px 0;color:#6b7a8f;">${inline(olMatch[1])}</li>`)
      continue
    }

    if (/^\|.+\|$/.test(line.trim()) && !line.includes('---')) {
      closeLists()
      const cells = line.split('|').slice(1, -1).map(
        (c) => `<td style="border:1px solid #eef0f4;padding:8px;font-size:14px;">${inline(c.trim())}</td>`,
      )
      html.push(`<tr>${cells.join('')}</tr>`)
      continue
    }

    if (/^\|[-| :]+\|$/.test(line.trim())) {
      continue
    }

    if (!line.trim()) {
      closeLists()
      continue
    }

    closeLists()
    html.push(`<p style="margin:8px 0;line-height:1.75;color:#6b7a8f;">${inline(line)}</p>`)
  }

  closeLists()
  closeBlockquote()
  if (inCode && codeBuf.length) {
    html.push(
      `<pre style="background:#f5f7fa;padding:12px;border-radius:8px;font-size:13px;"><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`,
    )
  }

  return html.join('')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
