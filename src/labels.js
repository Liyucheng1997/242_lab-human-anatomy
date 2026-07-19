// 解剖结构中文数据：医学标准中文名 + 简介 + 功能
// 字段：zh 中文名 | system 所属系统 | intro 简介 | func 功能
// Z-Anatomy 的 mesh 名为英文标准解剖名（带 .l/.r 侧别、末尾编号）。
// 查表做归一化：去侧别后缀、末尾编号、下划线、括号，转小写。
// 全部 790 个结构名见 assets_source/structure_names.txt，可继续分批补全。

export const LABELS = {
  // ========== 骨骼系统 ==========
  'femur':   { zh: '股骨', system: '骨骼系统', intro: '大腿内的长骨，人体最长、最强壮的骨。', func: '支撑体重、传递下肢负荷，为大腿肌群提供附着与杠杆。' },
  'tibia':   { zh: '胫骨', system: '骨骼系统', intro: '小腿内侧的粗大长骨，俗称迎面骨。', func: '主要承重骨，将体重从膝传至踝关节。' },
  'fibula':  { zh: '腓骨', system: '骨骼系统', intro: '小腿外侧的细长骨。', func: '稳定踝关节、为小腿肌肉提供附着，几乎不直接承重。' },
  'humerus': { zh: '肱骨', system: '骨骼系统', intro: '上臂唯一的长骨，上连肩、下接肘。', func: '构成肩、肘关节，为上臂肌群提供杠杆。' },
  'radius':  { zh: '桡骨', system: '骨骼系统', intro: '前臂外侧（拇指侧）长骨。', func: '参与前臂旋转（旋前/旋后）与腕关节构成。' },
  'ulna':    { zh: '尺骨', system: '骨骼系统', intro: '前臂内侧（小指侧）长骨。', func: '与肱骨构成肘关节，是前臂稳定的主轴。' },
  'scapula': { zh: '肩胛骨', system: '骨骼系统', intro: '背部上方的三角形扁骨。', func: '构成肩关节盂、连接上肢与躯干，为多块肌肉提供附着。' },
  'clavicle':{ zh: '锁骨', system: '骨骼系统', intro: '连接胸骨与肩胛骨的横行长骨。', func: '支撑肩部、传递上肢至躯干的力，保护下方血管神经。' },
  'sternum': { zh: '胸骨', system: '骨骼系统', intro: '胸前正中的扁骨，分柄、体、剑突三部。', func: '连接肋软骨、构成胸廓前壁，保护心脏与大血管。' },
  'body of sternum':    { zh: '胸骨体', system: '骨骼系统', intro: '胸骨的中段主体，两侧接第2–7肋软骨。', func: '构成胸廓前壁主体，参与呼吸时胸腔的扩张。' },
  'manubrium of sternum':{ zh: '胸骨柄', system: '骨骼系统', intro: '胸骨最上段，上缘为颈静脉切迹。', func: '与锁骨、第1肋相接，是胸廓上口的前界。' },
  'xiphoid process':    { zh: '剑突', system: '骨骼系统', intro: '胸骨最下端的小突起，年轻时为软骨。', func: '为腹壁肌与膈提供附着点。' },
  'mandible':{ zh: '下颌骨', system: '骨骼系统', intro: '面部唯一可动的骨，构成下颌。', func: '容纳下牙、参与咀嚼与发音。' },
  'patella': { zh: '髌骨', system: '骨骼系统', intro: '膝前方的籽骨，位于股四头肌腱内。', func: '增大伸膝力臂、保护膝关节前方。' },
  'sacrum':  { zh: '骶骨', system: '骨骼系统', intro: '由5块骶椎融合成的三角形骨。', func: '连接脊柱与骨盆，传递上身重量至下肢。' },
  'coccyx':  { zh: '尾骨', system: '骨骼系统', intro: '脊柱末端的小三角骨，由退化尾椎融合。', func: '为盆底肌与韧带提供附着。' },
  'rib':     { zh: '肋骨', system: '骨骼系统', intro: '弓形扁骨，左右各12对，构成胸廓侧壁。', func: '保护胸腔脏器、参与呼吸运动。' },
  'cranium': { zh: '颅骨', system: '骨骼系统', intro: '包围脑的骨性结构，由多块扁骨组成。', func: '保护脑、支撑面部结构。' },
  'incus':   { zh: '砧骨', system: '骨骼系统', intro: '中耳三块听小骨之一，位于锤骨与镫骨之间。', func: '传导并放大鼓膜的振动至内耳。' },
  'malleus': { zh: '锤骨', system: '骨骼系统', intro: '中耳听小骨，柄附着于鼓膜。', func: '将鼓膜振动传给砧骨。' },
  'stapes':  { zh: '镫骨', system: '骨骼系统', intro: '人体最小的骨，底板嵌于前庭窗。', func: '将振动传入内耳淋巴液，完成声音的机械传导。' },
  'fifth metatarsal bone': { zh: '第五跖骨', system: '骨骼系统', intro: '足外侧的跖骨，基底有粗隆。', func: '构成足弓外侧、支撑并传递足部负荷。' },
  'ilium':   { zh: '髂骨', system: '骨骼系统', intro: '髋骨上部的宽大扇形骨。', func: '构成骨盆侧壁、承托腹腔脏器，为臀肌提供附着。' },
  'ischium': { zh: '坐骨', system: '骨骼系统', intro: '髋骨后下部，坐骨结节为坐位承重点。', func: '坐位时支撑体重、为大腿后群肌提供起点。' },
  'pubis':   { zh: '耻骨', system: '骨骼系统', intro: '髋骨前下部，两侧于耻骨联合相接。', func: '构成骨盆前壁、保护盆腔脏器。' },
  'calcaneus':{ zh: '跟骨', system: '骨骼系统', intro: '足后部最大的跗骨，构成足跟。', func: '承受体重、经跟腱传递小腿肌力。' },
  'talus':   { zh: '距骨', system: '骨骼系统', intro: '位于胫骨与跟骨之间的跗骨。', func: '构成踝关节，传递体重至足部。' },

  // ========== 心血管系统 ==========
  'left atrium':  { zh: '左心房', system: '心血管系统', intro: '心脏左上腔，接收肺静脉回流的动脉血。', func: '将含氧血送入左心室。' },
  'right atrium': { zh: '右心房', system: '心血管系统', intro: '心脏右上腔，接收上下腔静脉的静脉血。', func: '将缺氧血送入右心室。' },
  'left ventricle':{ zh: '左心室', system: '心血管系统', intro: '心脏左下腔，室壁最厚。', func: '将含氧血泵入主动脉，供应全身。' },
  'right ventricle':{ zh: '右心室', system: '心血管系统', intro: '心脏右下腔。', func: '将缺氧血泵入肺动脉，送往肺部进行气体交换。' },
  'aorta':   { zh: '主动脉', system: '心血管系统', intro: '人体最大的动脉，起自左心室。', func: '将含氧血输送到全身各级动脉。' },
  'pulmonary trunk': { zh: '肺动脉干', system: '心血管系统', intro: '起自右心室的大动脉，随后分左右肺动脉。', func: '将缺氧血送往两肺。' },
  'superior vena cava': { zh: '上腔静脉', system: '心血管系统', intro: '汇集上半身静脉血的大静脉。', func: '将头颈、上肢的缺氧血导入右心房。' },
  'inferior vena cava': { zh: '下腔静脉', system: '心血管系统', intro: '人体最大的静脉，汇集下半身静脉血。', func: '将下肢、腹盆脏器的缺氧血导入右心房。' },
  'papillary muscle': { zh: '乳头肌', system: '心血管系统', intro: '心室壁上的锥状肌，连于腱索。', func: '收缩时牵拉腱索，防止房室瓣脱垂反流。' },
  'common carotid artery': { zh: '颈总动脉', system: '心血管系统', intro: '颈部大动脉，分颈内、颈外动脉。', func: '为头颈部供血。' },
  'femoral artery': { zh: '股动脉', system: '心血管系统', intro: '大腿主要动脉，髂外动脉的延续。', func: '供应下肢血液，是常用的动脉穿刺点。' },

  // ========== 内脏系统 ==========
  'liver':   { zh: '肝', system: '内脏系统', intro: '人体最大的实质性器官，位于右上腹。', func: '代谢、解毒、合成蛋白与胆汁、储存糖原。' },
  'lung':    { zh: '肺', system: '内脏系统', intro: '位于胸腔的呼吸器官，左二右三叶。', func: '进行氧与二氧化碳的气体交换。' },
  'kidney':  { zh: '肾', system: '内脏系统', intro: '腹后壁成对的蚕豆形器官。', func: '滤过血液、生成尿液、调节水盐与血压。' },
  'stomach': { zh: '胃', system: '内脏系统', intro: '消化道最膨大的部分，位于左上腹。', func: '储存食物、分泌胃酸与酶，初步消化蛋白质。' },
  'ascending colon':  { zh: '升结肠', system: '内脏系统', intro: '结肠起始段，沿右腹向上行。', func: '吸收水分与电解质，推进肠内容物。' },
  'transverse colon': { zh: '横结肠', system: '内脏系统', intro: '横行于上腹的结肠段。', func: '继续吸收水分、形成粪便。' },
  'descending colon': { zh: '降结肠', system: '内脏系统', intro: '沿左腹向下行的结肠段。', func: '储存并向乙状结肠输送粪便。' },
  'sigmoid colon':    { zh: '乙状结肠', system: '内脏系统', intro: 'S形弯曲的结肠段，接直肠。', func: '暂存粪便，参与排便。' },
  'rectum':  { zh: '直肠', system: '内脏系统', intro: '大肠末段，位于盆腔。', func: '储存粪便并引发排便反射。' },
  'duodenum':{ zh: '十二指肠', system: '内脏系统', intro: '小肠起始的C形段，接纳胆汁和胰液。', func: '中和胃酸、启动脂肪与蛋白质的消化。' },
  'jejunum': { zh: '空肠', system: '内脏系统', intro: '小肠中段，黏膜皱襞丰富。', func: '主要的营养吸收部位。' },
  'ileum':   { zh: '回肠', system: '内脏系统', intro: '小肠末段，接盲肠。', func: '吸收维生素B12、胆盐及剩余营养。' },
  'caecum':  { zh: '盲肠', system: '内脏系统', intro: '大肠起始的囊袋，连阑尾。', func: '接收小肠内容物、吸收水分。' },
  'appendix':{ zh: '阑尾', system: '内脏系统', intro: '盲肠末端的细长盲管。', func: '含淋巴组织，参与肠道免疫。' },
  'spleen':  { zh: '脾', system: '内脏系统', intro: '左上腹的最大淋巴器官。', func: '滤血、清除衰老红细胞、参与免疫。' },
  'pancreas':{ zh: '胰', system: '内脏系统', intro: '横位于上腹后方的腺体。', func: '分泌消化酶（外分泌）与胰岛素等激素（内分泌）。' },
  'gallbladder':{ zh: '胆囊', system: '内脏系统', intro: '肝下方的梨形囊。', func: '储存并浓缩胆汁，进食时排入十二指肠。' },
  'oesophagus':{ zh: '食管', system: '内脏系统', intro: '连接咽与胃的肌性管道。', func: '以蠕动将食物送入胃。' },
  'trachea': { zh: '气管', system: '内脏系统', intro: '颈胸部的软骨性气道，下分左右主支气管。', func: '输送空气进出肺、加温加湿并清除异物。' },
  'urinary bladder': { zh: '膀胱', system: '内脏系统', intro: '盆腔内储尿的肌性囊。', func: '储存尿液并在排尿时收缩排出。' },
  'greater omentum': { zh: '大网膜', system: '内脏系统', intro: '自胃大弯下垂覆盖肠管的双层腹膜。', func: '储存脂肪、限制感染扩散、免疫防御。' },
  'lesser omentum':  { zh: '小网膜', system: '内脏系统', intro: '连于肝与胃小弯之间的腹膜。', func: '包裹肝门血管与胆管的通路。' },
  'peritoneal cavity': { zh: '腹膜腔', system: '内脏系统', intro: '腹膜脏、壁两层之间的潜在腔隙。', func: '含少量浆液，减少脏器摩擦、利于蠕动。' },

  // ========== 肌肉系统 ==========
  'deltoid': { zh: '三角肌', system: '肌肉系统', intro: '覆盖肩部的三角形肌。', func: '外展上臂，前后束协助屈伸肩。' },
  'biceps brachii': { zh: '肱二头肌', system: '肌肉系统', intro: '上臂前面的双头肌。', func: '屈肘并使前臂旋后。' },
  'triceps brachii':{ zh: '肱三头肌', system: '肌肉系统', intro: '上臂后面的三头肌。', func: '伸肘。' },
  'pectoralis major': { zh: '胸大肌', system: '肌肉系统', intro: '胸前宽大的扇形肌。', func: '内收、内旋并前屈上臂。' },
  'rectus abdominis': { zh: '腹直肌', system: '肌肉系统', intro: '腹前壁纵行的带状肌，即腹肌。', func: '屈躯干、增加腹压。' },
  'gastrocnemius':  { zh: '腓肠肌', system: '肌肉系统', intro: '小腿后面浅层的双头肌，构成小腿肚。', func: '跖屈踝、屈膝，参与行走跳跃。' },
  'gluteus maximus':{ zh: '臀大肌', system: '肌肉系统', intro: '臀部最大最表浅的肌。', func: '伸髋、外旋大腿，维持站立姿势。' },
  'trapezius':{ zh: '斜方肌', system: '肌肉系统', intro: '项背部的大型菱形肌。', func: '提、降、内收肩胛骨，协助转头。' },
  'latissimus dorsi': { zh: '背阔肌', system: '肌肉系统', intro: '背下部宽阔的扁肌。', func: '内收、内旋并后伸上臂，如引体向上。' },
  'sternocleidomastoid': { zh: '胸锁乳突肌', system: '肌肉系统', intro: '颈侧斜行的长肌。', func: '单侧收缩转头、双侧收缩屈颈。' },
  'sartorius':{ zh: '缝匠肌', system: '肌肉系统', intro: '人体最长的肌，斜跨大腿前面。', func: '屈髋屈膝并外旋大腿。' },
  'adductor longus':{ zh: '长收肌', system: '肌肉系统', intro: '大腿内侧收肌群之一。', func: '内收并屈大腿。' },
  'adductor magnus':{ zh: '大收肌', system: '肌肉系统', intro: '大腿内侧最大的收肌。', func: '强力内收大腿，兼有伸髋作用。' },
  'anconeus muscle':{ zh: '肘肌', system: '肌肉系统', intro: '肘后方的小三角肌。', func: '协助伸肘、稳定肘关节。' },

  // ========== 神经与感官 ==========
  'brain':   { zh: '脑', system: '神经与感官', intro: '中枢神经系统的主体，位于颅腔。', func: '处理感觉、控制运动、主管思维情感与调节内脏。' },
  'cerebellum':{ zh: '小脑', system: '神经与感官', intro: '位于脑后下方的结构。', func: '协调运动、维持平衡与肌张力。' },
  'spinal cord':{ zh: '脊髓', system: '神经与感官', intro: '椎管内的柱状中枢神经。', func: '传导脑与躯体间信息，完成反射。' },
  'amygdaloid body': { zh: '杏仁体', system: '神经与感官', intro: '颞叶内侧的杏仁状核团。', func: '处理恐惧等情绪与情绪记忆。' },
  'hippocampus': { zh: '海马', system: '神经与感官', intro: '颞叶内侧的弯曲结构。', func: '形成新的长期记忆、参与空间定位。' },
  'thalamus':{ zh: '丘脑', system: '神经与感官', intro: '间脑的大型灰质核团。', func: '感觉信息（除嗅觉）通往大脑皮层的中继站。' },
  'adenohypophysis': { zh: '腺垂体', system: '神经与感官', intro: '垂体前叶，属内分泌腺。', func: '分泌生长激素、促甲状腺激素等，调控多个内分泌腺。' },
  'angular gyrus':{ zh: '角回', system: '神经与感官', intro: '顶叶下部的脑回。', func: '参与语言、阅读与数字处理。' },
  'anterior commissure': { zh: '前连合', system: '神经与感官', intro: '连接两侧大脑半球的纤维束。', func: '沟通两半球颞叶等区域的信息。' },
  'eyeball': { zh: '眼球', system: '神经与感官', intro: '视觉器官的主体，位于眶内。', func: '聚焦光线于视网膜、启动视觉信号。' },
  'anterior chamber of eyeball': { zh: '眼前房', system: '神经与感官', intro: '角膜与虹膜之间充满房水的腔。', func: '维持眼压、营养角膜与晶状体。' },
  'sciatic nerve': { zh: '坐骨神经', system: '神经与感官', intro: '人体最粗大的神经，由骶丛发出。', func: '支配大腿后群及小腿、足的运动与感觉。' },
  'median nerve':  { zh: '正中神经', system: '神经与感官', intro: '走行于前臂正中的神经。', func: '支配前臂屈肌和手部，感觉桡侧三指半。' },
}

