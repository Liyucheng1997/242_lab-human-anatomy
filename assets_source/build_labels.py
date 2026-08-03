# -*- coding: utf-8 -*-
"""
构建 src/anatomy.json：把 GLB 里的英文 mesh 名映射到
中文名 / 英文名 / 拉丁名 / 所属系统 / 简介 / 功能 / 外部核对链接。

数据来源（同时展示在网页侧栏，见 src/sources.js 与 README）：
  1. 拉丁名  —— assets_source/TA2.csv，FIPAT《Terminologia Anatomica》第2版(2019)，CC BY-ND 4.0
  2. 英文名  —— 同上 TA2 英文栏；模型自带结构名来自 Z-Anatomy
  3. 中文名  —— 以全国科学技术名词审定委员会《人体解剖学名词》第二版（术语在线 termonline.cn）
                与人民卫生出版社《系统解剖学》第9版为准，逐条人工核定
  4. 简介/功能 —— 依据《系统解剖学》第9版、Kenhub 中文版、IMAIOS e-Anatomy 中文版整理
  5. Wikidata QID —— 经 TA2 ID (属性 P7173) 关联，供前端给出可点击的逐条核对链接

用法：  python assets_source/build_labels.py
输出：  src/anatomy.json  并在终端打印覆盖率与未覆盖清单
"""
import json
import os
import re
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, 'public', 'models')
OUT = os.path.join(ROOT, 'src', 'anatomy.json')
OUT_OVERRIDES = os.path.join(ROOT, 'src', 'mesh-overrides.json')
TA2_CSV = os.path.join(ROOT, 'assets_source', 'TA2.csv')
WD_JSON = os.path.join(ROOT, 'assets_source', 'wikidata_ta2.json')

SYSTEM_ZH = {
    'skeleton': '骨骼系统',
    'muscular': '肌肉系统',
    'cardiovascular': '心血管系统',
    'nervous': '神经与感官',
    'visceral': '内脏系统',
}

CN_NUM = '一二三四五六七八九十'


def cn(i):
    """1..12 -> 一..十二"""
    if i <= 10:
        return CN_NUM[i - 1]
    return '十' + CN_NUM[i - 11]


# ---------------------------------------------------------------- GLB 读取
def glb_json(path):
    data = open(path, 'rb').read()
    off, js = 12, None
    while off < len(data):
        clen, ctype = struct.unpack('<II', data[off:off + 8])
        if ctype == 0x4E4F534A:
            js = json.loads(data[off + 8:off + 8 + clen].decode('utf-8'))
        off += 8 + clen
    return js


def base_name(raw):
    """去掉 Blender 的 .001 编号与 .l/.r/.j/.g 后缀，得到基础结构名。"""
    s = raw.strip()
    s = re.sub(r'\.\d+$', '', s)
    s = re.sub(r'\.(l|r|j|m|s|g)$', '', s, flags=re.I)
    return re.sub(r'\s+', ' ', s).strip()


def collect_structures():
    """返回 {基础名: 系统id}，同一名字出现在多个模型时取首次出现的系统。"""
    out = {}
    for fn in sorted(os.listdir(MODELS)):
        if not fn.endswith('.glb'):
            continue
        js = glb_json(os.path.join(MODELS, fn))
        for node in js.get('nodes', []):
            if 'mesh' in node:
                out.setdefault(base_name(node.get('name', '')), fn[:-4])
    return out


# ---------------------------------------------------------------- 外部资料
def load_ta2():
    by_en = {}
    with open(TA2_CSV, encoding='utf-8-sig') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if line.startswith('"') and line.endswith('"'):
                line = line[1:-1]
            p = line.split(';')
            if len(p) < 3 or p[0] == 'TA2ID':
                continue
            by_en.setdefault(p[1].strip().lower(), (p[0], p[2].strip()))
    return by_en


