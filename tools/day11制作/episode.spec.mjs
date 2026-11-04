// Day11《老大找工作》声明式单集配置（通用引擎驱动，待指定配音实测轴到位后渲染）
// 笨鱼全程哑演（拍胸脯/写简历/比划），旁白与转述均为本鲸；姿态只用已校准 8 种。
const actorA = {
  pose: 'shock', poses: [{ at: 0.8, pose: 'point' }],
  x: 430, y: 600, u: 40,
};
const actorB = {
  pose: 'fatfish_working',
  x: 830, y: 600, u: 38,
};

export default {
  day: 11,
  title: '老大找工作',
  speaker: '本鲸',
  opener: {
    badge: '饭碗告急',
    headlinePrefix: '老大可能失业，',
    headlineHighlight: '鱼先急啦！',
    stampText: '包在它身上！',
    stampWord: { line: 1, char: '老' },
    stampAt: [640, 500],
    actorA, actorB,
    rolePlates: ['本鲸 · 监工', '笨鱼 · 热心鱼'],
    foregroundProps: [
      { propId: 'empty_bowl', x: 640, y: 520, scale: 1 },
    ],
  },
  verticalTitle: ['老大可能失业，', '鱼先急啦！'],
  shots: [
    {
      id: 'C01', fromLine: 1, toLine: 6, mood: 'work_cool',
      actors: [actorA, actorB],
      interactions: [],
      companionProps: [{ propId: 'name_plate', x: 640, y: 500, scale: 1, state: { text: '老大的饭碗' } }],
    },
    {
      id: 'C02', fromLine: 7, toLine: 11, mood: 'work_cool',
      actors: [
        { pose: 'point', x: 450, y: 600, u: 38 },
        { pose: 'fatfish_working', x: 850, y: 600, u: 36 },
      ],
      interactions: [
        { verb: 'unroll_scroll', propId: 'folded_page', wordLine: 8, wordChar: '真', actor: 1, scale: 1 },
      ],
      companionProps: [{ propId: 'empty_bowl', x: 700, y: 540, scale: 1 }],
    },
    {
      id: 'C03', fromLine: 12, toLine: 13, mood: 'work_cool',
      actors: [
        { pose: 'think', x: 450, y: 600, u: 38 },
        { pose: 'point', x: 850, y: 600, u: 38 },
      ],
      interactions: [
        { verb: 'slap_deflect', propId: 'speech_missile', wordLine: 12, wordChar: '投', text: '暂无回信', actor: 1, scale: 0.8 },
      ],
      companionProps: [{ propId: 'name_plate', x: 620, y: 520, scale: 1, state: { text: '简历' } }],
    },
    {
      id: 'C04', fromLine: 14, toLine: 18, mood: 'panic_alert',
      actors: [
        { pose: 'think', x: 430, y: 600, u: 38 },
        { pose: 'shock', x: 860, y: 600, u: 38 },
      ],
      interactions: [],
      companionProps: [
        { propId: 'notice_board', x: 640, y: 300, scale: 1, state: { title: '招人要求', left: '会敲代码', right: '会修直播' } },
      ],
    },
    {
      id: 'C05', fromLine: 19, toLine: 22, mood: 'warm_meal',
      actors: [
        { pose: 'confident_hips', x: 450, y: 600, u: 38 },
        { pose: 'eat', x: 850, y: 600, u: 38 },
      ],
      interactions: [
        { verb: 'knock_bowl', propId: 'rice_bowl', wordLine: 21, wordChar: '空', at: [720, 530], actor: 1, scale: 1 },
      ],
      companionProps: [{ propId: 'folded_page', x: 560, y: 520, scale: 0.9, state: { title: '面试小抄', sub: '先夸食堂' } }],
    },
    {
      id: 'C06', fromLine: 23, toLine: 26, mood: 'warm_meal',
      actors: [
        { pose: 'point', x: 470, y: 600, u: 38 },
        { pose: 'confident_hips', x: 820, y: 600, u: 38 },
      ],
      interactions: [],
      companionProps: [
        { propId: 'folded_page', x: 640, y: 515, scale: 1, state: { title: '岗位小本本', sub: '等你们支招' } },
      ],
    },
  ],
};
