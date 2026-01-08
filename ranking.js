(() => {
  const API_BASE = "https://subscope-ranking-319660105312.asia-northeast1.run.app";

  const top3 = document.getElementById("ranking-top3");
  const rest = document.getElementById("ranking-rest");
  const btns = document.querySelectorAll(".period-btn");

  if (!top3 || !rest) return;

  // DAY/WEEK/MONTH/ALL -> days
  const periodToDays = (p) => (p === "day" ? 1 : p === "week" ? 7 : p === "month" ? 30 : 365);

  const normalizeKey = (k) => {
    if (!k) return "";
    const s = String(k).trim();
    try {
      const u = new URL(s.startsWith("http") ? s : location.origin + s);
      let id = u.searchParams.get("id");
      if (!id) return "";
      id = String(id).split(/[?&]/)[0];
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

  const badgeClass = (rank) => (rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "");

  // ====== ✅ キャッシュ（1時間） ======
  const RANK_CACHE_KEY = "subscope_rank_page_cache_v1";
  const RANK_TTL = 60 * 60 * 1000; // 1時間

  const readCache = (period) => {
    try {
      const raw = localStorage.getItem(RANK_CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      const hit = obj?.[period];
      if (!hit?.ts || !Array.isArray(hit?.rows)) return null;
      if (Date.now() - hit.ts > RANK_TTL) return null;
      return hit.rows;
    } catch {
      return null;
    }
  };

  const writeCache = (period, rows) => {
    try {
      const raw = localStorage.getItem(RANK_CACHE_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      obj[period] = { ts: Date.now(), rows };
      localStorage.setItem(RANK_CACHE_KEY, JSON.stringify(obj));
    } catch {}
  };

  const draw = (period, rows) => {
    const days = periodToDays(period);

    const top = rows.slice(0, 3).map((r, i) => {
      const rank = i + 1;
      return `
        <div class="rank-hero" onclick="location.href='${r.key}'">
          <div class="rank-badge rank-badge-large ${badgeClass(rank)}">${rank}</div>
          <div class="rank-hero-content">
            <div class="ranking-service">PAGE VIEW</div>
            <div class="rank-hero-title">${r.key}</div>
            <div class="rank-hero-desc">直近 ${days} 日間で多く見られたページ</div>
            <div class="rank-hero-meta"><span>${r.views.toLocaleString()} views</span></div>
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
            <div class="ranking-row-meta"><span>${r.views.toLocaleString()} views</span></div>
          </div>
        </div>
      `;
    }).join("");

    top3.innerHTML = top;
    rest.innerHTML = others;

    document.querySelectorAll(".reveal").forEach(el => el.classList.add("active"));
  };

  const render = async (period) => {
    // ① キャッシュがあれば即表示（＝読み込み表示がほぼ消える）
    const cachedRows = readCache(period);
    if (cachedRows && cachedRows.length) {
      draw(period, cachedRows);
    } else {
      top3.innerHTML = "";
      rest.innerHTML = `<div style="padding:12px 0;color:#86868b;">読み込み中…</div>`;
    }

    // ② 裏で最新を取得して更新（成功したらキャッシュ更新）
    try {
      const days = periodToDays(period);
      const data = await fetchRank(days);

      const merged = new Map();
      (data.rows || []).forEach((r) => {
        const key = normalizeKey(r.key);
        const views = Number(r.views || 0);
        if (!key) return;
        if (key === "/article.html") return;
        merged.set(key, (merged.get(key) || 0) + views);
      });

      const rows = [...merged.entries()]
        .map(([key, views]) => ({ key, views }))
        .sort((a, b) => b.views - a.views);

      if (!rows.length) {
        if (!cachedRows?.length) rest.innerHTML = `<div style="padding:12px 0;color:#86868b;">データがありません</div>`;
        return;
      }

      writeCache(period, rows);
      draw(period, rows);
    } catch (e) {
      console.error(e);
      if (!cachedRows?.length) {
        rest.innerHTML = `<div style="padding:12px 0;color:#d00;">読み込み失敗：${e.message}</div>`;
      }
    }
  };

  // ボタンで切り替え
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      render(b.dataset.period || "all");
    });
  });

  // 初期表示（ALL）
  render("all");

  // ✅ 1時間に1回更新（ページ開いてる間）
  setInterval(() => {
    const activePeriod = document.querySelector(".period-btn.active")?.dataset?.period || "all";
    render(activePeriod);
  }, 60 * 60 * 1000);
})();
