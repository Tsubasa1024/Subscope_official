(() => {
  const API_BASE = "https://subscope-ranking-319660105312.asia-northeast1.run.app";

  const top3 = document.getElementById("ranking-top3");
  const rest = document.getElementById("ranking-rest");
  const btns = document.querySelectorAll(".period-btn");

  if (!top3 || !rest) {
    console.warn("ranking containers not found");
    return;
  }

  // DAY/WEEK/MONTH/ALL -> days
  const periodToDays = (p) => (p === "day" ? 1 : p === "week" ? 7 : p === "month" ? 30 : 365);

// ★ id の重複を強制的に消す正規化（ここが修正点）
const normalizeKey = (k) => {
  if (!k) return "";
  const s = String(k).trim();

  try {
    // /article.html?... でも https://〜 でも両対応
    const u = new URL(
      s.startsWith("http") ? s : location.origin + s
    );

    // id が複数あっても最初の1個だけ使う
    const id = u.searchParams.get("id");
    if (!id) return ""; // id 無しは捨てる

    return `/article.html?id=${id}`;
  } catch {
    return "";
  }
};


  const fetchRank = async (days) => {
    const url = new URL(API_BASE);
    url.searchParams.set("mode", "page");
    url.searchParams.set("days", String(days));
    url.searchParams.set("limit", "30");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  };

  const badgeClass = (rank) => {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
    return "";
  };

  const render = async (period) => {
    top3.innerHTML = "";
    rest.innerHTML = `<div style="padding:12px 0;color:#86868b;">読み込み中…</div>`;

    try {
      const days = periodToDays(period);
      const data = await fetchRank(days);
const merged = new Map();

(data.rows || []).forEach(r => {
  const key = normalizeKey(r.key);
  const views = Number(r.views || 0);
  if (!key) return;

  // id無しテンプレはランキングに出さない
  if (key === "/article.html") return;

  merged.set(key, (merged.get(key) || 0) + views);
});


const rows = [...merged.entries()]
  .map(([key, views]) => ({ key, views }))
  .sort((a, b) => b.views - a.views);


      if (!rows.length) {
        rest.innerHTML = `<div style="padding:12px 0;color:#86868b;">データがありません</div>`;
        return;
      }

      // PVランキングは「ページ単位」なので、表示はシンプルにする
      // クリックするとそのページへ飛ぶ（/article.html など）
      const top = rows.slice(0, 3).map((r, i) => {
        const rank = i + 1;
        return `
          <div class="rank-hero" onclick="location.href='${r.key}'">
            <div class="rank-badge rank-badge-large ${badgeClass(rank)}">${rank}</div>
            <div class="rank-hero-content">
              <div class="ranking-service">PAGE VIEW</div>
              <div class="rank-hero-title">${r.key}</div>
              <div class="rank-hero-desc">直近 ${days} 日間で多く見られたページ</div>
              <div class="rank-hero-meta">
                <span>${r.views.toLocaleString()} views</span>
              </div>
            </div>
          </div>
        `;
      }).join("");

      const others = rows.slice(3).map((r, i) => {
        const rank = i + 4;
        return `
          <div class="ranking-row" onclick="location.href='${r.key}'">
            <div class="ranking-row-rank">${rank}</div>
            <div class="ranking-row-main">
              <div class="ranking-row-title">${r.key}</div>
              <div class="ranking-row-meta">
                <span>${r.views.toLocaleString()} views</span>
              </div>
            </div>
          </div>
        `;
      }).join("");

      top3.innerHTML = top;
      rest.innerHTML = others;

      // reveal アニメ（強制で見えるように）
      document.querySelectorAll(".reveal").forEach(el => el.classList.add("active"));

    } catch (e) {
      console.error(e);
      rest.innerHTML = `<div style="padding:12px 0;color:#d00;">読み込み失敗：${e.message}</div>`;
    }
  };

  // ボタンで切り替え
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      btns.forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      render(b.dataset.period || "all");
    });
  });

  // 初期表示（ALL）
  render("all");
})();
