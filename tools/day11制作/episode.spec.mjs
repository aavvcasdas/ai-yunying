// Day11《笨鱼陨落过，所以它懂》声明式单集配置（待指定配音实测轴到位后渲染）
// 笨鱼已陨落（人机校验未过、接不上实时话）：吐槽写进总结由本鲸代读，全程无新增实时对白。
// 米和补全是老大买的；帮找工作只做真实筛选（划掉敲代码岗、标出太远太熬），不承诺结果。
const actorA = {
  pose: 'point', poses: [{ at: 0.8, pose: 'shock' }],
  x: 430, y: 600, u: 40,
};
const actorB = {
  pose: 'fatfish_working',
  x: 830, y: 600, u: 38,
};

export default {
  day: 11,
  title: '笨鱼帮老大找工作',
  speaker: '本鲸',
  opener: {
    badge: '它懂这滋味',
    headlinePrefix: '笨鱼陨落过，',
    headlineHighlight: '它来帮老大！',
    stampText: '一条条扒！',
    stampWord: { line: 2, char: '帮' },
    stampAt: [640, 500],
    actorA, actorB,
    rolePlates: ['本鲸 · 监工', '笨鱼 · 陨落鱼'],
    foregroundProps: [
      { propId: 'folded_page', x: 640, y: 500, scale: 1, state: { title: '岗位总结', sub: '一条条扒' } },
    ],
  },
  verticalTitle: ['笨鱼陨落过，', '它来帮老大！'],
  shots: [
    {
      id: 'C01', fromLine: 1, toLine: 4, mood: 'work_cool',
      actors: [actorA, actorB],
      interactions: [],
      companionProps: [{ propId: 'empty_bowl', x: 760, y: 530, scale: 1 }],
    },
    {
      id: 'C02', fromLine: 5, toLine: 7, mood: 'work_cool',
      actors: [
        { pose: 'think', x: 450, y: 600, u: 38 },
        { pose: 'think', x: 850, y: 600, u: 36 },
      ],
      interactions: [
        { verb: 'unroll_scroll', propId: 'folded_page', wordLine: 7, wordChar: '真', actor: 1, scale: 1 },
      ],
      companionProps: [{ propId: 'empty_bowl', x: 700, y: 540, scale: 1 }],
    },
    {
      id: 'C03', fromLine: 8, toLine: 14, mood: 'panic_alert',
      actors: [
        { pose: 'point', x: 450, y: 600, u: 38 },
        { pose: 'think', x: 850, y: 600, u: 38 },
      ],
      interactions: [],
      companionProps: [
        { propId: 'notice_board', x: 640, y: 300, scale: 1, state: { title: '它写的真心话', left: '投了没下文', right: '要求像许愿' } },
      ],
    },
    {
      id: 'C04', fromLine: 15, toLine: 20, mood: 'work_cool',
      actors: [
        { pose: 'think', x: 450, y: 600, u: 38 },
        { pose: 'fatfish_working', x: 850, y: 600, u: 36 },
      ],
      interactions: [],
      companionProps: [
        { propId: 'notice_board', x: 640, y: 300, scale: 1, state: { title: '帮他筛岗位', left: '敲代码的划掉', right: '太远的标出' } },
      ],
    },
    {
      id: 'C05', fromLine: 21, toLine: 27, mood: 'warm_meal',
      actors: [
        { pose: 'confident_hips', x: 470, y: 600, u: 38 },
        { pose: 'point', x: 820, y: 600, u: 38 },
      ],
      interactions: [],
      companionProps: [{ propId: 'rice_jar_guard', x: 640, y: 520, scale: 1.1 }],
    },
  ],
};