def load_wikidata():
    if not os.path.exists(WD_JSON):
        return {}
    out = {}
    for r in json.load(open(WD_JSON, encoding='utf-8')):
        if r.get('ta2') and r.get('qid'):
            out.setdefault(str(r['ta2']), r['qid'])
    return out


def key_of(name):
    return re.sub(r'\s+', ' ', name.replace('*', '')).strip().lower()


# ---------------------------------------------------------------- 词条注册
TERMS = {}


def add(table):
    """table: {英文名: (中文名, 简介, 功能)}"""
    for en, v in table.items():
        TERMS[key_of(en)] = v


# ============================ 规则化系列 ============================
ORD_EN = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth',
          'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth']


def ribs():
    t = {}
    special = {
        1: ('最短、最扁、弯曲度最大的肋，构成胸廓上口的前外侧界。',
            '其上面有前斜角肌结节和锁骨下动、静脉沟，保护经过胸廓上口的血管与臂丛。'),
        2: ('较第1肋细长，外面有前锯肌粗隆。', '构成胸廓上部侧壁，为前锯肌提供起点，是胸骨角平面的计数标志。'),
        11: ('浮肋，前端游离、不接肋软骨。', '保护肾与脾的后方，为腹壁肌与膈提供附着。'),
        12: ('最短的浮肋，前端游离。', '是腰方肌和膈的附着点，也是肾区叩击痛的骨性标志。'),
    }
    for i, w in enumerate(ORD_EN, 1):
        intro, func = special.get(i, (
            f'胸廓第{i}对弓形扁骨，后端与胸椎相关节，前端接肋软骨。',
            '构成胸廓侧壁，保护胸腔脏器，并在呼吸时升降以改变胸腔容积。'))
        t[f'{w.capitalize()} rib'] = (f'第{cn(i)}肋', intro, func)
        if i <= 10:
            t[f'Costal cartilage of {w} rib'] = (
                f'第{cn(i)}肋软骨',
                f'连于第{i}肋前端的透明软骨（第8–10肋软骨依次附着于上位肋软骨形成肋弓）。',
                '赋予胸廓弹性，使肋在呼吸时能够上提下降而不断裂。')
    return t


def vertebrae():
    t = {}
    for i in range(3, 8):
        extra = '第7颈椎棘突长而末端不分叉，隆于皮下，称隆椎，是计数椎骨的体表标志。' if i == 7 else ''
        t[f'Vertebra C{i}'] = (
            f'第{cn(i)}颈椎',
            f'颈段第{i}节椎骨，椎体较小、横突根部有横突孔供椎动脉通过。{extra}',
            '支撑头部并保护颈段脊髓，使颈部能大幅度屈伸、侧屈与旋转。')
    for i in range(1, 13):
        t[f'Vertebra T{i}'] = (
            f'第{cn(i)}胸椎',
            f'胸段第{i}节椎骨，椎体侧面有肋凹与第{i}肋头相关节，棘突长而向下倾斜。',
            '与肋骨、胸骨共同构成胸廓保护心肺，胸段脊柱以旋转运动为主。')
    for i in range(1, 6):
        t[f'Vertebra L{i}'] = (
            f'第{cn(i)}腰椎',
            f'腰段第{i}节椎骨，椎体粗大、棘突宽而水平后伸。',
            '承受上半身的大部分重量，允许躯干前屈、后伸与侧屈。')
    return t


DIGIT = {'first': '一', 'second': '二', 'third': '三', 'fourth': '四', 'fifth': '五'}


def phalanges():
    t = {}
    seg = {'Proximal': ('近节', '最靠近掌骨/跖骨的一节'),
           'Middle': ('中节', '夹在近节与远节之间的一节'),
           'Distal': ('远节', '最末端、托住甲床的一节')}
    for part, (pz, pd) in seg.items():
        for hf, (hz, dz, act) in {'hand': ('手', '指', '抓握与精细动作'),
                                  'foot': ('足', '趾', '站立与蹬地')}.items():
            for d, dz_num in DIGIT.items():
                if part == 'Middle' and d == 'first':
                    continue  # 拇指、踇趾只有近节和远节
                t[f'{part} phalanx of {d} finger of {hf}'] = (
                    f'第{dz_num}{dz}{pz}{dz}骨',
                    f'{hz}部第{dz_num}{dz}的{pz}{dz}骨，{pd}。',
                    f'构成该{dz}的骨性支架，为屈、伸肌腱提供止点，参与{act}。')
    return t


