const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

const demoManga = [
  {
    "id": "eminence-in-shadow",
    "title": "Kage no Jitsuryokusha ni Naritakute!",
    "thumbnail": "https://uploads.mangadex.org/covers/77bee52c-d2d6-44ad-a33a-1734c1fe696a/6079dd31-838b-4d61-87c4-121f3ad19158.jpg.256.jpg",
    "author": "Daisuke Aizawa",
    "genres": [
      "Reincarnation",
      "Action",
      "Demons"
    ],
    "status": "ongoing",
    "description": "Just like how everyone adored heroes in their childhood, a certain young man adored those powers hidden in shadows. Ninjas, rogues, shadowy mentor typ..."
  }
];
const demoChapters = {
  "eminence-in-shadow": [
    {
      "id": "eminence-in-shadow-21",
      "chapter_number": 21,
      "title": "Chapter 21"
    },
    {
      "id": "eminence-in-shadow-43",
      "chapter_number": 43,
      "title": "Chapter 43"
    }
  ]
};
const demoImages = {
  "eminence-in-shadow-21": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/1-75394ea0016b0e6e57d614509d0acecf198b74446bef6dad8502de307b81d633.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/2-af950062ea4bbe1fe3e6d33a8039bc7fc2bcbea9304d285fcbd4d2e6255e5798.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/3-a7c1e9a913cb8987d144a59a187318f9c6602c73fcff013143ad33716fd046fb.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/4-70b65ff3846c1fd5a9ac3e9d4af8f49676133ad4d6ece09efc2ab88f919d4556.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/5-b567a82c55a48c7d29e948b13d1f0cb8eb3d90a9fac7354b39d38dbbebee363c.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/6-b52819ff075daf882460ff085091d260ef260c7d3173166f1632c68f0b5f7e60.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/7-e117de2c044e4f91a9a61240780f0eec58dba166d6b6c403c84e1a7082efbace.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/8-1c6935f874031e9665b477d5f18d67247228f61f031f9fcef3b36f3401c81359.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/9-12abb0fbc064a143408d30e79efff654e148c38cddde0f5437108d483004f71d.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/10-88796fbea0a210a010b39330dba49736c2e1fc0743d0b4acdc7caf1ec31fbe5e.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/11-d8813ac13e03759dc2594cdd9a501bb6ed6ed4a1ddb16b7813bc62c6587d1d8e.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/12-ef613c4c302e9f998ea628d69393accaaf5ea40dda250674d9249a8b5726309e.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/13-ca3c681ce633f2ef034ada997c52967fa9a0cc908a187e32b3cd65e6081633dd.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/14-1bfb6be1be01e83030d1aed5bc06fe15b0ef98487e9171d5c689ba7506eb97e1.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/15-2c28c2a2806574debfda06abe2f7b906d8a0dd84840a80658a72a1091c9108fd.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/16-14d7898787a37568c1f107264c8817e000bf54c55347bdce613a4d6d3f660edc.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/17-3d4be82367c923db7911b631a639f2e926c1cc464ca067635b5737fa88876ce4.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/18-c3a03fd6519a25b3d8ff71a6221d3037c6981353b8127e1e3010bdcb408d09a4.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/19-610322ee07052a839f190ff66b0dbd21fb97b3ff0c9e0ededb3afcca08d2ecfe.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/20-82d038f3cb5dbf44176b0236c49d2a9ad8a068068bc6476697d1f2a95c2c3ecb.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/21-31e993fc2e6568035c5f4b8880231902e0dd0ac35eff8a5f47de4390a46ae25c.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/22-b19ef8a7ab96a07a3ea31305924a35be3da82de9754f210fafd0018107002acc.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/23-5cd3d7788d8bf21cf4a1eb4ca1b8b1ed7a9a4f8b3029bfb024f338a58a35214f.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/24-23d050348be393bf7310e12dfeffa7bf386ba2b2472b3a71261819dd266a5561.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/25-2c73574ef37e6acc4bce8d69e2f063a70fc7f53c02c2e18eeac3b83218f90937.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/26-165e004e9f09990022f4ce818dc9b0212ff65c00023da42806b33b9ec2e3fb87.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/27-be4bb7cf883cdf476c817b7376dae5bc7ced7bf2b39ceba5fbe9fac9f729e647.jpg"
  ],
  "eminence-in-shadow-43": [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/1-42eeaae896a60faa4a76057b8e4694271061bab32ee7b6e4b1fe3066677729c4.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/2-38d0771912c98c6a77a1e5b10031519f9e5d9e173c11f725def4d920f0352e75.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/3-b9cb625a2726099a72d3c37f0c7ff083a3bb3a4d5772d37a89779bd20473fca3.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/4-188079eec30c74a933c4d297a2060a3b4244e0f71bfdd84024473c0063d4144d.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/5-8fd4142afc0cf673ea25cc8b9a2f3763e3bdb9a8dee68d20914e3456a60e8146.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/6-b481a7ccd02e1882d03d09857fa185fa4a394518f2438582f8fc9ed6331e7d7c.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/7-a629c8a6b05fe1cdf6142033bb50ef1fab1f11e21b12c8711c2bb658eae0730a.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/8-1226e3962af34301017f3d4e8bbd937bda3c01cc14f9d629064621c99a3dd617.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/9-529642063f4aa592abd6bccb98303d3275e5d5f0c51fe84c881fcb9be97c71f9.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/10-fff43ea31a9737ce0ab79226b439767630bc5240ced08b07276a5ae8c35291e7.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/11-c88143582281efbe612f0711f002c61e6732ad5c06d6712e63d5e3127693ad80.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/12-1f583d26957f1472b62968e8cd0cabeb101cb811db05103bf77f085b8dd66a2e.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/13-664ce02e9acef61dd189fff02546414c888099ce6ee8136ff1a2f5616859dd59.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/14-e2e786b90b2ea5cc617344b25c12dd13b6d59a945c7a13c905075f9c01db5861.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/15-10d0fbadcce4e13f9f34c223959da3fb3d34af03d866b91a0f22128a6c954f69.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/16-0be507128c2427d8d9a23436494c6482a52b118c61c73f864279846a98b86083.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/17-96d436cfbfed999e3b280f4b4d3a6e50f6a5d5fefbde95d55d05b1166caac2e3.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/18-30a4d9375d859212f8a273d64acb4f4e0691e278e28f8a02b779f7bcbfc75b97.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/19-968abf4a5de493f3f4b14b75e19b30d9f23ab5dd909db1bb3d9ba7a26dbaba53.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/20-a28207842bff729954946e767b5e533f7470b316ce7f8a3782ad9d23959ec464.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/21-870e3286865d202c3de49cd589ca4575110e0cd42a1306a42b112b6c0de685c2.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/22-8a196acb23ba819008453a88d47d3b5f19b7b3d8833672e9874bb8e41728751a.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/23-ea750a106f07952038c4dcb8ebaed225546dcd31f819f09101ce0a161ce56ea9.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/24-7892792790923c4f8870efabbced9c8d83be68b5bab528852866a50dbf198565.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/25-2f7c7e2e8f69e7676f8f81dc6cf4f657a0d19bef29d297f0f69b76fe95a0d7f2.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/26-87c5e4f50b84091f9f38f9f9fb51abb023efbf8ae881b19240e2697410e0eedc.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/27-b4a8efbf8902c7503a3b23afa3a7569a3f76b68b6c1fdfc40ab9d6059a4ca483.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/28-32c8c5fa53c41b8711af38ae6cfee215c81844bb8b6ee4f93e63505c99fa5668.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/29-f00bfde062af2a85ba4dcd30342fe5eb3cd4b9e1edb8f04e2e7c8f6f54ed4442.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/30-8c4f997918276b88a0e3b5f4c04bb79eec44d2b4f3618b025c36d26ff52d51c4.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/31-c9074cb8d574e8437d95168d3ead5ec42841220d3407a9def9d2969a0850bc1a.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/32-d33df784c020a2a5b0d3a6785c019ac0fed6f724b3f88a55ecf4b21e76088e63.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/2f922b28df9fb734b4f33a8f9aebd644/33-40a548c494724d56bf429aafcc021e572601e9f99d113a68b71a2cb71eb48417.jpg"
  ]
};

app.get('/api/manga/latest', (req, res) => {
  if (req.query.page && req.query.page !== "1") return res.json({ mangas: [] });
  res.json({ mangas: demoManga });
});

app.get('/api/manga/:id/chapters', (req, res) => {
  res.json({ chapters: demoChapters[req.params.id] || [] });
});

app.get('/api/chapter/:id/images', (req, res) => {
  res.json({ images: demoImages[req.params.id] || [] });
});

app.listen(PORT, () => console.log('Mock Provider running on port ' + PORT));
