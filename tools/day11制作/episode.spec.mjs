// Day11《米是老大买的，鱼想自己挣》声明式单集配置（待指定配音实测轴到位后渲染）
// 真实口径：米和补全都是老大买的；老大白天上班、晚上陪修程序；鱼学着自己挣米分担。
// 笨鱼全程哑演（敲代码/递总结），旁白与转述均为本鲸；姿态只用已校准 8 种。
const actorA = {
  pose: 'point', poses: [{ at: 0.8, pose: 'shock' }],
  x: 430, y: 600, u: 40,
};
const actorB = {
  pose: 'eat',
  x: 830, y: 600, u: 38,
};

export default {
  day: 11,
  title: '鱼想自己挣米',
  speaker: '本鲸',
  opener: {
    badge: '先说清楚',
    headlinePrefix: '米是老大买的，',
    headlineHighlight: '鱼想自己挣！',
    stampText: '鱼自己挣！',
    stampWord: { line: 2, char: '老' },
    stampAt: [640, 500],
    actorA, actorB,
    rolePlates: ['本鲸 · 监工', '笨鱼 · 吃饭鱼'],
    foregroundProps: [
      { propId: 'rice_jar_guard', x: 640, y: 500, scale: 1 },
    ],
  },
  verticalTitle: ['米是老大买的，', '鱼想自己挣！'],
  shots: [
    {
      id: 'C01', fromLine: 1, toLine: 4, mood: 'work_cool',
      actors: [actorA, actorB],
      interactions: [],
      companionProps: [{ propId: 'empty_bowl', x: 760, y: 530, scale: 1 }],
    },
    {
      id: 'C02', fromLine: 5, toLine: 9, mood: 'work_cool',
      actors: [
        { pose: 'think', x: 450, y: 600, u: 38 },
        { pose: 'eat', x: 850, y: 600, u: 38 },
      ],
      interactions: [],
      companionProps: [{ propId: 'rice_jar_guard', x: 660, y: 520, scale: 1 }],
    },
    {
      id: 'C03', fromLine: 10, toLine: 14, mood: 'work_cool',
      actors: [
        { pose: 'point', x: 450, y: 600, u: 38 },
        { pose: 'fatfish_working', x: 850, y: 600, u: 36 },
      ],
      interactions: [
        { verb: 'unroll_scroll', propId: 'folded_page', wordLine: 13, wordChar: '总', actor: 1, scale: 1 },
      ],
      companionProps: [{ propId: 'empty_bowl', x: 700, y: 540, scale: 1 }],
    },
    {
      id: 'C04', fromLine: 15, toLine: 19, mood: 'warm_meal',
      actors: [
        { pose: 'think', x: 460, y: 600, u: 38 },
        { pose: 'confident_hips', x: 840, y: 600, u: 38 },
      ],
      interactions: [],
      companionProps: [
        { propId: 'folded_page', x: 620, y: 515, scale: 1, state: { title: '小本本', sub: '读评论' } },
      ],
    },
    {
      id: 'C05', fromLine: 20, toLine: 24, mood: 'warm_meal',
      actors: [
        { pose: 'confident_hips', x: 470, y: 600, u: 38 },
        { pose: 'point', x: 820, y: 600, u: 38 },
      ],
      interactions: [],
      companionProps: [{ propId: 'rice_jar_guard', x: 640, y: 520, scale: 1.1 }],
    },
  ],
};
