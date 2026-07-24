const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// --- Mock Data ---
const demoManga = [
  {
    id: "one-piece",
    title: "One Piece",
    thumbnail: "https://m.media-amazon.com/images/I/91rE-pwA7QL._AC_UF1000,1000_QL80_.jpg",
    author: "Eiichiro Oda",
    genres: ["Action", "Adventure", "Fantasy"],
    status: "ongoing",
    description: "Follow Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger."
  },
  {
    id: "jujutsu-kaisen",
    title: "Jujutsu Kaisen",
    thumbnail: "https://m.media-amazon.com/images/I/81t3A2W2ZGL._AC_UF1000,1000_QL80_.jpg",
    author: "Gege Akutami",
    genres: ["Action", "Supernatural", "Horror"],
    status: "ongoing",
    description: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself."
  },
  {
    id: "attack-on-titan",
    title: "Attack on Titan",
    thumbnail: "https://m.media-amazon.com/images/I/81U5N5xOamL._AC_UF1000,1000_QL80_.jpg",
    author: "Hajime Isayama",
    genres: ["Action", "Dark Fantasy", "Post-apocalyptic"],
    status: "completed",
    description: "Humanity is forced to live in cities surrounded by enormous walls that protect them from gigantic man-eating humanoids."
  },
  {
    id: "demon-slayer",
    title: "Demon Slayer",
    thumbnail: "https://m.media-amazon.com/images/I/813+oKpxaUL._AC_UF1000,1000_QL80_.jpg",
    author: "Koyoharu Gotouge",
    genres: ["Action", "Historical", "Supernatural"],
    status: "completed",
    description: "A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon slowly."
  }
];

const demoChapters = {
  "one-piece": [
    { id: "op-1090", chapter_number: 1090, title: "Kizaru" },
    { id: "op-1089", chapter_number: 1089, title: "Hostage Situation" }
  ],
  "jujutsu-kaisen": [
    { id: "jjk-236", chapter_number: 236, title: "Heading South" }
  ],
  "attack-on-titan": [
    { id: "aot-139", chapter_number: 139, title: "Toward the Tree on That Hill" }
  ],
  "demon-slayer": [
    { id: "ds-205", chapter_number: 205, title: "Life Shining Across the Years" }
  ]
};

const dummyImages = [
  "https://placehold.co/800x1200/222222/FFFFFF/png?text=Realistic+Manga+Panel+1&font=Roboto",
  "https://placehold.co/800x1200/222222/FFFFFF/png?text=Realistic+Manga+Panel+2&font=Roboto",
  "https://placehold.co/800x1200/222222/FFFFFF/png?text=Realistic+Manga+Panel+3&font=Roboto"
];

// --- MOCK FIREFLY & MANGAHOOK ROUTES ---
// We use the exact same routes since our adapters expect similar endpoints.

// 1. GET /api/manga/latest?page=X
app.get('/api/manga/latest', (req, res) => {
  // Only return data on page 1 to stop pagination
  if (req.query.page && req.query.page !== "1") {
    return res.json({ mangas: [] });
  }
  res.json({ mangas: demoManga });
});

// 2. GET /api/manga/:id/chapters
app.get('/api/manga/:id/chapters', (req, res) => {
  const chapters = demoChapters[req.params.id] || [];
  res.json({ chapters });
});

// 3. GET /api/chapter/:id/images
app.get('/api/chapter/:id/images', (req, res) => {
  res.json({ images: dummyImages });
});

app.listen(PORT, () => {
  console.log(`Mock Provider APIs running on http://localhost:${PORT}`);
});
