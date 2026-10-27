// ============================================================================
// whale_poses.mjs — 姿势注册表（v6）
//
// v4 的 9 张 + 本轮复刻旧版动作新生成的 9 张 = 18 张，全部是同一角色的差分姿势。
// 这里只登记「用哪张图、脚底线在哪」，骨架由 whale_rig.mjs 从 alpha 通道现量。
// ============================================================================

export const POSES = {
  // ---- v4：基础 9 张 ----
  idle:            { file: 'whale_idle.png',            foot: 0.988, tag: '站立' },
  wave:            { file: 'whale_wave.png',            foot: 0.989, tag: '挥手' },
  run:             { file: 'whale_run.png',             foot: 0.974, tag: '冲刺' },
  cry:             { file: 'whale_cry.png',             foot: 0.989, tag: '大哭' },
  shock:           { file: 'whale_shock.png',           foot: 0.988, tag: '震惊' },
  eat:             { file: 'whale_eat.png',             foot: 0.989, tag: '捧碗吃' },
  point:           { file: 'whale_point.png',           foot: 0.988, tag: '指证' },
  think:           { file: 'whale_think.png',           foot: 0.989, tag: '翻本子' },
  cheer:           { file: 'whale_cheer.png',           foot: 0.980, tag: '欢呼跳' },

  // ---- v6：按旧版 ACTION_LIST 复刻的 9 张 ----
  peek_curious:    { file: 'whale_peek_curious.png',    foot: 0.988, tag: '放大镜张望' },
  shy_fidget:      { file: 'whale_shy_fidget.png',      foot: 0.988, tag: '害羞戳手指' },
  ciallo_wink:     { file: 'whale_ciallo_wink.png',     foot: 0.988, tag: '比耶眨眼' },
  wake_stretch:    { file: 'whale_wake_stretch.png',    foot: 0.988, tag: '伸懒腰' },
  confident_hips:  { file: 'whale_confident_hips.png',  foot: 0.989, tag: '叉腰得意' },
  camera_shutter:  { file: 'whale_camera_shutter.png',  foot: 0.988, tag: '举相机' },
  eat_onigiri:     { file: 'whale_eat_onigiri.png',     foot: 0.988, tag: '啃饭团' },
  coin_hug:        { file: 'whale_coin_hug.png',        foot: 0.988, tag: '抱金币' },
  playful_fists:   { file: 'whale_playful_fists.png',   foot: 0.987, tag: '握拳抗议' }
};

export const POSE_NAMES = Object.keys(POSES);
