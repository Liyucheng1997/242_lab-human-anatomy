// 数据来源。侧栏与"来源"面板据此渲染，逐条结构另有 Wikidata 链接可直接核对。
export const SOURCES = [
  {
    key: 'ta2',
    label: '拉丁名 · 英文名',
    name: 'Terminologia Anatomica 第2版（FIPAT/IFAA, 2019）',
    note: '国际解剖学术语标准，本项目随仓库附有 TA2 词表（CC BY-ND 4.0）。',
    url: 'https://ifaa.unifr.ch/Public/EntryPage/ViewTA2Part1.html',
  },
  {
    key: 'cnterm',
    label: '中文名',
    name: '《人体解剖学名词》第二版 · 全国科学技术名词审定委员会',
    note: '国家审定公布的规范解剖学名词，可在"术语在线"逐条检索。',
    url: 'https://www.termonline.cn/',
  },
  {
    key: 'pmph',
    label: '简介 · 功能',
    name: '《系统解剖学》第9版，人民卫生出版社',
    note: '结构描述、起止与功能以该教材为主要依据。',
    url: 'https://book.douban.com/subject/30481982/',
  },
  {
    key: 'kenhub',
    label: '简介 · 功能（补充）',
    name: 'Kenhub 中文版 / IMAIOS e-Anatomy 中文版',
    note: '用于补充临床要点与个别结构的细节描述。',
    url: 'https://www.kenhub.cn/',
  },
  {
    key: 'wikidata',
    label: '逐条核对',
    name: 'Wikidata（经 TA2 ID 属性 P7173 关联）',
    note: '本项目 1112 个结构附有 Wikidata 条目链接，可点击核对多语言名称与外部数据库编号。',
    url: 'https://www.wikidata.org/wiki/Property:P7173',
  },
  {
    key: 'zanatomy',
    label: '三维模型',
    name: 'Z-Anatomy（源自 BodyParts3D）',
    note: '模型与结构英文名的来源，CC BY-SA 4.0。',
    url: 'https://github.com/Z-Anatomy',
  },
]