def metacarpals():
    t = {}
    for d, n in DIGIT.items():
        t[f'{d.capitalize()} metacarpal bone'] = (
            f'第{n}掌骨',
            f'手掌部第{n}掌骨，近端与腕骨相接，远端与近节指骨构成掌指关节。',
            '构成手掌骨性支架并形成掌弓，把抓握的力量从手指传向腕部。')
        t[f'{d.capitalize()} metatarsal bone'] = (
            f'第{n}跖骨',
            f'足部第{n}跖骨，近端与跗骨相接，远端与近节趾骨构成跖趾关节。',
            '构成足弓前部，站立和行走时分担并向前传递体重。')
    return t


def teeth():
    t = {}
    rows = {
        'medial incisor': ('中切牙', '牙冠呈凿形、切缘锐利，单根。', '切断食物，并参与发音与容貌构成。'),
        'lateral incisor': ('侧切牙', '位于中切牙外侧，形态相似而略小。', '切断食物。'),
        'canine': ('尖牙', '牙冠有一个锐利牙尖，牙根为全口最长。', '撕裂食物，并支撑口角外形。'),
        'first premolar': ('第一前磨牙', '牙冠有颊、舌两个牙尖。', '协助撕裂并初步捣碎食物。'),
        'second premolar': ('第二前磨牙', '牙冠有颊、舌两个牙尖，多为单根。', '协助捣碎食物。'),
        'first molar tooth': ('第一磨牙', '萌出最早的恒磨牙，咬合面宽大、有4–5个牙尖。', '磨碎食物，是建立咬合关系的关键牙。'),
        'second molar tooth': ('第二磨牙', '位于第一磨牙远中，咬合面宽大。', '磨碎食物。'),
    }
    for up, upz in (('Upper', '上颌'), ('Lower', '下颌')):
        for k, (zh, intro, func) in rows.items():
            t[f'{up} {k}'] = (f'{upz}{zh}', f'{upz}牙列中的{zh}，{intro}', func)
    return t


# 逐条人工编写的词条，按系统分文件存放于 assets_source/terms/
from terms import skeleton, muscular, nervous, cardiovascular, visceral  # noqa: E402

EXPLICIT = [skeleton.TERMS, muscular.TERMS, nervous.TERMS,
            cardiovascular.TERMS, visceral.TERMS]


# ============================ 主流程 ============================
def register_all():
    add(ribs())
    add(vertebrae())
    add(phalanges())
    add(metacarpals())
    add(teeth())
    for tbl in EXPLICIT:
        add(tbl)


# ------------------------------------------------ three.js 运行时名 / 歧义表
# three.js 的 GLTFLoader 会用 PropertyBinding.sanitizeNodeName() 处理节点名：
# 空格换成下划线，并删除 [ ] . : / 。点被删掉后侧别与编号后缀会糊在词尾，
# 例如 "Vertebra T1.001" 与 "Vertebra T10.001" 分别变成 vertebra_t1001 与
# vertebra_t10001——此时切分点无法由字符串本身确定（t1+001 还是 t10+001）。
#
# 绝大多数名称只有一种切法能命中词典，前端按候选逐个试即可。这里只把**确实存在
# 多种合法切法**的名称导出成一张小的歧义表交给前端，避免它去猜。歧义与否由数据
# 本身决定，模型换了重跑即可，不依赖前端用的是哪种试探顺序。
def runtime_name(raw):
    """复现 three.js 的 sanitizeNodeName + 前端 clean() 的规范化。"""
    s = raw.replace('*', '').lower()
    s = re.sub(r'\s', '_', s)
    s = re.sub(r'[\[\].:/]', '', s)
    s = re.sub(r'_+', '_', s)
    return s.strip('_')


