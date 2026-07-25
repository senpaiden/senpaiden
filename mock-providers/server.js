const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 4000;

const demoManga = [
  {
    "id": "solo-leveling",
    "title": "Na Honjaman Level Up: Ragnarok",
    "thumbnail": "https://uploads.mangadex.org/covers/ade0306c-f4b6-4890-9edb-1ddf04df2039/fe76445d-387f-4ff6-8340-f06403c20dbe.jpg.256.jpg",
    "author": "DAUL (다울)",
    "genres": [
      "Action",
      "Long Strip",
      "Adventure",
      "Fantasy"
    ],
    "status": "hiatus",
    "description": "After witnessing the death of one of their own, the Absolute Ones — creators of the many universes outside of our own — frantically seek to fill the power void left by their fallen brother. With earth's existence in danger once more as gates spill mo..."
  },
  {
    "id": "one-piece",
    "title": "One Piece Academy",
    "thumbnail": "https://uploads.mangadex.org/covers/b70113a5-32a3-44e8-a28f-0e88392808ba/22f544f1-32fc-4750-a1c4-2c851c876eb1.jpg.256.jpg",
    "author": "Souhei Kouji",
    "genres": [
      "Action",
      "Comedy",
      "Adventure",
      "School Life"
    ],
    "status": "ongoing",
    "description": "A spin off where the One Piece cast goes to a big academy & lives modern lives...."
  },
  {
    "id": "jujutsu-kaisen",
    "title": "Jujutsu Kaisen",
    "thumbnail": "https://uploads.mangadex.org/covers/c52b2ce3-7f95-469c-96b0-479524fb7a1a/6d9134b2-21ea-4d02-ac2b-7c0d1c6a2aaa.jpg.256.jpg",
    "author": "Akutami Gege",
    "genres": [
      "Award Winning",
      "Action",
      "Ghosts",
      "Adventure"
    ],
    "status": "completed",
    "description": "For some strange reason, Itadori Yuuji, despite his insane athleticism, would rather just hang out with the Occult Club. However, he soon finds out that the occult is as real as it gets when his fellow club members are attacked!\n\nMeanwhile, the myste..."
  },
  {
    "id": "chainsaw-man",
    "title": "Chainsaw Man",
    "thumbnail": "https://uploads.mangadex.org/covers/a77742b1-befd-49a4-bff5-1ad4e6b0ef7b/6e518bd1-5f60-446b-8832-bfe6bf74834b.jpg.256.jpg",
    "author": "Fujimoto Tatsuki",
    "genres": [
      "Award Winning",
      "Monsters",
      "Action",
      "Demons"
    ],
    "status": "completed",
    "description": "Broke young man + chainsaw dog demon = Chainsaw Man!  \n  \nThe name says it all! Denji's life of poverty is changed forever when he merges with his pet chainsaw dog, Pochita! Now he's living in the big city and an official Devil Hunter. But he's got a..."
  },
  {
    "id": "spy-x-family",
    "title": "SPY×FAMILY",
    "thumbnail": "https://uploads.mangadex.org/covers/6b958848-c885-4735-9201-12ee77abcb3c/91a35e78-62b2-41fe-9869-ce051f2d1070.jpg.256.jpg",
    "author": "Endou Tatsuya",
    "genres": [
      "Award Winning",
      "Action",
      "Animals",
      "Romance"
    ],
    "status": "ongoing",
    "description": "The master spy codenamed <Twilight> has spent most of his life on undercover missions, all for the dream of a better world. Yet one day he receives a particularly difficult order from command. For his mission, he must form a temporary family and star..."
  },
  {
    "id": "my-hero-academia",
    "title": "Boku no Hero Academia (Official Colored)",
    "thumbnail": "https://uploads.mangadex.org/covers/1a051bb3-094e-4494-aa2e-fdac29b9ab5b/a9d17668-36d4-414b-b146-e15dd8cdafb9.jpg.256.jpg",
    "author": "Horikoshi Kouhei",
    "genres": [
      "Official Colored",
      "Action",
      "Superhero",
      "Adventure"
    ],
    "status": "ongoing",
    "description": "Midoriya inherits the superpower of the world’s greatest hero, but greatness won’t come easy. \nWhat would the world be like if 80 percent of the population manifested superpowers called Quirks? Heroes and villains would be battling it out everywhere!..."
  },
  {
    "id": "attack-on-titan",
    "title": "Shingeki no Kyojin - Buaisou na Osananajimi no Hazukashi Gatteru Sugata ga Mite Mitai!! (Doujinshi)",
    "thumbnail": "https://uploads.mangadex.org/covers/529d7d4e-54ad-4370-8d12-163bf437c9d4/512c61d2-bed8-449c-a7d1-fb03a045f05a.jpg.256.jpg",
    "author": "Nozawa Yukiko",
    "genres": [
      "Romance",
      "Comedy",
      "Military",
      "Doujinshi"
    ],
    "status": "completed",
    "description": "Popular high-rated manga series...."
  },
  {
    "id": "demon-slayer",
    "title": "Slayers: Super-Explosive Demon Story",
    "thumbnail": "https://uploads.mangadex.org/covers/3da3ebeb-3870-48bd-90fe-a613eee07a4c/471da717-8887-4668-b5f0-8d3b60092c39.jpg.256.jpg",
    "author": "Kanzaka Hajime",
    "genres": [
      "Action",
      "Comedy",
      "Adventure",
      "Fantasy"
    ],
    "status": "completed",
    "description": "When Lina Inverse meets the dimwitted swordsman Gourry Gabriev, the two partner up in what should have been a temporary alliance… But when the two find themselves under constant attack by brutal demons out for their blood, they join up with Zelgadiss..."
  },
  {
    "id": "berserk",
    "title": "Kuro no Shoukanshi",
    "thumbnail": "https://uploads.mangadex.org/covers/dc332d04-d3b0-413c-a767-70f5e451b031/00a77dcc-0486-4d98-8f45-e8b986a91a3b.jpg.256.jpg",
    "author": "Mayoi Tofu",
    "genres": [
      "Reincarnation",
      "Monsters",
      "Action",
      "Demons"
    ],
    "status": "ongoing",
    "description": "\"If you truly want to get stronger, you have to challenge and defeat those stronger than yourself.\"\n\nWhile being transmigrated to another world, Kelvin bartered away his memories for a collection of powerful new abilities. Setting out on the ultimate..."
  },
  {
    "id": "the-eminence-in-shadow",
    "title": "Kage no Jitsuryokusha ni Naritakute!",
    "thumbnail": "https://uploads.mangadex.org/covers/77bee52c-d2d6-44ad-a33a-1734c1fe696a/6079dd31-838b-4d61-87c4-121f3ad19158.jpg.256.jpg",
    "author": "Sakano Anri",
    "genres": [
      "Reincarnation",
      "Action",
      "Demons",
      "Comedy"
    ],
    "status": "ongoing",
    "description": "Just like how everyone adored heroes in their childhood, a certain young man adored those powers hidden in shadows. Ninjas, rogues, shadowy mentor types, that sort of deal.  \r\nAfter hiding his strength and living the mediocre life of a NPC by day whi..."
  }
];
const demoChapters = {
  "solo-leveling": [],
  "one-piece": [],
  "jujutsu-kaisen": [],
  "chainsaw-man": [
    {
      "id": "chainsaw-man-1",
      "chapter_number": 1,
      "title": "A Dog and a Chainsaw"
    },
    {
      "id": "chainsaw-man-2",
      "chapter_number": 2,
      "title": "Pochita's Whereabouts"
    },
    {
      "id": "chainsaw-man-3",
      "chapter_number": 3,
      "title": "Arrival in Tokyo"
    }
  ],
  "spy-x-family": [],
  "my-hero-academia": [],
  "attack-on-titan": [],
  "demon-slayer": [
    {
      "id": "demon-slayer-1",
      "chapter_number": 1,
      "title": "An explosive girl enters the scene!"
    },
    {
      "id": "demon-slayer-2",
      "chapter_number": 2,
      "title": "Guard The Golden Muscle!"
    },
    {
      "id": "demon-slayer-3",
      "chapter_number": 3,
      "title": "Breach The Impregnable Fortress!"
    }
  ],
  "berserk": [
    {
      "id": "berserk-1",
      "chapter_number": 1,
      "title": "The Summoner"
    },
    {
      "id": "berserk-2",
      "chapter_number": 2,
      "title": "Dark Spirit Knight I"
    },
    {
      "id": "berserk-3",
      "chapter_number": 3,
      "title": "Black Soul Knight II"
    }
  ],
  "the-eminence-in-shadow": [
    {
      "id": "the-eminence-in-shadow-1",
      "chapter_number": 1,
      "title": "Chapter 1"
    },
    {
      "id": "the-eminence-in-shadow-2",
      "chapter_number": 2,
      "title": "Chapter 2"
    },
    {
      "id": "the-eminence-in-shadow-3",
      "chapter_number": 3,
      "title": "Chapter 3"
    }
  ]
};
const demoImages = {
  "chainsaw-man-1": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A1-612f24d412cc157e7221bd8a051d5d564adcd539931b8c0bd58b691c07bf8c90.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A2-e55084e7872e417f519215a5517cc9ebca71887f21ced2ef0642b9c9c3c5d1fa.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A3-f87a43c0a44a73f552ab58d13c00f8690c4167a5f8e50c7722d60a46a302a346.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A4-dd391d8eb86c963114927dafc5b6f7b7d2dba201b904442a1e1d8d3f58e75ee5.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A5-7abd9cd1324ceb47ce83c672010198ab691f786662ae9568b61fcb0846dc2e03.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A6-115581702069a1bc410ef7fee0cf77c4c12cb6a8fa9e74f1bbfad7a4032e74ef.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A7-20a396015398cbaf1e8ce96da71f21634b4d338305140e0ef614a1ed2a290cf7.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A8-f5c9ab2a268143f0d2a8944afa447295845f2dcdda7ad8848569194b5ca110ec.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A9-6e3a1de539b7a957f14523292c22fe30c8d4281fad2e07f120c028feb4986ed7.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A10-68fdb0e48ef7bb07f1cb0a7b21e77252ec00a2c9e08dfdfb1804ac560fc9accd.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A11-8424a32993df323af8650c6b6e2ebba27510962f685e7d2aea940d66207e3b97.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A12-27aa5af4ebe5e1b6c3e41abd3b90aad45f755692e9f62b3d2983ac79476d107f.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A13-d62b35a1e79f8db4385ccf4242ab71192ce6a2f416a810b9e58baef124d44cb1.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A14-b8966c7d4770815ff1556333be93aa52c5b4bada556d660889ecc6c4681fcf8b.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A15-6b8908222a99ad6e0da9b14a12401dd8784964192889af1fa90a3b6fafb97273.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A16-22aa4f4a5b9fd7b2da90cacc6785936a62037dfeb1fc174feb8ed97668777c6d.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A17-083fdbf673a49cf0de02ae057e5e6c54ba814ce62b751a1fb5f7f349d4ebcdad.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A18-c6b9ea108ee8efdf6f948bdbb672a0c78605f721d9eca615dd6921f9cb6e5fe0.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A19-52294848e6ad33c1927f6b92e99500258ba83554d2bead972850fa389d15a845.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A20-8a0b7fac865d8bc37563c8374ea873353b4e7cf9d8c547ca08e47dcec0bc0d5a.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A21-08cc234f3944ca370bf09dc99de4de7664464fd807c428442eb0db95938d8b34.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A22-01f4aa5cbb0090ac51bf4f601e5976aa75169760df078beb486b6d14e565b426.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A23-c94527d0551c579f56d4dea6c73ac84830f537801f06d916b4822293f93de456.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A24-54c226bbd3bb773e1aaa41947ae7c73d12316eda4803c3d58558b6dfba5db619.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A25-6b4b837e6c62218e4bef9638532db2d221a5341fd1a6255b69ac7aa7626c7813.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A26-8de302cfe1d296fdfa71eeb8fc03b22481e8af584769f544b0fe91ee338661d7.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A27-d75e1cd794ca3f1e610ec21701aa5a39cfb43585ba1f9d93497cf1e43a137ab7.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A28-5bbad9e569f35d29dd538342b53b3873cb9c83855e4bce73d529e8620316b102.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A29-d5f7aaa0667fa57d09060026846cc04ed0928b5701a78762e48c4b286deeee0c.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A30-66f2bfa821e8bfef3758f4309d98b13fe95a4c90b9de8616bdd74dd72a7b59b0.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A31-709b846da87a3a3dbfa4f3f506c3e84f17ca655a88f167ef7f5ff08de1de812d.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A32-e7dbcd9c5e3f846908fe46eef5cb13a7d1531526fb1dc53e649ac61e5762f8d3.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A33-bfc21be0a81cfb3d8f2c9c2e0656beae81f60ffc0756255d04faf08c80385d55.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A34-6b24c41d943ebccfd05ae18efc2724417f4703a5a79f1c12777d72dca5024be0.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A35-6ee876075d297a5bc28eefbded547bfadee38868624f5cf195258f8a45f7f48a.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A36-e30d842e6d56eef94a9a041b528557ebc74ba7632bd6ea446de2366da77f991b.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A37-f45adbf0f974dd9b6a894101448b7b375ed37a225fcee258aa0f833e9c1eb09f.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A38-0d992b5e9a3a75cab99caf0247f10adbdc33fc2bbd58f9fcb66edde5195a5ca7.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A39-ec714c8cdfe290418fe8293ddf1bb85767b3e6161be5a8fd4c903b87aadebe84.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A40-97e9501b5408667ac1938a262f31ac643303c6625c55c7959743f1c5df7f0cb1.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A41-8cab9ccccc8f72b8c824b1a846c0ca1af2c68946d7dd2692b28c699616fcda0b.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A42-96370caaedc9249d1368df00d28a0ec960cdb4ab3bceee9c371ece53231b33cb.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A43-a297f417a9b5fcc73e16f057a15aa6136c4ab3739ad5c13220be4c6d43793c7d.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A44-4e0f835a0a8fbe03def882cbabb23eef88ff5aa78593f94ad45835792f43fe40.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A45-4eee812e8ca7fb6fd15bc21bbdf71f00951fbae5e7549e4d04693a2cd8759f6a.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A46-b04401eb43e1e0e31ee9c3a463997d2cafff636107dc24152a1f4eb9fa119f63.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A47-c67cab860c0d4dd22e8bd4934b4e8e87309fdf753558b3868453abcd30a42536.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A48-8bc5a9c933d00a8d7d0d9df7eac0384060bc49aa746a82cadf27a479a147d017.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A49-399ec13af0cb62afdea08bc9df825ab63dc4f2ecf15a3076dff2a156b48e7cd6.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A50-6a98e3d147f620d8692aa856f5b4b3cc9156a7f031ef288e7abb9555a24a8808.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A51-0476913cc2e7d82702e07168d5f9bd495b7bd7cfb02640a8e3115b37864a7eac.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A52-5e0d2cc8377a6d03a5affeefeb8231ae039af894821d8516801ddb1df18c7752.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A53-5395d38a403aa9fbee6657072b76fe60823c7b54ed5ec85e2caaf0ba7a077d19.png"
  ],
  "chainsaw-man-2": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m1-b000bc8c05098422ef8746a81cc866deb73fc7cdedfb2f02985cf4eff2072e24.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m2-529045ff38848364a58ffd4cba0bfeaa5432fe1536472c84251e120efa28c8b2.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m3-a395827290d2634e9f3045b514d304926c9aa52335e2d2db3fb5ebab57920660.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m4-a9ae57462287e369c2f83baa85fc5970e2d8e49ebf2dc791eb689118a7f6ea87.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m5-4ea2b2c4bd0f57a13dcca9fc5c193169ba606c5afedc193aec991820ac28f89b.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m6-2be955e0fa007f62afb2a8ca01ee35af38440e1f81f696019a67ec3bcb6821a4.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m7-60f6464446dc5fc8d9dc25b9526d0ae47d63e40c3fa2b028201596f9b4adf696.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m8-eea018dd319dd90004e68404eb6d060a1fd401ad51de4be4609b0a41a783fbed.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m9-9c514a3d6d039f4f8f256ed00ffb4b685c3b0d479cd209c383ae09e8da34f6c4.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m10-50ec6d05456fc88da4bba9447a949ff6b3795804519a25c443e185a4b90c8867.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m11-da57ceec828c1209b9a46be7db39e53f5d92cf3245694b6c1cfa6beed9987c92.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m12-11005b327b6efe4614feee09e0c4cf08d7c94a0bd4a46d4da30e2688faea7cd8.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m13-db16c7e0964329b44e8dea8c2201fe3070a16428b9470f91bcf1f49a32be2c76.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m14-544c8df5592f55aa37c6d117c154fb74233c1883841b58b206574744549339fe.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m15-5db5259914bc7914a7326b0467ad511b1dc99b31a9315a81f1b153a8b8356761.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m16-9f4c992c55d70101317a47d3730f34075bab18e71c31cd023cb6b857540cf9a7.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m17-88e333bd15f69822f8e8d421a13090c490fdd76197998193a8555b1bd269766e.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m18-d8f5508fc4f14945065565b298fa3f1424db6c90ec649249c21ad3babee59a69.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m19-fba700fb0a2425a058c231805d5fb237aa09ff177710cd5ffdec9bc831f7dcd5.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m20-561163cbf0008e231c5666982c659e4663e0a265a2c7c5860a7375ed724e5dc8.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m21-8375bb83b421633ba28d24fe475191bf3df5a816e9b39ec480c9ab9db0e7a7d9.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m22-482bdb95cbb576be8f7c207c15755872b49c8c95b4a68011a462dcc91d76bf48.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m23-2dc719306d7acde05dc7c8ec07050f43413c306372683b016003513ac3dd03e7.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m24-ae19eac0b4972d80666f26c8b6006eaa2ad394f98a6da64c7750af4ba82d8c44.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m25-4e468bf1de0ca08e8502b7595948218de5b5bc58a8da77155c6d141e9010807a.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/9ca783495183d5137c48cf24bbdd94d0/m26-e0f484b8313617df7109b9fc7734b18ad2beffbe8434a94001df2966c14bff02.png"
  ],
  "chainsaw-man-3": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X1-a9ce089a4ce1c823a96eeed15ef0a187c15e052667fa82aa25880a3ab1a8611a.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X2-d2b67bdf8520282c9fbab42c6af9c112756a59dba5894bfc58df8e7e2e22251c.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X3-c70ff3e705140149fb270c5c4616dd16e34e70e8be9b73ffe9f105bd0658c686.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X4-ffe217bddb67862c4e3bbc97a62ae31a5086949a435d9ac1a1683519144bbedd.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X5-c2c7b6b03701f010317efeceb60dd1daff17296de98706f3096e7bc8069bbc5c.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X6-9fdbcb1692eedb29feb3bff2b87662d4b1316e1aee40576fe52e1fa02a89f0b4.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X7-13877da560a01646e4b779735bd17f0088f359fbf6637be6b74e71d4805499ca.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X8-3d72f5f47fa1b05927aa9338d5f57a41f846455ba8abd9a19163507ea96b5adb.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X9-c949d0506c13c2890af41eb99943b297b8a62693318c7200d0bc506b7aa52853.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X10-fe5967b686dc783f02d0aa91b4115a93946c89a409ae86b62716971c8e246ebc.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X11-690ec386debf9b827ec7fc4deb61579d11e87c92a9cd7e7945c8c16942a6eb0a.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X12-5cb58b1daa333f27c4cf55cfe3a4f16b94c1e21ae75dbc3d7b041fdf9af096ed.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X13-8e24f41bf4d20bde82acdb7a546d83e751eddcf52bad336637cc83083878f8d4.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X14-6e7f0fecf37badee0b0a973fc5e40b5b2c7da68f723773ca68505eb8202621f9.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X15-4ce6546fcac93fd8acbd2a13c27b3e42b9bf55c397669c77c28bc254395f6290.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X16-cc31ab8ace5e668e266fc9463f23f537a607d8cbaecc50b5787a7932dec91720.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X17-c5d392d08a05406b3546823e8dd1977b10f13f9bb2c72e4cff56fef8b5c94c1e.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X18-59d11cceb3cca5698fe7f031d023adebd80fb5a1a3aa6ee71e22879d2dc7a52a.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X19-3387a75060b57065e0049d7c16e615925eb46662cbb98ae87da2c435a5c67aca.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X20-555298d7a2c501db3d6ca3acba31ecbe582f5e19e73e480ee0ca1b8dc8ef5f40.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X21-1761514dff65e3fb12f5ca4c6e8b54ec22aabdff0e8ce142093b48c8c3a0caae.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X22-8ade16672fe2fd200972282658edbd79d1c046280f9b332a8798dc1e6e301603.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X23-b88958b03934163a6810bc89bce1ce97ade9dc612afa57ce24dc34a41a14ce41.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/6924a5165733d5881bdb78e44d8144bd/X24-e9fd1cb107f27c332bdad00689c1b646abc349189592e05d704046c3f4b267d4.png"
  ],
  "demon-slayer-1": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/1-d790b2b7d45d47fc2ed2b9d1a4e1108b97970d8e2a5c66d5412ade68a59c71b7.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/2-469351cf84be60b792d88e3140c06a592c8ad79123dcca2b2041dca1dea0d781.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/3-d3408fa27917af3c36182fd77980a0aa898123f74e1a3909885cb3c48f33a36b.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/4-2e4d14036f00dcd81a22a6e551f61149ebc93afd84d143a552727a7975158638.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/5-1394f22e5096493d77303781e0ce1f7db2739ec1f3ff644d5d7c324fbd03cc45.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/6-8a7bc3a3a9c65e21828edb5085b02ccfc08d6d0b6214f83da7591205a852e3c6.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/7-88843721b94f4eb5abf3425d0c37d5f7ab2ed67da9e1e5584c9081cfdf770c78.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/8-0b4b5a6a6ecb9f1e3fdb43b726c0e47ead2c90a19e836a1d438e2f2ddd8c97b8.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/9-3caae3a8052c04af5d98274f9051503c42ff36f9cd08743aef3e7987555a1079.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/10-4f053f3289545de9943959eaa313843236d18c249dba77c7fb4eb2146b38a8f1.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/11-7ef574751e2251782b34b79e69efab3bcca914b0b5a8c12a844baee0e13ca003.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/12-6661f31814308f1ddd5e7b3a82763b55f69caa1213e4914bfbeb96d886d47cac.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/13-ab0fde3073580ff79587430d915ffda3e52d0dc037d81087809667a1937daf02.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/14-49c4a4c36fa89a0e031cb4a2614a25176b19360c24db7f14833e6dedd6175d35.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/15-c008529b6b7ef7ba7abe54bcc48e0cbc2c98ecc5578a48a1d9f618b3836dd30a.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/16-cfa143c8ca03ceaedd1d8de10fb81c9f97539b303261e39b6b171736fc358ead.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/17-ff632f925920f47fe60538b5eccc71819aec7cd6d3ac1fe3a46fc5a8eb439da9.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/18-51701e635b42f6640df07a5affe47e824e9a3cb71951e492c4519591bd4f7767.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/19-e8010866d33047b305053a491e2f24ae0d5e48b536b49fde029d474a9e9380e2.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/20-fdb77d3bcd3b21af1e0f978c19647a3a66321d6dde89ad26be08ac0bd59aa868.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/21-5410660506b1eef78dba1cf10513a6c5c42f29af51a1c59bcbc0ce0ccd1f8908.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/22-562ae070358184bd8222eb456f6bde66da7fe7c37fc294a85a37bc60c45759c1.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/23-255bf33ef71f5cf31199db658897cc469a533140d4fd84dac5717703e62ca0b1.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/24-d54ec3aa943e9104c9421c6b1e886150cfab11014ae0e302184866b4677211fa.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/25-6ae07f57cf60298e55056fbb76b4be4ce7abe771e662e243cb0864f2771396d5.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/26-035dcaf122e09568f779a2402790c54998235c6f448ee7585731d1c886a03353.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/27-c81c950f698b5db14189b8be9891ab3db09aa1b324499abeba30e76f0ab46c82.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/28-9b0f60787aecf74680b3bc1faba80ddc82d2898742023524e84398a50a04916e.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/29-0ddd97183dd6d4225e55a1a0342f573705ab2633c36127194029b64345d392f8.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/30-ecac8f6cecd1a94308440c8151b0221a4482c4778cfb462b2c78b34695a39674.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/31-68a5108fdac8a0d66c3d1ea6711d5abcd264a46753190f7172ca182da1d21b07.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/32-f36b248d3ec6d6d45cf941b82ddbe2e92a193363a2bf843d8e73d1e3c89bb43e.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/33-b6f430f563d5599181c3af5e8b8aea1700602f2bb6e8a16e3b7651d286dc2bfb.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/34-5d27bdba3fb52df2593375dc3abe484318ec3eeccd4dbad8e876f8579424a9f7.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/35-1b33c75b015a101086bfda8848d922a22f09b4eab08a0e31efdd7f472f6f227f.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/36-a6e6bf1ad4ff2c9cf0f8a041f3375c5f58e45d2828217da65174eb5ae56e7fa7.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/37-63adc7f0db94804f412ba0888c68cae72cd75ee5dafd90eb5a86f74a334dd290.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/38-33bf12fbdcebbacafb5e030df1c0502f35fae4b1211fe925188058f71cd20934.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/39-9a73fc8785bcca1ecb4ca048e762f51ac791d976d56506e5f73b47052a4fb486.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/40-b370d1a08211f3a048837927b46bc1f8b25dbade25d67e295f164e1be4d3c81a.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/41-48c148b4952e3e9fcc24e0fffa7cc181166988bd5164f8ad1b3be43125a1c40d.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/42-4d34747ca769a575cd75fa9dcac2ded33efb7f248e23e2c7d969f6b4db84a886.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/43-b12c9716a79913fa305a5354083cf36299f24dbab5764ba41ff39b0f6c421a67.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/44-cea72e413adc83fc2bcaf668e86ca190e1d3b493d05e97775db4d2744266ad73.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/45-a23f1bd676e97cdc73140926e6a45515865a620677d49697a9588b4a6d06ff24.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/46-e8f044979ed439bdfb0e2224fde636697604406f8a93399e4a5bcbb15362c784.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/47-96620223ec5b601df1f8f5866f8f96c4e49dcddcb0a25517922c6bd89c75b96a.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/48-daff3ac52711f062f71dea993e267ad15bbe98352c9decf24fc132205ac26ceb.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/49-8b552daf648c1607533ce758a44689b31bc0e2e0bfb8f441832058c8c309e1b2.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/50-3ccc898a259831627810759fcfb6867bebacc01cbc1a77dd1e312fb7e6d2fb48.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/51-02d776c4e6f288bf5daa96346c403f2582bd8ca418b7c55d8b29c3ac07211a8d.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/58b4363b995c187149d6a88abf1ada1e/52-e370ee2593d6bf85ad2a8ff6b58ec256f33b0ab2fb9143ba2fed28c2b24ec96b.jpg"
  ],
  "demon-slayer-2": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x1-5416e832144b2ad0751dcdc8c9dde1e498ee2dec4ba3f34f1981d21fffe3f340.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x2-829d3488d882bf5d291c834400f47ebafb27c62de1a39bc6b48d17f081ff93ce.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x3-7483d9784bcd27b8172bcb2f4a909b5b6e3f0422799b70de53cd83fa12d5594f.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x4-c4c6086ee5d2f9c93b75a49ad9b5ea9bc70bfebbcde6fc1fd08164d481217667.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x5-8d5dd91dfdd92fefc40e261ccf61d0f2fb68cac906ae975cfe018c22696b394e.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x6-2348e58bf925efebd1884ffc7d3966c537fe3dc8c09649b694b03cc4bff57a5f.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x7-47070aef72791a170512d677e8432d6a78e6b4ea4e95eb1a13ba62a30f7fa36b.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x8-a3cb1ee778d124aef811bb76d4cfa1431c7e52e5b681a2a212a4b787f65f0cec.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x9-6f1c2d14977cdd6c1d0300ab934e500f2b1b98e5671199929a667843dffd5d62.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x10-e1aab764da0823d2f07f55922c03fc2b514797aa6f4f703e211b1c010c7b3fbf.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x11-eb9da3986a7f2f9b41e6c3f200e507a85347db6e3341a771e3e31df6d0fa1069.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x12-0f5fc882c493c07550a1462f40c1571d81293b21f5a37137eb696209108c8112.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x13-23778f9ffae2a674018e07e5067cc85a497f3ec67fdbf50e23a2fedb73810dd8.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x14-e85a8d74d001a276fc2492827c2468db729c4128746c71d71f7217624080d790.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x15-3de3555dc688b38e03bd941e8b51382e5b43b5d911f687693cba71f95d9eb24f.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x16-f811a1c15daa224b84eaf80dcd0a7be87aeee58a955a746646d1eb213b76b169.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x17-882ebc72a252011b56845f69dd09e97fa9f4f9e954ca56201fb0eb72453c5bce.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x18-e8fdfd68ab76b1fd2176b3b31fdebbcfcc1568f69c9d0271071fb68a2ae9c022.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x19-d5dc34dc1220a39a2bba7958f5ae509b8770a6ed9d698069037c776e5eadc74d.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x20-f97ed6c7e32fd6677f6f451493f33f0d344f8b2c6fed0ed7c4d0349fe49fe1a4.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x21-589151e830ee021681c61675d9f5bb1121498a69498b38d9ab7a8f6075f6f082.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x22-ab4f51aa46aff49d688ba7afc40f109e4ddef6c0417c4323f60518e4cd4679ae.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x23-63d4b858bb789d1898a546e56b49f3142729d2e97f74f88dee02912271091eb6.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x24-9a23b06be6b681505bfdf4f2bf5f906ba6d159f02051147d1cc935b89256a010.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x25-239b2fff70899aa9d155447e37effba2ba0b09c059b2af2fa73c3d437b621cae.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x26-e5763b786b3c9a25b6a8260e59f5e24529ca5c7eeb6c31a456df404194488323.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x27-22a24e7ebd97a4677aab30d0f0656fdea674b5d6a4c8abc788a4e0b496d0a719.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x28-e29ed3a2c17c8c3ffb9e1acf08a5939bbdfb38379e1a3c6d03fcb1fbb16922c1.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x29-6fdc8517634ed8d00a6c51795daaa56131b5283f881053538ec9688280f75453.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/bc42e96afb48fdbdfc117922d820434f/x30-318652a47e630b2d54731312af63fa53622ae97aff52172b556d66cfffc48ce2.png"
  ],
  "demon-slayer-3": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x1-5ff17d2c6230a3eadbe0ea0dcce8fa417143e41568c179c7ba17b1a38c0dd04d.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x2-2a11ea0956a97032a07439997fcddac42f8bee8174e5a244751721cdc447b401.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x3-f5a8133347b471d44f55565f65602d0e069d2b0515c0cd3485357d5248b62db4.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x4-d55a67203e50ff6022cdc185e26a28c26b915592ee1b9455fc1e0a0eb84b1f66.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x5-66c48faccb104f06da4429eb7f2cdf6cc41db7f74699b7d38a39f3356f5a702c.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x6-8ac733dee386d043421c1fc96ff79bc8f41cc97a895ea3fbd8326427a29464d0.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x7-5cc97ce6acd79394547c756bd51d46e0cf1be9e3b44bb73e07e663e633208217.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x8-02da37b2e960820307a6d147343e0b7426e1848ce1c98c8c0101bd1992858f09.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x9-d526aa5e6558362af97cd18fa8b4c572feb56c5b6c9cb4ce12647f91038c5983.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x10-f010cc1b739a826ab3833645d1ccccf2700d920e218e41747dc7ec2a3566166e.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x11-38bbfb5cd7b1ce4d7de5bae24ccc1bc76003a0f59ebcdfd8189902d058afad5f.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x12-5f3d4e32373c04541e3dbf7bc3f6aef21b86e8153530aa963de8ecb01e1a1db2.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x13-4993fe33d6c841892cce47aa4df41a3c0c2928e820b433f69906d9a154094ac2.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x14-a810cf9904823c70baf6bc3d0580ddc8776c2c7299e368ce6c2ae3fd9994ce33.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x15-d3898600b7924c86354d5472f4e531423eb1ab677082692a62cb7efb06552e1e.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x16-a60926fcb0a04ee7a2919e25fa588700e6716d7bb3862e97146066818434e557.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x17-d7426790292eedaee389f6e2ef1257289c4a23a006dee8fe66de8eb85dfde5e2.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x18-3e2a35ec33b8f019607a6fde063ac41f1f74d189d9d61ab36fbdeb488d94f680.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x19-e46369b6eabbf75c0395951f09e2074d3c591f98cf904f3d53c6192e9edfecd8.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x20-227207ef3b05d7a2fee1eb971f30366eed4b8abec5e3662c7201e49574db47b6.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x21-b2ab7d0c3c65ba4e62ba53062b6382fa9c5a6b4e04f1271b9fb4e036b333d599.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x22-d450180a47c6699e7cbb7cbf353f176078a50fea235241cb413eeb3af5e21a94.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x23-454f303eb708c9ba12cbfa56b318e16db170a688abf548e80ae428e7bfca934c.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x24-5f88d1c6f56cfae4994ee73ac9cb26fcfe60131d16e3469263bdaba579fbfc4b.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x25-68831fa7d59c11a2f15608c8f4a627e638bc983b7700d0a4e488454944ec7f27.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/4b1fb0585a865b9ef3ab4e0284cdd709/x26-dec1196d82faaf4602d1cafed6a2a61e10bb047a4cd2363d2b95c5d30535d905.png"
  ],
  "berserk-1": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x1-139c0d028ad3333d105bf8f940ceddfabb63bd016a7e243e265bfe3b0716faa6.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x2-e82da031240a4efd303b78cec12028ba4c53646d13c3bd0ef5f5eb47b026f32b.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x3-59a2287221d736e1f8c31f4f467f00f6c2b068737466fdb6d00e96586355d2c9.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x4-17be8c7275d5abbc3955e84625a8687bc0777f1b480a45f1b3d76f49e251f990.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x5-3a1028a710b20a24b14a64dfcc9949b43dd552efa9aba95a740c2f643a0adc63.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x6-d9f6b59fb2d080e81440ad905c53bb6d1176bc85ac7c5879468114c624995650.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x7-d592b7b1a087aad2e0fee407631903fb9e2a23f7dd3f3a8520f794e78de64c2e.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x8-8e4f678e6be85be9eb31fc5710ed87ea9559865016fe2edd117241b1e4fd30bf.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x9-c749ee9cf2aee2a8195dbd830f996377ec70c721291e846b319b2e42b90145f7.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x10-c1524b51f2a1482dbd8af10008bd2c56fb646d2fbea6f620358897317c82f1c9.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x11-94cf30631d8cebf4d8569cc6715a3ef5d60357bbb6dbc3ae96bccdbc13693eb8.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x12-66430c792e354dbc8add3ac729d1cf5db2c7ea0dcbec7544f229ae5369718125.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x13-42ceebf29a2f48a4725903e15c016cadb811c960fb8ce72e63813d7e92b2f65c.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x14-056e631de036e36c0620791364529be13688a0ec6a67b60d7d243dfc6a96c7b3.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x15-0c75be4bc7bf7b8b5016ca596f49de899f724b8891ddd28174b34838b1314d74.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x16-82da4f94479b96590ff992dcbdd660cd260b77bbb1796fafb66434c903828292.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x17-283982ab7b35b7386e44e9ef435a64e77800cee1a9c27476773eb0dc244bc9e3.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x18-e865163e962c364288d3248cb1fd568d8d019f4696360338638ed597a3b6e238.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x19-5269e55a62e2db22f175229136702e3954256056a4f99bbc15613fea5879805d.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x20-aaaf0e72aeb584f2107a54c43ab49024f9b50e8eb45446868f84adefa0b9f93c.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x21-1b026d2d1fdba8c3138f7a9bcfa07c6ac7e168930e7dd253fa2d700167ed04a5.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x22-996098924de00cd7ace5aa244524dccb1bed44cf44391455246d9a6e4dc310cf.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x23-2bd8d8879702d1fa4fdbdf25e44d5bb05511b328e026a1ccd1cf5c60cb8226e2.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x24-b365bb922f4e5fb56943bca8e9fb609be7a3ff7b0a481b9df315d4bb51ffcadf.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x25-f9e4c85462963923af05e879ac99fc8a6dee71dca8c71e0ffc2dcb621c8ae7f5.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x26-67312702968c3470b9ab82d9bfa8f1984395acf87f3b484bcb9422aaacd31b93.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x27-765e0c3ca7c40b99d87c43028cf6bb27abd64d82e9d95a9c416d937db39c2f88.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x28-998ebec1a8b4916775b3fc541ee853ab932275bfa9cebb691981b0990531dafa.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x29-1ee5e3ed8843088dc0913e84d620aca738d00dfaa9d60ecfcca438b86871459b.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x30-3cb65810f8690e89dca10557038b13be7d02284398d878e912d36c4228cff0a6.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x31-af4a9d29ee28aacc012cf86fd97649e405b3985c902db88f34d75860fd0f4299.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x32-4aa011201562d4542829abffba7ec6e151e8a0ff8406803470521a527a4ed84d.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x33-d370f9ca688ae771a66f6c6f698a40c8339cf99246f8e99b4da0629af20ca2db.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x34-65c2bcefdac69ae3316f9cef61844174d0ff93671ff62af39bede8c682160160.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x35-4130c42fcca40237829b4d497a78256375a63468752a25586c844805cc019cae.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x36-8e5b162407a69aed0f604ee6ce93c543c34c1980a251c25cb8c0e1bda9550ebc.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/74971aa4a97cb677a16457cb4a3af0cd/x37-cab9d816640f15e87bc4a0edba944753b8f2dd4983d8f946e4c8ced93854ff58.jpg"
  ],
  "berserk-2": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x1-3b59b1b278af3f8be1c69944ca6b2ec983f07bdf6e8208bffee936832b511bda.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x2-3e8ad9924dff1bf57218d33b76d4ba0980f74a845790dbf22fb2baba11673778.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x3-3da4d623d530931a39ae3c26192f82c0fc42bba6ed22d960279f6048174c39f1.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x4-5ca46ebd72c74d0abc8a2781985efaa7bb894effbc8de4000340d4b724f1f7f5.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x5-11c6f5634f5a404dff6651dd2441ebe14c33826cf99f39baffd503622cc43eda.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x6-c9f5fe12589b4a8afab998357ad7be90b8459ae1cc1e0058060e5e50902ed1ca.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x7-b8d76e01bb7af6828d779eb26a44cfd14613f7c8e5364cd70aff9fa0673e3bfb.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x8-e845cafff242255966f6a7d97f4b6cca29ee340c81f8df17ba427b1a95735fcb.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x9-4bc53d1d3285303ef24d74932b7c0041830abf3702def4848617bdbc36915c9b.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x10-a93b95c1629c348cf38a5cc0307f2928def4b8ba7688dda5615e90a9d45fa90f.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x11-fe3922d014cff2cedbf4cb772683f1906bc7d140468ffd8b346cd4852e45f698.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x12-1bdc81fddbb05c61d20ac1e8ef124f86614f2641a5eb4b8d99f5a5f04bb6ac3b.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x13-534e11e441e9479dacf716861f3f97ede8b926465c60343ea560b065dea0d2f5.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x14-c2f3c6a7032c84ea873535b82e10289d6b74df1e960fef1e267885c1c4b987b3.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x15-a727b41ac5b19ea16ade082e5fd4090fdc20ca082ce1b36d389e04566bdda52b.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x16-e781956ef1ec7aa4835d02fdbb570ee8dd36e9e7d4e793b3e0dffd1fc30da6fc.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x17-50d7f03ec4caf1ffefb5be828d5f70b0fa91822046066b79d97624fdcee82729.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x18-10dfdc997e52d157114f3397bebc44da8ca2fb8b8dacd2ac8758fd09ed149209.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x19-f583b3fd01b3a1b3735d5c0f5af6c3aba43580c7ed3042b842226001ce6504bf.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x20-86fffd47f6e96fd03b29ba09e08b4d0fe96a2dbdca16110d50d2b49ff2ca381b.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x21-711867d6debc0fccf48367ee9e1f873438ea42964d4bcb34258dbb82a2f0e507.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x22-760e16a17644be48221d9caa16d4204d29e94282cbe61d5def35c7fb2368583f.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x23-bcfc2f8dfb5c729e753e000ee0190f53a4e9a182ce2810cabf90480e0e4a6f79.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x24-4cf0e2e76f79b0d6712c03deb5b67adca0cd5dd3bd5cbf05c7e835145dd341b5.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x25-48121fcdeba82eec5860fd050fc06c17039521ec591fe16876ec548d1a8b0ca4.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x26-ffda929cd568618fd4f5b9234aa1909f054ab9d923ae3c55aa60356883c641ce.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x27-dd9f1803eb7a7a311391b2280b7abd1b3c5740037630a8c18638f94d036040e8.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x28-5728d36c4facd5c1100ecf9574ccf92044469419359a1b2a32bc421ea3aa1321.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x29-c0270087ba77c214fe1b094a7a87b389e56f4020707a38827e4fa9e32fdf8e3a.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x30-4f54783feced46166cda90921ae467cf6951966f7fbfeef256525ca2993d255b.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x31-9ea3370eb23f17b1116a2b3c1c3833fc77539aa787aa95f22eed9373c812b63f.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x32-a2d71ae8fbf708eab6b2db91cc58f5fcdb8f3af794b8fa7048b59087a6f6363e.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x33-cdd64a723e50179d78a5e2e2e12f17fa468a9c5d293853e5726f84f8c94347f3.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x34-f9b3b235b88da8c90c8b9c3762aa3e6d15a9cf3dd7f23feb30cd7d64cb978854.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x35-b139ebc533b97b06a9fcd876224a2662f0adadefda03bd35c69f53d000dcbe0d.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x36-ed4be576cf8a24c64c91aa18164d8c1828f2833b4f624acbbc6249312463f1ab.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x37-dbfd1eeb52c1e1bec105097f56cb316e48b0df2c4ad225fa36e8bcff0d4eab25.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x38-6c72143f99996f59069b251dac52243e42ee4a0bede6f98acb8b3c557a17d043.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x39-0db7b73df89b1c29351fe7fd3aa54da18f0b78073893b5b35ef928fa71837ae5.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/5b1922ba0d1f301eaa2cb3def88ea780/x40-b5ff7519f97fe94d6d9d1e321c6896f13d86b61a1f214a742736c36eb0205aeb.jpg"
  ],
  "berserk-3": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x1-b7f67ef179f3bd5dd5c3520d38ff5534f788c16faaacabf26df0aa4df05b7e1a.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x2-cc2c77b413db80098b7ee70edb3433c7027b63796df8493760aa1964338617d8.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x3-3c189c449375b120fb9929c031b16475c5b27073423ed064481d68c96099b4a4.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x4-81b82494c7435fa195e289cc4b947ee8540329c5804eed25e35abec5ba006585.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x5-7e411a0e088a0ec3d83581837c0d36f757de73eab72988385c963f4081c3bc8b.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x6-e19216c44e83b2b6dcdc34148fe156fad66e005e7583a240201b7f8274b95dd3.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x7-8d051cd19478f7d464ee44dd148e65b064303ba538a34da7db072b031866000c.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x8-2c114253d3522ae62e7b510e1c7482e6c00fd4de18a8df8ac9641605cb7c7a68.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x9-04c83e6fa68c7e973f17e585235591a5e9d8188751361aee8248c458a650178f.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x10-e27c753cf1e2fab5e5197f01cb2fbdc0c5a23db01fa7c31fcf8be9ee98064941.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x11-725f7293cb728e153f4492731b1917a26b23066615756ecfec77299e73f624eb.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x12-8cbb2c129b82433ef32d23e2863446111719dc2e0fd0640b6ed8d4b18e87f3a6.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x13-d11a3ceef6d0e99c5fcfeb079777505c411de685fcc66ad528572a2b842d7490.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x14-098b809221eb2256e4e63434580400242216f744293b2c568ae5c696a9d54e26.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x15-cc5791bc571cce2ef6699e680f7a1a0f64ccd9482e3a5a26afcf58e33f514aa1.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x16-dceb638be0892b69ea9250de12f9f1930ea74913aa5d47de5648944954ced3b8.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x17-a30b385186bc2a823de7b0e42aad098bbc99843f3be78bc8a6ac660d67ee4f48.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x18-ffcd05405916700c177d0063212058be3c07aa4e9537226cbe5e8e4abbc10dc6.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x19-97f62531f6eeb842ff1f861ef4b56f4b0b6ab9394f0c8296341aab4a70be2bef.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x20-fe5bbc0b8c8e35e37c2a5cb1ea82782f86949b00c12c075176b438495cd304b3.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x21-1b5c23f8dc8ba3499ccd110d9bc62fa34cece0415f1d3701dd46d745a0b4d8cf.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x22-045646e93f33c09934eebaa527f047893baecedc0517877b037893c77bdb22cf.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x23-3c87180947359c986cea269ab6835f6d90156cb8f2f8bef9bb52d69e24bcd648.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x24-1920a5072d64b214ff5fc6ac19f42d131ef0f4c476180114beab73b3da4c6feb.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x25-3f5a4016548b35e0f382811cc9ef5444ee8ae5c4aedc09f5222d9a7dc8c2c0b0.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x26-7c7e46b7c37d46d483c679f27f3804d9e3b273c16367d9ce9a66b683f16e8672.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x27-da9c61fe097db16b2e3bd177534f4fb36cf2b7e84d0093473017def97fd00a88.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x28-f4a535718ce9e5381a9d7f3b8c3a760973bcec36eec0c7c683883e7871afade9.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/c9c18c9f4bda025ef01083f5579acda7/x29-e82da031240a4efd303b78cec12028ba4c53646d13c3bd0ef5f5eb47b026f32b.jpg"
  ],
  "the-eminence-in-shadow-1": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x1-99066c859da11f13dad0402c3fce96fcd3d2f37474ba526dae3b290a411b44a2.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x2-764cab5bb334bc8ab93049a05c63229dad34165e6ad0896594287f53421556bc.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x3-282f9eaa9c3f9f425b7a86d15088de0d9715b7e2b4dd366dcbcd4ab6fd0b7c4a.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x4-41d60e0df78586f6c7d3d6e7eec89898bf9bf8c97c43355147fc1dc57ae953f5.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x5-c7370f0c1909ef036e7f146ac4451dfa5e2a1f6bba6c243b7b09b32118b03bc2.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x6-600c6ed9faa536b585bed1b13b5fbc6a8e41ac9f10b61e7fd451028df1373ca4.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x7-29bd6935a2e8a9452f2861555ca54b8e86654f07c9fbfc1fbd1e4dd40a770543.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x8-41183e2236bdfdb7020096a72892d5c2ab5675c64ad947f68bfdad64ced8625b.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x9-ab0fe8f1c812327fee4458786044ed38b35db1bee7150b25d9df6283fab80ce5.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x10-4dc9b6d41bdfdad3419fc3b2ee5650d1640b83854e789376abe0aae44ee242ef.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x11-7b3adc466375668da8f3c4dadb98fc160df7ef9af07545a61fc4a1101f3e6a80.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x12-faa9512585516f07c0d9431a3e300aaae6501604cf6e08b114dcd1d70ffcf280.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x13-5b97e953a0661c06c067872cbd2e0a85aa9b556041ce90a001739acf92c90566.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x14-ba3d3473a55607dd204a71be7afadb836cb00a2e91babe7396d619cbafe357d7.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x15-1a71b8cedb3858c40d2707d3c3caaeb0671f0de8f0a16ae2b9976e386bbb808f.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x16-599c8e5bc870148689e0c6704babc6c86e4520fb87983f7834f9b51c554bd937.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x17-aa37989c162878a02f0f4f7ac5edafcd7ab26281a2d3a8c14c4241f717dda54d.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x18-fc721e35d26970a9a01ccd79ab6653c9f55fa163e11af8c7cc2971f247b628f7.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x19-8a1808a8f803f1d8e1b9cc9a5c1c83f258379265082c547f6f5c314bb00ba025.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x20-11699b8243f44aca9af53ab97feacdc94e6095fa49b2dbde6738fbf60dd9c1c0.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x21-309ad930746848167fe2bfad587febca425849bc5a0b2621344c39d1f5068eb8.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x22-cdb78260cf037d07528d48998197d54da9d2b16d4040876ce706b30445524997.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x23-e7dc72df36ba463dac6742344ada2dc65345ba6c95761073b535650ee28c902d.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x24-318b72de2f1c77cf1b61963e8831a9f8e8a54c310b48230adf5442b2297f865a.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x25-c014c5da4e9c4387a0eae02adf4abffed2e806f0e6d33ec5c84d89a808e2b7fd.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x26-66430280a1729763aedc88c3f6c7241abfa56993a1330327113806be76870cb9.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x27-61d15bbdc61e9e434581401c51359076b1f2b7fd7de56aa9cfd63da0b96ba5e2.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x28-29535a25a21047bbf3198de70956163c9153ee6e01137ea657d6ee20938a6d85.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x29-bcc04602e2ce97b5b462b973e52b6add19177b7ad740f2a7b5a356bed0eaf134.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x30-4a997f22ce8dd9f4956394ab5725144698802b4bb59b0be66a8f268742014e91.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x31-203024beb031f85104a0d22e6a749bb739e3c58456aabc4a49209f0b965d29d0.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x32-1ff7db30a8ebd4a55ee9b3e77bca7c5b76288498d1677a52065a8dda370cf370.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x33-863fedab1372d584df48621155a078504d1adbfa4752dcbb7f25c366fb063da8.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x34-e1393c35f35f2136fd6330a9897ebd48095451c601c83e9baf938db6afbad15b.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x35-57c3913aa96696014491f7740cb2319ceae3ba2845003fd38eef013c18cf46f8.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x36-763f8db31fbd0a2e278292170ee81fb117e7658c1d8e5acb16944a986ab7e4e2.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/cfdcdc22b8556e8adb22744ed24c05e7/x37-1d8aae0034f16bd7d90b19f8f7e9cfa77773dd171e0572d38ebe1e44a41c2889.png"
  ],
  "the-eminence-in-shadow-2": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x1-769e8245a2b012ef767e9a0032154ef86df5799c2dd8827cbb6cbdd44cd44131.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x2-3aa05d8a98e28c679a916e371fd455aa5009a88ee5d9b5cd16bed36d80b49253.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x3-a3b666fb363847278eee0e7a4fbd10b774028c529cecbb453f67392968a9068d.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x4-8c57507d5bea8d8e044e99e2a657251c6d272f00e892aa1a4f46e3ea69f66161.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x5-8ccfefbefa74d413ff826922f299366182d95a66fef5a5539c71822a70fead89.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x6-4a871fe852a2e159f797d8e11189a61a4de5d01ce841cfa67e43812afe1be23b.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x7-4fbd7b885a2d2db772d6ad0722cf2ddac15cd8a246c563a3d267b0d0709b0f5f.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x8-00a0d696dfc3094ff55646975d96459a274d6b5499e165b5cd50389459a3d3e3.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x9-ed64cac484118818b447200729d8fad4a6670880fe07e4f83648e44282109c93.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x10-3a51caa2f8e20d24928b410935c76f00745b430bb355780591cbf47f90ca2000.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x11-a3d0df720df8959ffad4f54ee86f26e715abaa0f93ff53763782ab684e8cc158.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x12-b7105f1a00872c6f4a2678897eb7914880765fa528de908d2bd45475fdf4f9de.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x13-c634dec413c09423aabd48d9acf1222e7fc885f277fe1937f554daa265e0efa6.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x14-7d6a54dfdaf06ed3899476612a3ef52ee071d68d5866539cb97ddcf9b2ba35f8.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x15-c41c47fa10369dc341cec2318f9d4bd01aba824b4387c8cbd54730834bebec4b.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x16-b0b9c1f81dfa2aab1ac8778e66f1add5523feb167aa229d1f7509bce68a03cdb.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x17-fcd04db347b432cd585e2224745961a0043b719108f8e0badca880c0d389f058.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x18-639f4dec27ec35302bfaee08bed6201f027ebdb5a878685f7e2349c4da50c983.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x19-f4e993e675d26fd94d3e2acfbdcfb481cfa41edf6400003378023faea89b6599.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x20-4f6361fda952958ce2761b0fa26e3f688f5a20f45b8e134f3b6aa443bacd3787.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x21-b201ff08e39add11bd8ce6b53419f1700b1a911441b5ec782e462786bb9f8f87.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x22-8e52d604cc38e529c86b6e7340ce28d3d72cea4cef1c35f84d8d343079713cfe.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x23-1f81f390219d65153d68d84cabc3fabb7c9350b35fb6e1b948af13a0ab07cf00.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x24-bed32574aa76791c22a6b42b55ab56c272c101a04f9b95a470b0cd25142742d3.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x25-f867c7cf8f7dba97cf4b1fcaa4f1f804bfc4099ab0c015b27be734c4550cd629.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x26-9b9f1ed6bd7bbb36afac9dcba54ab270974ea22019f4874809ccaa3deb470fcf.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x27-b7ea2960573aab08169324070182d3c315b958acc4725f8db43e2f762d07f840.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x28-49909df6976a0d895ec491b601699ba70812819c2f0d60c3597c7566832a1452.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x29-ffcf7dc5bb90bbaafbff67930760d46028aef13e911ea55bd5dba30fa1708ef1.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x30-584aaf20fd3bfcab04c19ed07f297e388198d72a3cecd3ab66e393970925b20b.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x31-4813951375e6c91d3b5620aa2e826f94ac56dec7e7cf880357a4b4fa9d2a8b13.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x32-2c1efecf7d53d00b7ccc6448b58160090e7e0f31911d8cf3c0ff9c98806f38f9.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x33-9d33990ad89cc86a2a67e3bc38cebdddfcb14dfda0c3a1c17526c202e901460e.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x34-93442f7a233af249284cf1283ea12b89299173005d5360e5ac720d5fc52d3b88.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x35-540e4818c20c7f1347abd373d95d44f4949255fec965fa0ee41ab4912e3f32ad.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x36-c162900276a7d8057dd5c8627e3dd9570fd5422f5e1a682d27c9ec62490a9184.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x37-8956364bcb74976db79e2e1176444a51327934ec4b6e0b195b3cd5968a32211c.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f4db36c0a26fbb4340454c1c497dd723/x38-659e16d45262ab87fb3fe66a5272044f0a63f983ef49a1aa17592cabfea7da5c.png"
  ],
  "the-eminence-in-shadow-3": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r1-4e866fd4dcfcd3e45f010c175f54d9ac607ccb0f4b469c4ca1e9e936c22d0d92.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r2-3a1caf1d335de58812daab7cc2e1eff2c35bdc482950244e9bb899f1194d27cc.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r3-631cc54aacd6231df34c7f7201d0b5e2d92ac906cf4e5d59b305c401abf30559.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r4-57f0bac23f38cc2802eab13ef4d93680b29db4cc45c63778373f767848354ce4.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r5-f44b82a4cacb1aa3666ac6e67e91c9047b6d94e27308e385c284d32ea69d9491.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r6-0e8703e6b5ea8817a7615a733697d19db71bf96f7547566c9ccdb841a0d9ddf1.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r7-d662129bd789742ee113669ceb6f095238288c3cd5be2a13faf4cad9bb1c9235.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r8-3d48a5f7b91265424245c2bcda6c70da919786c4e1b61c2a00e65c1f73b05f4a.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r9-f09325ffa86cdaa9a90dea5bce80f18870ae4a618a4317925cb716e2d380d203.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r10-60dd3230dd31008ea43c471f89d2bc9c40c7cb5413a1b5b284a5110cb31b076c.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r11-ab768ab1704924eb7ded251921318c59268c02e448a99f5db633865561786aee.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r12-2f4f26df435cdb337b98d30ec64ed00dbcd13a1bafc87991c9988947d82da8cc.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r13-b5a3104f8fee9349c7723d8e53a67be46904a2571765ab4a6e681464146524c3.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r14-c2d4834f27300fc4863fe9c5e4078387e19d17f9c3961d45ee8c93046e3011de.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r15-3dc684d928b0173df890407d8421f8c01cac67bb272cc98c20386ed67a4e9188.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r16-74f01fffe6bec35ee017441adfe24e06f99cca2d85a6c52f7a207d750fc8b12c.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r17-0ac1648d04397f7b9cea1b015cc40a91688330d746abf1366d4765bec77d0665.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r18-d8da518ac99015826eeb2a084b467d5b0cfee82d9293265f0e732f76346d05ae.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r19-f6be9f10a9203016426f5e06b936bd3d000b608f40104b6874f319c0160e9296.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r20-026ec076297e38a51421765afec0eeec1b5cfd251540cf3f18779d9922cc11b2.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r21-853c8558833aa9a8efca3a55c506164ce4496ba1b43cb699d9f38074fa3a4d1a.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r22-5b01a0455c627a4beb827cd67ecbaf2d216de468a8a5de8d0e6b044219d4ab52.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r23-dd81a83a7946e2f2cd6ad046519bfb95e991228ee2eade3c303354e9814a5f8f.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r24-1bd486d689caef379d04627985e7af8f10a7acbe5359fc3a8dfbd6d0889ecc46.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r25-101700364e6afe85c7b0fef01b112dba4b8ce3a96ccf9e52ac0b790cc84964c7.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r26-864b5d60a68432b30f64e87ca90afc5ba5940c02a2445579cef0d7bb58472d8e.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r27-ee55e2a6deb4b6691cc80f23cb480ee0b550e4356e270e00494760c201dc9cfd.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r28-48e0e7f744064a6da4f3cf702ee6344843444e12bccb2451efedb064468cd658.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r29-fd12dfafe8b0de2cd9862c6ca3301db8129530b1005a35feb89cde665464fada.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r30-376fe4eed301d59ba4a9548e6e67ac155395d81a17233f49e353dc239005db71.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r31-44f58358bcf4cca1bdf6df70381bcd982de33aacbc1ba83407cabb735c6f16b2.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r32-99d93441889945a81f8c8bf08b47682598b1e67cddaa6eff1848ec95f38a7637.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r33-e43e36e32263b3e96df547b3dd7d4bf1ee6c6d86fef7a98f5d6dfe0810651650.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r34-ade4866d3fa1be5929c6532612480243a0de9bf058f835f6f7ce5f46dc2430b6.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r35-1d2734dba67ea823dc41c3b10d543f66b2f3630c4d31af184a15b0acdf4d5c8f.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r36-833c93efd0896829edae8d6c3557e10ebf517979db3e11b0395d898b4902cd31.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r37-06d213001cfb6bf7e738141b942fa4b1dc4b556f8ad2aca257eded12d050d6bb.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/1981d4bc790e863d80d4d74d86ed38de/r38-6fc32f695bf6c624cff171edde62ccf76d07ca772659dea5b0a76616cfc162fd.png"
  ]
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (pathname === '/api/manga/latest') {
    const page = parseInt(parsedUrl.query.page || "1", 10);
    if (page > 1) {
      res.end(JSON.stringify({ mangas: [] }));
    } else {
      res.end(JSON.stringify({ mangas: demoManga }));
    }
    return;
  }

  const chapterMatch = pathname.match(/^\/api\/manga\/([^/]+)\/chapters$/);
  if (chapterMatch) {
    const mangaId = chapterMatch[1];
    res.end(JSON.stringify({ chapters: demoChapters[mangaId] || [] }));
    return;
  }

  const imageMatch = pathname.match(/^\/api\/chapter\/([^/]+)\/images$/);
  if (imageMatch) {
    const chapterId = imageMatch[1];
    const availableImages = demoImages[chapterId] || Object.values(demoImages)[0] || [];
    res.end(JSON.stringify({ images: availableImages }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => console.log('Zero-dependency Mock Provider running on port ' + PORT));
