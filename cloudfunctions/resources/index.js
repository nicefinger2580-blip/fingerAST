const cloud = require('wx-server-sdk')
const { SEED_ITEMS } = require('./seedData')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const SUBTYPE_LABELS = {
  prompt: '提示词素材',
  image_site: '图片素材网站',
  icon_site: '图标素材网站',
  opensource: '开源项目',
  tool: '实用工具',
  tutorial: '编写教程',
}

const MATERIAL_SUBTYPES = ['prompt', 'image_site', 'icon_site', 'opensource']

function formatItem(doc) {
  return {
    id: doc._id,
    category: doc.category,
    subType: doc.subType || '',
    subTypeLabel: SUBTYPE_LABELS[doc.subType] || '',
    title: doc.title || '',
    desc: doc.desc || '',
    tag: doc.tag || '',
    tagColor: doc.tagColor || 'blue',
    count: doc.count || '',
    icon: doc.icon || '📁',
    url: doc.url || '',
    sort: doc.sort || 0,
    hasContent: !!(doc.content && String(doc.content).trim()),
  }
}

function formatDetail(doc) {
  return {
    ...formatItem(doc),
    content: doc.content || '',
  }
}

function sortItems(list) {
  return list.sort((a, b) => {
    if (a.sort !== b.sort) return a.sort - b.sort
    return (a._id || '').localeCompare(b._id || '')
  })
}

function groupMaterialItems(items) {
  return MATERIAL_SUBTYPES.map((subType) => ({
    subType,
    label: SUBTYPE_LABELS[subType],
    items: items.filter((item) => item.subType === subType),
  })).filter((group) => group.items.length > 0)
}

async function seedResources(force = false) {
  const existing = await db.collection('resources').count()
  if (!force && existing.total > 0) {
    return { seeded: false, count: existing.total, message: '已有数据，跳过初始化' }
  }

  const now = db.serverDate()
  let added = 0
  for (const item of SEED_ITEMS) {
    if (!force) {
      const dup = await db.collection('resources').where({
        title: item.title,
        category: item.category,
      }).limit(1).get()
      if (dup.data.length > 0) continue
    }
    await db.collection('resources').add({
      data: {
        ...item,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      },
    })
    added += 1
  }
  return { seeded: true, added, message: `已写入 ${added} 条资源` }
}

exports.main = async (event) => {
  const action = event.action || 'list'

  try {
    if (action === 'seed') {
      const result = await seedResources(!!event.force)
      return { success: true, data: result }
    }

    if (action === 'list') {
      const category = Number(event.category)
      if (![0, 1, 2].includes(category)) {
        return { success: false, message: 'category 无效，应为 0/1/2' }
      }

      const countRes = await db.collection('resources').count()
      if (countRes.total === 0) {
        await seedResources(false)
      }

      const res = await db.collection('resources')
        .where({ category, enabled: true })
        .limit(200)
        .get()

      const items = sortItems(res.data).map(formatItem)

      if (category === 0) {
        return {
          success: true,
          data: {
            list: items,
            groups: groupMaterialItems(items),
          },
        }
      }

      return { success: true, data: { list: items, groups: [] } }
    }

    if (action === 'getDetail') {
      const id = event.id
      if (!id) {
        return { success: false, message: '缺少 id' }
      }
      const doc = await db.collection('resources').doc(id).get()
      const item = doc.data
      if (!item || item.enabled === false) {
        return { success: false, message: '资源不存在' }
      }
      return { success: true, data: { item: formatDetail(item) } }
    }

    return { success: false, message: '未知 action' }
  } catch (err) {
    console.error('resources error', err)
    return { success: false, message: err.message || '服务异常' }
  }
}