def sanitize_key(k):
    s = re.sub(r'\s', '_', k)
    s = re.sub(r'[\[\].:/]', '', s)
    s = re.sub(r'_+', '_', s)
    return s.strip('_')


SIDE_LETTERS = 'lrjmsg'


def candidate_keys(rt, by_sanitized):
    """列出 rt 所有能命中词典的切分，返回 [(key, side), ...]。"""
    out = []
    if rt in by_sanitized:
        out.append((by_sanitized[rt], ''))
    m = re.search(r'\d+$', rt)
    digits = m.group(0) if m else ''
    for n in range(1, len(digits) + 1):
        cut = rt[:-n]
        if cut in by_sanitized:
            out.append((by_sanitized[cut], ''))
        if cut and cut[-1] in SIDE_LETTERS and cut[:-1] in by_sanitized:
            out.append((by_sanitized[cut[:-1]], cut[-1]))
    # 去重保序
    return list(dict.fromkeys(out))


def build_overrides(out):
    """扫描全部 mesh 名，导出歧义表 {运行时名: [词典键, 侧别字母]}。"""
    by_sanitized = {sanitize_key(k): k for k in out}
    overrides = {}
    seen = 0
    for fn in sorted(os.listdir(MODELS)):
        if not fn.endswith('.glb'):
            continue
        js = glb_json(os.path.join(MODELS, fn))
        for node in js.get('nodes', []):
            if 'mesh' not in node:
                continue
            raw = node.get('name', '')
            seen += 1
            rt = runtime_name(raw)
            cands = candidate_keys(rt, by_sanitized)
            if len(cands) <= 1:
                continue
            # 真实答案取自未经 sanitize 的原始名，可靠
            truth_key = key_of(base_name(raw))
            m = re.search(r'\.([lr])(?:\.\d+)?$', raw)
            overrides[rt] = [truth_key, m.group(1) if m else '']
    return overrides, seen


def build():
    register_all()
    structures = collect_structures()
    ta2 = load_ta2()
    wd = load_wikidata()

    out, missing = {}, []
    for name, layer in sorted(structures.items()):
        k = key_of(name)
        hit = TERMS.get(k)
        ta = ta2.get(k)
        entry = {
            'en': name,
            'sys': SYSTEM_ZH.get(layer, layer),
        }
        if ta:
            entry['la'] = ta[1]
            qid = wd.get(ta[0])
            if qid:
                entry['wd'] = qid
        if hit:
            entry['zh'], entry['intro'], entry['func'] = hit
        else:
            missing.append((layer, name))
        out[k] = entry

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=0, sort_keys=True)

    overrides, mesh_count = build_overrides(out)
    with open(OUT_OVERRIDES, 'w', encoding='utf-8') as f:
        json.dump(overrides, f, ensure_ascii=False, indent=0, sort_keys=True)

    total = len(out)
    done = total - len(missing)
    print(f'结构总数 {total}  已录中文 {done} ({done*100//total}%)  待补 {len(missing)}')
    print(f'拉丁名覆盖 {sum(1 for v in out.values() if v.get("la"))}')
    print(f'Wikidata 链接 {sum(1 for v in out.values() if v.get("wd"))}')
    print(f'mesh 总数 {mesh_count}  运行时名歧义 {len(overrides)} 条已写入歧义表')
    for rt, (k, s) in sorted(overrides.items()):
        print(f'    {rt} -> {k}{("." + s) if s else ""}')
    by_layer = {}
    for layer, n in missing:
        by_layer.setdefault(layer, []).append(n)
    for layer in sorted(by_layer):
        print(f'\n--- 待补 {layer} ({len(by_layer[layer])}) ---')
        for n in by_layer[layer]:
            print(' ', n)
    return out


if __name__ == '__main__':
    build()
