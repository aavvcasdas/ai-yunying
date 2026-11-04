// schema_validator.mjs — episode.spec.mjs 声明式配置强校验
// 在渲染前拦截：缺失交互、同姿罚站、越界坐标、未知道具/动词、违规文案。
import { CALIBRATION } from '../互动元素/actor_contacts.mjs';
import { PROP_REGISTRY, propBottom } from './prop_registry.mjs';
import { validateOpenerActors } from './opener_director.mjs';

export const CALIBRATED_POSES = Object.freeze(Object.keys(CALIBRATION));
const VERBS = new Set(['drop_bonk', 'slap_deflect', 'tug_grab', 'knock_bowl', 'unroll_scroll']);
const ARABIC = /\d/;

function checkHookText(label, s) {
  if (typeof s !== 'string' || !s.trim()) throw new Error(`${label} 不能为空`);
  if (ARABIC.test(s)) throw new Error(`${label} 不得含阿拉伯数字：${s}`);
  if (s.length > 22) throw new Error(`${label} 过长（>22 字）：${s}`);
}

function posesOf(actor) {
  const list = [actor.pose, ...((actor.poses || []).map((p) => p.pose)), ...((actor.poseChanges || []).map((p) => p.pose))].filter(Boolean);
  return list;
}

function validateActor(actor, where) {
  if (!actor || typeof actor !== 'object') throw new Error(`${where} 角色配置缺失`);
  for (const pose of posesOf(actor)) {
    if (!CALIBRATED_POSES.includes(pose)) throw new Error(`${where} 使用未校准姿态 ${pose}（可用：${CALIBRATED_POSES.join(', ')}）`);
  }
  if (!Number.isFinite(actor.x) || !Number.isFinite(actor.y)) throw new Error(`${where} 角色坐标 x/y 必须为有限数`);
  if (actor.y > 640 || actor.y < 420) throw new Error(`${where} 角色脚位 y=${actor.y} 越界（应在 420..640）`);
}

function validatePropRef(ref, where) {
  if (!ref || !PROP_REGISTRY[ref.propId]) throw new Error(`${where} 未知道具 ${ref?.propId}`);
  const scale = ref.scale ?? 1;
  if (!Number.isFinite(ref.x) || !Number.isFinite(ref.y)) throw new Error(`${where} 道具坐标必须为有限数`);
  const bottom = propBottom(ref.propId, ref.y, scale);
  if (bottom > 600) throw new Error(`${where} 道具 ${ref.propId} 下沿 ${bottom.toFixed(1)} 越界（必须 <= 600）`);
}

/**
 * @param {object} spec episode.spec 内容
 * @param {object} [opts] { cueCount } 提供时校验行号范围
 */
export function validateSpec(spec, { cueCount = null } = {}) {
  if (!spec || typeof spec !== 'object') throw new Error('spec 必须为对象');
  if (!Number.isInteger(spec.day) || spec.day < 1) throw new Error('spec.day 必须为正整数');
  const opener = spec.opener;
  if (!opener) throw new Error('spec.opener 缺失：新集必须声明开场钩子');
  checkHookText('opener.headlinePrefix', opener.headlinePrefix || '');
  checkHookText('opener.headlineHighlight', opener.headlineHighlight || '');
  if (opener.badge) checkHookText('opener.badge', opener.badge);
  if (opener.stampText) checkHookText('opener.stampText', opener.stampText);
  if (!opener.actorA || !opener.actorB) throw new Error('opener.actorA / opener.actorB 缺失：开场须声明双人反差');
  validateActor(opener.actorA, 'opener.actorA');
  validateActor(opener.actorB, 'opener.actorB');
  validateOpenerActors([opener.actorA, opener.actorB]);
  for (const [i, p] of (opener.foregroundProps || []).entries()) validatePropRef(p, `opener.foregroundProps[${i}]`);
  if (opener.stampWord) {
    if (!Number.isInteger(opener.stampWord.line) || !opener.stampWord.char) throw new Error('opener.stampWord 须含 line（整数）与 char');
    if (cueCount != null && (opener.stampWord.line < 1 || opener.stampWord.line > cueCount)) throw new Error('opener.stampWord.line 超出台词行数');
  }
  if (!Array.isArray(spec.shots) || !spec.shots.length) throw new Error('spec.shots 不能为空');
  const ids = new Set();
  spec.shots.forEach((shot, i) => {
    const where = `shots[${i}]${shot?.id ? `(${shot.id})` : ''}`;
    if (!shot.id || ids.has(shot.id)) throw new Error(`${where} 镜号缺失或重复`);
    ids.add(shot.id);
    if (!Number.isInteger(shot.fromLine) || !Number.isInteger(shot.toLine) || shot.fromLine > shot.toLine) throw new Error(`${where} fromLine/toLine 无效`);
    if (cueCount != null && (shot.fromLine < 1 || shot.toLine > cueCount)) throw new Error(`${where} 行号超出台词范围`);
    const actors = shot.actors || shot.actorsPlan;
    if (!Array.isArray(actors) || !actors.length) throw new Error(`${where} 缺少 actors 声明`);
    actors.forEach((a, j) => validateActor(a, `${where}.actors[${j}]`));
    if (actors.length >= 2 && actors.every((a) => posesOf(a).every((p) => p === 'idle'))) {
      throw new Error(`${where} 双人全镜静立被拒：至少一人须有语义姿态`);
    }
    for (const [j, it] of (shot.interactions || []).entries()) {
      if (!VERBS.has(it.verb)) throw new Error(`${where}.interactions[${j}] 未实现动词 ${it.verb}`);
      if (!PROP_REGISTRY[it.propId]) throw new Error(`${where}.interactions[${j}] 未知道具 ${it.propId}`);
      if (it.wordChar != null && (typeof it.wordChar !== 'string' || it.wordChar.length !== 1)) throw new Error(`${where}.interactions[${j}] wordChar 须为单字`);
      if (it.verb === 'drop_bonk' && !Array.isArray(it.land)) throw new Error(`${where}.interactions[${j}] drop_bonk 必须声明 land 落点`);
    }
    for (const [j, p] of (shot.companionProps || []).entries()) validatePropRef(p, `${where}.companionProps[${j}]`);
    if ((shot.interactions || []).length && !(shot.companionProps || []).length && !shot.allowNoCompanion) {
      throw new Error(`${where} 有主交互时须至少一件配套物（companionProps），反应特写可声明 allowNoCompanion`);
    }
  });
  if (spec.shots[0].fromLine !== 1) throw new Error('首镜 fromLine 必须为 1（第 0 帧直接进入正片）');
  return spec;
}

/** 解析词点引用：{line, char} -> 秒（chars_timed 优先，缺失退回句首并标记估算）。 */
export function resolveWordTime(cues, line, char) {
  const cue = cues[line - 1];
  if (!cue) throw new Error(`词点行号越界：L${line}`);
  const hit = (cue.chars_timed || []).find((c) => c.ch === char);
  if (hit) return { time: hit.start, measured: true };
  return { time: cue.start, measured: false };
}
