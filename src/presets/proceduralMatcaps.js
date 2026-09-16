// ============================================================================
// 100% Procedural Code-Based MatCap Presets (641 Materials)
// Generated purely with mathematical HTML5 Canvas gradients and lighting models.
// 100% Original Code - Safe for Commercial Distribution
// ============================================================================

export function renderProceduralMatCap(ctx, w, h, colors, category) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const r = w * 0.5;

  const c0 = colors[0] || '#ffffff';
  const c1 = colors[1] || colors[0] || '#888888';
  const c2 = colors[2] || colors[1] || '#333333';
  const c3 = colors[3] || '#111111';

  const isMetal = category && (category.includes('Metal') || category.includes('Gold'));
  const isDark = category && category.includes('Obsidian');
  const isClay = category && (category.includes('Clay') || category.includes('Skin'));

  // 1. Base Spherical Illumination Gradient (Simulates 3D curved sphere with key light)
  const keyX = cx * 0.72;
  const keyY = cy * 0.38;
  const baseGrad = ctx.createRadialGradient(keyX, keyY, r * 0.04, cx, cy, r);

  if (isMetal) {
    baseGrad.addColorStop(0.0, '#ffffff');
    baseGrad.addColorStop(0.2, c0);
    baseGrad.addColorStop(0.55, c1);
    baseGrad.addColorStop(0.85, c2);
    baseGrad.addColorStop(1.0, c3);
  } else if (isDark) {
    baseGrad.addColorStop(0.0, c0);
    baseGrad.addColorStop(0.25, c1);
    baseGrad.addColorStop(0.65, c2);
    baseGrad.addColorStop(1.0, '#000000');
  } else if (isClay) {
    baseGrad.addColorStop(0.0, c0);
    baseGrad.addColorStop(0.35, c1);
    baseGrad.addColorStop(0.75, c2);
    baseGrad.addColorStop(1.0, c3);
  } else {
    baseGrad.addColorStop(0.0, c0);
    baseGrad.addColorStop(0.3, c1);
    baseGrad.addColorStop(0.7, c2);
    baseGrad.addColorStop(1.0, c3);
  }

  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // 2. Specular Gloss Highlight (Simulates glossy surface reflection)
  if (!isClay) {
    const specGrad = ctx.createRadialGradient(keyX * 0.95, keyY * 0.9, 1, keyX, keyY, r * (isMetal ? 0.35 : 0.22));
    specGrad.addColorStop(0.0, 'rgba(255, 255, 255, ' + (isMetal ? '0.85' : '0.6') + ')');
    specGrad.addColorStop(0.4, 'rgba(255, 255, 255, ' + (isMetal ? '0.35' : '0.15') + ')');
    specGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Ambient Rim / Fresnel Light
  const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.86, cx, cy, r);
  rimGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
  rimGrad.addColorStop(1.0, isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.22)');
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

