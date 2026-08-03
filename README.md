# 人体结构 · 交互式 3D 图谱（原型）

参考 [humanome.co](https://humanome.co) 的交互形式，用**开源、可商用**的解剖模型做的中文站。

## 资产来源与许可

模型**不来自 humanome**，而是直接使用同款开源根源：

- **Z-Anatomy** — <https://github.com/Z-Anatomy> · 许可证 **CC-BY-SA 4.0**
- 源自 **BodyParts3D**（日本 DBCLS，CC-BY-SA）

### 合规义务（CC-BY-SA）
1. **署名**：网站标注模型来自 Z-Anatomy / BodyParts3D（已在右侧面板）。
2. **相同方式共享**：你对模型的任何修改也须以 CC-BY-SA 开放。

## 已完成
- 从 [Z-Anatomy/Models-of-human-anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) 下载 `Z-Anatomy.zip`（内含 `Startup.blend`，4568 个 mesh）。
- 用本机 Blender 无界面导出 5 个系统层为 Draco 压缩 GLB，放在 `public/models/`：

  | 文件 | 系统 | 大小 |
  |------|------|------|
  | skeleton.glb | 骨骼 | 2.1 MB |
  | muscular.glb | 肌肉 | 5.0 MB |
  | cardiovascular.glb | 心血管 | 0.46 MB |
  | nervous.glb | 神经与感官 | 2.9 MB |
  | visceral.glb | 内脏 | 1.4 MB |

- 每个结构保留英文标准解剖名（如 `Left atrium`、`Ascending colon`，`.l/.r` 为左右侧）。
- **全部 1347 个结构已有完整中文数据**（中文名 / 英文名 / 拉丁名 / 所属系统 / 简介 / 功能），见下节。

## 结构数据

数据表在 `src/anatomy.json`，由 `assets_source/build_labels.py` 生成，覆盖 5 个 GLB 中全部
1347 个结构（对应 2342 个 mesh，含左右侧）。字段：

| 字段 | 含义 | 覆盖 |
|------|------|------|
| `zh` | 中文名 | 1347 / 1347 |
| `en` | 英文名 | 1347 / 1347 |
| `la` | 拉丁名 | 1294 / 1347 |
| `sys` | 所属系统 | 1347 / 1347 |
| `intro` | 简介（位置、形态、起止） | 1347 / 1347 |
| `func` | 功能（作用、临床要点） | 1347 / 1347 |
| `wd` | Wikidata 条目号，供逐条核对 | 1112 / 1347 |

### 数据来源

| 内容 | 来源 |
|------|------|
| 拉丁名、英文名 | [Terminologia Anatomica 第2版](https://ifaa.unifr.ch/Public/EntryPage/ViewTA2Part1.html)（FIPAT/IFAA 2019，CC BY-ND 4.0），词表随仓库存于 `assets_source/TA2.csv` |
| 中文名 | 全国科学技术名词审定委员会《人体解剖学名词》第二版，可在[术语在线](https://www.termonline.cn/)逐条检索 |
| 简介、功能 | 人民卫生出版社《系统解剖学》第9版；[Kenhub 中文版](https://www.kenhub.cn/)、[IMAIOS e-Anatomy 中文版](https://www.imaios.com/cn/e-anatomy) 补充临床要点 |
| 逐条核对链接 | [Wikidata](https://www.wikidata.org/wiki/Property:P7173)，经 TA2 ID（属性 P7173）关联 |

网页右侧面板底部的「查看全部数据来源」可展开同一份清单；选中结构后，卡片内会给出该结构自己的
Wikidata 链接。

### 重新生成数据表
```bash
python assets_source/build_labels.py
```
脚本直接读 `public/models/*.glb` 里的 mesh 名，与 `assets_source/terms/*.py` 中逐条编写的词条
对表，并把 TA2 拉丁名与 Wikidata 条目号并进来，最后打印覆盖率与未覆盖清单。新增/替换模型后
重跑即可看出还缺哪些结构。

## 运行
```bash
npm install
npm run dev   # http://localhost:5173
```

## 交互
- 拖拽旋转、滚轮缩放
- 上方按钮切换系统图层（可多选叠加）
- 点击任意结构 → 右侧显示中文名、英文名、拉丁名、所属系统、侧别、简介、功能与来源
- 点击空白处取消选择

## 重新导出其它图层（可复现）
> 注意：293MB 的 `Startup.blend` 超过 GitHub 单文件上限，未纳入仓库。先从
> [Z-Anatomy/Models-of-human-anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy)
> 下载 `Z-Anatomy.zip` 解压到 `assets_source/Z-Anatomy/` 即可。

源文件在 `assets_source/`。Blender 路径按你机器为 `D:\Blender\blender.exe`。
```bash
# 顶层集合名见下；把集合名和输出文件名替换即可
"D:/Blender/blender.exe" -b assets_source/Z-Anatomy/Startup.blend \
  --python assets_source/export_glb.py -- "3: Joints" public/models/joints.glb
```
Startup.blend 的顶层集合：
`1: Skeletal system` / `2: Muscular insertions` / `3: Joints` / `4: Muscular system` /
`5: Cardiovascular system` / `6: Lymphoid organs` / `7: Nervous system & Sense organs` /
`8: Visceral systems` / `9: Regions of human body`

## 下一步可扩展
- 结构搜索框（对 `anatomy.json` 检索中文名/英文名 + 相机聚焦到对应 mesh）
- 把 `anatomy.json` 拆成按系统的分包，做动态 import 减小首屏体积
- 病症信息接入（humanome 那 8000+ 条来自外部医学库，可自行接开放数据源）
- 半透明皮肤/表层，突出内部结构
