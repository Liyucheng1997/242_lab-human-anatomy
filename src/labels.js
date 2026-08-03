// 解剖结构数据查询。
//
// 数据表 anatomy.json 由 assets_source/build_labels.py 生成，覆盖模型中全部
// 1347 个结构，每条含：中文名 zh / 英文名 en / 拉丁名 la / 所属系统 sys /
// 简介 intro / 功能 func / Wikidata 条目号 wd。
//
// GLB 里的 mesh 名带 Blender 的后缀，形如 "Femur.l.001"、"Skeletal system.g.001"，
// 归一化时必须先去掉末尾的 .001 编号，再去掉 .l/.r 等侧别后缀——顺序反了会漏掉
// 全部成对结构。
import DATA from './anatomy.json'

export const LABELS = DATA

const SIDE_SUFFIX = /\.(l|r|j|m|s|g)$/i

// mesh 名 -> anatomy.json 的键
function normalize(raw) {
  return stripSuffixes(raw).replace(/[*]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

// 依次剥离 .001 数字编号与 .l/.r/.j/.g 后缀（Blender 允许两者叠加）
function stripSuffixes(raw) {
  let s = String(raw).trim()
  for (let i = 0; i < 4; i++) {
    const before = s
    s = s.replace(/\.\d+$/, '')
    s = s.replace(SIDE_SUFFIX, '')
    if (s === before) break
  }
  return s.replace(/\s+/g, ' ').trim()
}

function side(raw) {
  const s = String(raw).replace(/\.\d+$/, '')
  if (/\.l$/i.test(s)) return '（左）'
  if (/\.r$/i.test(s)) return '（右）'
  return ''
}

export function lookup(rawName) {
  if (!rawName) return null
  const key = normalize(rawName)
  const sd = side(rawName)
  const hit = LABELS[key]

  if (!hit) {
    // 未收录：至少给出清理过的英文名，不让界面空着
    const en = stripSuffixes(rawName)
    return { zh: null, en, la: null, sys: null, intro: null, func: null, wd: null, side: sd }
  }

  return {
    zh: hit.zh ? hit.zh + sd : null,
    en: hit.en,
    la: hit.la || null,
    sys: hit.sys || null,
    intro: hit.intro || null,
    func: hit.func || null,
    wd: hit.wd || null,
    side: sd,
  }
}
