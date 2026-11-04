// Day11《笨鱼鲸落过，所以它懂》声明式分镜。
// 动作密度对齐 Day10：每镜「入镜→词点接触→结果→反应」，配套物分时入场。
// 第 0 帧只留双人 + 顶部钩子 + 一张正在翻的岗位纸，铭牌/戳章/碗都不挤在首帧。
// 笨鱼无新增实时对白；米和补全是老大买的，只做筛选，不承诺找到工作。
const actorA = {
  pose: 'point', poses: [{ at: 0.72, pose: 'shock' }],
  x: 400, y: 600, u: 40,
};
const actorB = {
  pose: 'fatfish_working',
  x: 860, y: 600, u: 36,
};

const pageAt = [640, 456];
const bowlAt = [360, 468];
const jarAt = [250, 452];
const boardAt = [640, 118];

export default {
  day: 11,
  title: '笨鱼帮老大找工作',
  speaker: '本鲸',
  opener: {
    badge: '它懂这滋味',
    headlinePrefix: '笨鱼鲸落过，',
    headlineHighlight: '它来帮老大。',
    stampText: '一条条扒！',
    stampWord: { line: 2, char: '帮' },
    stampAt: [990, 390],
    platesAt: 0.85,
    actorA, actorB,
    rolePlates: ['本鲸 · 监工', '笨鱼 · 鲸落鱼'],
    foregroundProps: [],
  },
  verticalTitle: ['笨鱼鲸落过，', '它来帮老大。'],
  shots: [
    {
      id: 'C01', fromLine: 1, toLine: 3, mood: 'work_cool',
      actors: [
        { pose: 'shock', poses: [{ line: 3, pose: 'point' }], x: 400, y: 600, u: 40 },
        { pose: 'fatfish_working', poses: [{ line: 3, pose: 'think' }], x: 860, y: 600, u: 36 },
      ],
      interactions: [
        { verb: 'tug_grab', propId: 'folded_page', wordLine: 1, wordChar: '翻', actor: 1, at: pageAt, scale: 0.92, title: '岗位', sub: '先翻开' },
      ],
      companionProps: [
        { propId: 'name_plate', x: 300, y: 470, scale: 0.9, fromLine: 3, state: { text: '可能换岗' } },
      ],
    },
    {
      id: 'C02', fromLine: 4, toLine: 6, mood: 'work_cool',
      actors: [
        { pose: 'shock', poses: [{ line: 6, pose: 'think' }], x: 410, y: 600, u: 38 },
        { pose: 'fatfish_working', poses: [{ line: 5, pose: 'point' }], x: 850, y: 600, u: 36 },
      ],
      interactions: [
        { verb: 'unroll_scroll', propId: 'folded_page', wordLine: 4, wordChar: '扒', startLine: 4, actor: 1, at: pageAt, scale: 1, title: '岗位总结', sub: '一条条扒' },
      ],
      companionProps: [
        { propId: 'empty_bowl', x: bowlAt[0], y: bowlAt[1], scale: 0.9, fromLine: 6, state: { text: '这滋味' } },
      ],
    },
    {
      id: 'C03', fromLine: 7, toLine: 9, mood: 'panic_alert',
      actors: [
        { pose: 'point', poses: [{ line: 9, pose: 'shock' }], x: 420, y: 600, u: 38 },
        { pose: 'think', poses: [{ line: 8, pose: 'fatfish_working' }], x: 860, y: 600, u: 36 },
      ],
      push: { line: 9, z: 1.22, cx: 640, cy: 400, duration: 0.4 },
      interactions: [
        { verb: 'sink_drop', propId: 'folded_page', wordLine: 9, wordChar: '石', startLine: 7, actor: 1, at: pageAt, land: pageAt, scale: 0.95, title: '简历', sub: '沉进海里' },
      ],
      companionProps: [
        { propId: 'notice_board', x: boardAt[0], y: boardAt[1], scale: 1, state: { title: '真心话', left: '简历沉海里', right: '聊完没下文' } },
      ],
    },
    {
      id: 'C04', fromLine: 10, toLine: 13, mood: 'panic_alert',
      actors: [
        { pose: 'shock', poses: [{ line: 12, pose: 'playful_fists' }], x: 430, y: 600, u: 38 },
        { pose: 'point', poses: [{ line: 13, pose: 'playful_fists' }], x: 860, y: 600, u: 36 },
      ],
      interactions: [
        { verb: 'slap_deflect', propId: 'speech_missile', wordLine: 13, wordChar: '嫌', startLine: 11, actor: 1, scale: 0.82, text: '什么都要会' },
      ],
      companionProps: [
        { propId: 'notice_board', x: boardAt[0], y: boardAt[1], scale: 1, carry: true, state: { title: '要求像许愿', left: '什么都要会', right: '还嫌学历' } },
      ],
    },
    {
      id: 'C05', fromLine: 14, toLine: 16, mood: 'work_cool',
      actors: [
        { pose: 'playful_fists', poses: [{ line: 14, pose: 'think' }], x: 400, y: 600, u: 38 },
        { pose: 'point', poses: [{ line: 16, pose: 'fatfish_working' }], x: 860, y: 600, u: 36, walk: { from: 940, to: 800, startLine: 15, duration: 0.85 } },
      ],
      interactions: [
        { verb: 'mark_strike', propId: 'notice_board', wordLine: 15, wordChar: '标', startLine: 15, actor: 1, at: boardAt, text: '偷偷标', slot: 0 },
      ],
      companionProps: [
        { propId: 'notice_board', x: boardAt[0], y: boardAt[1], scale: 1, carry: true, state: { title: '一条条筛', left: '不是程序员', right: '先看岗位' } },
      ],
    },
    {
      id: 'C06', fromLine: 17, toLine: 19, mood: 'work_cool',
      actors: [
        { pose: 'think', poses: [{ line: 18, pose: 'point' }], x: 410, y: 600, u: 38 },
        { pose: 'fatfish_working', poses: [{ line: 17, pose: 'point' }], x: 820, y: 600, u: 36 },
      ],
      push: { line: 17, z: 1.2, cx: 700, cy: 340, duration: 0.45 },
      interactions: [
        { verb: 'mark_strike', propId: 'notice_board', wordLine: 17, wordChar: '划', actor: 1, at: boardAt, text: '敲代码', slot: 0, span: 'left' },
        { verb: 'mark_strike', propId: 'notice_board', wordLine: 18, wordChar: '标', actor: 1, at: boardAt, text: '太远', slot: 1, span: 'right' },
        { verb: 'mark_strike', propId: 'notice_board', wordLine: 19, wordChar: '熬', actor: 1, at: boardAt, text: '太熬', slot: 2, span: 'right' },
      ],
      companionProps: [
        { propId: 'notice_board', x: boardAt[0], y: boardAt[1], scale: 1, carry: true, state: { title: '帮他筛', left: '敲代码的', right: '太远太熬' } },
        { propId: 'folded_page', x: pageAt[0], y: pageAt[1], scale: 0.85, carry: true, state: { title: '筛过的', sub: '划掉标出', open: 1 } },
      ],
    },
    {
      id: 'C07', fromLine: 20, toLine: 22, mood: 'warm_meal',
      actors: [
        { pose: 'point', poses: [{ line: 21, pose: 'confident_hips' }], x: 620, y: 600, u: 38, walk: { from: 540, to: 640, startLine: 22, duration: 0.7 } },
        { pose: 'point', poses: [{ line: 20, pose: 'think' }], x: 920, y: 600, u: 34, flip: true },
      ],
      interactions: [
        { verb: 'handoff', propId: 'folded_page', wordLine: 22, wordChar: '递', startLine: 21, actor: 1, toActor: 0, at: [720, 456], scale: 0.9, title: '挑好的', sub: '递过去' },
      ],
      companionProps: [
        { propId: 'rice_jar_guard', x: 200, y: 468, scale: 0.95 },
        { propId: 'name_plate', x: 200, y: 392, scale: 0.78, state: { text: '老大买的' } },
      ],
    },
    {
      id: 'C08', fromLine: 23, toLine: 25, mood: 'warm_meal',
      actors: [
        { pose: 'confident_hips', poses: [{ line: 23, pose: 'eat' }], x: 560, y: 600, u: 38 },
        { pose: 'think', poses: [{ line: 25, pose: 'playful_fists' }], x: 900, y: 600, u: 34 },
      ],
      interactions: [
        { verb: 'knock_bowl', propId: 'rice_jar_guard', wordLine: 23, wordChar: '吃', startLine: 23, actor: 0, at: [200, 468], scale: 0.95 },
      ],
      companionProps: [
        { propId: 'name_plate', x: 200, y: 392, scale: 0.78, carry: true, state: { text: '老大买的' } },
        { propId: 'folded_page', x: 760, y: 456, scale: 0.78, carry: true, state: { title: '慢慢挑', sub: '先吃饭', open: 1 } },
        { propId: 'standee', x: 1100, y: 418, scale: 0.78, fromLine: 25, state: { title: '读评论', sub: '绝不摸鱼' } },
      ],
    },
  ],
};
