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

- 每个结构保留英文标准解剖名（如 `Left atrium`、`Ascending colon`，`.l/.r` 为左右侧）。全部 790 个名称见 `assets_source/structure_names.txt`。
- 中英对照在 `src/labels.js`（已译常见结构，其余回退显示英文名，可批量补译）。

## 运行
```bash
npm install
npm run dev   # http://localhost:5173
```

## 交互
- 拖拽旋转、滚轮缩放
- 上方按钮切换系统图层（可多选叠加）
- 点击任意结构 → 右侧显示中文名/英文名/系统
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
- 结构搜索框（对 labels 检索 + 相机聚焦到对应 mesh）
- 批量补译 `structure_names.txt` 进 `labels.js`（可结合 `assets_source/TA2.csv` 术语表）
- 病症信息接入（humanome 那 8000+ 条来自外部医学库，可自行接开放数据源）
- 半透明皮肤/表层，突出内部结构
```
