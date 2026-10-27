// ============================================================================
// claude_poses.mjs — Claude 大小姐的立绘注册表 + 镜头用图
//
// 立绘来自 opsCar/claude-daxiaojie-assets（CC BY-NC-SA 4.0，署名见 ./claude_src/ATTRIBUTION.md）。
// 原图 1024×1536 透明 PNG，不重画、不改配色，只按镜头挑姿势 + 缩放 + 骨架绑定。
// ============================================================================

export const CLAUDE_POSES = {
  greet:     { file: 'pose_1_greet.png',      foot: 0.990, heightU: 10.6, tag: '打招呼' },
  explain:   { file: 'pose_2_explain.png',    foot: 0.990, heightU: 10.6, tag: '讲解' },
  wave:      { file: 'pose_3_wave.png',       foot: 0.986, heightU: 10.6, tag: '挥手' },
  flustered: { file: 'pose_4_flustered.png',  foot: 0.988, heightU: 10.6, tag: '慌' },
  signoff:   { file: 'pose_5_signoff.png',    foot: 0.988, heightU: 10.6, tag: '收尾' },
  refuse:    { file: 'pose_cross_arms_no.png', foot: 0.988, heightU: 10.6, tag: '抱臂拒绝' },
  present:   { file: 'pose_present.png',      foot: 0.988, heightU: 10.6, tag: '展示' },
  shocked:   { file: 'pose_shocked_back.png', foot: 0.988, heightU: 10.6, tag: '后仰震惊' },
  mic:       { file: 'pose_microphone.png',   foot: 0.986, heightU: 10.6, tag: '握麦' },
  teapot:    { file: 'pose_hold_teapot.png',  foot: 0.988, heightU: 10.6, tag: '端茶' }
};

// 每个镜头默认用哪张（数值是 cue 序号 4..16）
export const CLAUDE_SHOT_POSE = {
  4: 'greet',    // L04 空位牌
  5: 'refuse',   // L05 虚线尾巴 + 折扇
  6: 'explain',  // L06 账本
  7: 'present',  // L07 完播环形表
  8: 'explain',  // L08 半碗饭
  9: 'present',  // L09 蛋 + 批章 + 9:8
  10: 'wave',    // L10 电视（内=新版）
  11: 'greet',   // L11 薄肌预备饭
  12: 'signoff', // L12 点名 + 空椅
  13: 'wave',    // L13 电视里转圈
  14: 'mic',     // L14 饭碗当麦
  15: 'shocked', // L15 水缸 + 扎水
  16: 'flustered'// L16 褪色
};

export const CLAUDE_ACTION_POSE = {
  idle: 'greet',
  explain: 'explain',
  wave_hand: 'wave',
  refuse: 'refuse',
  present: 'present',
  mic: 'mic',
  shocked: 'shocked',
  flustered: 'flustered',
  signoff: 'signoff'
};
