export interface Project {
  id: string
  title: string
  blurb: string
  category: string
  tools: string[]
  makers: string[]
  date: string
  loves: number
  featured: boolean
  color: string
}

export const PROJECTS: Project[] = [
  {
    id: 'glow-garden',
    title: 'Glow Garden',
    blurb: 'A capacitive plant pot that pulses softly when you touch the soil. Built for the Engineering common room.',
    category: 'Electronics',
    tools: ['Soldering iron', '3D printer', 'Arduino'],
    makers: ['Aria T.', 'Theo K.'],
    date: '2026-04-11',
    loves: 142,
    featured: true,
    color: 'linear-gradient(146deg, #567dff 0%, #9f42d1 60%, #f04ab9 100%)',
  },
  {
    id: 'tessellate',
    title: 'Tessellate',
    blurb: 'A crochet blanket that maps a Penrose tiling across 280 hand-hooked hexagons. Took most of Semester One.',
    category: 'Textiles',
    tools: ['Crochet hook', 'Wool'],
    makers: ['Mei L.'],
    date: '2026-03-02',
    loves: 88,
    featured: false,
    color: 'linear-gradient(146deg, #9f42d1 0%, #f04ab9 50%, #ff25c7 100%)',
  },
  {
    id: 'bytecake',
    title: 'Bytecake',
    blurb: 'Pixel-art layer cakes for COMPSCI 230. Each slice is a sprite — and there are two-bit and four-bit cakes.',
    category: 'Food',
    tools: ['Piping bag', 'Oven', 'Patience'],
    makers: ['Sam W.', 'Jordan A.'],
    date: '2026-05-01',
    loves: 311,
    featured: true,
    color: 'linear-gradient(146deg, #ff25c7 0%, #ff3c6d 50%, #ff856a 100%)',
  },
  {
    id: 'caster',
    title: 'Caster',
    blurb: 'An open-source dice tower that rolls a real D20 on a Cherry MX switch. Plug it into anything.',
    category: '3D Print',
    tools: ['Resin printer', 'Soldering iron'],
    makers: ['Finn O.'],
    date: '2026-02-18',
    loves: 64,
    featured: false,
    color: 'linear-gradient(146deg, #567dff 0%, #9f42d1 100%)',
  },
  {
    id: 'quokka',
    title: 'Quokka Macropad',
    blurb: 'A nine-key RP2040 macropad for VS Code, built around a hand-routed PCB and a cheery 3D-printed shell.',
    category: 'Electronics',
    tools: ['KiCad', 'Soldering iron', '3D printer'],
    makers: ['Priya R.'],
    date: '2026-04-26',
    loves: 198,
    featured: true,
    color: 'linear-gradient(146deg, #567dff 0%, #f04ab9 100%)',
  },
  {
    id: 'forager',
    title: 'Forager',
    blurb: 'A Swift app that IDs mushrooms growing on campus after the rain. Trained on a tiny CoreML dataset we labelled ourselves.',
    category: 'Code',
    tools: ['Swift', 'CoreML', 'Figma'],
    makers: ['Liam B.', 'Naia P.'],
    date: '2026-03-19',
    loves: 124,
    featured: false,
    color: 'linear-gradient(146deg, #9f42d1 0%, #ff25c7 100%)',
  },
  {
    id: 'stickmaker',
    title: 'Stickmaker',
    blurb: 'A generative sticker pack — you tap once and get a unique vinyl sticker printed at our cutter. Ran every Tuesday this semester.',
    category: 'Art',
    tools: ['Procreate', 'Vinyl cutter', 'p5.js'],
    makers: ['Emi H.'],
    date: '2026-04-04',
    loves: 76,
    featured: false,
    color: 'linear-gradient(146deg, #f04ab9 0%, #ff856a 100%)',
  },
  {
    id: 'kowhai-lamp',
    title: 'Kōwhai Lamp',
    blurb: 'A laser-cut plywood lamp inspired by kōwhai flowers. Three nested shades, warm-white LED, ten dollars in materials.',
    category: 'Wood',
    tools: ['Laser cutter', 'Wood glue'],
    makers: ['Tane M.'],
    date: '2026-01-30',
    loves: 102,
    featured: true,
    color: 'linear-gradient(146deg, #ff3c6d 0%, #ff856a 100%)',
  },
  {
    id: 'yarnscape',
    title: 'Yarnscape',
    blurb: 'A woven wall hanging mapping the route between our common room and the Engineering library. Every member walked it and logged time.',
    category: 'Textiles',
    tools: ['Loom', 'Wool', 'GPS log'],
    makers: ['Ru S.'],
    date: '2025-12-12',
    loves: 41,
    featured: false,
    color: 'linear-gradient(146deg, #9f42d1 0%, #ff3c6d 100%)',
  },
  {
    id: 'open-hours',
    title: 'Open Hours, Term 1',
    blurb: 'Twelve weeks of Tuesday drop-in soldering, sewing and snacks. Sixty-four people, four broken irons, zero serious burns.',
    category: 'Workshops',
    tools: ['Soldering iron', 'Snacks'],
    makers: ['The Make Crew'],
    date: '2026-04-29',
    loves: 215,
    featured: true,
    color: 'linear-gradient(146deg, #567dff 0%, #ff25c7 100%)',
  },
  {
    id: 'loaf-lab',
    title: 'Loaf Lab',
    blurb: 'A sourdough fermentation logger — temperature, humidity, rise — plotted live to a Notion page. The starter is named Glenn.',
    category: 'Food',
    tools: ['Arduino', 'Notion API', 'Oven'],
    makers: ['Tas R.'],
    date: '2026-03-28',
    loves: 167,
    featured: false,
    color: 'linear-gradient(146deg, #ff25c7 0%, #ff856a 100%)',
  },
  {
    id: 'polywall',
    title: 'Polywall',
    blurb: 'Modular climbing holds for the new boulder wall behind the workshop. Twenty-two FDM prints, epoxied to plywood. They hold.',
    category: '3D Print',
    tools: ['3D printer', 'Epoxy'],
    makers: ['Jess Y.', 'Kai N.'],
    date: '2026-02-09',
    loves: 53,
    featured: false,
    color: 'linear-gradient(146deg, #567dff 0%, #f04ab9 60%, #ff3c6d 100%)',
  },
]

export const CATEGORIES = [
  'All',
  'Electronics',
  '3D Print',
  'Code',
  'Textiles',
  'Art',
  'Food',
  'Wood',
  'Workshops',
]

export const ALL_TOOLS: string[] = (() => {
  const s = new Set<string>()
  PROJECTS.forEach(p => p.tools.forEach(t => s.add(t)))
  return ['All tools', ...[...s].sort()]
})()
