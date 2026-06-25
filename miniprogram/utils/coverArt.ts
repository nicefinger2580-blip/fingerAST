import type { TemplateItem } from './types'

function hashStr(str: string): number {
  let sum = 0
  for (let i = 0; i < str.length; i += 1) sum += str.charCodeAt(i)
  return sum
}

export function enrichTemplateCover(item: TemplateItem): TemplateItem {
  const hash = hashStr(item.id || item.title || '')
  const coverPattern = (hash % 4) + 1
  const coverSizes = ['sm', 'md', 'lg'] as const
  return {
    ...item,
    coverPattern,
    coverSize: coverSizes[hash % 3],
  }
}

export function enrichTemplateList(list: TemplateItem[]): TemplateItem[] {
  return list.map(enrichTemplateCover)
}