export const PROCEDURAL_MATCAP_PALETTES = [
  {
    "id": "matcap_0404e8_0404b5_0404cb_3333fc",
    "name": "Medium Cobalt Blue #0404E8",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#0404E8",
      "#0404B5",
      "#0404CB",
      "#3333FC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_045c5c_0dbdbd_049393_04a4a4",
    "name": "Deep Cyan Turquoise #045C5C",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#045C5C",
      "#0DBDBD",
      "#049393",
      "#04A4A4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_046363_0cc3c3_049b9b_04acac",
    "name": "Deep Cyan Turquoise #046363",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#046363",
      "#0CC3C3",
      "#049B9B",
      "#04ACAC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_0489c5_0dddf9_04c3ee_04afe1",
    "name": "Dark Cyan Turquoise #0489C5",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#0489C5",
      "#0DDDF9",
      "#04C3EE",
      "#04AFE1"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_04989a_0ce3e4_04d2d5_04c7c8",
    "name": "Dark Cyan Turquoise #04989A",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#04989A",
      "#0CE3E4",
      "#04D2D5",
      "#04C7C8"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_04c455_0efabc_04f097_04e17a",
    "name": "Dark Emerald Green #04C455",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#04C455",
      "#0EFABC",
      "#04F097",
      "#04E17A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_04cc77_0cf7ca_04e9a7_04ab54",
    "name": "Dark Emerald Green #04CC77",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#04CC77",
      "#0CF7CA",
      "#04E9A7",
      "#04AB54"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_04e804_04b504_04cb04_33fc33",
    "name": "Medium Emerald Green #04E804",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#04E804",
      "#04B504",
      "#04CB04",
      "#33FC33"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_04e8e8_04b5b5_04cccc_33fcfc",
    "name": "Medium Cyan Turquoise #04E8E8",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#04E8E8",
      "#04B5B5",
      "#04CCCC",
      "#33FCFC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_050505_747474_4c4c4c_333333",
    "name": "Deep Obsidian #050505",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#050505",
      "#747474",
      "#4C4C4C",
      "#333333"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_070b0c_b2c7ce_728fa3_5b748b",
    "name": "Deep Cyan Turquoise #070B0C",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#070B0C",
      "#B2C7CE",
      "#728FA3",
      "#5B748B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_090909_9c9c9c_555555_7c7c7c",
    "name": "Deep Obsidian #090909",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#090909",
      "#9C9C9C",
      "#555555",
      "#7C7C7C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_0a0a0a_a9a9a9_525252_747474",
    "name": "Deep Obsidian #0A0A0A",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#0A0A0A",
      "#A9A9A9",
      "#525252",
      "#747474"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_0c0cc3_04049f_040483_04045c",
    "name": "Dark Cobalt Blue #0C0CC3",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#0C0CC3",
      "#04049F",
      "#040483",
      "#04045C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_0c430c_257d25_439a43_3c683c",
    "name": "Deep Emerald Green #0C430C",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#0C430C",
      "#257D25",
      "#439A43",
      "#3C683C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_0d0dbd_040497_04047b_040455",
    "name": "Dark Cobalt Blue #0D0DBD",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#0D0DBD",
      "#040497",
      "#04047B",
      "#040455"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_0d0de3_040486_0404af_0404cf",
    "name": "Medium Cobalt Blue #0D0DE3",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#0D0DE3",
      "#040486",
      "#0404AF",
      "#0404CF"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_0dbd0d_049704_047b04_045504",
    "name": "Dark Emerald Green #0DBD0D",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#0DBD0D",
      "#049704",
      "#047B04",
      "#045504"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_0f0f0f_4b4b4b_1c1c1c_2c2c2c",
    "name": "Deep Obsidian #0F0F0F",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#0F0F0F",
      "#4B4B4B",
      "#1C1C1C",
      "#2C2C2C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_0f990f_047b04_044604_046704",
    "name": "Dark Emerald Green #0F990F",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#0F990F",
      "#047B04",
      "#044604",
      "#046704"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_15100f_241d1b_292424_2c2c27",
    "name": "Deep Ruby Crimson #15100F",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#15100F",
      "#241D1B",
      "#292424",
      "#2C2C27"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_161b1f_c7e0ec_90a5b3_7b8c9b",
    "name": "Deep Cyan Turquoise #161B1F",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#161B1F",
      "#C7E0EC",
      "#90A5B3",
      "#7B8C9B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_167e76_36d6d2_23b2ac_27c1be",
    "name": "Dark Cyan Turquoise #167E76",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#167E76",
      "#36D6D2",
      "#23B2AC",
      "#27C1BE"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_17395a_7ebcc7_4d8b9f_65a1b5",
    "name": "Deep Cyan Turquoise #17395A",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#17395A",
      "#7EBCC7",
      "#4D8B9F",
      "#65A1B5"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_181f1f_475057_616566_525c62",
    "name": "Deep Cyan Turquoise #181F1F",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#181F1F",
      "#475057",
      "#616566",
      "#525C62"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_191514_6d5145_4e3324_3b564d",
    "name": "Deep Obsidian #191514",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#191514",
      "#6D5145",
      "#4E3324",
      "#3B564D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_1a2461_3d70db_2c3c8f_2c6cac",
    "name": "Deep Cobalt Blue #1A2461",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#1A2461",
      "#3D70DB",
      "#2C3C8F",
      "#2C6CAC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_1b1b1b_515151_7e7e7e_6c6c6c",
    "name": "Deep Obsidian #1B1B1B",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#1B1B1B",
      "#515151",
      "#7E7E7E",
      "#6C6C6C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_1b1b1b_999999_575757_747474",
    "name": "Deep Obsidian #1B1B1B",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#1B1B1B",
      "#999999",
      "#575757",
      "#747474"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_1b1c19_5f615d_4b4e4c_3f403d",
    "name": "Deep Obsidian #1B1C19",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#1B1C19",
      "#5F615D",
      "#4B4E4C",
      "#3F403D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_1c1810_352f23_2b2c1c_2b2c24",
    "name": "Deep Gold Brass #1C1810",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#1C1810",
      "#352F23",
      "#2B2C1C",
      "#2B2C24"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_1c70c6_09294c_0f3f73_52b3f6",
    "name": "Dark Cyan Turquoise #1C70C6",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#1C70C6",
      "#09294C",
      "#0F3F73",
      "#52B3F6"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_1d2424_565f66_4e555a_646c6e",
    "name": "Deep Obsidian #1D2424",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#1D2424",
      "#565F66",
      "#4E555A",
      "#646C6E"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_1d2a21_43443b_655b54_545c54",
    "name": "Deep Emerald Green #1D2A21",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#1D2A21",
      "#43443B",
      "#655B54",
      "#545C54"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_1d3fcc_051b5f_81a0f2_5579e9",
    "name": "Medium Cobalt Blue #1D3FCC",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#1D3FCC",
      "#051B5F",
      "#81A0F2",
      "#5579E9"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_221917_928380_5f504d_7c746c",
    "name": "Deep Ruby Crimson #221917",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#221917",
      "#928380",
      "#5F504D",
      "#7C746C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_232014_908b78_5e5743_747460",
    "name": "Deep Gold Brass #232014",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#232014",
      "#908B78",
      "#5E5743",
      "#747460"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_242733_333a4d_3e4554_3c3b43",
    "name": "Deep Cobalt Blue #242733",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#242733",
      "#333A4D",
      "#3E4554",
      "#3C3B43"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_245642_3d8168_3d6858_417364",
    "name": "Deep Emerald Green #245642",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#245642",
      "#3D8168",
      "#3D6858",
      "#417364"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_253c3c_528181_406c6c_385f5f",
    "name": "Deep Cyan Turquoise #253C3C",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#253C3C",
      "#528181",
      "#406C6C",
      "#385F5F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_254fb0_99aff0_6587d8_1d3279",
    "name": "Dark Cobalt Blue #254FB0",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#254FB0",
      "#99AFF0",
      "#6587D8",
      "#1D3279"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_27222b_677491_484f6a_5d657a",
    "name": "Deep Obsidian #27222B",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#27222B",
      "#677491",
      "#484F6A",
      "#5D657A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_281813_604233_4b3426_442b22",
    "name": "Deep Ruby Crimson #281813",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#281813",
      "#604233",
      "#4B3426",
      "#442B22"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_28292a_d3dae5_a3acb8_818183",
    "name": "Deep Obsidian #28292A",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#28292A",
      "#D3DAE5",
      "#A3ACB8",
      "#818183"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_291912_473531_3c2c25_3a2424",
    "name": "Deep Ruby Crimson #291912",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#291912",
      "#473531",
      "#3C2C25",
      "#3A2424"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_293534_b2bfc5_738289_8a9aa7",
    "name": "Deep Cyan Turquoise #293534",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#293534",
      "#B2BFC5",
      "#738289",
      "#8A9AA7"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_293d21_abc692_73b255_667c5c",
    "name": "Deep Emerald Green #293D21",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#293D21",
      "#ABC692",
      "#73B255",
      "#667C5C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2a2a2a_b3b3b3_6d6d6d_848c8c",
    "name": "Deep Obsidian #2A2A2A",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#2A2A2A",
      "#B3B3B3",
      "#6D6D6D",
      "#848C8C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2a2a2a_dbdbdb_6a6a6a_949494",
    "name": "Deep Obsidian #2A2A2A",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#2A2A2A",
      "#DBDBDB",
      "#6A6A6A",
      "#949494"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2a2d21_555742_898974_6c745b",
    "name": "Deep Emerald Green #2A2D21",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#2A2D21",
      "#555742",
      "#898974",
      "#6C745B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2a4ba7_1b2d44_1f3768_233c81",
    "name": "Dark Cobalt Blue #2A4BA7",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#2A4BA7",
      "#1B2D44",
      "#1F3768",
      "#233C81"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2a6276_041218_739ba6_042941",
    "name": "Dark Cyan Turquoise #2A6276",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#2A6276",
      "#041218",
      "#739BA6",
      "#042941"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2b2828_7b796f_534f4a_616464",
    "name": "Deep Obsidian #2B2828",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#2B2828",
      "#7B796F",
      "#534F4A",
      "#616464"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2b2b22_3c3c30_464538_121210",
    "name": "Deep Obsidian #2B2B22",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#2B2B22",
      "#3C3C30",
      "#464538",
      "#121210"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2d2d2a_74716e_8f8c8c_92958e",
    "name": "Deep Obsidian #2D2D2A",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#2D2D2A",
      "#74716E",
      "#8F8C8C",
      "#92958E"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2d2d2f_c6c2c5_727176_94949b",
    "name": "Deep Obsidian #2D2D2F",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#2D2D2F",
      "#C6C2C5",
      "#727176",
      "#94949B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2d8753_5cd6a5_45bb82_4cc494",
    "name": "Dark Emerald Green #2D8753",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#2D8753",
      "#5CD6A5",
      "#45BB82",
      "#4CC494"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2e2e2d_7d7c76_a3a39f_949c94",
    "name": "Deep Obsidian #2E2E2D",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#2E2E2D",
      "#7D7C76",
      "#A3A39F",
      "#949C94"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2e763a_78a0b7_b3d1cf_14f209",
    "name": "Dark Emerald Green #2E763A",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#2E763A",
      "#78A0B7",
      "#B3D1CF",
      "#14F209"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2eac9e_61ebe3_4dddd1_43d1c6",
    "name": "Dark Cyan Turquoise #2EAC9E",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#2EAC9E",
      "#61EBE3",
      "#4DDDD1",
      "#43D1C6"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2f2faa_1e1e87_10104e_1c1c70",
    "name": "Dark Cobalt Blue #2F2FAA",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#2F2FAA",
      "#1E1E87",
      "#10104E",
      "#1C1C70"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_2f3747_6a7c9e_54637f_62748b",
    "name": "Deep Cobalt Blue #2F3747",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#2F3747",
      "#6A7C9E",
      "#54637F",
      "#62748B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_300706_888576_822821_876e79",
    "name": "Deep Ruby Crimson #300706",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#300706",
      "#888576",
      "#822821",
      "#876E79"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_302721_cac1bb_7a706a_91959b",
    "name": "Deep Amber Coral #302721",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#302721",
      "#CAC1BB",
      "#7A706A",
      "#91959B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_304fb1_69a1ef_5081df_5c8ce6",
    "name": "Dark Cobalt Blue #304FB1",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#304FB1",
      "#69A1EF",
      "#5081DF",
      "#5C8CE6"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_312c34_a2aab3_61656a_808494",
    "name": "Deep Obsidian #312C34",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#312C34",
      "#A2AAB3",
      "#61656A",
      "#808494"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_312d20_80675c_8b8c8b_85848c",
    "name": "Deep Gold Brass #312D20",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#312D20",
      "#80675C",
      "#8B8C8B",
      "#85848C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_313131_bbbbbb_878787_a3a4a4",
    "name": "Deep Obsidian #313131",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#313131",
      "#BBBBBB",
      "#878787",
      "#A3A4A4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_320455_720dbe_560496_47047b",
    "name": "Deep Amethyst Purple #320455",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#320455",
      "#720DBE",
      "#560496",
      "#47047B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_32201d_613c3c_563533_8c655f",
    "name": "Deep Ruby Crimson #32201D",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#32201D",
      "#613C3C",
      "#563533",
      "#8C655F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_32302b_4c4842_121211_1c1c14",
    "name": "Deep Obsidian #32302B",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#32302B",
      "#4C4842",
      "#121211",
      "#1C1C14"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_323c4d_b79039_7c6a44_605c48",
    "name": "Deep Cobalt Blue #323C4D",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#323C4D",
      "#B79039",
      "#7C6A44",
      "#605C48"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_326666_66cbc9_c0b8ae_52b3b4",
    "name": "Dark Cyan Turquoise #326666",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#326666",
      "#66CBC9",
      "#C0B8AE",
      "#52B3B4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_331a0b_b17038_7d4e28_5b351a",
    "name": "Deep Amber Coral #331A0B",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#331A0B",
      "#B17038",
      "#7D4E28",
      "#5B351A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_336eb3_152578_a4c5e2_74aed9",
    "name": "Medium Cyan Turquoise #336EB3",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#336EB3",
      "#152578",
      "#A4C5E2",
      "#74AED9"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_34352a_718184_50605e_6e6761",
    "name": "Deep Obsidian #34352A",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#34352A",
      "#718184",
      "#50605E",
      "#6E6761"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_346088_6abed7_56a0c5_4e91b8",
    "name": "Dark Cyan Turquoise #346088",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#346088",
      "#6ABED7",
      "#56A0C5",
      "#4E91B8"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_34a09c_6ee5e3_5cd7d3_4ec9c6",
    "name": "Dark Cyan Turquoise #34A09C",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#34A09C",
      "#6EE5E3",
      "#5CD7D3",
      "#4EC9C6"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_34ab94_36dfc1_19f9eb_6c6e62",
    "name": "Dark Cyan Turquoise #34AB94",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#34AB94",
      "#36DFC1",
      "#19F9EB",
      "#6C6E62"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_353535_cfcfcf_828282_a4a4a4",
    "name": "Deep Obsidian #353535",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#353535",
      "#CFCFCF",
      "#828282",
      "#A4A4A4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_36220c_c6c391_8c844a_8b7b4c",
    "name": "Deep Amber Coral #36220C",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#36220C",
      "#C6C391",
      "#8C844A",
      "#8B7B4C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_36312e_726461_59504d_645c5c",
    "name": "Deep Obsidian #36312E",
    "category": "🌑 MatCaps: Obsidian & Dark",
    "colors": [
      "#36312E",
      "#726461",
      "#59504D",
      "#645C5C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_365123_c6e5a3_a8d18d_8eb16c",
    "name": "Deep Emerald Green #365123",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#365123",
      "#C6E5A3",
      "#A8D18D",
      "#8EB16C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_36c8fa_176acb_24a7ef_1d93ec",
    "name": "Medium Cyan Turquoise #36C8FA",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#36C8FA",
      "#176ACB",
      "#24A7EF",
      "#1D93EC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_37c337_279f27_186018_248824",
    "name": "Medium Emerald Green #37C337",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#37C337",
      "#279F27",
      "#186018",
      "#248824"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_385264_a1d3e2_86adc1_6e94a8",
    "name": "Dark Cyan Turquoise #385264",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#385264",
      "#A1D3E2",
      "#86ADC1",
      "#6E94A8"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_385862_6d8b8d_647b80_1a2e2f",
    "name": "Dark Cyan Turquoise #385862",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#385862",
      "#6D8B8D",
      "#647B80",
      "#1A2E2F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_386169_a9cfdb_153c23_7ca3ac",
    "name": "Dark Cyan Turquoise #386169",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#386169",
      "#A9CFDB",
      "#153C23",
      "#7CA3AC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_38925d_142b23_1d4835_2a6449",
    "name": "Dark Emerald Green #38925D",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#38925D",
      "#142B23",
      "#1D4835",
      "#2A6449"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_392307_b3ae7d_6d5618_847c42",
    "name": "Deep Amber Coral #392307",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#392307",
      "#B3AE7D",
      "#6D5618",
      "#847C42"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_39433a_65866e_86bf8b_bff8d8",
    "name": "Deep Chrome Steel #39433A",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#39433A",
      "#65866E",
      "#86BF8B",
      "#BFF8D8"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_394641_b1a67e_75bebe_7d7256",
    "name": "Deep Chrome Steel #394641",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#394641",
      "#B1A67E",
      "#75BEBE",
      "#7D7256"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3a2412_a78b5f_705434_836c47",
    "name": "Deep Amber Coral #3A2412",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#3A2412",
      "#A78B5F",
      "#705434",
      "#836C47"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3a3329_c9b090_928069_a9957a",
    "name": "Deep Gold Brass #3A3329",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#3A3329",
      "#C9B090",
      "#928069",
      "#A9957A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3a3d37_7e7f75_bcbfb6_9c9c94",
    "name": "Deep Chrome Steel #3A3D37",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#3A3D37",
      "#7E7F75",
      "#BCBFB6",
      "#9C9C94"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3b3b3b_c7c7c7_878787_a4a4a4",
    "name": "Deep Chrome Steel #3B3B3B",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#3B3B3B",
      "#C7C7C7",
      "#878787",
      "#A4A4A4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3b3c3f_dad9d5_929290_abaca8",
    "name": "Deep Chrome Steel #3B3C3F",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#3B3C3F",
      "#DAD9D5",
      "#929290",
      "#ABACA8"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3b4235_7b9395_5b716c_70847b",
    "name": "Deep Chrome Steel #3B4235",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#3B4235",
      "#7B9395",
      "#5B716C",
      "#70847B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3b6e10_e3f2c3_88ac2e_99ce51",
    "name": "Deep Emerald Green #3B6E10",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#3B6E10",
      "#E3F2C3",
      "#88AC2E",
      "#99CE51"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3d1f12_653821_070404_22130b",
    "name": "Deep Ruby Crimson #3D1F12",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#3D1F12",
      "#653821",
      "#070404",
      "#22130B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3e2335_d36a1b_8e4a2e_2842a5",
    "name": "Deep Magenta Velvet #3E2335",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#3E2335",
      "#D36A1B",
      "#8E4A2E",
      "#2842A5"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3e3d39_d6ceaf_91bac1_897966",
    "name": "Deep Chrome Steel #3E3D39",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#3E3D39",
      "#D6CEAF",
      "#91BAC1",
      "#897966"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3e3e36_72726d_63645d_0e0f0c",
    "name": "Deep Chrome Steel #3E3E36",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#3E3E36",
      "#72726D",
      "#63645D",
      "#0E0F0C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3e3e3e_aeaeae_848484_777777",
    "name": "Deep Chrome Steel #3E3E3E",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#3E3E3E",
      "#AEAEAE",
      "#848484",
      "#777777"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3e95cc_65d9f1_a2e2f6_679bd4",
    "name": "Medium Cyan Turquoise #3E95CC",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#3E95CC",
      "#65D9F1",
      "#A2E2F6",
      "#679BD4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3f3a2f_91d0a5_7d876a_94977b",
    "name": "Deep Gold Brass #3F3A2F",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#3F3A2F",
      "#91D0A5",
      "#7D876A",
      "#94977B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3f3d52_ccced9_afb0c6_8d8cac",
    "name": "Dark Cobalt Blue #3F3D52",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#3F3D52",
      "#CCCED9",
      "#AFB0C6",
      "#8D8CAC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_3f4441_d1d7d6_888f87_a2ada1",
    "name": "Dark Chrome Steel #3F4441",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#3F4441",
      "#D1D7D6",
      "#888F87",
      "#A2ADA1"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_403a34_b0936e_7f979c_7e6956",
    "name": "Deep Chrome Steel #403A34",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#403A34",
      "#B0936E",
      "#7F979C",
      "#7E6956"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_415325_83a24e_678239_748c3c",
    "name": "Deep Emerald Green #415325",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#415325",
      "#83A24E",
      "#678239",
      "#748C3C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_416ba7_a5b8d0_0d2549_65abeb",
    "name": "Medium Cobalt Blue #416BA7",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#416BA7",
      "#A5B8D0",
      "#0D2549",
      "#65ABEB"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_422509_c89536_824512_0a0604",
    "name": "Deep Amber Coral #422509",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#422509",
      "#C89536",
      "#824512",
      "#0A0604"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_422a1e_716767_685d59_5e4f4a",
    "name": "Deep Ruby Crimson #422A1E",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#422A1E",
      "#716767",
      "#685D59",
      "#5E4F4A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_424244_bdbbbe_8a898e_a3a4a9",
    "name": "Dark Chrome Steel #424244",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#424244",
      "#BDBBBE",
      "#8A898E",
      "#A3A4A9"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_425f84_1c2939_2a3f57_24344c",
    "name": "Dark Cyan Turquoise #425F84",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#425F84",
      "#1C2939",
      "#2A3F57",
      "#24344C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_430404_bd9295_7e1e21_94544c",
    "name": "Deep Ruby Crimson #430404",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#430404",
      "#BD9295",
      "#7E1E21",
      "#94544C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_432322_5e3839_170c0b_543433",
    "name": "Deep Ruby Crimson #432322",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#432322",
      "#5E3839",
      "#170C0B",
      "#543433"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_433d3f_a58d7d_786760_8c7c6d",
    "name": "Dark Chrome Steel #433D3F",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#433D3F",
      "#A58D7D",
      "#786760",
      "#8C7C6D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_434240_d3d3cf_898784_a4a49f",
    "name": "Dark Chrome Steel #434240",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#434240",
      "#D3D3CF",
      "#898784",
      "#A4A49F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_434343_9e9e9e_8c8c8c_848484",
    "name": "Dark Chrome Steel #434343",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#434343",
      "#9E9E9E",
      "#8C8C8C",
      "#848484"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_434c32_62704c_546244_2f3220",
    "name": "Deep Emerald Green #434C32",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#434C32",
      "#62704C",
      "#546244",
      "#2F3220"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_442c27_a79e90_847066_8d837c",
    "name": "Deep Ruby Crimson #442C27",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#442C27",
      "#A79E90",
      "#847066",
      "#8D837C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_447072_8acacb_65a4a5_74b3b3",
    "name": "Dark Cyan Turquoise #447072",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#447072",
      "#8ACACB",
      "#65A4A5",
      "#74B3B3"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_45432c_808361_b8c8bc_a5a27a",
    "name": "Deep Gold Brass #45432C",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#45432C",
      "#808361",
      "#B8C8BC",
      "#A5A27A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_454447_908e9a_181716_7c7c7b",
    "name": "Dark Chrome Steel #454447",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#454447",
      "#908E9A",
      "#181716",
      "#7C7C7B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_456a73_779b9e_173a46_154c5d",
    "name": "Dark Cyan Turquoise #456A73",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#456A73",
      "#779B9E",
      "#173A46",
      "#154C5D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_463f37_accfbb_818b78_91a494",
    "name": "Deep Amber Coral #463F37",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#463F37",
      "#ACCFBB",
      "#818B78",
      "#91A494"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_464445_d2d0cb_919196_a8adb0",
    "name": "Dark Chrome Steel #464445",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#464445",
      "#D2D0CB",
      "#919196",
      "#A8ADB0"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_464543_d1cfc1_8e8c83_a4ac9c",
    "name": "Dark Chrome Steel #464543",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#464543",
      "#D1CFC1",
      "#8E8C83",
      "#A4AC9C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_46804d_cbe9ac_90b57c_95d38f",
    "name": "Dark Emerald Green #46804D",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#46804D",
      "#CBE9AC",
      "#90B57C",
      "#95D38F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_468126_c1ddb5_8ac460_a1d07c",
    "name": "Dark Emerald Green #468126",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#468126",
      "#C1DDB5",
      "#8AC460",
      "#A1D07C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_47392e_997e69_7c6553_8b745f",
    "name": "Deep Amber Coral #47392E",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#47392E",
      "#997E69",
      "#7C6553",
      "#8B745F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_474444_7b7575_9e9899_8c8c8b",
    "name": "Dark Chrome Steel #474444",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#474444",
      "#7B7575",
      "#9E9899",
      "#8C8C8B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_474643_696f7d_a9abb8_8b8c93",
    "name": "Dark Chrome Steel #474643",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#474643",
      "#696F7D",
      "#A9ABB8",
      "#8B8C93"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_474843_cecec4_898883_a3a3a4",
    "name": "Dark Chrome Steel #474843",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#474843",
      "#CECEC4",
      "#898883",
      "#A3A3A4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_48270f_c4723b_9b5728_7b431b",
    "name": "Deep Amber Coral #48270F",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#48270F",
      "#C4723B",
      "#9B5728",
      "#7B431B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_482908_894e0d_fbdb52_ca7420",
    "name": "Deep Amber Coral #482908",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#482908",
      "#894E0D",
      "#FBDB52",
      "#CA7420"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_487fc9_a8e7f8_88ccf2_70afde",
    "name": "Medium Cyan Turquoise #487FC9",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#487FC9",
      "#A8E7F8",
      "#88CCF2",
      "#70AFDE"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_489b7a_a0e7d9_6dc5ac_87dac7",
    "name": "Dark Emerald Green #489B7A",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#489B7A",
      "#A0E7D9",
      "#6DC5AC",
      "#87DAC7"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_48c381_226640_369f64_3cac74",
    "name": "Medium Emerald Green #48C381",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#48C381",
      "#226640",
      "#369F64",
      "#3CAC74"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_49200b_c6926c_9c642b_a45c26",
    "name": "Deep Amber Coral #49200B",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#49200B",
      "#C6926C",
      "#9C642B",
      "#A45C26"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_495ca6_ccd2e6_a5b1d8_1e2852",
    "name": "Medium Cobalt Blue #495CA6",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#495CA6",
      "#CCD2E6",
      "#A5B1D8",
      "#1E2852"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_495e48_0d100d_9d9c87_9ecc9c",
    "name": "Dark Emerald Green #495E48",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#495E48",
      "#0D100D",
      "#9D9C87",
      "#9ECC9C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_496dba_94c9f2_72a7e2_84b4ec",
    "name": "Medium Cobalt Blue #496DBA",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#496DBA",
      "#94C9F2",
      "#72A7E2",
      "#84B4EC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4a6442_d0ab75_81cd94_181b12",
    "name": "Dark Emerald Green #4A6442",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#4A6442",
      "#D0AB75",
      "#81CD94",
      "#181B12"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4b362c_715a4f_211913_644c44",
    "name": "Deep Ruby Crimson #4B362C",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#4B362C",
      "#715A4F",
      "#211913",
      "#644C44"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4b4a3a_94a3a4_68766f_988475",
    "name": "Dark Gold Brass #4B4A3A",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#4B4A3A",
      "#94A3A4",
      "#68766F",
      "#988475"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4b5455_bbbfc4_97a0a6_838c90",
    "name": "Dark Chrome Steel #4B5455",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#4B5455",
      "#BBBFC4",
      "#97A0A6",
      "#838C90"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4c240e_a5613b_895134_734c44",
    "name": "Deep Amber Coral #4C240E",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#4C240E",
      "#A5613B",
      "#895134",
      "#734C44"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4c342a_7b584b_271912_6b4c44",
    "name": "Deep Ruby Crimson #4C342A",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#4C342A",
      "#7B584B",
      "#271912",
      "#6B4C44"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4c462e_6d876c_9aac8f_9aaba6",
    "name": "Deep Gold Brass #4C462E",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#4C462E",
      "#6D876C",
      "#9AAC8F",
      "#9AABA6"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4c4c4c_d2d2d2_8f8f8f_acacac",
    "name": "Dark Chrome Steel #4C4C4C",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#4C4C4C",
      "#D2D2D2",
      "#8F8F8F",
      "#ACACAC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4d595e_858d87_596f84_748480",
    "name": "Dark Chrome Steel #4D595E",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#4D595E",
      "#858D87",
      "#596F84",
      "#748480"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4e4c42_b8c4c5_898e89_a3aca4",
    "name": "Dark Chrome Steel #4E4C42",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#4E4C42",
      "#B8C4C5",
      "#898E89",
      "#A3ACA4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4e4d40_979786_aeaea1_878678",
    "name": "Dark Chrome Steel #4E4D40",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#4E4D40",
      "#979786",
      "#AEAEA1",
      "#878678"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4e5150_9fa3a3_848c8a_82848c",
    "name": "Dark Chrome Steel #4E5150",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#4E5150",
      "#9FA3A3",
      "#848C8A",
      "#82848C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4f251b_381710_43241b_602f23",
    "name": "Deep Ruby Crimson #4F251B",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#4F251B",
      "#381710",
      "#43241B",
      "#602F23"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4f439f_a28be5_8570d6_7765c9",
    "name": "Dark Cobalt Blue #4F439F",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#4F439F",
      "#A28BE5",
      "#8570D6",
      "#7765C9"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4f4742_b7b1aa_847e79_969294",
    "name": "Dark Chrome Steel #4F4742",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#4F4742",
      "#B7B1AA",
      "#847E79",
      "#969294"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4f4c45_a7aeaa_7a8575_9d97a2",
    "name": "Dark Chrome Steel #4F4C45",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#4F4C45",
      "#A7AEAA",
      "#7A8575",
      "#9D97A2"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4f4f4f_9c9c9c_121212_7c7c7c",
    "name": "Dark Chrome Steel #4F4F4F",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#4F4F4F",
      "#9C9C9C",
      "#121212",
      "#7C7C7C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4f4f4f_a1a1a1_8c8c8c_848484",
    "name": "Dark Chrome Steel #4F4F4F",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#4F4F4F",
      "#A1A1A1",
      "#8C8C8C",
      "#848484"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4f5246_8c8d84_7b7c74_131611",
    "name": "Dark Chrome Steel #4F5246",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#4F5246",
      "#8C8D84",
      "#7B7C74",
      "#131611"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_4fe34f_2bb02b_3cd03c_1c861c",
    "name": "Medium Emerald Green #4FE34F",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#4FE34F",
      "#2BB02B",
      "#3CD03C",
      "#1C861C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_50332c_d98d79_955f52_aa7c6c",
    "name": "Deep Ruby Crimson #50332C",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#50332C",
      "#D98D79",
      "#955F52",
      "#AA7C6C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_503522_c38254_9f6b45_845838",
    "name": "Deep Amber Coral #503522",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#503522",
      "#C38254",
      "#9F6B45",
      "#845838"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_504d3c_979c9d_81837d_9c998a",
    "name": "Dark Gold Brass #504D3C",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#504D3C",
      "#979C9D",
      "#81837D",
      "#9C998A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_513a11_cdbeb5_c8811c_9a733f",
    "name": "Deep Gold Brass #513A11",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#513A11",
      "#CDBEB5",
      "#C8811C",
      "#9A733F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_51462b_dfca7e_948050_a49874",
    "name": "Deep Gold Brass #51462B",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#51462B",
      "#DFCA7E",
      "#948050",
      "#A49874"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_515151_dcdcdc_b7b7b7_9b9b9b",
    "name": "Dark Chrome Steel #515151",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#515151",
      "#DCDCDC",
      "#B7B7B7",
      "#9B9B9B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_515341_9a9c86_16180d_838474",
    "name": "Dark Emerald Green #515341",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#515341",
      "#9A9C86",
      "#16180D",
      "#838474"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_517919_659623_34460c_3e5813",
    "name": "Dark Emerald Green #517919",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#517919",
      "#659623",
      "#34460C",
      "#3E5813"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_519c8d_83dac7_9dede0_2b5b4c",
    "name": "Medium Cyan Turquoise #519C8D",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#519C8D",
      "#83DAC7",
      "#9DEDE0",
      "#2B5B4C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_522221_91343b_7f6f6b_744960",
    "name": "Deep Ruby Crimson #522221",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#522221",
      "#91343B",
      "#7F6F6B",
      "#744960"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_522a1a_94543a_c3896f_ab7d66",
    "name": "Deep Ruby Crimson #522A1A",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#522A1A",
      "#94543A",
      "#C3896F",
      "#AB7D66"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_525050_d4d3d3_959393_acacac",
    "name": "Dark Chrome Steel #525050",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#525050",
      "#D4D3D3",
      "#959393",
      "#ACACAC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_533b33_af9998_866965_9c7e7b",
    "name": "Dark Ruby Crimson #533B33",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#533B33",
      "#AF9998",
      "#866965",
      "#9C7E7B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_535a2f_cdca91_91915b_a4ac6f",
    "name": "Dark Emerald Green #535A2F",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#535A2F",
      "#CDCA91",
      "#91915B",
      "#A4AC6F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_535f6b_a6bdc8_8fa3b4_7f91a2",
    "name": "Dark Cyan Turquoise #535F6B",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#535F6B",
      "#A6BDC8",
      "#8FA3B4",
      "#7F91A2"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_537387_75bbb9_152e5b_0e85e8",
    "name": "Dark Cyan Turquoise #537387",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#537387",
      "#75BBB9",
      "#152E5B",
      "#0E85E8"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_54584e_b1bac5_818b91_a7aca3",
    "name": "Dark Chrome Steel #54584E",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#54584E",
      "#B1BAC5",
      "#818B91",
      "#A7ACA3"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_545b4d_d8ddc8_a0a792_b2c1a3",
    "name": "Dark Chrome Steel #545B4D",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#545B4D",
      "#D8DDC8",
      "#A0A792",
      "#B2C1A3"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_54c104_bbfa0f_97ef04_7ae104",
    "name": "Dark Emerald Green #54C104",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#54C104",
      "#BBFA0F",
      "#97EF04",
      "#7AE104"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_55382f_78554e_271a16_6c4c44",
    "name": "Dark Ruby Crimson #55382F",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#55382F",
      "#78554E",
      "#271A16",
      "#6C4C44"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_555555_c8c8c8_8b8b8b_a4a4a4",
    "name": "Dark Chrome Steel #555555",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#555555",
      "#C8C8C8",
      "#8B8B8B",
      "#A4A4A4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_556f42_112817_81927f_223e24",
    "name": "Dark Emerald Green #556F42",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#556F42",
      "#112817",
      "#81927F",
      "#223E24"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_55c404_bcfa0e_97f004_7ae104",
    "name": "Dark Emerald Green #55C404",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#55C404",
      "#BCFA0E",
      "#97F004",
      "#7AE104"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_562d2a_2e1615_7e4945_703c3c",
    "name": "Dark Ruby Crimson #562D2A",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#562D2A",
      "#2E1615",
      "#7E4945",
      "#703C3C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_56352f_1e110f_311c19_3c231c",
    "name": "Dark Ruby Crimson #56352F",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#56352F",
      "#1E110F",
      "#311C19",
      "#3C231C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_57553f_c6c3af_8c8768_868c8c",
    "name": "Dark Gold Brass #57553F",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#57553F",
      "#C6C3AF",
      "#8C8768",
      "#868C8C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_57583e_969788_292920_848474",
    "name": "Dark Gold Brass #57583E",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#57583E",
      "#969788",
      "#292920",
      "#848474"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_579241_b5d25d_0e1d2d_97c284",
    "name": "Dark Emerald Green #579241",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#579241",
      "#B5D25D",
      "#0E1D2D",
      "#97C284"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_582410_83381a_1f0c04_30140a",
    "name": "Deep Ruby Crimson #582410",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#582410",
      "#83381A",
      "#1F0C04",
      "#30140A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_583629_2e1810_765648_3c1c14",
    "name": "Dark Ruby Crimson #583629",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#583629",
      "#2E1810",
      "#765648",
      "#3C1C14"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_584f3a_bec3bd_c5a57d_a39073",
    "name": "Dark Gold Brass #584F3A",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#584F3A",
      "#BEC3BD",
      "#C5A57D",
      "#A39073"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_586a51_ccd5aa_8c9675_8dbbb7",
    "name": "Dark Emerald Green #586A51",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#586A51",
      "#CCD5AA",
      "#8C9675",
      "#8DBBB7"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_593e2c_e5d8a9_bc9f79_9f8a68",
    "name": "Dark Amber Coral #593E2C",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#593E2C",
      "#E5D8A9",
      "#BC9F79",
      "#9F8A68"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_595356_cdbfc6_aa9da3_bbb3bc",
    "name": "Dark Chrome Steel #595356",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#595356",
      "#CDBFC6",
      "#AA9DA3",
      "#BBB3BC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_59554f_171716_847c74_2c2c24",
    "name": "Dark Chrome Steel #59554F",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#59554F",
      "#171716",
      "#847C74",
      "#2C2C24"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_596773_b3c6ce_98afb9_879aa8",
    "name": "Dark Cyan Turquoise #596773",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#596773",
      "#B3C6CE",
      "#98AFB9",
      "#879AA8"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_597c3f_254319_6c9668_7c9b53",
    "name": "Dark Emerald Green #597C3F",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#597C3F",
      "#254319",
      "#6C9668",
      "#7C9B53"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5a492b_dec583_987d4d_ac9c74",
    "name": "Dark Gold Brass #5A492B",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#5A492B",
      "#DEC583",
      "#987D4D",
      "#AC9C74"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5a643b_454d2c_393f25_202315",
    "name": "Dark Emerald Green #5A643B",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#5A643B",
      "#454D2C",
      "#393F25",
      "#202315"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5b4cbc_b59af2_9b84eb_8f78e4",
    "name": "Medium Cobalt Blue #5B4CBC",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#5B4CBC",
      "#B59AF2",
      "#9B84EB",
      "#8F78E4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5b5428_c5a052_a28b46_ada752",
    "name": "Dark Gold Brass #5B5428",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#5B5428",
      "#C5A052",
      "#A28B46",
      "#ADA752"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5b574e_586967_807c6f_6a746c",
    "name": "Dark Chrome Steel #5B574E",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#5B574E",
      "#586967",
      "#807C6F",
      "#6A746C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5c045c_bd0dbd_930493_a404a4",
    "name": "Deep Amethyst Purple #5C045C",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#5C045C",
      "#BD0DBD",
      "#930493",
      "#A404A4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5c2e0c_c36924_9f4f14_834114",
    "name": "Deep Amber Coral #5C2E0C",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#5C2E0C",
      "#C36924",
      "#9F4F14",
      "#834114"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5c4e41_cccdd6_9b979b_b1afb0",
    "name": "Dark Amber Coral #5C4E41",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#5C4E41",
      "#CCCDD6",
      "#9B979B",
      "#B1AFB0"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5c5743_262418_393727_342c20",
    "name": "Dark Gold Brass #5C5743",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#5C5743",
      "#262418",
      "#393727",
      "#342C20"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5c5c04_bdbd0d_939304_a4a404",
    "name": "Deep Gold Brass #5C5C04",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#5C5C04",
      "#BDBD0D",
      "#939304",
      "#A4A404"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5c5c5c_a2a2a2_8c8c8c_848484",
    "name": "Dark Chrome Steel #5C5C5C",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#5C5C5C",
      "#A2A2A2",
      "#8C8C8C",
      "#848484"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5d5854_1a1714_373330_2c2424",
    "name": "Dark Chrome Steel #5D5854",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#5D5854",
      "#1A1714",
      "#373330",
      "#2C2424"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5d5d5d_cdcdcd_232323_acacac",
    "name": "Dark Chrome Steel #5D5D5D",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#5D5D5D",
      "#CDCDCD",
      "#232323",
      "#ACACAC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5d5e5a_a1a29b_2a2927_8b948c",
    "name": "Dark Chrome Steel #5D5E5A",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#5D5E5A",
      "#A1A29B",
      "#2A2927",
      "#8B948C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5e423a_8c6e69_382416_745d64",
    "name": "Dark Ruby Crimson #5E423A",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#5E423A",
      "#8C6E69",
      "#382416",
      "#745D64"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5e5049_cdc2be_9c8e88_b7aca4",
    "name": "Dark Amber Coral #5E5049",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#5E5049",
      "#CDC2BE",
      "#9C8E88",
      "#B7ACA4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5e5855_c6c4cd_c89b67_8f8e98",
    "name": "Dark Chrome Steel #5E5855",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#5E5855",
      "#C6C4CD",
      "#C89B67",
      "#8F8E98"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5e5f62_a7b2be_211c17_939ca3",
    "name": "Dark Chrome Steel #5E5F62",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#5E5F62",
      "#A7B2BE",
      "#211C17",
      "#939CA3"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5ecba4_bcfae7_92eed0_a1f4dc",
    "name": "Medium Emerald Green #5ECBA4",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#5ECBA4",
      "#BCFAE7",
      "#92EED0",
      "#A1F4DC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5f1827_9b4a60_1f0404_340406",
    "name": "Deep Ruby Crimson #5F1827",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#5F1827",
      "#9B4A60",
      "#1F0404",
      "#340406"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5f4c4b_a07c7d_a8afbf_868185",
    "name": "Dark Chrome Steel #5F4C4B",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#5F4C4B",
      "#A07C7D",
      "#A8AFBF",
      "#868185"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5f4f50_a18e8e_8c7c7b_211a1a",
    "name": "Dark Chrome Steel #5F4F50",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#5F4F50",
      "#A18E8E",
      "#8C7C7B",
      "#211A1A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_5f5f5f_bdbdbd_a4a4a4_9c9c9c",
    "name": "Dark Chrome Steel #5F5F5F",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#5F5F5F",
      "#BDBDBD",
      "#A4A4A4",
      "#9C9C9C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_604a30_dc9065_212c14_ac9c92",
    "name": "Dark Amber Coral #604A30",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#604A30",
      "#DC9065",
      "#212C14",
      "#AC9C92"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_60534a_211813_9b948e_8e837d",
    "name": "Dark Amber Coral #60534A",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#60534A",
      "#211813",
      "#9B948E",
      "#8E837D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_605352_e9ccc5_c7a8a3_a89291",
    "name": "Dark Chrome Steel #605352",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#605352",
      "#E9CCC5",
      "#C7A8A3",
      "#A89291"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_606857_9ba894_8c9c83_8c9483",
    "name": "Dark Chrome Steel #606857",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#606857",
      "#9BA894",
      "#8C9C83",
      "#8C9483"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_613f04_d68c04_a45f04_1f0f04",
    "name": "Deep Gold Brass #613F04",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#613F04",
      "#D68C04",
      "#A45F04",
      "#1F0F04"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_61583e_252314_928972_342c1c",
    "name": "Dark Gold Brass #61583E",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#61583E",
      "#252314",
      "#928972",
      "#342C1C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_617586_23304c_1b1e30_4988cf",
    "name": "Medium Cyan Turquoise #617586",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#617586",
      "#23304C",
      "#1B1E30",
      "#4988CF"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_622f19_885934_9a7748_94603a",
    "name": "Deep Ruby Crimson #622F19",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#622F19",
      "#885934",
      "#9A7748",
      "#94603A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_623622_a1756f_986353_89645b",
    "name": "Dark Ruby Crimson #623622",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#623622",
      "#A1756F",
      "#986353",
      "#89645B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_624541_fcd0c6_e4a19a_fcbcb4",
    "name": "Dark Ruby Crimson #624541",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#624541",
      "#FCD0C6",
      "#E4A19A",
      "#FCBCB4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_626262_9e9e9e_848484_262626",
    "name": "Dark Chrome Steel #626262",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#626262",
      "#9E9E9E",
      "#848484",
      "#262626"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_626262_a8a8a8_949494_1f1f1f",
    "name": "Dark Chrome Steel #626262",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#626262",
      "#A8A8A8",
      "#949494",
      "#1F1F1F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_626a57_3b3f33_7d8973_444c3c",
    "name": "Dark Chrome Steel #626A57",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#626A57",
      "#3B3F33",
      "#7D8973",
      "#444C3C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_626d5c_b8c2bb_1b230f_a4aca3",
    "name": "Dark Chrome Steel #626D5C",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#626D5C",
      "#B8C2BB",
      "#1B230F",
      "#A4ACA3"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_627d72_a6caaa_202c28_b4d4b4",
    "name": "Dark Emerald Green #627D72",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#627D72",
      "#A6CAAA",
      "#202C28",
      "#B4D4B4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_630463_c30cc3_9b049b_ac04ac",
    "name": "Deep Amethyst Purple #630463",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#630463",
      "#C30CC3",
      "#9B049B",
      "#AC04AC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_63533b_aa9472_1c1108_9b8c68",
    "name": "Dark Gold Brass #63533B",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#63533B",
      "#AA9472",
      "#1C1108",
      "#9B8C68"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_63584b_e6e0d6_a8a092_bfb6a8",
    "name": "Dark Amber Coral #63584B",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#63584B",
      "#E6E0D6",
      "#A8A092",
      "#BFB6A8"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_635d52_a9bcc0_b1aea0_819598",
    "name": "Dark Chrome Steel #635D52",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#635D52",
      "#A9BCC0",
      "#B1AEA0",
      "#819598"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_636363_aaaaaa_949494_252525",
    "name": "Dark Chrome Steel #636363",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#636363",
      "#AAAAAA",
      "#949494",
      "#252525"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_636d6c_d4e7ed_abbcc4_9ba4a8",
    "name": "Dark Chrome Steel #636D6C",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#636D6C",
      "#D4E7ED",
      "#ABBCC4",
      "#9BA4A8"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_637598_b7c4d3_22293a_9bacbf",
    "name": "Medium Cobalt Blue #637598",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#637598",
      "#B7C4D3",
      "#22293A",
      "#9BACBF"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_64554d_d1c9c1_abada0_0e0c0a",
    "name": "Dark Amber Coral #64554D",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#64554D",
      "#D1C9C1",
      "#ABADA0",
      "#0E0C0A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_64686f_bdc0c4_161718_a4a7ab",
    "name": "Dark Chrome Steel #64686F",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#64686F",
      "#BDC0C4",
      "#161718",
      "#A4A7AB"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_647171_1f3349_2a475c_87a5ad",
    "name": "Dark Chrome Steel #647171",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#647171",
      "#1F3349",
      "#2A475C",
      "#87A5AD"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_647686_23292e_333c44_404b55",
    "name": "Medium Cyan Turquoise #647686",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#647686",
      "#23292E",
      "#333C44",
      "#404B55"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_656662_9b9b99_393b31_8b8c8c",
    "name": "Dark Chrome Steel #656662",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#656662",
      "#9B9B99",
      "#393B31",
      "#8B8C8C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_657274_2a2f30_a0a7b0_363c44",
    "name": "Dark Chrome Steel #657274",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#657274",
      "#2A2F30",
      "#A0A7B0",
      "#363C44"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_65a0ba_c3e4f1_a7d5e6_97cadf",
    "name": "Medium Cyan Turquoise #65A0BA",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#65A0BA",
      "#C3E4F1",
      "#A7D5E6",
      "#97CADF"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_65a0c7_c3e4f8_a7d5ef_97cae9",
    "name": "Medium Cyan Turquoise #65A0C7",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#65A0C7",
      "#C3E4F8",
      "#A7D5EF",
      "#97CAE9"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_660505_f2b090_dd4d37_aa1914",
    "name": "Deep Ruby Crimson #660505",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#660505",
      "#F2B090",
      "#DD4D37",
      "#AA1914"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_66605e_939198_2e261f_3c332a",
    "name": "Dark Chrome Steel #66605E",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#66605E",
      "#939198",
      "#2E261F",
      "#3C332A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_666864_b3b4ab_2f2f2c_9ca49b",
    "name": "Dark Chrome Steel #666864",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#666864",
      "#B3B4AB",
      "#2F2F2C",
      "#9CA49B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_673b2a_99735c_99593a_3a160e",
    "name": "Dark Ruby Crimson #673B2A",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#673B2A",
      "#99735C",
      "#99593A",
      "#3A160E"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_677e93_36444d_99a9ba_435464",
    "name": "Medium Cyan Turquoise #677E93",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#677E93",
      "#36444D",
      "#99A9BA",
      "#435464"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_678e67_c4d9c4_acc8ac_98b898",
    "name": "Medium Emerald Green #678E67",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#678E67",
      "#C4D9C4",
      "#ACC8AC",
      "#98B898"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_68049f_c90de6_a404cf_b304dc",
    "name": "Dark Amethyst Purple #68049F",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#68049F",
      "#C90DE6",
      "#A404CF",
      "#B304DC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_683f2d_9f736d_431d06_966152",
    "name": "Dark Ruby Crimson #683F2D",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#683F2D",
      "#9F736D",
      "#431D06",
      "#966152"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_68493e_b2aaa9_978c8c_130907",
    "name": "Dark Ruby Crimson #68493E",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#68493E",
      "#B2AAA9",
      "#978C8C",
      "#130907"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_684c40_776e69_9b7765_758d96",
    "name": "Dark Ruby Crimson #684C40",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#684C40",
      "#776E69",
      "#9B7765",
      "#758D96"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_685b57_beb1b1_9b99a4_1e1d1d",
    "name": "Dark Chrome Steel #685B57",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#685B57",
      "#BEB1B1",
      "#9B99A4",
      "#1E1D1D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_686464_cccac7_a4a19f_bcb4b4",
    "name": "Dark Chrome Steel #686464",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#686464",
      "#CCCAC7",
      "#A4A19F",
      "#BCB4B4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_686b73_2a2b2d_d5d9dd_b0b3bc",
    "name": "Dark Chrome Steel #686B73",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#686B73",
      "#2A2B2D",
      "#D5D9DD",
      "#B0B3BC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_686e55_353c2f_869b7f_444434",
    "name": "Dark Emerald Green #686E55",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#686E55",
      "#353C2F",
      "#869B7F",
      "#444434"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_696347_98b0a2_28261e_362b22",
    "name": "Dark Gold Brass #696347",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#696347",
      "#98B0A2",
      "#28261E",
      "#362B22"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_696969_a0a0a0_949494_8c8c8c",
    "name": "Dark Chrome Steel #696969",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#696969",
      "#A0A0A0",
      "#949494",
      "#8C8C8C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6a3c15_efc898_d59d59_b38346",
    "name": "Deep Amber Coral #6A3C15",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#6A3C15",
      "#EFC898",
      "#D59D59",
      "#B38346"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6a5338_1c120b_c5975f_96886c",
    "name": "Dark Amber Coral #6A5338",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#6A5338",
      "#1C120B",
      "#C5975F",
      "#96886C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6a8287_405153_839ebe_424c5c",
    "name": "Medium Cyan Turquoise #6A8287",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#6A8287",
      "#405153",
      "#839EBE",
      "#424C5C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6b3822_a65d48_824e48_401e0c",
    "name": "Dark Ruby Crimson #6B3822",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#6B3822",
      "#A65D48",
      "#824E48",
      "#401E0C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6bbd6b_c8f3c8_a3e2a3_b4ecb4",
    "name": "Medium Emerald Green #6BBD6B",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#6BBD6B",
      "#C8F3C8",
      "#A3E2A3",
      "#B4ECB4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6c52aa_c9a6ea_a681d6_b494e2",
    "name": "Medium Cobalt Blue #6C52AA",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#6C52AA",
      "#C9A6EA",
      "#A681D6",
      "#B494E2"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6c5dc3_352d66_5c4cab_544ca5",
    "name": "Medium Cobalt Blue #6C5DC3",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#6C5DC3",
      "#352D66",
      "#5C4CAB",
      "#544CA5"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6c6f76_cbd1d7_b2bdc7_a6b0bf",
    "name": "Dark Chrome Steel #6C6F76",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#6C6F76",
      "#CBD1D7",
      "#B2BDC7",
      "#A6B0BF"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6c8996_14223f_b9dedd_2e445c",
    "name": "Medium Cyan Turquoise #6C8996",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#6C8996",
      "#14223F",
      "#B9DEDD",
      "#2E445C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6d1616_e6cdba_de2b24_230f0f",
    "name": "Dark Ruby Crimson #6D1616",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#6D1616",
      "#E6CDBA",
      "#DE2B24",
      "#230F0F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6d3b1c_895638_502a0d_844c31",
    "name": "Dark Amber Coral #6D3B1C",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#6D3B1C",
      "#895638",
      "#502A0D",
      "#844C31"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6d6050_c8c2b9_a2998e_b4aa9f",
    "name": "Dark Clay Skin #6D6050",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#6D6050",
      "#C8C2B9",
      "#A2998E",
      "#B4AA9F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6d6d6d_3e3e3e_c0c0c0_949494",
    "name": "Dark Chrome Steel #6D6D6D",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#6D6D6D",
      "#3E3E3E",
      "#C0C0C0",
      "#949494"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6e2e36_d3a1a0_bd7175_c78c8b",
    "name": "Dark Ruby Crimson #6E2E36",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#6E2E36",
      "#D3A1A0",
      "#BD7175",
      "#C78C8B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6e5137_e8ca90_271912_b99c74",
    "name": "Dark Amber Coral #6E5137",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#6E5137",
      "#E8CA90",
      "#271912",
      "#B99C74"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6e524d_8496c5_af6624_100b11",
    "name": "Dark Ruby Crimson #6E524D",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#6E524D",
      "#8496C5",
      "#AF6624",
      "#100B11"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6e6d69_d0ece9_aac7c6_200c0c",
    "name": "Dark Chrome Steel #6E6D69",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#6E6D69",
      "#D0ECE9",
      "#AAC7C6",
      "#200C0C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6e7181_d1cfdf_abafc7_b4bcce",
    "name": "Medium Chrome Steel #6E7181",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#6E7181",
      "#D1CFDF",
      "#ABAFC7",
      "#B4BCCE"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6e8c48_b8cda7_344018_a8bc94",
    "name": "Dark Emerald Green #6E8C48",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#6E8C48",
      "#B8CDA7",
      "#344018",
      "#A8BC94"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6ec66e_c9f8c9_a3e8a3_b4f1b4",
    "name": "Medium Emerald Green #6EC66E",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#6EC66E",
      "#C9F8C9",
      "#A3E8A3",
      "#B4F1B4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_6f503e_d59a70_221812_b0a899",
    "name": "Dark Amber Coral #6F503E",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#6F503E",
      "#D59A70",
      "#221812",
      "#B0A899"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_705b4b_312821_af927b_44342c",
    "name": "Dark Clay Skin #705B4B",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#705B4B",
      "#312821",
      "#AF927B",
      "#44342C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_706962_24211e_bcb6af_aca494",
    "name": "Dark Chrome Steel #706962",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#706962",
      "#24211E",
      "#BCB6AF",
      "#ACA494"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_713a28_a87661_3a160d_9b6454",
    "name": "Dark Ruby Crimson #713A28",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#713A28",
      "#A87661",
      "#3A160D",
      "#9B6454"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_714c30_ead7c5_cc9265_e2b48f",
    "name": "Dark Amber Coral #714C30",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#714C30",
      "#EAD7C5",
      "#CC9265",
      "#E2B48F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_716049_d1c8b9_3f160c_baa6a9",
    "name": "Dark Clay Skin #716049",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#716049",
      "#D1C8B9",
      "#3F160C",
      "#BAA6A9"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_71623b_ecde8c_30250a_aba69a",
    "name": "Dark Gold Brass #71623B",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#71623B",
      "#ECDE8C",
      "#30250A",
      "#ABA69A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_72625b_f0dfd0_d9baa5_c3a595",
    "name": "Dark Chrome Steel #72625B",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#72625B",
      "#F0DFD0",
      "#D9BAA5",
      "#C3A595"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_726f5b_a09c88_8b8c7b_94907c",
    "name": "Dark Chrome Steel #726F5B",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#726F5B",
      "#A09C88",
      "#8B8C7B",
      "#94907C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_727167_2f2f2b_a3a6a2_44443c",
    "name": "Dark Chrome Steel #727167",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#727167",
      "#2F2F2B",
      "#A3A6A2",
      "#44443C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_728473_534c40_7bcec8_7bb9b6",
    "name": "Medium Chrome Steel #728473",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#728473",
      "#534C40",
      "#7BCEC8",
      "#7BB9B6"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_736655_d9d8d5_2f281f_b1aeab",
    "name": "Dark Clay Skin #736655",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#736655",
      "#D9D8D5",
      "#2F281F",
      "#B1AEAB"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_745359_bfaea8_9b8384_ac9392",
    "name": "Dark Ruby Crimson #745359",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#745359",
      "#BFAEA8",
      "#9B8384",
      "#AC9392"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_746761_291c19_ab9385_3c2b27",
    "name": "Dark Chrome Steel #746761",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#746761",
      "#291C19",
      "#AB9385",
      "#3C2B27"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_747a6f_292e2a_aca79f_45453b",
    "name": "Medium Chrome Steel #747A6F",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#747A6F",
      "#292E2A",
      "#ACA79F",
      "#45453B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_74a192_041b0d_194c33_235b4c",
    "name": "Medium Emerald Green #74A192",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#74A192",
      "#041B0D",
      "#194C33",
      "#235B4C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_75322b_96463f_51201a_3d1814",
    "name": "Dark Ruby Crimson #75322B",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#75322B",
      "#96463F",
      "#51201A",
      "#3D1814"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_75723e_c0c3a0_2a1e0e_afae77",
    "name": "Dark Gold Brass #75723E",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#75723E",
      "#C0C3A0",
      "#2A1E0E",
      "#AFAE77"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_75746f_333330_a2a1a9_444444",
    "name": "Dark Chrome Steel #75746F",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#75746F",
      "#333330",
      "#A2A1A9",
      "#444444"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_758391_bac2ca_435263_a1acbc",
    "name": "Medium Chrome Steel #758391",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#758391",
      "#BAC2CA",
      "#435263",
      "#A1ACBC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_763b28_d0bdb8_ada39e_1e1d1d",
    "name": "Dark Ruby Crimson #763B28",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#763B28",
      "#D0BDB8",
      "#ADA39E",
      "#1E1D1D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_763c39_431510_210504_55241c",
    "name": "Dark Ruby Crimson #763C39",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#763C39",
      "#431510",
      "#210504",
      "#55241C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_764739_d0917b_2a1611_b37c68",
    "name": "Dark Ruby Crimson #764739",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#764739",
      "#D0917B",
      "#2A1611",
      "#B37C68"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_765938_1f1009_a59c7c_c9a382",
    "name": "Dark Amber Coral #765938",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#765938",
      "#1F1009",
      "#A59C7C",
      "#C9A382"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_766554_c1bebb_2a1a0e_b4abac",
    "name": "Dark Clay Skin #766554",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#766554",
      "#C1BEBB",
      "#2A1A0E",
      "#B4ABAC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_76787c_2f3031_a5a9b8_444446",
    "name": "Medium Chrome Steel #76787C",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#76787C",
      "#2F3031",
      "#A5A9B8",
      "#444446"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_767989_323437_b6c4ee_343c44",
    "name": "Medium Chrome Steel #767989",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#767989",
      "#323437",
      "#B6C4EE",
      "#343C44"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_771a1f_d2939e_b6595d_9d4b54",
    "name": "Dark Ruby Crimson #771A1F",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#771A1F",
      "#D2939E",
      "#B6595D",
      "#9D4B54"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_773012_ae5124_4d1908_340f04",
    "name": "Dark Ruby Crimson #773012",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#773012",
      "#AE5124",
      "#4D1908",
      "#340F04"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_776045_d2ccc3_281910_bbb5aa",
    "name": "Dark Clay Skin #776045",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#776045",
      "#D2CCC3",
      "#281910",
      "#BBB5AA"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_776a5c_ba9a89_302c26_443c34",
    "name": "Dark Clay Skin #776A5C",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#776A5C",
      "#BA9A89",
      "#302C26",
      "#443C34"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_776c62_292622_474039_3c342c",
    "name": "Dark Chrome Steel #776C62",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#776C62",
      "#292622",
      "#474039",
      "#3C342C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_777c61_333727_babfa1_a5ac8c",
    "name": "Dark Emerald Green #777C61",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#777C61",
      "#333727",
      "#BABFA1",
      "#A5AC8C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_777d7d_bdcad2_3e3c2e_b1b8b6",
    "name": "Medium Chrome Steel #777D7D",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#777D7D",
      "#BDCAD2",
      "#3E3C2E",
      "#B1B8B6"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_787165_dad9cd_9dc0ce_36302a",
    "name": "Dark Chrome Steel #787165",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#787165",
      "#DAD9CD",
      "#9DC0CE",
      "#36302A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7877ee_d87fc5_75d9c7_1c78c0",
    "name": "Bright Cobalt Blue #7877EE",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#7877EE",
      "#D87FC5",
      "#75D9C7",
      "#1C78C0"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_794e40_361612_4c2a21_441b1b",
    "name": "Dark Ruby Crimson #794E40",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#794E40",
      "#361612",
      "#4C2A21",
      "#441B1B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_795038_c2856b_533320_ac7c61",
    "name": "Dark Amber Coral #795038",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#795038",
      "#C2856B",
      "#533320",
      "#AC7C61"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_796d6b_ded3cb_c6bab1_ada09b",
    "name": "Dark Chrome Steel #796D6B",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#796D6B",
      "#DED3CB",
      "#C6BAB1",
      "#ADA09B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_796f52_36413a_c9b48c_b6a77f",
    "name": "Dark Clay Skin #796F52",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#796F52",
      "#36413A",
      "#C9B48C",
      "#B6A77F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_797367_302e29_aba3a0_443c35",
    "name": "Dark Chrome Steel #797367",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#797367",
      "#302E29",
      "#ABA3A0",
      "#443C35"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7a6959_2d271d_c1b5a9_b4a393",
    "name": "Dark Clay Skin #7A6959",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#7A6959",
      "#2D271D",
      "#C1B5A9",
      "#B4A393"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7a736f_463f33_575046_4b463d",
    "name": "Medium Chrome Steel #7A736F",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#7A736F",
      "#463F33",
      "#575046",
      "#4B463D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7a7a7a_d0d0d0_bcbcbc_b4b4b4",
    "name": "Medium Chrome Steel #7A7A7A",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#7A7A7A",
      "#D0D0D0",
      "#BCBCBC",
      "#B4B4B4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7a7a7a_d9d9d9_bcbcbc_b4b4b4",
    "name": "Medium Chrome Steel #7A7A7A",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#7A7A7A",
      "#D9D9D9",
      "#BCBCBC",
      "#B4B4B4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7a7c63_625531_665b3f_5b4b29",
    "name": "Dark Chrome Steel #7A7C63",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#7A7C63",
      "#625531",
      "#665B3F",
      "#5B4B29"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7a9196_485c64_425459_c1e4e7",
    "name": "Medium Chrome Steel #7A9196",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#7A9196",
      "#485C64",
      "#425459",
      "#C1E4E7"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7b5254_e9dcc7_b19986_c8ac91",
    "name": "Dark Ruby Crimson #7B5254",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#7B5254",
      "#E9DCC7",
      "#B19986",
      "#C8AC91"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7b6857_383028_bca38f_4c3c34",
    "name": "Dark Clay Skin #7B6857",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#7B6857",
      "#383028",
      "#BCA38F",
      "#4C3C34"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7b6e5b_c5cacc_b1b2ae_322415",
    "name": "Dark Clay Skin #7B6E5B",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#7B6E5B",
      "#C5CACC",
      "#B1B2AE",
      "#322415"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7b7e82_343536_a0b1c8_44444c",
    "name": "Medium Chrome Steel #7B7E82",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#7B7E82",
      "#343536",
      "#A0B1C8",
      "#44444C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7c584c_27140d_b3765c_3d2318",
    "name": "Dark Clay Skin #7C584C",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#7C584C",
      "#27140D",
      "#B3765C",
      "#3D2318"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7c7c71_353630_adafaf_444444",
    "name": "Medium Chrome Steel #7C7C71",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#7C7C71",
      "#353630",
      "#ADAFAF",
      "#444444"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7d6651_f8e3bf_cea987_e7c29c",
    "name": "Dark Clay Skin #7D6651",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#7D6651",
      "#F8E3BF",
      "#CEA987",
      "#E7C29C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7d7673_353230_aea7b0_4c4444",
    "name": "Medium Chrome Steel #7D7673",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#7D7673",
      "#353230",
      "#AEA7B0",
      "#4C4444"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7da1ba_a4cce8_5d7a8b_5e7c94",
    "name": "Medium Cyan Turquoise #7DA1BA",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#7DA1BA",
      "#A4CCE8",
      "#5D7A8B",
      "#5E7C94"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7e5344_22120e_ccab9c_8d919d",
    "name": "Dark Clay Skin #7E5344",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#7E5344",
      "#22120E",
      "#CCAB9C",
      "#8D919D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7e5e57_ad9794_612d1d_c9997d",
    "name": "Dark Ruby Crimson #7E5E57",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#7E5E57",
      "#AD9794",
      "#612D1D",
      "#C9997D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7e8174_39444d_cecaa7_b3b49b",
    "name": "Medium Chrome Steel #7E8174",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#7E8174",
      "#39444D",
      "#CECAA7",
      "#B3B49B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7f5134_22120a_452110_9f7d5f",
    "name": "Dark Clay Skin #7F5134",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#7F5134",
      "#22120A",
      "#452110",
      "#9F7D5F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_7f8896_3b3936_bbcfe9_4b4b4d",
    "name": "Medium Chrome Steel #7F8896",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#7F8896",
      "#3B3936",
      "#BBCFE9",
      "#4B4B4D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_803537_310f10_c35a5d_d89093",
    "name": "Dark Ruby Crimson #803537",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#803537",
      "#310F10",
      "#C35A5D",
      "#D89093"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_807068_c3b0ab_443e3b_ac9c94",
    "name": "Medium Chrome Steel #807068",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#807068",
      "#C3B0AB",
      "#443E3B",
      "#AC9C94"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_80726c_dcdbd7_9aa6c2_b7bfca",
    "name": "Medium Chrome Steel #80726C",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#80726C",
      "#DCDBD7",
      "#9AA6C2",
      "#B7BFCA"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_808a5b_e0e1d4_2c4304_c5c7b0",
    "name": "Dark Emerald Green #808A5B",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#808A5B",
      "#E0E1D4",
      "#2C4304",
      "#C5C7B0"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_80a6b4_d5e9ef_b2d0d9_c1dce4",
    "name": "Medium Cyan Turquoise #80A6B4",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#80A6B4",
      "#D5E9EF",
      "#B2D0D9",
      "#C1DCE4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_80ca23_b7ee37_d5fa4c_a3e434",
    "name": "Medium Emerald Green #80CA23",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#80CA23",
      "#B7EE37",
      "#D5FA4C",
      "#A3E434"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_812828_521818_c94141_ab3737",
    "name": "Dark Ruby Crimson #812828",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#812828",
      "#521818",
      "#C94141",
      "#AB3737"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_812e39_551c24_381117_9e3c49",
    "name": "Dark Ruby Crimson #812E39",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#812E39",
      "#551C24",
      "#381117",
      "#9E3C49"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_815c41_f6c99a_d39f77_bb9474",
    "name": "Dark Clay Skin #815C41",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#815C41",
      "#F6C99A",
      "#D39F77",
      "#BB9474"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_815f54_decbc6_301813_c5a8a0",
    "name": "Dark Ruby Crimson #815F54",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#815F54",
      "#DECBC6",
      "#301813",
      "#C5A8A0"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8194ab_d6dfeb_c0cede_b0bfd1",
    "name": "Medium Cyan Turquoise #8194AB",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#8194AB",
      "#D6DFEB",
      "#C0CEDE",
      "#B0BFD1"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_81adb3_d6ecee_bfdee1_afd1d7",
    "name": "Medium Cyan Turquoise #81ADB3",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#81ADB3",
      "#D6ECEE",
      "#BFDEE1",
      "#AFD1D7"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_81baba_d5f3f3_bbe4e4_abdcdc",
    "name": "Medium Cyan Turquoise #81BABA",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#81BABA",
      "#D5F3F3",
      "#BBE4E4",
      "#ABDCDC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_825c4d_a08175_97746c_613b2f",
    "name": "Dark Clay Skin #825C4D",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#825C4D",
      "#A08175",
      "#97746C",
      "#613B2F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_826a59_e0c9b9_cbad99_3d2615",
    "name": "Dark Clay Skin #826A59",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#826A59",
      "#E0C9B9",
      "#CBAD99",
      "#3D2615"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_827c87_4f3937_605457_534c4e",
    "name": "Medium Chrome Steel #827C87",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#827C87",
      "#4F3937",
      "#605457",
      "#534C4E"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_834741_4c281d_be8f8c_ae6a65",
    "name": "Dark Ruby Crimson #834741",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#834741",
      "#4C281D",
      "#BE8F8C",
      "#AE6A65"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_835984_39273a_4c334c_593d5a",
    "name": "Dark Amethyst Purple #835984",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#835984",
      "#39273A",
      "#4C334C",
      "#593D5A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_837667_dcd4c8_c5baac_3c2e22",
    "name": "Medium Chrome Steel #837667",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#837667",
      "#DCD4C8",
      "#C5BAAC",
      "#3C2E22"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_846556_503e33_61493d_5c4434",
    "name": "Dark Clay Skin #846556",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#846556",
      "#503E33",
      "#61493D",
      "#5C4434"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_848679_363630_aabbb7_4b4b44",
    "name": "Medium Chrome Steel #848679",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#848679",
      "#363630",
      "#AABBB7",
      "#4B4B44"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_855d08_dac31b_bf9b0c_af860c",
    "name": "Dark Gold Brass #855D08",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#855D08",
      "#DAC31B",
      "#BF9B0C",
      "#AF860C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_85694c_d1a67a_3c2f22_ebbf8f",
    "name": "Dark Clay Skin #85694C",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#85694C",
      "#D1A67A",
      "#3C2F22",
      "#EBBF8F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_857b61_ace5d4_593d28_5b4334",
    "name": "Medium Clay Skin #857B61",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#857B61",
      "#ACE5D4",
      "#593D28",
      "#5B4334"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_858362_9f9f80_9c9673_70714b",
    "name": "Medium Gold Brass #858362",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#858362",
      "#9F9F80",
      "#9C9673",
      "#70714B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_85b9d3_c9eaf9_417277_528789",
    "name": "Bright Cyan Turquoise #85B9D3",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#85B9D3",
      "#C9EAF9",
      "#417277",
      "#528789"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_866c5b_544237_b29b8c_ac8f7c",
    "name": "Dark Clay Skin #866C5B",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#866C5B",
      "#544237",
      "#B29B8C",
      "#AC8F7C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_872f2d_ab403e_682421_581f1c",
    "name": "Dark Ruby Crimson #872F2D",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#872F2D",
      "#AB403E",
      "#682421",
      "#581F1C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_877b70_34302b_cbb3a4_524c44",
    "name": "Medium Chrome Steel #877B70",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#877B70",
      "#34302B",
      "#CBB3A4",
      "#524C44"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_877c72_b6acbb_36322d_4c443b",
    "name": "Medium Chrome Steel #877C72",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#877C72",
      "#B6ACBB",
      "#36322D",
      "#4C443B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_878787_4c4c4c_646464_5c5c5c",
    "name": "Medium Chrome Steel #878787",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#878787",
      "#4C4C4C",
      "#646464",
      "#5C5C5C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_887153_e5c188_433729_c1a484",
    "name": "Dark Clay Skin #887153",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#887153",
      "#E5C188",
      "#433729",
      "#C1A484"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_888d8f_515454_646a6c_6c6c6d",
    "name": "Medium Chrome Steel #888D8F",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#888D8F",
      "#515454",
      "#646A6C",
      "#6C6C6D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_89204b_17080d_da4377_f780b5",
    "name": "Dark Magenta Velvet #89204B",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#89204B",
      "#17080D",
      "#DA4377",
      "#F780B5"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8955d0_744cc4_ea4aef_954da4",
    "name": "Medium Amethyst Purple #8955D0",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#8955D0",
      "#744CC4",
      "#EA4AEF",
      "#954DA4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8a3b3d_da5f62_461f20_bc7f81",
    "name": "Dark Ruby Crimson #8A3B3D",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#8A3B3D",
      "#DA5F62",
      "#461F20",
      "#BC7F81"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8a3da1_d77ce4_c263d4_b75ac9",
    "name": "Dark Amethyst Purple #8A3DA1",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#8A3DA1",
      "#D77CE4",
      "#C263D4",
      "#B75AC9"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8a5b34_f3bd7c_da9758_be7e45",
    "name": "Dark Clay Skin #8A5B34",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#8A5B34",
      "#F3BD7C",
      "#DA9758",
      "#BE7E45"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8a6565_2e214d_d48a5f_ada59c",
    "name": "Medium Ruby Crimson #8A6565",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#8A6565",
      "#2E214D",
      "#D48A5F",
      "#ADA59C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8a7666_3c332c_c6aea2_54443c",
    "name": "Medium Clay Skin #8A7666",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#8A7666",
      "#3C332C",
      "#C6AEA2",
      "#54443C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8a7968_3c342d_c6b3a5_54443b",
    "name": "Medium Clay Skin #8A7968",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#8A7968",
      "#3C342D",
      "#C6B3A5",
      "#54443B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8b7469_443e39_c7a797_544443",
    "name": "Medium Clay Skin #8B7469",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#8B7469",
      "#443E39",
      "#C7A797",
      "#544443"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8b795f_291504_efe5d4_4a3518",
    "name": "Medium Clay Skin #8B795F",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#8B795F",
      "#291504",
      "#EFE5D4",
      "#4A3518"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8b892c_d4e856_475e2d_47360a",
    "name": "Dark Gold Brass #8B892C",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#8B892C",
      "#D4E856",
      "#475E2D",
      "#47360A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8c5945_d4c0b6_c3a49c_430504",
    "name": "Dark Clay Skin #8C5945",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#8C5945",
      "#D4C0B6",
      "#C3A49C",
      "#430504"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8caebc_3a4443_506463_daefef",
    "name": "Medium Cyan Turquoise #8CAEBC",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#8CAEBC",
      "#3A4443",
      "#506463",
      "#DAEFEF"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8d553d_3c2419_5d3727_aa766c",
    "name": "Dark Clay Skin #8D553D",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#8D553D",
      "#3C2419",
      "#5D3727",
      "#AA766C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8d8d8d_dddddd_cccccc_b7b7b7",
    "name": "Medium Chrome Steel #8D8D8D",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#8D8D8D",
      "#DDDDDD",
      "#CCCCCC",
      "#B7B7B7"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8e6767_d9c4c4_c8acac_b89898",
    "name": "Medium Ruby Crimson #8E6767",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#8E6767",
      "#D9C4C4",
      "#C8ACAC",
      "#B89898"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8e7c67_e2c6a5_3b332a_c3ab94",
    "name": "Medium Clay Skin #8E7C67",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#8E7C67",
      "#E2C6A5",
      "#3B332A",
      "#C3AB94"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8e907c_b1b5a7_d7dbd0_cccfba",
    "name": "Medium Chrome Steel #8E907C",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#8E907C",
      "#B1B5A7",
      "#D7DBD0",
      "#CCCFBA"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8f4277_361530_bf538e_52274c",
    "name": "Dark Magenta Velvet #8F4277",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#8F4277",
      "#361530",
      "#BF538E",
      "#52274C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8f4e20_e8b06b_391a08_cc8944",
    "name": "Dark Amber Coral #8F4E20",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#8F4E20",
      "#E8B06B",
      "#391A08",
      "#CC8944"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8f5d3c_5b3b26_382416_70482e",
    "name": "Dark Clay Skin #8F5D3C",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#8F5D3C",
      "#5B3B26",
      "#382416",
      "#70482E"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8f7b61_d6b892_4e4436_c3ac86",
    "name": "Medium Clay Skin #8F7B61",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#8F7B61",
      "#D6B892",
      "#4E4436",
      "#C3AC86"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_8f894e_dad79b_c9c384_c4be7b",
    "name": "Dark Gold Brass #8F894E",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#8F894E",
      "#DAD79B",
      "#C9C384",
      "#C4BE7B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_903b2a_ec9888_d96747_58190d",
    "name": "Dark Ruby Crimson #903B2A",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#903B2A",
      "#EC9888",
      "#D96747",
      "#58190D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_906867_c7b6bc_5d2e26_bea4a3",
    "name": "Medium Ruby Crimson #906867",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#906867",
      "#C7B6BC",
      "#5D2E26",
      "#BEA4A3"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_908887_3c3229_c7c6d0_554a45",
    "name": "Medium Chrome Steel #908887",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#908887",
      "#3C3229",
      "#C7C6D0",
      "#554A45"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_908e8e_292828_454444_595757",
    "name": "Medium Chrome Steel #908E8E",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#908E8E",
      "#292828",
      "#454444",
      "#595757"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_909473_555d4b_c2cca2_645b3c",
    "name": "Medium Emerald Green #909473",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#909473",
      "#555D4B",
      "#C2CCA2",
      "#645B3C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_910e5a_e127c3_cf1ca3_c1158f",
    "name": "Dark Magenta Velvet #910E5A",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#910E5A",
      "#E127C3",
      "#CF1CA3",
      "#C1158F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_926b48_4c2d0d_5f3913_aa8874",
    "name": "Dark Clay Skin #926B48",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#926B48",
      "#4C2D0D",
      "#5F3913",
      "#AA8874"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_927253_eecea7_d8b792_c7a883",
    "name": "Dark Clay Skin #927253",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#927253",
      "#EECEA7",
      "#D8B792",
      "#C7A883"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_935555_f6dad9_d39393_593333",
    "name": "Medium Ruby Crimson #935555",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#935555",
      "#F6DAD9",
      "#D39393",
      "#593333"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_936451_c29a8f_5f3a2b_361d14",
    "name": "Dark Clay Skin #936451",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#936451",
      "#C29A8F",
      "#5F3A2B",
      "#361D14"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_938c8d_403731_ceced8_554c4c",
    "name": "Medium Chrome Steel #938C8D",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#938C8D",
      "#403731",
      "#CECED8",
      "#554C4C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_942967_d292b5_c76e9e_551a4c",
    "name": "Dark Magenta Velvet #942967",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#942967",
      "#D292B5",
      "#C76E9E",
      "#551A4C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_945d43_e5aaa0_351f14_cc8b78",
    "name": "Dark Clay Skin #945D43",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#945D43",
      "#E5AAA0",
      "#351F14",
      "#CC8B78"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_94615b_daced1_c3b9a4_ccabaa",
    "name": "Medium Ruby Crimson #94615B",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#94615B",
      "#DACED1",
      "#C3B9A4",
      "#CCABAA"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_94624f_573529_24110c_733424",
    "name": "Dark Clay Skin #94624F",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#94624F",
      "#573529",
      "#24110C",
      "#733424"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9650ca_46236a_7239a6_633492",
    "name": "Medium Amethyst Purple #9650CA",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#9650CA",
      "#46236A",
      "#7239A6",
      "#633492"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_965146_2b191d_df7a5c_bfd6e1",
    "name": "Dark Ruby Crimson #965146",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#965146",
      "#2B191D",
      "#DF7A5C",
      "#BFD6E1"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_96785d_b8a398_63452c_6c5435",
    "name": "Medium Clay Skin #96785D",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#96785D",
      "#B8A398",
      "#63452C",
      "#6C5435"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_975337_eebe98_4b211c_d88659",
    "name": "Dark Clay Skin #975337",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#975337",
      "#EEBE98",
      "#4B211C",
      "#D88659"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_977970_e1d9d8_dac8c1_c4b2ad",
    "name": "Medium Ruby Crimson #977970",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#977970",
      "#E1D9D8",
      "#DAC8C1",
      "#C4B2AD"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_98332e_4a100d_691a16_a85a5b",
    "name": "Dark Ruby Crimson #98332E",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#98332E",
      "#4A100D",
      "#691A16",
      "#A85A5B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_989784_665542_bfece5_6d644c",
    "name": "Medium Chrome Steel #989784",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#989784",
      "#665542",
      "#BFECE5",
      "#6D644C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9a5a55_31110d_582a24_703c34",
    "name": "Medium Ruby Crimson #9A5A55",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#9A5A55",
      "#31110D",
      "#582A24",
      "#703C34"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9a7467_d2c2bf_662d22_ccb2a5",
    "name": "Medium Clay Skin #9A7467",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#9A7467",
      "#D2C2BF",
      "#662D22",
      "#CCB2A5"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9aa8b6_313133_4e5055_d7ebf8",
    "name": "Bright Cyan Turquoise #9AA8B6",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#9AA8B6",
      "#313133",
      "#4E5055",
      "#D7EBF8"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9b4816_e8a138_cc7421_dc8827",
    "name": "Dark Amber Coral #9B4816",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#9B4816",
      "#E8A138",
      "#CC7421",
      "#DC8827"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9b9994_e1e0db_474643_544c4c",
    "name": "Medium Chrome Steel #9B9994",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#9B9994",
      "#E1E0DB",
      "#474643",
      "#544C4C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9b9b9b_1e1e1e_5c5c5c_444444",
    "name": "Medium Chrome Steel #9B9B9B",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#9B9B9B",
      "#1E1E1E",
      "#5C5C5C",
      "#444444"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9c5b3b_49200a_e9c8ab_ddab7d",
    "name": "Dark Clay Skin #9C5B3B",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#9C5B3B",
      "#49200A",
      "#E9C8AB",
      "#DDAB7D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9cc338_4e671a_799f27_8cac2c",
    "name": "Medium Emerald Green #9CC338",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#9CC338",
      "#4E671A",
      "#799F27",
      "#8CAC2C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9d282a_38191d_dfc6cd_d6495a",
    "name": "Dark Ruby Crimson #9D282A",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#9D282A",
      "#38191D",
      "#DFC6CD",
      "#D6495A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9d4343_e38989_d37474_ce6c6c",
    "name": "Dark Ruby Crimson #9D4343",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#9D4343",
      "#E38989",
      "#D37474",
      "#CE6C6C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9d602e_e4c363_d5a64f_c38a44",
    "name": "Dark Clay Skin #9D602E",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#9D602E",
      "#E4C363",
      "#D5A64F",
      "#C38A44"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9d7f6e_c6dad4_6d4c4b_c6bbbc",
    "name": "Medium Clay Skin #9D7F6E",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#9D7F6E",
      "#C6DAD4",
      "#6D4C4B",
      "#C6BBBC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9d8f84_5d4544_d9d3c9_62555a",
    "name": "Medium Chrome Steel #9D8F84",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#9D8F84",
      "#5D4544",
      "#D9D3C9",
      "#62555A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9d9d9d_4e4e4e_646464_6c6c6c",
    "name": "Medium Chrome Steel #9D9D9D",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#9D9D9D",
      "#4E4E4E",
      "#646464",
      "#6C6C6C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9e7c7e_ddcbd0_351d20_683b38",
    "name": "Medium Ruby Crimson #9E7C7E",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#9E7C7E",
      "#DDCBD0",
      "#351D20",
      "#683B38"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9e9c77_6e6f4e_7c7c54_c7bf96",
    "name": "Medium Gold Brass #9E9C77",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#9E9C77",
      "#6E6F4E",
      "#7C7C54",
      "#C7BF96"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9f1a27_f1af7f_cd5845_d08441",
    "name": "Dark Ruby Crimson #9F1A27",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#9F1A27",
      "#F1AF7F",
      "#CD5845",
      "#D08441"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9f4738_ce958d_4f0c0a_c0837c",
    "name": "Dark Ruby Crimson #9F4738",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#9F4738",
      "#CE958D",
      "#4F0C0A",
      "#C0837C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9f7d30_b69f75_b9b7be_cb9c4d",
    "name": "Dark Clay Skin #9F7D30",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#9F7D30",
      "#B69F75",
      "#B9B7BE",
      "#CB9C4D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9f886d_362f25_e8c9a4_5c4c3c",
    "name": "Medium Clay Skin #9F886D",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#9F886D",
      "#362F25",
      "#E8C9A4",
      "#5C4C3C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_9f9f9f_e4e4e4_d4d4d4_cccccc",
    "name": "Medium Chrome Steel #9F9F9F",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#9F9F9F",
      "#E4E4E4",
      "#D4D4D4",
      "#CCCCCC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a05f31_d5c2bc_d9996f_42230e",
    "name": "Dark Clay Skin #A05F31",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#A05F31",
      "#D5C2BC",
      "#D9996F",
      "#42230E"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a0a8b0_424336_e7e9ef_545c5c",
    "name": "Bright Chrome Steel #A0A8B0",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#A0A8B0",
      "#424336",
      "#E7E9EF",
      "#545C5C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a1824f_4a2a06_f7e29f_b3a598",
    "name": "Medium Clay Skin #A1824F",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#A1824F",
      "#4A2A06",
      "#F7E29F",
      "#B3A598"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a27216_e9d036_d0ab24_dcb927",
    "name": "Dark Gold Brass #A27216",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#A27216",
      "#E9D036",
      "#D0AB24",
      "#DCB927"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a28766_e4d6c3_d6c4aa_cab598",
    "name": "Medium Clay Skin #A28766",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#A28766",
      "#E4D6C3",
      "#D6C4AA",
      "#CAB598"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a3b2a4_3b3e3d_676f6a_535c57",
    "name": "Bright Chrome Steel #A3B2A4",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#A3B2A4",
      "#3B3E3D",
      "#676F6A",
      "#535C57"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a48da4_e8dde8_c9b7c9_d4c2d4",
    "name": "Medium Chrome Steel #A48DA4",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#A48DA4",
      "#E8DDE8",
      "#C9B7C9",
      "#D4C2D4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a49994_695244_c4c2cf_76645c",
    "name": "Medium Chrome Steel #A49994",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#A49994",
      "#695244",
      "#C4C2CF",
      "#76645C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a67362_36150c_5e2e1e_f6c3bf",
    "name": "Medium Ruby Crimson #A67362",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#A67362",
      "#36150C",
      "#5E2E1E",
      "#F6C3BF"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a84337_611d18_3f110f_7c2a22",
    "name": "Dark Ruby Crimson #A84337",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#A84337",
      "#611D18",
      "#3F110F",
      "#7C2A22"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a88c77_dad2c7_623532_956229",
    "name": "Medium Clay Skin #A88C77",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#A88C77",
      "#DAD2C7",
      "#623532",
      "#956229"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a95e4d_57261a_6e3223_773c24",
    "name": "Medium Ruby Crimson #A95E4D",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#A95E4D",
      "#57261A",
      "#6E3223",
      "#773C24"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a971a9_e8cbe8_d4a8d4_dcb3dc",
    "name": "Medium Amethyst Purple #A971A9",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#A971A9",
      "#E8CBE8",
      "#D4A8D4",
      "#DCB3DC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a98d6a_f2d3ab_fbe6be_695332",
    "name": "Medium Clay Skin #A98D6A",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#A98D6A",
      "#F2D3AB",
      "#FBE6BE",
      "#695332"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_a9a2a0_2f211c_544440_6d5e5a",
    "name": "Medium Chrome Steel #A9A2A0",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#A9A2A0",
      "#2F211C",
      "#544440",
      "#6D5E5A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_aa526c_eaa6c9_dc88af_d17ba0",
    "name": "Medium Magenta Velvet #AA526C",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#AA526C",
      "#EAA6C9",
      "#DC88AF",
      "#D17BA0"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ab2c2c_ebb4b3_561212_de8484",
    "name": "Dark Ruby Crimson #AB2C2C",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#AB2C2C",
      "#EBB4B3",
      "#561212",
      "#DE8484"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ab2d08_c35e5a_c75522_c56c70",
    "name": "Dark Ruby Crimson #AB2D08",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#AB2D08",
      "#C35E5A",
      "#C75522",
      "#C56C70"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ab54a8_ebaae9_df8fdd_d37ed0",
    "name": "Medium Amethyst Purple #AB54A8",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#AB54A8",
      "#EBAAE9",
      "#DF8FDD",
      "#D37ED0"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ac171c_fa8593_e84854_d3464e",
    "name": "Dark Ruby Crimson #AC171C",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#AC171C",
      "#FA8593",
      "#E84854",
      "#D3464E"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ac725c_2e1610_663e31_e78f6b",
    "name": "Medium Clay Skin #AC725C",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#AC725C",
      "#2E1610",
      "#663E31",
      "#E78F6B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ac7f84_78463a_c4aabb_885454",
    "name": "Medium Ruby Crimson #AC7F84",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#AC7F84",
      "#78463A",
      "#C4AABB",
      "#885454"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ac8942_432d19_6e4d27_5f3b1c",
    "name": "Medium Clay Skin #AC8942",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#AC8942",
      "#432D19",
      "#6E4D27",
      "#5F3B1C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ac8961_ebdac3_d1b791_dcc2a0",
    "name": "Medium Clay Skin #AC8961",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#AC8961",
      "#EBDAC3",
      "#D1B791",
      "#DCC2A0"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ad9e81_f1e5ce_6b5c3e_5a492a",
    "name": "Medium Clay Skin #AD9E81",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#AD9E81",
      "#F1E5CE",
      "#6B5C3E",
      "#5A492A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_adc2cd_dff7fa_c9e6f5_c1dbec",
    "name": "Bright Cyan Turquoise #ADC2CD",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#ADC2CD",
      "#DFF7FA",
      "#C9E6F5",
      "#C1DBEC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ae9d99_29303b_585f70_875c33",
    "name": "Medium Chrome Steel #AE9D99",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#AE9D99",
      "#29303B",
      "#585F70",
      "#875C33"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_af986f_cdb489_9c7c5b_7e6c4d",
    "name": "Medium Clay Skin #AF986F",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#AF986F",
      "#CDB489",
      "#9C7C5B",
      "#7E6C4D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_af987a_2f2416_523f27_6b5331",
    "name": "Medium Clay Skin #AF987A",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#AF987A",
      "#2F2416",
      "#523F27",
      "#6B5331"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_af9a72_504718_74652b_e2c2a2",
    "name": "Medium Clay Skin #AF9A72",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#AF9A72",
      "#504718",
      "#74652B",
      "#E2C2A2"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b06932_451b09_7b3e16_150804",
    "name": "Dark Amber Coral #B06932",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#B06932",
      "#451B09",
      "#7B3E16",
      "#150804"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b09273_7a573d_c7af97_84644c",
    "name": "Medium Clay Skin #B09273",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B09273",
      "#7A573D",
      "#C7AF97",
      "#84644C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b0a2a8_866a63_e8e9f2_614c4f",
    "name": "Bright Chrome Steel #B0A2A8",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#B0A2A8",
      "#866A63",
      "#E8E9F2",
      "#614C4F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b0b0b0_6e6e6e_848484_8c8c8c",
    "name": "Bright Chrome Steel #B0B0B0",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#B0B0B0",
      "#6E6E6E",
      "#848484",
      "#8C8C8C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b1a395_efe6e1_635a47_786d5d",
    "name": "Medium Clay Skin #B1A395",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B1A395",
      "#EFE6E1",
      "#635A47",
      "#786D5D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b2674b_552913_7c442f_733919",
    "name": "Medium Clay Skin #B2674B",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B2674B",
      "#552913",
      "#7C442F",
      "#733919"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b26f52_4b2e2b_79493a_663b32",
    "name": "Medium Clay Skin #B26F52",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B26F52",
      "#4B2E2B",
      "#79493A",
      "#663B32"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b27744_5a2804_f6c488_ebb27d",
    "name": "Medium Clay Skin #B27744",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B27744",
      "#5A2804",
      "#F6C488",
      "#EBB27D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b38b76_40251d_745042_5f3a30",
    "name": "Medium Clay Skin #B38B76",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B38B76",
      "#40251D",
      "#745042",
      "#5F3A30"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b3aa93_f4efd7_e1ddc2_dcd3bb",
    "name": "Medium Clay Skin #B3AA93",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B3AA93",
      "#F4EFD7",
      "#E1DDC2",
      "#DCD3BB"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b47a5b_301e14_704a31_633c23",
    "name": "Medium Clay Skin #B47A5B",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B47A5B",
      "#301E14",
      "#704A31",
      "#633C23"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b4b29d_442d0d_604e2a_736542",
    "name": "Bright Gold Brass #B4B29D",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#B4B29D",
      "#442D0D",
      "#604E2A",
      "#736542"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b5987e_f8e4dc_6f5939_e9ccba",
    "name": "Medium Clay Skin #B5987E",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B5987E",
      "#F8E4DC",
      "#6F5939",
      "#E9CCBA"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b5bbb5_3b4026_6e745d_5c6147",
    "name": "Bright Pearl #B5BBB5",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#B5BBB5",
      "#3B4026",
      "#6E745D",
      "#5C6147"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b62d33_e4868b_7e2d34_dd6469",
    "name": "Dark Ruby Crimson #B62D33",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#B62D33",
      "#E4868B",
      "#7E2D34",
      "#DD6469"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b66d59_f0c9b2_e5b49c_daa084",
    "name": "Medium Ruby Crimson #B66D59",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#B66D59",
      "#F0C9B2",
      "#E5B49C",
      "#DAA084"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b67f6b_4b2e2a_6c3a34_f3dbc6",
    "name": "Medium Clay Skin #B67F6B",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B67F6B",
      "#4B2E2A",
      "#6C3A34",
      "#F3DBC6"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b6b8b1_994a24_315c81_927963",
    "name": "Bright Chrome Steel #B6B8B1",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#B6B8B1",
      "#994A24",
      "#315C81",
      "#927963"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b76e5e_7f3a2f_ee938c_f8a5a1",
    "name": "Medium Ruby Crimson #B76E5E",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#B76E5E",
      "#7F3A2F",
      "#EE938C",
      "#F8A5A1"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b7a763_e6e1cc_554a1e_6c6428",
    "name": "Medium Gold Brass #B7A763",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#B7A763",
      "#E6E1CC",
      "#554A1E",
      "#6C6428"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b86137_fbca6f_6f3c37_040404",
    "name": "Medium Clay Skin #B86137",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B86137",
      "#FBCA6F",
      "#6F3C37",
      "#040404"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b9896a_5b341b_f4caa3_6c4c2d",
    "name": "Medium Clay Skin #B9896A",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B9896A",
      "#5B341B",
      "#F4CAA3",
      "#6C4C2D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b98a6d_7b4f38_d1a68f_8c5b43",
    "name": "Medium Clay Skin #B98A6D",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#B98A6D",
      "#7B4F38",
      "#D1A68F",
      "#8C5B43"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b9b37a_f1eed0_e5e4ba_dad6a8",
    "name": "Medium Gold Brass #B9B37A",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#B9B37A",
      "#F1EED0",
      "#E5E4BA",
      "#DAD6A8"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_b9cdd2_775339_958272_7f6a5e",
    "name": "Bright Cyan Turquoise #B9CDD2",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#B9CDD2",
      "#775339",
      "#958272",
      "#7F6A5E"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ba472d_ca6e67_c76150_ca6c59",
    "name": "Medium Ruby Crimson #BA472D",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#BA472D",
      "#CA6E67",
      "#C76150",
      "#CA6C59"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ba5dba_f2bef2_e69be6_dc8cdc",
    "name": "Medium Amethyst Purple #BA5DBA",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#BA5DBA",
      "#F2BEF2",
      "#E69BE6",
      "#DC8CDC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ba864a_5d381e_644422_fbe97a",
    "name": "Medium Clay Skin #BA864A",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#BA864A",
      "#5D381E",
      "#644422",
      "#FBE97A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ba8979_ddcbca_9a4726_892407",
    "name": "Medium Ruby Crimson #BA8979",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#BA8979",
      "#DDCBCA",
      "#9A4726",
      "#892407"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_baada8_ece6e7_9a8378_e3dcd3",
    "name": "Bright Chrome Steel #BAADA8",
    "category": "💎 MatCaps: Metals & Chrome",
    "colors": [
      "#BAADA8",
      "#ECE6E7",
      "#9A8378",
      "#E3DCD3"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_bc5b43_95170b_eeac92_db8c7c",
    "name": "Medium Ruby Crimson #BC5B43",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#BC5B43",
      "#95170B",
      "#EEAC92",
      "#DB8C7C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_bc928d_f9e2d6_654445_835a51",
    "name": "Medium Ruby Crimson #BC928D",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#BC928D",
      "#F9E2D6",
      "#654445",
      "#835A51"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_bd0d0d_970404_7b0404_550404",
    "name": "Dark Ruby Crimson #BD0D0D",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#BD0D0D",
      "#970404",
      "#7B0404",
      "#550404"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_bd5345_460f11_732622_edb7b1",
    "name": "Medium Ruby Crimson #BD5345",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#BD5345",
      "#460F11",
      "#732622",
      "#EDB7B1"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_bdb466_f3edc3_e3dd9f_ece3aa",
    "name": "Medium Gold Brass #BDB466",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#BDB466",
      "#F3EDC3",
      "#E3DD9F",
      "#ECE3AA"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_be5f5f_f4bdbd_eca4a4_e29191",
    "name": "Medium Ruby Crimson #BE5F5F",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#BE5F5F",
      "#F4BDBD",
      "#ECA4A4",
      "#E29191"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_bee2e9_7e6a53_9aa09c_87837e",
    "name": "Luminous Cyan Turquoise #BEE2E9",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#BEE2E9",
      "#7E6A53",
      "#9AA09C",
      "#87837E"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_bf7051_994c2d_e99a7b_de8c74",
    "name": "Medium Clay Skin #BF7051",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#BF7051",
      "#994C2D",
      "#E99A7B",
      "#DE8C74"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_bf7745_f5d08e_e5ae6b_ecbc7c",
    "name": "Medium Clay Skin #BF7745",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#BF7745",
      "#F5D08E",
      "#E5AE6B",
      "#ECBC7C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_bf8e78_e5ccbf_753e32_4a261e",
    "name": "Medium Clay Skin #BF8E78",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#BF8E78",
      "#E5CCBF",
      "#753E32",
      "#4A261E"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_bfaa83_f5ead6_e1d0b1_ebddc0",
    "name": "Medium Clay Skin #BFAA83",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#BFAA83",
      "#F5EAD6",
      "#E1D0B1",
      "#EBDDC0"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_bfb5a4_dedccb_d7d4cc_dcd3c2",
    "name": "Bright Clay Skin #BFB5A4",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#BFB5A4",
      "#DEDCCB",
      "#D7D4CC",
      "#DCD3C2"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c05429_ed6129_94492a_834729",
    "name": "Medium Ruby Crimson #C05429",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#C05429",
      "#ED6129",
      "#94492A",
      "#834729"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c09e5c_dad2b9_654429_81582d",
    "name": "Medium Clay Skin #C09E5C",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C09E5C",
      "#DAD2B9",
      "#654429",
      "#81582D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c1aa92_ad6e29_737889_ced1d7",
    "name": "Bright Clay Skin #C1AA92",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C1AA92",
      "#AD6E29",
      "#737889",
      "#CED1D7"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c1b3a1_f6eee5_e1d7c7_ece4d3",
    "name": "Bright Clay Skin #C1B3A1",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C1B3A1",
      "#F6EEE5",
      "#E1D7C7",
      "#ECE4D3"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c21338_920c24_e71c54_f34a7d",
    "name": "Dark Ruby Crimson #C21338",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#C21338",
      "#920C24",
      "#E71C54",
      "#F34A7D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c28e4e_845119_0b0805_713c0c",
    "name": "Medium Clay Skin #C28E4E",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C28E4E",
      "#845119",
      "#0B0805",
      "#713C0C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c2a391_523728_785741_694836",
    "name": "Bright Clay Skin #C2A391",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C2A391",
      "#523728",
      "#785741",
      "#694836"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c2a584_363b41_71665b_8c7367",
    "name": "Medium Clay Skin #C2A584",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C2A584",
      "#363B41",
      "#71665B",
      "#8C7367"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c2ab7d_4a412e_7a6b4e_f9edbe",
    "name": "Medium Clay Skin #C2AB7D",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C2AB7D",
      "#4A412E",
      "#7A6B4E",
      "#F9EDBE"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c30c0c_9f0404_830404_5c0404",
    "name": "Dark Ruby Crimson #C30C0C",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#C30C0C",
      "#9F0404",
      "#830404",
      "#5C0404"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c33829_48171a_752523_942923",
    "name": "Medium Ruby Crimson #C33829",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#C33829",
      "#48171A",
      "#752523",
      "#942923"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c345ec_5f1daa_9f31db_872ccd",
    "name": "Medium Amethyst Purple #C345EC",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#C345EC",
      "#5F1DAA",
      "#9F31DB",
      "#872CCD"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c35c04_f9c30c_ee9f04_e08304",
    "name": "Dark Amber Coral #C35C04",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#C35C04",
      "#F9C30C",
      "#EE9F04",
      "#E08304"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c3ccd4_5f3b23_948a7b_a9a49a",
    "name": "Bright Cyan Turquoise #C3CCD4",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#C3CCD4",
      "#5F3B23",
      "#948A7B",
      "#A9A49A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c47004_f9d00c_edaf04_e09704",
    "name": "Dark Amber Coral #C47004",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#C47004",
      "#F9D00C",
      "#EDAF04",
      "#E09704"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c4a591_635448_f2d9d5_856d5b",
    "name": "Bright Clay Skin #C4A591",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C4A591",
      "#635448",
      "#F2D9D5",
      "#856D5B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c4c6c6_4d5756_646463_7a8080",
    "name": "Bright Pearl #C4C6C6",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#C4C6C6",
      "#4D5756",
      "#646463",
      "#7A8080"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c4dede_97b5b5_eaf9f9_abc4c4",
    "name": "Luminous Cyan Turquoise #C4DEDE",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#C4DEDE",
      "#97B5B5",
      "#EAF9F9",
      "#ABC4C4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c5a292_635247_f2d7d6_846a5b",
    "name": "Bright Clay Skin #C5A292",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C5A292",
      "#635247",
      "#F2D7D6",
      "#846A5B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c5bbb6_f8f4f1_e2dad6_ece3df",
    "name": "Bright Pearl #C5BBB6",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#C5BBB6",
      "#F8F4F1",
      "#E2DAD6",
      "#ECE3DF"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c75f55_f8bda9_eb9484_f4a494",
    "name": "Medium Ruby Crimson #C75F55",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#C75F55",
      "#F8BDA9",
      "#EB9484",
      "#F4A494"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c7938d_e0dbe1_d1bbbc_d5cccb",
    "name": "Bright Ruby Crimson #C7938D",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#C7938D",
      "#E0DBE1",
      "#D1BBBC",
      "#D5CCCB"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c7b9a1_f8f1e4_eee4d2_e4d8c4",
    "name": "Bright Clay Skin #C7B9A1",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C7B9A1",
      "#F8F1E4",
      "#EEE4D2",
      "#E4D8C4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c7c0ac_2e181b_543b30_6b6270",
    "name": "Bright Clay Skin #C7C0AC",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C7C0AC",
      "#2E181B",
      "#543B30",
      "#6B6270"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c7c7d7_4c4e5a_818393_6c6c74",
    "name": "Luminous Cobalt Blue #C7C7D7",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#C7C7D7",
      "#4C4E5A",
      "#818393",
      "#6C6C74"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c87157_f8cbae_e9a582_f2b394",
    "name": "Medium Ruby Crimson #C87157",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#C87157",
      "#F8CBAE",
      "#E9A582",
      "#F2B394"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c88467_5b3333_875c5a_7a3822",
    "name": "Medium Clay Skin #C88467",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C88467",
      "#5B3333",
      "#875C5A",
      "#7A3822"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c8af84_f9ecd7_efdebf_e6d1af",
    "name": "Bright Clay Skin #C8AF84",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#C8AF84",
      "#F9ECD7",
      "#EFDEBF",
      "#E6D1AF"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c8c8c8_3f3f3f_787878_5c5c5c",
    "name": "Bright Pearl #C8C8C8",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#C8C8C8",
      "#3F3F3F",
      "#787878",
      "#5C5C5C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c8d1dc_575b62_818892_6e747b",
    "name": "Luminous Cyan Turquoise #C8D1DC",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#C8D1DC",
      "#575B62",
      "#818892",
      "#6E747B"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c98d7f_3b0b0b_a97667_94433f",
    "name": "Medium Ruby Crimson #C98D7F",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#C98D7F",
      "#3B0B0B",
      "#A97667",
      "#94433F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c99a8b_491b0e_6e4136_8a4d28",
    "name": "Bright Ruby Crimson #C99A8B",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#C99A8B",
      "#491B0E",
      "#6E4136",
      "#8A4D28"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_c9c7be_55514b_888279_7b6e5f",
    "name": "Bright Pearl #C9C7BE",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#C9C7BE",
      "#55514B",
      "#888279",
      "#7B6E5F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ca4fe1_6b2398_a337c7_9334bc",
    "name": "Medium Amethyst Purple #CA4FE1",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#CA4FE1",
      "#6B2398",
      "#A337C7",
      "#9334BC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ca8892_f9d7dc_ebb8c0_f3c4cc",
    "name": "Bright Ruby Crimson #CA8892",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#CA8892",
      "#F9D7DC",
      "#EBB8C0",
      "#F3C4CC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_caa094_875343_956255_eadedc",
    "name": "Bright Ruby Crimson #CAA094",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#CAA094",
      "#875343",
      "#956255",
      "#EADEDC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_caa78a_f9e7d7_ead0b9_f3dcc3",
    "name": "Bright Clay Skin #CAA78A",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#CAA78A",
      "#F9E7D7",
      "#EAD0B9",
      "#F3DCC3"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_caac80_faebd5_f2debf_ead1af",
    "name": "Medium Clay Skin #CAAC80",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#CAAC80",
      "#FAEBD5",
      "#F2DEBF",
      "#EAD1AF"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cab094_f9ecdd_efdec8_e8d4bd",
    "name": "Bright Clay Skin #CAB094",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#CAB094",
      "#F9ECDD",
      "#EFDEC8",
      "#E8D4BD"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cab79d_f9f1e3_f1e5d1_e9dac6",
    "name": "Bright Clay Skin #CAB79D",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#CAB79D",
      "#F9F1E3",
      "#F1E5D1",
      "#E9DAC6"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cae24e_6c9a23_a3c737_b3d43c",
    "name": "Medium Emerald Green #CAE24E",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#CAE24E",
      "#6C9A23",
      "#A3C737",
      "#B3D43C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cb4934_fb9971_f07554_f68464",
    "name": "Medium Ruby Crimson #CB4934",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#CB4934",
      "#FB9971",
      "#F07554",
      "#F68464"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cb4e88_f99ad6_f384c3_ed75b9",
    "name": "Medium Magenta Velvet #CB4E88",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#CB4E88",
      "#F99AD6",
      "#F384C3",
      "#ED75B9"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cb5e3b_fabc7a_ef965e_f4a46c",
    "name": "Medium Ruby Crimson #CB5E3B",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#CB5E3B",
      "#FABC7A",
      "#EF965E",
      "#F4A46C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cb7146_551d0f_7c270d_e5ab9c",
    "name": "Medium Ruby Crimson #CB7146",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#CB7146",
      "#551D0F",
      "#7C270D",
      "#E5AB9C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cb7846_753c22_ab5c32_b46c3c",
    "name": "Medium Amber Coral #CB7846",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#CB7846",
      "#753C22",
      "#AB5C32",
      "#B46C3C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cb919b_f9dde1_ecc0c8_f4ccd4",
    "name": "Bright Ruby Crimson #CB919B",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#CB919B",
      "#F9DDE1",
      "#ECC0C8",
      "#F4CCD4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cbcbcb_595959_8c8c8c_747474",
    "name": "Bright Pearl #CBCBCB",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#CBCBCB",
      "#595959",
      "#8C8C8C",
      "#747474"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cc7c5f_a15436_b26346_af5c3c",
    "name": "Medium Clay Skin #CC7C5F",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#CC7C5F",
      "#A15436",
      "#B26346",
      "#AF5C3C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cc9a7e_8a5249_c06a3e_dadada",
    "name": "Medium Clay Skin #CC9A7E",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#CC9A7E",
      "#8A5249",
      "#C06A3E",
      "#DADADA"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ccc5c9_3b2b2b_67585b_7f7375",
    "name": "Bright Pearl #CCC5C9",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#CCC5C9",
      "#3B2B2B",
      "#67585B",
      "#7F7375"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ccf6fa_9dd9eb_82c5d9_acd4e4",
    "name": "Luminous Cyan Turquoise #CCF6FA",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#CCF6FA",
      "#9DD9EB",
      "#82C5D9",
      "#ACD4E4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cdc3b8_5a3f3c_67545a_8d7769",
    "name": "Bright Clay Skin #CDC3B8",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#CDC3B8",
      "#5A3F3C",
      "#67545A",
      "#8D7769"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_cdcbc8_444342_696765_81807e",
    "name": "Bright Pearl #CDCBC8",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#CDCBC8",
      "#444342",
      "#696765",
      "#81807E"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ce8c15_eac79b_ddab57_f9c962",
    "name": "Dark Gold Brass #CE8C15",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#CE8C15",
      "#EAC79B",
      "#DDAB57",
      "#F9C962"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ce8f3d_f0d2b0_f3c77d_e6b278",
    "name": "Medium Amber Coral #CE8F3D",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#CE8F3D",
      "#F0D2B0",
      "#F3C77D",
      "#E6B278"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ceb299_6b5c4c_887564_746355",
    "name": "Bright Clay Skin #CEB299",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#CEB299",
      "#6B5C4C",
      "#887564",
      "#746355"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d04444_af2f2f_8b2424_9b2c2c",
    "name": "Medium Ruby Crimson #D04444",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#D04444",
      "#AF2F2F",
      "#8B2424",
      "#9B2C2C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d07e3f_fbbd1f_8d2840_24120c",
    "name": "Medium Amber Coral #D07E3F",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#D07E3F",
      "#FBBD1F",
      "#8D2840",
      "#24120C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d0cccb_524d50_928891_727581",
    "name": "Luminous Pearl #D0CCCB",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#D0CCCB",
      "#524D50",
      "#928891",
      "#727581"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d0d3be_816854_998366_685146",
    "name": "Bright Emerald Green #D0D3BE",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#D0D3BE",
      "#816854",
      "#998366",
      "#685146"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d1ac04_f8e50a_edd004_b38d04",
    "name": "Dark Gold Brass #D1AC04",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#D1AC04",
      "#F8E50A",
      "#EDD004",
      "#B38D04"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d3caab_8c866e_c0b89a_aea68a",
    "name": "Bright Gold Brass #D3CAAB",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#D3CAAB",
      "#8C866E",
      "#C0B89A",
      "#AEA68A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d4855f_92512d_ae6742_a75c2c",
    "name": "Medium Ruby Crimson #D4855F",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#D4855F",
      "#92512D",
      "#AE6742",
      "#A75C2C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d54c2b_5f1105_f39382_f08375",
    "name": "Medium Ruby Crimson #D54C2B",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#D54C2B",
      "#5F1105",
      "#F39382",
      "#F08375"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d5b5b4_9e6c6f_f5e9ef_a57986",
    "name": "Bright Ruby Crimson #D5B5B4",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#D5B5B4",
      "#9E6C6F",
      "#F5E9EF",
      "#A57986"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d5d5d5_929292_acacac_b4b4b4",
    "name": "Luminous Pearl #D5D5D5",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#D5D5D5",
      "#929292",
      "#ACACAC",
      "#B4B4B4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d64480_e27497_ea9bb1_cd156f",
    "name": "Medium Magenta Velvet #D64480",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#D64480",
      "#E27497",
      "#EA9BB1",
      "#CD156F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d7d7c3_aaaa92_f5f5ea_bcbca4",
    "name": "Luminous Gold Brass #D7D7C3",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#D7D7C3",
      "#AAAA92",
      "#F5F5EA",
      "#BCBCA4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d7dfdb_aab5af_f5faf7_bcc4c4",
    "name": "Luminous Pearl #D7DFDB",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#D7DFDB",
      "#AAB5AF",
      "#F5FAF7",
      "#BCC4C4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d8388b_230a14_fcc8fc_fc71e1",
    "name": "Medium Magenta Velvet #D8388B",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#D8388B",
      "#230A14",
      "#FCC8FC",
      "#FC71E1"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d8c949_f5f19e_6b7855_9a9858",
    "name": "Medium Gold Brass #D8C949",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#D8C949",
      "#F5F19E",
      "#6B7855",
      "#9A9858"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_d8d8e5_9d9daf_b4b4c4_b4b4cc",
    "name": "Luminous Cobalt Blue #D8D8E5",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#D8D8E5",
      "#9D9DAF",
      "#B4B4C4",
      "#B4B4CC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_da5788_de94bd_e078a3_dd83b4",
    "name": "Medium Magenta Velvet #DA5788",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#DA5788",
      "#DE94BD",
      "#E078A3",
      "#DD83B4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_dbdbbb_f7f7e4_afaf89_c4c49c",
    "name": "Bright Gold Brass #DBDBBB",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#DBDBBB",
      "#F7F7E4",
      "#AFAF89",
      "#C4C49C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_dc3e04_b52604_fc7d20_f85f04",
    "name": "Dark Ruby Crimson #DC3E04",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#DC3E04",
      "#B52604",
      "#FC7D20",
      "#F85F04"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_de9261_86361e_a85a37_944c2c",
    "name": "Medium Amber Coral #DE9261",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#DE9261",
      "#86361E",
      "#A85A37",
      "#944C2C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_dedec4_b5b597_f9f9ea_c4c4ab",
    "name": "Luminous Gold Brass #DEDEC4",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#DEDEC4",
      "#B5B597",
      "#F9F9EA",
      "#C4C4AB"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_dee3e8_a6aeb5_bcc4cc_bcc4c4",
    "name": "Luminous Cyan Turquoise #DEE3E8",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#DEE3E8",
      "#A6AEB5",
      "#BCC4CC",
      "#BCC4C4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_dee8de_a6b5a6_bcccbc_bcc4bc",
    "name": "Luminous Emerald Green #DEE8DE",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#DEE8DE",
      "#A6B5A6",
      "#BCCCBC",
      "#BCC4BC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_dee8e8_a6b5b5_bccccc_bac4c4",
    "name": "Luminous Cyan Turquoise #DEE8E8",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#DEE8E8",
      "#A6B5B5",
      "#BCCCCC",
      "#BAC4C4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_dfd9c2_b5ae92_f9f7ea_c4c4a4",
    "name": "Luminous Gold Brass #DFD9C2",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#DFD9C2",
      "#B5AE92",
      "#F9F7EA",
      "#C4C4A4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_dfdbb7_f9f8e3_b5af86_bcbc8c",
    "name": "Bright Gold Brass #DFDBB7",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#DFDBB7",
      "#F9F8E3",
      "#B5AF86",
      "#BCBC8C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_dfdfca_4d2d07_6b5224_857145",
    "name": "Luminous Gold Brass #DFDFCA",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#DFDFCA",
      "#4D2D07",
      "#6B5224",
      "#857145"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_dfdfd6_58544e_81766a_989288",
    "name": "Luminous Gold Brass #DFDFD6",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#DFDFD6",
      "#58544E",
      "#81766A",
      "#989288"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e1e1d4_777c7b_9fa19a_898f8d",
    "name": "Luminous Gold Brass #E1E1D4",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#E1E1D4",
      "#777C7B",
      "#9FA19A",
      "#898F8D"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e1e1e0_363636_989897_747472",
    "name": "Luminous Pearl #E1E1E0",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#E1E1E0",
      "#363636",
      "#989897",
      "#747472"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e2d3bc_867255_b39e7f_96836c",
    "name": "Luminous Clay Skin #E2D3BC",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#E2D3BC",
      "#867255",
      "#B39E7F",
      "#96836C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e2e2e7_aeaeb5_c4c4cc_c4c4c4",
    "name": "Luminous Pearl #E2E2E7",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#E2E2E7",
      "#AEAEB5",
      "#C4C4CC",
      "#C4C4C4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e42e12_f35132_f86949_b71b0a",
    "name": "Medium Ruby Crimson #E42E12",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#E42E12",
      "#F35132",
      "#F86949",
      "#B71B0A"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e5ded7_afa69d_c4bcb4_c3baab",
    "name": "Luminous Clay Skin #E5DED7",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#E5DED7",
      "#AFA69D",
      "#C4BCB4",
      "#C3BAAB"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e6bf3c_5a4719_977726_fcfc82",
    "name": "Medium Gold Brass #E6BF3C",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#E6BF3C",
      "#5A4719",
      "#977726",
      "#FCFC82"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e6e3e3_b5afaf_ccc4c4_c4c4c4",
    "name": "Luminous Pearl #E6E3E3",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#E6E3E3",
      "#B5AFAF",
      "#CCC4C4",
      "#C4C4C4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e6e6e6_aaaaaa_c4c4c4_cccccc",
    "name": "Luminous Pearl #E6E6E6",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#E6E6E6",
      "#AAAAAA",
      "#C4C4C4",
      "#CCCCCC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e7632f_fba06b_bb2905_fb865e",
    "name": "Medium Ruby Crimson #E7632F",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#E7632F",
      "#FBA06B",
      "#BB2905",
      "#FB865E"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e7e2d8_b1aa9d_c9c2b3_bcb4ac",
    "name": "Luminous Clay Skin #E7E2D8",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#E7E2D8",
      "#B1AA9D",
      "#C9C2B3",
      "#BCB4AC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e80404_b50404_cb0404_fc3333",
    "name": "Medium Ruby Crimson #E80404",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#E80404",
      "#B50404",
      "#CB0404",
      "#FC3333"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e804e8_b504b5_cc04cc_fc33fc",
    "name": "Medium Amethyst Purple #E804E8",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#E804E8",
      "#B504B5",
      "#CC04CC",
      "#FC33FC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e8dee1_b5a6aa_ccbcc1_c4bbbc",
    "name": "Luminous Magenta Velvet #E8DEE1",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#E8DEE1",
      "#B5A6AA",
      "#CCBCC1",
      "#C4BBBC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e8e5de_b5afa6_ccc5bc_c4c4bb",
    "name": "Luminous Clay Skin #E8E5DE",
    "category": "🏺 MatCaps: Clay, Skin & Earth",
    "colors": [
      "#E8E5DE",
      "#B5AFA6",
      "#CCC5BC",
      "#C4C4BB"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e8e8de_b5b5a6_ccccbc_c4c4ba",
    "name": "Luminous Gold Brass #E8E8DE",
    "category": "🌿 MatCaps: Green & Emerald",
    "colors": [
      "#E8E8DE",
      "#B5B5A6",
      "#CCCCBC",
      "#C4C4BA"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_e9cca1_a63106_df8c3b_621304",
    "name": "Bright Gold Brass #E9CCA1",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#E9CCA1",
      "#A63106",
      "#DF8C3B",
      "#621304"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ea783e_6d4830_905837_fcdc6c",
    "name": "Medium Amber Coral #EA783E",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#EA783E",
      "#6D4830",
      "#905837",
      "#FCDC6C"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ead8d6_b59a97_ccb4b0_c9abab",
    "name": "Luminous Ruby Crimson #EAD8D6",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#EAD8D6",
      "#B59A97",
      "#CCB4B0",
      "#C9ABAB"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_eaeaea_b5b5b5_cccccc_d4d4d4",
    "name": "Luminous Pearl #EAEAEA",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#EAEAEA",
      "#B5B5B5",
      "#CCCCCC",
      "#D4D4D4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_eaeaea_b6b6b6_cccccc_c4c4c4",
    "name": "Luminous Pearl #EAEAEA",
    "category": "⚪ MatCaps: Pearl & Ceramic",
    "colors": [
      "#EAEAEA",
      "#B6B6B6",
      "#CCCCCC",
      "#C4C4C4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ed4630_791a0e_a42716_501009",
    "name": "Medium Ruby Crimson #ED4630",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#ED4630",
      "#791A0E",
      "#A42716",
      "#501009"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ed5087_fac3d0_1c0b0c_fc84cc",
    "name": "Medium Magenta Velvet #ED5087",
    "category": "🔮 MatCaps: Purple & Velvet",
    "colors": [
      "#ED5087",
      "#FAC3D0",
      "#1C0B0C",
      "#FC84CC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ed7f04_fcd60e_7e2d04_b73e04",
    "name": "Medium Amber Coral #ED7F04",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#ED7F04",
      "#FCD60E",
      "#7E2D04",
      "#B73E04"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_eded06_b5b504_cccc04_d4d404",
    "name": "Medium Gold Brass #EDED06",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#EDED06",
      "#B5B504",
      "#CCCC04",
      "#D4D404"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_ee4128_fc8e82_9a0704_bf0f05",
    "name": "Medium Ruby Crimson #EE4128",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#EE4128",
      "#FC8E82",
      "#9A0704",
      "#BF0F05"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_eeecfb_bfb6d5_d0c8eb_ccc4dc",
    "name": "Luminous Cobalt Blue #EEECFB",
    "category": "🌊 MatCaps: Blue & Cyan",
    "colors": [
      "#EEECFB",
      "#BFB6D5",
      "#D0C8EB",
      "#CCC4DC"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_f0d504_fbfad3_b98609_cda204",
    "name": "Medium Gold Brass #F0D504",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#F0D504",
      "#FBFAD3",
      "#B98609",
      "#CDA204"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_f75f0b_461604_9a3004_fb9d2f",
    "name": "Medium Amber Coral #F75F0B",
    "category": "🔥 MatCaps: Orange & Coral",
    "colors": [
      "#F75F0B",
      "#461604",
      "#9A3004",
      "#FB9D2F"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_f77777_fbe1e1_fab2b2_fbc4c4",
    "name": "Bright Ruby Crimson #F77777",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#F77777",
      "#FBE1E1",
      "#FAB2B2",
      "#FBC4C4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_f79686_fccbd4_e76644_e76b56",
    "name": "Bright Ruby Crimson #F79686",
    "category": "🔥 MatCaps: Red & Crimson",
    "colors": [
      "#F79686",
      "#FCCBD4",
      "#E76644",
      "#E76B56"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_f9e6c7_fcf7df_edd3aa_f1d4b4",
    "name": "Luminous Gold Brass #F9E6C7",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#F9E6C7",
      "#FCF7DF",
      "#EDD3AA",
      "#F1D4B4"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_fbb43f_fbe993_fb552e_fcdd65",
    "name": "Medium Gold Brass #FBB43F",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#FBB43F",
      "#FBE993",
      "#FB552E",
      "#FCDD65"
    ],
    "type": "matcap"
  },
  {
    "id": "matcap_fbb82d_fbedbf_fbde7d_fb7e05",
    "name": "Medium Gold Brass #FBB82D",
    "category": "👑 MatCaps: Gold & Amber",
    "colors": [
      "#FBB82D",
      "#FBEDBF",
      "#FBDE7D",
      "#FB7E05"
    ],
    "type": "matcap"
  }
];

export const PROCEDURAL_MATCAP_PRESETS = PROCEDURAL_MATCAP_PALETTES.map(p => ({
  ...p,
  generate: (ctx, w, h) => renderProceduralMatCap(ctx, w, h, p.colors, p.category)
}));
