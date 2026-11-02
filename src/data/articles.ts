export const articles = [
  {
    slug: "newton-history",
    category: "力学",
    title: "ニュートンの法則を基礎から理解する",
    date: "2024.04.20",
    excerpt:
      "運動の基本法則であるニュートンの運動の法則について、その意味と使い方をやさしく解説します。",
    image: "pendulum",
  },
  {
    slug: "equation-of-motion",
    category: "力学",
    title: "運動方程式の立て方",
    date: "2024.04.18",
    excerpt:
      "物体の運動を式で表す運動方程式の立て方を、具体例とともに整理します。",
    image: "bridge",
  },
  {
    slug: "vector",
    category: "力学",
    title: "ベクトルの基本",
    date: "2024.04.15",
    excerpt:
      "力や速度を表すベクトルの考え方と、演算の基本を整理して解説します。",
    image: "blocks",
  },
  {
    slug: "balance",
    category: "力学",
    title: "力のつり合いを図で整理する",
    date: "2024.04.11",
    excerpt:
      "静止している物体に働く力のつり合いを、図を使ってやさしく整理します。",
    image: "books",
  },
  {
    slug: "friction",
    category: "力学",
    title: "摩擦力の基本と問題の解き方",
    date: "2024.04.09",
    excerpt:
      "摩擦力の向きや大きさの考え方と、よく出る問題の解法を丁寧に解説します。",
    image: "wood",
  },
  {
    slug: "acceleration",
    category: "力学",
    title: "等加速度運動を図でやさしく整理する",
    date: "2024.04.07",
    excerpt: "等加速度運動の式とグラフの関係を図解で整理します。",
    image: "road",
  },
  {
    slug: "circular-motion",
    category: "力学",
    title: "円運動の基本",
    date: "2024.04.05",
    excerpt: "等速円運動の向心力や角速度の考え方を、基礎から解説します。",
    image: "water",
  },
  {
    slug: "momentum",
    category: "力学",
    title: "運動量と衝突",
    date: "2024.04.03",
    excerpt: "運動量保存の法則と、弾性衝突・非弾性衝突を整理します。",
    image: "train",
  },
  {
    slug: "work-energy",
    category: "力学",
    title: "仕事とエネルギーの関係",
    date: "2024.04.01",
    excerpt: "仕事と運動エネルギーの関係を、図や具体例を使って解説します。",
    image: "arrow",
  },
  {
    slug: "momentum-conservation",
    category: "力学",
    title: "運動量保存則の応用",
    date: "2024.03.28",
    excerpt: "運動量保存則を使ったさまざまな問題のポイントを解説します。",
    image: "newton",
  },
];

export const imageFor = (seed: string, w = 800, h = 520) =>
  `https://picsum.photos/seed/physics-${seed}/${w}/${h}`;
