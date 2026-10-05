/* ============================================================
   学长餐厅 · 菜单数据
   ------------------------------------------------------------
   想增删菜品：照着下面的格式复制一段 { ... } 改文字即可。
   每道菜的字段：
     name  菜名（不要用 × ｜（ ） 这几个符号）
     en    英文名（菜单上以小字显示在菜名下方；没有可留空 ""）
     desc  一句话描述（食材/做法，可以留空 ""）
     tags  标签，可选值："招牌" "推荐" "辣" "微辣" "可素" "含酒" "生食" "海鲜"
     options  需要客人选规格的菜（如牛排熟度），填 ["三分","五分","七分"]，
              不需要就整个字段不写
   ============================================================ */

const MENU = {
  restaurant: "学长餐厅",
  english: "XUEZHANG · CHEF'S TABLE",
  subtitle: "中西融合创意菜",
  subtitleEn: "MODERN CHINESE-FRENCH FUSION",
  season: "秋季菜单 · Autumn 2026",
  // 页脚的一句玩笑话
  footerNote: "仅供朋友预订 · 菜单随时令与主厨心情调整",

  // 客人点单时可多选的「口味爱好」标签
  prefOptions: [
    "爱吃辣", "偏清淡", "喜酸", "偏甜", "少油", "重口味", "大胃口", "小鸟胃", "爱吃肉", "爱吃海鲜", "爱蔬菜", "碳水狂魔", "必吃甜品", "汤品爱好者"
  ],

  sections: [
    {
      id: "snacks",
      label: "小食",
      en: "SNACKS",
      note: "",
      items: [
        {
          name: "慢煮溏心蛋 · 鱼子酱",
          en: "Onsen Egg & Caviar",
          desc: "63.5°C 温泉蛋，鲟鱼籽点缀",
          tags: ["推荐"]
        },
        {
          name: "现烤酸面包",
          en: "Sourdough & Butter",
          desc: "天然酵种隔夜发酵，外壳脆响，配海盐黄油",
          tags: []
        },
        {
          name: "冰镇糖渍山楂",
          en: "Chilled Candied Hawthorn",
          desc: "梅子粉轻撒，开胃解腻",
          tags: ["可素"]
        }
      ]
    },
    {
      id: "starters",
      label: "前菜",
      en: "STARTERS",
      note: "",
      items: [
        {
          name: "和牛他塔 · 鹌鹑蛋黄",
          en: "Wagyu Tartare & Quail Yolk",
          desc: "生食级和牛粗切，黄芥末酸豆调味，拌入鹌鹑蛋黄",
          tags: ["生食", "推荐"]
        },
        {
          name: "低温慢煮三文鱼 · 柚子醋",
          en: "Slow-Cooked Salmon, Yuzu",
          desc: "45°C 慢煮，牛油果泥垫底，柚子醋提亮",
          tags: ["海鲜"]
        },
        {
          name: "烤南瓜沙拉 · 帕玛森",
          en: "Roasted Pumpkin Salad, Parmesan",
          desc: "时令南瓜炭烤，油醋汁，帕玛森刨片",
          tags: ["可素"]
        },
        {
          name: "火腿蜜瓜",
          en: "Prosciutto & Melon",
          desc: "意式风干火腿，包裹当季蜜瓜，咸甜相衬",
          tags: []
        }
      ]
    },
    {
      id: "soups",
      label: "汤品",
      en: "SOUPS",
      note: "",
      items: [
        {
          name: "清炖牛尾",
          en: "Clear-Braised Oxtail Consommé",
          desc: "文火慢炖六小时，汤清见底，白萝卜同炖",
          tags: ["招牌"]
        },
        {
          name: "竹荪菌菇清汤",
          en: "Bamboo Fungus & Mushroom Broth",
          desc: "云南菌菇与竹荪，一滴香油收尾",
          tags: ["可素"]
        },
        {
          name: "法式洋葱汤 · 酥皮封盖",
          en: "French Onion Soup, Pastry Lid",
          desc: "洋葱慢炒至焦糖化，酥皮封盖焗烤",
          tags: []
        },
        {
          name: "烤南瓜浓汤",
          en: "Roasted Pumpkin Soup",
          desc: "烤南瓜打泥，温润顺口",
          tags: ["可素"]
        }
      ]
    },
    {
      id: "mains",
      label: "主菜",
      en: "MAIN COURSES",
      note: "",
      items: [
        {
          name: "秘制牛肋排",
          en: "Slow-Braised Beef Ribs, House Secret Sauce",
          desc: "秘制卤汁慢炖至脱骨，大火收汁挂亮",
          tags: ["招牌"]
        },
        {
          name: "M7干式熟成牛排",
          en: "M7 Dry-Aged Wagyu Steak",
          desc: "澳洲 M7 和牛，干式熟成 28 天，厚切现煎",
          tags: ["招牌"],
          options: ["三分", "五分", "七分"]
        },
        {
          name: "香煎鲈鱼 · 柠檬黄油",
          en: "Pan-Seared Sea Bass, Lemon Butter",
          desc: "皮脆肉嫩，柠檬黄油汁收尾",
          tags: []
        },
        {
          name: "碳烤东星斑",
          en: "Charcoal-Grilled Coral Grouper",
          desc: "整条炭火慢烤，皮脆肉蒜瓣，柠檬海盐提鲜",
          tags: ["招牌", "海鲜"]
        },
        {
          name: "蒜香黄油焗大虾 · 天使面",
          en: "Garlic Butter Prawns, Angel Hair",
          desc: "大蒜黄油焗烤，佐蒜香油浸天使细面",
          tags: ["海鲜"]
        },
        {
          name: "泰式极品鳌虾",
          en: "Thai-Style Premium Langoustine",
          desc: "泰式酸辣汁腌拌，香茅柠檬鱼露提味，虾肉弹甜",
          tags: ["海鲜"]
        },
        {
          name: "西班牙风味海鲜饭",
          en: "Spanish Seafood Paella",
          desc: "藏红花打底，大虾青口鱿鱼铺满，锅底结出焦香饭焦",
          tags: ["招牌", "海鲜"]
        },
        {
          name: "三杯菌菇烩饭",
          en: "San-Bei Mushroom Risotto",
          desc: "麻油、酱油、九层塔，意大利米吸满酱汁",
          tags: ["可素"]
        }
      ]
    },
    {
      id: "sides",
      label: "配菜 · 主食",
      en: "SIDES",
      note: "",
      items: [
        {
          name: "乔尔卢布松土豆泥",
          en: "Robuchon-Style Pommes Purée",
          desc: "足量黄油与淡奶油，过筛三遍，如丝绒",
          tags: ["招牌"]
        },
        {
          name: "上汤娃娃菜",
          en: "Baby Cabbage in Superior Broth",
          desc: "高汤煨透，火腿提鲜，清甜软糯",
          tags: []
        },
        {
          name: "白灼芥兰",
          en: "Blanched Gai Lan, Soy Sauce",
          desc: "白灼保留脆嫩，豉油热油激香",
          tags: ["可素"]
        },
        {
          name: "川香藤椒油拌面",
          en: "Green Sichuan Pepper Oil Noodles",
          desc: "藤椒油现淋，麻香开胃，川味十足",
          tags: ["辣"]
        },
        {
          name: "特色三明治",
          en: "The House Sandwich",
          desc: "主厨当日手作，馅料随心配，即兴组合",
          tags: ["推荐"]
        }
      ]
    },
    {
      id: "desserts",
      label: "甜品",
      en: "DESSERTS",
      note: "",
      items: [
        {
          name: "榴莲 Gelato",
          en: "Durian Gelato",
          desc: "猫山王果肉直打，浓郁挂壁",
          tags: ["招牌"]
        },
        {
          name: "蓝莓 Gelato",
          en: "Blueberry Gelato",
          desc: "整颗蓝莓熬成果酱拌入，酸甜",
          tags: []
        },
        {
          name: "芒果 Gelato",
          en: "Mango Gelato",
          desc: "当季芒果，果肉含量过半",
          tags: []
        }
      ]
    },
    {
      id: "drinks",
      label: "饮品",
      en: "DRINKS",
      note: "",
      items: [
        {
          name: "高蛋白西瓜奶昔",
          en: "High-Protein Watermelon Shake",
          desc: "冰镇西瓜现打，希腊酸奶与乳清蛋白调制，清甜浓滑",
          tags: ["招牌"]
        },
        {
          name: "现榨石榴汁",
          en: "Fresh Pomegranate Juice",
          desc: "整颗石榴现压，不兑水",
          tags: []
        },
        {
          name: "现榨西瓜汁",
          en: "Fresh Watermelon Juice",
          desc: "冰镇去沙，清甜",
          tags: []
        },
        {
          name: "现榨橙汁",
          en: "Fresh Orange Juice",
          desc: "手挤鲜橙，带果肉",
          tags: []
        }
      ]
    }
  ]
};


/* 菜名速查表（按菜名找所属分节），由下方代码自动生成，不用手动维护 */
const DISH_INDEX = {};
MENU.sections.forEach(function (sec) {
  sec.items.forEach(function (it) {
    DISH_INDEX[it.name] = { section: sec.label, item: it };
  });
});