// 归一化 key
function normalize(raw) {
  return raw
    .replace(/\.(l|r|j|m|s)$/i, '')
    .replace(/[._]\d+$/, '')
    .replace(/\d+$/, '')
    .replace(/[()*]/g, '')
    .replace(/[_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// 侧别
function side(raw) {
  if (/\.l$/i.test(raw)) return '（左）'
  if (/\.r$/i.test(raw)) return '（右）'
  return ''
}

// 清理后的规范英文名（去下划线、末尾编号、侧别后缀）
function displayName(raw) {
  let s = raw
    .replace(/\.(l|r|j|m|s)$/i, '')
    .replace(/[._]\d+$/, '')
    .replace(/\d+$/, '')
    .replace(/[_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const sd = side(raw)
  return sd ? `${s} ${sd === '（左）' ? '(L)' : '(R)'}` : s
}

export function lookup(rawName) {
  if (!rawName) return null
  const key = normalize(rawName)
  const s = side(rawName)
  const disp = displayName(rawName)

  // 只做精确匹配，避免「右肺上叶动脉」被误配成「肺」之类的错译。
  const hit = LABELS[key]
  if (hit) {
    return { zh: hit.zh + s, system: hit.system, intro: hit.intro, func: hit.func, name: disp }
  }
  // 未收录：回退显示规范英文名
  return { zh: null, system: null, intro: null, func: null, name: disp }
}
