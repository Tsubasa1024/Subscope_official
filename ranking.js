/* =========================
   ranking.js（完全版）
   - ランキングがDOMに反映されたらローダーを消す
   - キャッシュ即表示 → 裏で更新
   - エラーでもローダー解除
   ========================= */

(() => {
  const API_BASE = "https://subscope-ranking-319660105312.asia-northeast1.run.app";

  const top3 = document.getElementById("ranking-top3");
  const rest = document.getElementById("ranking-rest");
  const btns = document.querySelectorAll(".period-btn");

  if (!top3 || !rest || !btns.length) {
    window.hideLoader?.();
    return;
  }

  // DAY/WEEK/MONTH/ALL -> days
  const periodToDays = (p) => (p === "day" ? 1 : p === "week" ? 7 : p === "month" ? 30 : 365);

  // Cloud Run の mode=page で返る key を /article.html?id=xxx に正規化
  const normalizeKey = (k) => {
    if (!k) return "";
    const s = String(k).trim();

    try {
      // keyがURLならそのまま解析 / パスなら補完
      const u = new URL(s.startsWith("http") ? s : location.origin + s);

      let id = u.searchParams.get("id");
      if (!id) return "";

      id = String(id).split(/[?&]/)[0];
      if (!id) return "";

      return `/article.html?id=${encodeURIComponent(id)}`;
    } catch {
      return "";
    }
  };

  const fetchRank = async (days) => {
    const url = new URL(API_BASE);
    url.searchParams.set("mode", "page");
    url.searchParams.set("days", String(days));
    url.searchParams.set("limit", "50");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  };

  const badgeClass = (rank) => (rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "");

  // ====== ✅ キャッシュ（1時間） ======
  const RANK_CACHE_KEY = "subscope_rank_page_cache_v2";
  const RANK_TTL = 60 * 60 * 1000;

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

  let firstRenderDone = false;

  const draw = (period, rows) => {
    const days = periodToDays(period);

    // 上位（最大3）
    const top = rows.slice(0, 3).map((r, i) => {
      const rank = i + 1;
      return `
        <div class="rank-hero" onclick="location.href='${r.key}'">
          <div class="rank-badge rank-badge-large ${badgeClass(rank)}">${rank}</div>
          <div class="rank-hero-content">
            <div class="ranking-service">PAGE VIEW</div>
            <div class="rank-hero-title">${escapeHtml(r.title || r.key)}</div>
            <div class="rank-hero-desc">直近 ${days} 日間で多く見られたページ</div>
            <div class="rank-hero-meta"><span>${Number(r.views || 0).toLocaleString()} views</span></div>
          </div>
        </div>
      `;
    }).join("");

    // 4位以降
    const others = rows.slice(3).map((r, i) => {
      const rank = i + 4;
      return `
        <div class="ranking-row" onclick="location.href='${r.key}'">
          <div class="ranking-row-rank">${rank}</div>
          <div class="ranking-row-main">
            <div class="ranking-row-title">${escapeHtml(r.title || r.key)}</div>
            <div class="ranking-row-meta"><span>${Number(r.views || 0).toLocaleString()} views</span></div>
          </div>
        </div>
      `;
    }).join("");

    top3.innerHTML = top;
    rest.innerHTML = others || `<div style="padding:12px 0;color:#86868b;">データがありません</div>`;

    // アニメ付け直し（既存スタイルに合わせる）
    [top3, rest].forEach((el) => {
      el.classList.remove("ranking-animate");
      void el.offsetWidth;
      el.classList.add("ranking-animate");
    });

    // ✅ 初回描画完了でローダー解除
    if (!firstRenderDone) {
      firstRenderDone = true;
      window.hideLoader?.();
    }
  };

  function escapeHtml(s = "") {
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));
  }

  const render = async (period) => {
    // ① キャッシュがあれば即表示
    const cachedRows = readCache(period);
    if (cachedRows && cachedRows.length) {
      draw(period, cachedRows);
    } else {
      // ローダーが上にいる想定だが、裏で読み込み表示も入れておく
      top3.innerHTML = "";
      rest.innerHTML = `<div style="padding:12px 0;color:#86868b;">読み込み中…</div>`;
    }

    // ② 最新を取得して更新
    try {
      const days = periodToDays(period);
      const data = await fetchRank(days);

      // 同一ページは合算
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
        .sort((a, b) => b.views - a.views)
        .slice(0, 30);

      if (!rows.length) {
        rest.innerHTML = `<div style="padding:12px 0;color:#86868b;">データがありません</div>`;
        window.hideLoader?.();
        return;
      }

      writeCache(period, rows);
      draw(period, rows);
    } catch (e) {
      console.error(e);
      if (!cachedRows?.length) {
        rest.innerHTML = `<div style="padding:12px 0;color:#d00;">読み込み失敗：${escapeHtml(e.message || "unknown")}</div>`;
      }
      // ✅ 失敗でもローダー解除（永遠に待たせない）
      window.hideLoader?.();
    }
  };

  // ボタンで切替
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      render(b.dataset.period || "all");
    });
  });

  // 初期表示（ALL）
  render("all");

  // 1時間に1回更新（ページ開いてる間）
  setInterval(() => {
    const activePeriod = document.querySelector(".period-btn.active")?.dataset?.period || "all";
    render(activePeriod);
  }, 60 * 60 * 1000);
})();
