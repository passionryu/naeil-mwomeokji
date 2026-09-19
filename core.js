// 내일 뭐먹지 — 식당 데이터 + 질문 + 추천 로직
// 브라우저(window.Core)와 Node(시뮬레이션 테스트) 양쪽에서 사용

(function (root) {
  const PLACE = (id) => `https://m.place.naver.com/restaurant/${id}/home`;

  // price: 1 = ~1.5만, 2 = ~2.5만, 3 = 3만+
  const RESTAURANTS = [
    { id: "bentan",   name: "벤탄빌라",          emoji: "🍜", kind: "베트남·태국",   price: 1, hours: "일 11:00–21:00 (LO 20:30)", menu: "쌀국수 1만 · 팟타이 1.35만 · 똠얌꿍 1.9만", url: PLACE(1718113572) },
    { id: "hongkong", name: "홍콩반점",          emoji: "🥟", kind: "중식",         price: 1, hours: "일 10:30–20:30 (LO 20:00)", menu: "짜장면 7천 · 짬뽕 9천 · 탕수육 1.68만~", url: PLACE(1899397279), warn: "단체석 표시 없음 · 8명 가능한지 전화 확인" },
    { id: "haru",     name: "하루엔소쿠",        emoji: "🍛", kind: "돈카츠·일식",   price: 1, hours: "일 10:00–21:00 (LO 20:20)", menu: "로스카츠 1.15만 · 하루카츠 1.25만 · 특로스 1.39만", url: PLACE(35905708) },
    { id: "bodram",   name: "보드람치킨",        emoji: "🍗", kind: "치킨",         price: 1, hours: "매일 16:00–01:00",          menu: "후라이드 2.2만 · 양념·반반 2.3만 · 떡볶이 1.2만", url: PLACE(2076098783) },
    { id: "choi",     name: "최대포",            emoji: "🥩", kind: "고기구이",      price: 2, hours: "매일 15:00–23:00",          menu: "갈매기살·항정살 1.6만 · 삼겹살 1.5만 · 모듬 4.2만", url: PLACE(21151799) },
    { id: "pado",     name: "파도초밥",          emoji: "🍣", kind: "초밥",         price: 2, hours: "일 11:00–22:00 (브레이크 15–17시)", menu: "오늘의 초밥 1.4만 · 코스 2.2만/3.1만 · 우동 7천", url: PLACE(1197859862) },
    { id: "sinan",    name: "신안수산",          emoji: "🐟", kind: "활어회",        price: 3, hours: "매일 11:00–23:00",          menu: "광어(소) 3.3만 · 광어+우럭 4.5만~ · 모듬회 8만~", url: PLACE(19048520) },
    { id: "dakgalbi", name: "홍춘천 치즈닭갈비", emoji: "🧀", kind: "닭갈비",        price: 1, hours: "매일 11:00–23:00",          menu: "홍춘천닭갈비 1.2만 · 치즈닭갈비 1.5만 · 볶음밥 2천", url: PLACE(1282785816), warn: "단체석 표시 없음 · 8명 가능한지 전화 확인" },
    { id: "mala",     name: "마라공방",          emoji: "🌶️", kind: "마라탕·샹궈",  price: 1, hours: "일 11:00–21:30 (LO 21:00)", menu: "마라탕 100g 2천 · 마라샹궈 100g 3.3천 · 꿔바로우 1.3만", url: PLACE(1349943901), warn: "단체석 표시 없음 · 8명 가능한지 전화 확인" },
  ];

  const PRICE_LABEL = { 1: "1인 ~1.5만", 2: "1인 ~2.5만", 3: "1인 3만+" };

  // 옵션 필드
  //   score: { 식당id: 점수 }   ban: [식당id] (🚫 제외)   why: 결과 화면에 보여줄 이유
  //   exclusive: 이 옵션을 고르면 다른 선택 해제 (멀티 선택용)
  const QUESTIONS = [
    {
      id: "ate",
      title: "이번 주에 먹은 메뉴,\n전부 골라줘",
      hint: "여러 개 선택 가능 · 겹치는 메뉴는 피할게",
      multi: true,
      options: [
        { id: "chinese",  label: "중식 (짜장·짬뽕)", emoji: "🥟", score: { hongkong: -4, mala: -1 } },
        { id: "asian",    label: "쌀국수·동남아",    emoji: "🍜", score: { bentan: -4 } },
        { id: "katsu",    label: "돈가스",           emoji: "🍛", score: { haru: -4 } },
        { id: "chicken",  label: "치킨",             emoji: "🍗", score: { bodram: -4, dakgalbi: -1 } },
        { id: "bbq",      label: "고기구이",         emoji: "🥩", score: { choi: -4 } },
        { id: "sushi",    label: "초밥",             emoji: "🍣", score: { pado: -4, sinan: -1 } },
        { id: "sashimi",  label: "회",               emoji: "🐟", score: { sinan: -4, pado: -1 } },
        { id: "dakgalbi", label: "닭갈비",           emoji: "🧀", score: { dakgalbi: -4, bodram: -1 } },
        { id: "mala",     label: "마라탕",           emoji: "🌶️", score: { mala: -4, hongkong: -1 } },
        { id: "none",     label: "딱히 없음 / 기억 안 남", emoji: "🤷", exclusive: true },
      ],
    },
    {
      id: "avoid",
      title: "못 먹거나\n싫은 거 있어?",
      hint: "여러 개 선택 가능 · 고르면 해당 식당은 빼거나 감점",
      multi: true,
      options: [
        { id: "raw",   label: "날것 (회·초밥)",  emoji: "🙅", tag: "날것", ban: ["pado", "sinan"] },
        { id: "spicy", label: "매운 것",         emoji: "🥵", tag: "매운것", ban: ["mala"], score: { dakgalbi: -2, hongkong: -1 } },
        { id: "herb",  label: "고수·향신료",     emoji: "🌿", tag: "향신료", score: { bentan: -3, mala: -2 } },
        { id: "none",  label: "없음! 다 잘 먹어", emoji: "😋", exclusive: true },
      ],
    },
    {
      id: "texture",
      title: "지금 제일\n끌리는 건?",
      options: [
        { id: "soup",  label: "뜨끈한 국물",   emoji: "🍲", why: "뜨끈한 국물이 당긴다며",   score: { bentan: 3, hongkong: 3, mala: 3, dakgalbi: 1 } },
        { id: "grill", label: "지글지글 구이", emoji: "🔥", why: "지글지글 구이가 당긴다며", score: { choi: 3, dakgalbi: 1 } },
        { id: "fried", label: "바삭한 튀김",   emoji: "🍤", why: "바삭한 게 당긴다며",       score: { bodram: 3, haru: 3, hongkong: 1 } },
        { id: "iron",  label: "매콤한 철판",   emoji: "🍳", why: "매콤한 철판이 당긴다며",   score: { dakgalbi: 3, mala: 2, choi: 1 } },
        { id: "raw",   label: "깔끔한 날것",   emoji: "🧊", why: "깔끔한 날것이 당긴다며",   score: { pado: 3, sinan: 3 }, hideIf: { avoid: "raw" } },
      ],
    },
    {
      id: "hunger",
      title: "지금\n배고픈 정도는?",
      options: [
        { id: "light",  label: "가볍게 먹고 싶어", emoji: "🥗", why: "가볍게 먹기 좋은 곳",   score: { bentan: 2, haru: 1, hongkong: 1, pado: 1, mala: 1 } },
        { id: "normal", label: "적당히",           emoji: "🍚" },
        { id: "heavy",  label: "폭식 모드",        emoji: "🐷", why: "폭식 모드에 딱",        score: { choi: 2, bodram: 2, dakgalbi: 2, sinan: 1 } },
      ],
    },
    {
      id: "budget",
      title: "1인 예산은\n어느 정도?",
      options: [
        { id: "low",  label: "1.5만 원 이하", emoji: "🪙", why: "예산 안에 들어옴", maxPrice: 1, priceScore: { 2: -3, 3: -5 } },
        { id: "mid",  label: "2.5만 원 정도", emoji: "💵", why: "예산 안에 들어옴", maxPrice: 2, priceScore: { 3: -2 } },
        { id: "any",  label: "오늘은 상관없어", emoji: "💸", why: "오늘은 플렉스 하는 날", score: { sinan: 2, pado: 1, choi: 1 } },
      ],
    },
    {
      id: "after",
      title: "밥 먹고 나서는?",
      options: [
        { id: "fast", label: "빨리 먹고 2차 카페", emoji: "☕", why: "빨리 먹고 일어나기 좋음", score: { hongkong: 2, haru: 2, mala: 2, bentan: 1 } },
        { id: "long", label: "오래 앉아서 수다",   emoji: "🗣️", why: "오래 앉아 수다 떨기 좋음", score: { choi: 2, sinan: 2, bodram: 2, dakgalbi: 1, pado: 1 } },
      ],
    },
    {
      id: "mood",
      title: "오늘 내 기분을\n고르자면?",
      options: [
        { id: "fire",  label: "불타오름",      emoji: "🔥", why: "불타는 기분엔 이 맛", score: { mala: 1, dakgalbi: 1, choi: 1 } },
        { id: "calm",  label: "평온함",        emoji: "😌", why: "평온한 날엔 이 맛",   score: { bentan: 1, pado: 1, haru: 1 } },
        { id: "tired", label: "지침",          emoji: "🥶", why: "지친 날엔 이 맛",     score: { hongkong: 1, bentan: 1, bodram: 1 } },
        { id: "party", label: "축하할 일 있음", emoji: "🎉", why: "축하엔 이 맛",        score: { sinan: 1, choi: 1, pado: 1 } },
      ],
    },
  ];

  const FALLBACK = "hongkong";

  function visibleOptions(q, answers) {
    return q.options.filter((o) => {
      if (!o.hideIf) return true;
      return !Object.entries(o.hideIf).some(([qid, oid]) => (answers[qid] || []).includes(oid));
    });
  }

  // answers: { 질문id: [옵션id, ...] }  →  정렬된 결과 배열
  function recommend(answers, rand = Math.random) {
    const rows = RESTAURANTS.map((r) => ({ r, score: 0, banned: false, why: [] }));
    const byId = Object.fromEntries(rows.map((x) => [x.r.id, x]));
    const ate = answers.ate || [];

    for (const q of QUESTIONS) {
      for (const oid of answers[q.id] || []) {
        const o = q.options.find((x) => x.id === oid);
        if (!o) continue;
        for (const id of o.ban || []) byId[id].banned = true;
        for (const [id, s] of Object.entries(o.score || {})) {
          byId[id].score += s;
          if (s > 0 && o.why) byId[id].why.push(o.why);
        }
        if (o.priceScore) {
          for (const x of rows) {
            const s = o.priceScore[x.r.price] || 0;
            x.score += s;
            if (o.why && x.r.price <= o.maxPrice) x.why.push(o.why);
          }
        }
      }
    }

    // 이번 주에 먹은 게 있는데 이 식당 메뉴는 안 먹었으면 이유로 표시
    const ateSomething = ate.length && !ate.includes("none");
    if (ateSomething) {
      const ateQ = QUESTIONS[0];
      const penalized = new Set();
      for (const oid of ate) {
        const o = ateQ.options.find((x) => x.id === oid);
        for (const [id, s] of Object.entries((o && o.score) || {})) if (s <= -4) penalized.add(id);
      }
      for (const x of rows) if (!penalized.has(x.r.id)) x.why.unshift("이번 주에 안 먹은 메뉴");
    }

    for (const x of rows) x.tie = rand();
    const alive = rows.filter((x) => !x.banned);
    const sorted = (alive.length ? alive : [byId[FALLBACK]]).sort(
      (a, b) => b.score - a.score || a.r.price - b.r.price || a.tie - b.tie
    );
    return { ranked: sorted, banned: rows.filter((x) => x.banned) };
  }

  function shareText(name, answers, result) {
    const [a, b, c] = result.ranked;
    const rest = [b, c].filter(Boolean).map((x, i) => `${i + 2}위 ${x.r.name}`).join(" · ");
    const avoidQ = QUESTIONS.find((q) => q.id === "avoid");
    const tags = (answers.avoid || [])
      .map((id) => avoidQ.options.find((o) => o.id === id))
      .filter((o) => o && o.tag)
      .map((o) => `🚫${o.tag}`)
      .join(" ");
    return `[내일 뭐먹지] ${name} → 1위 ${a.r.name} ${a.r.emoji}${rest ? ` (${rest})` : ""}${tags ? ` ${tags}` : ""}`;
  }

  const Core = { RESTAURANTS, QUESTIONS, PRICE_LABEL, visibleOptions, recommend, shareText };
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
  else root.Core = Core;
})(typeof window !== "undefined" ? window : globalThis);
