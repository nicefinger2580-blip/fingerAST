const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx')

function headingLevel(level) {
  if (level <= 1) return HeadingLevel.HEADING_1
  if (level === 2) return HeadingLevel.HEADING_2
  return HeadingLevel.HEADING_3
}

function buildDocument(title, prompt, sections) {
  const children = [
    new Paragraph({
      children: [new TextRun({ text: title || '学术论文', bold: true, size: 36 })],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ]

  const hasFullContent = sections.some((item) => item.content)
  if (!hasFullContent && prompt) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '研究主题', bold: true, size: 24 })],
        spacing: { before: 200, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: prompt, size: 22 })],
        spacing: { after: 300 },
      }),
    )
  }

  sections.forEach((item) => {
    if (item.checked === false) return
    const isChapter = item.level === 1
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: item.title,
            bold: isChapter,
            size: isChapter ? 26 : 24,
          }),
        ],
        heading: headingLevel(item.level),
        indent: item.level >= 3 ? { left: 720 } : item.level === 2 ? { left: 360 } : undefined,
        spacing: { before: isChapter ? 240 : 120, after: 120 },
      }),
    )

    const text = String(item.content || '').trim()
    if (text) {
      text.split(/\n+/).filter(Boolean).forEach((para) => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: para, size: 22 })],
            spacing: { after: 160, line: 360 },
            indent: { firstLine: 480 },
          }),
        )
      })
    }
  })

  return new Document({
    sections: [{ properties: {}, children }],
  })
}

async function createDocxBuffer(title, prompt, sections) {
  const doc = buildDocument(title, prompt, sections)
  return Packer.toBuffer(doc)
}

module.exports = { createDocxBuffer }
