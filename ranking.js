/* =========================
   ranking.js（完全版）
   - ランキングAPIのviewsを取得
   - window.articles（microCMS一覧）とIDで紐づけて title/image/service を表示
   - 描画完了でローダーを消す
   ========================= */
(() => {
  const API_BASE = "https://subscope-ranking-319660105312.asia-northeast1.run.app";
  const FALLBACK_IMG = "https://www.subscope.jp/ogp-default-v3.png";

  const top3 = document.getElementById("ranking-top3");
  const rest = document.getElementById("ranking-rest");
  const btns = document.querySelectorAll(".period-btn");
  if (!top3 || !rest) return;

  let firstRenderDone = false;

  const escapeHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  // DAY/WEEK/MONTH/ALL -> days
  const periodToDays = (p) => (p === "day" ? 1 : p === "week" ? 7 : p === "month" ? 30 : 365);

  // /article.html?id=xxxxx から id を抜く（壊れてても耐える）
  const extractIdFromUrl = (k) => {
    if (!k) return "";
    const s = String(k).trim();
    try {
      const u = new URL(s.startsWith("http") ? s : location.origin + s);
      let id = u.searchParams.get("id");
      if (!id) return "";
      id = String(id).split(/[?&]/)[0];
      return id;
    } catch {
      return "";
    }
  };

  const normalizeKeyToPath = (k) => {
    const id = extractIdFromUrl(k);
    if (!id) return "";
    return `/article.html?id=${id}`;
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
  const RANK_CACHE_KEY = "subscope_rank_page_cache_v2"; // v2（構造変えた）
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

  // ✅ microCMS 記事一覧を確実に用意
  const ensureArticles = async () => {
    try {
      if ((!window.articles || window.articles.length === 0) && typeof window.loadArticles === "function") {
        await window.loadArticles();
      }
    } catch (e) {
      console.warn("ensureArticles error", e);
    }
    return Array.isArray(window.articles) ? window.articles : [];
  };

  const buildArticleMap = (articles) => {
    const m = new Map();
    (articles || []).forEach((a) => {
      if (!a?.id) return;

      // 画像フィールドは環境でブレるので候補を並べる（安全側）
      const img =
        (a?.image?.url) ||
        (typeof a?.image === "string" ? a.image : "") ||
        (a?.thumbnail?.url) ||
        (a?.eyecatch?.url) ||
        (a?.heroImage?.url) ||
        "";

      const title = a?.title || "";
      const service = a?.service || a?.serviceName || "";
      const desc = (a?.description || "").trim();

      m.set(a.id, { id: a.id, title, image: img, service, description: desc });
    });
    return m;
  };

  // API rows -> [{id, path, views}]
  const buildRowsFromApi = (data) => {
    const merged = new Map(); // id -> views
    (data?.rows || []).forEach((r) => {
      const id = extractIdFromUrl(r?.key);
      if (!id) return;
      const views = Number(r?.views || 0);
      if (!Number.isFinite(views) || views <= 0) return;
      merged.set(id, (merged.get(id) || 0) + views);
    });

    const rows = [...merged.entries()]
      .map(([id, views]) => ({ id, path: `/article.html?id=${id}`, views }))
      .sort((a, b) => b.views - a.views);

    return rows;
  };

  const draw = (period, rows, articleMap) => {
    const days = periodToDays(period);

    const top = rows.slice(0, 3).map((r, i) => {
      const rank = i + 1;
      const a = articleMap.get(r.id) || null;

      const title = a?.title ? a.title : r.path;
      const service = a?.service ? a.service : "PAGE VIEW";
      const img = a?.image ? a.image : FALLBACK_IMG;

      return `
        <div class="rank-hero" onclick="location.href='${r.path}'">
          <div class="rank-badge rank-badge-large ${badgeClass(rank)}">${rank}</div>

          <div class="rank-hero-thumb" style="background-image:url('${escapeHtml(img)}')"></div>

          <div class="rank-hero-content">
            <div class="ranking-service">${escapeHtml(service)}</div>
            <div class="rank-hero-title">${escapeHtml(title)}</div>
            <div class="rank-hero-desc">直近 ${days} 日間で多く見られた記事</div>
            <div class="rank-hero-meta"><span>${Number(r.views||0).toLocaleString()} views</span></div>
          </div>
        </div>
      `;
    }).join("");

    const others = rows.slice(3).map((r, i) => {
      const rank = i + 4;
      const a = articleMap.get(r.id) || null;

      const title = a?.title ? a.title : r.path;
      const img = a?.image ? a.image : FALLBACK_IMG;

      return `
        <div class="ranking-row" onclick="location.href='${r.path}'">
          <div class="ranking-row-rank">${rank}</div>

          <div class="ranking-row-thumb" style="background-image:url('${escapeHtml(img)}')"></div>

          <div class="ranking-row-main">
            <div class="ranking-row-title">${escapeHtml(title)}</div>
            <div class="ranking-row-meta"><span>${Number(r.views||0).toLocaleString()} views</span></div>
          </div>
        </div>
      `;
    }).join("");

    top3.innerHTML = top;
    rest.innerHTML = others;

    // ローダー解除（初回だけ）
    if (!firstRenderDone) {
      firstRenderDone = true;
      window.hideLoader?.();
    }
  };

  const render = async (period) => {
    // まず記事一覧を用意（タイトル・画像のため）
    const articles = await ensureArticles();
    const articleMap = buildArticleMap(articles);

    // ① キャッシュがあれば即表示
    const cachedRows = readCache(period);
    if (cachedRows && cachedRows.length) {
      draw(period, cachedRows, articleMap);
    } else {
      top3.innerHTML = "";
      rest.innerHTML = `<div style="padding:12px 0;color:#86868b;">読み込み中…</div>`;
    }

    // ② 裏で最新取得して更新
    try {
      const days = periodToDays(period);
      const data = await fetchRank(days);

      const rows = buildRowsFromApi(data);

      if (!rows.length) {
        if (!cachedRows?.length) {
          rest.innerHTML = `<div style="padding:12px 0;color:#86868b;">データがありません</div>`;
          if (!firstRenderDone) { firstRenderDone = true; window.hideLoader?.(); }
        }
        return;
      }

      writeCache(period, rows);
      draw(period, rows, articleMap);
    } catch (e) {
      console.error(e);
      if (!cachedRows?.length) {
        rest.innerHTML = `<div style="padding:12px 0;color:#d00;">読み込み失敗：${escapeHtml(e.message)}</div>`;
      }
      // エラーでもローダーは必ず消す
      if (!firstRenderDone) {
        firstRenderDone = true;
        window.hideLoader?.();
      }
    }
  };

  // ボタン切り替え
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      render(b.dataset.period || "all");
    });
  });

  // 初期表示（ALL）
  render("all");

  // 1時間に1回更新
  setInterval(() => {
    const activePeriod = document.querySelector(".period-btn.active")?.dataset?.period || "all";
    render(activePeriod);
  }, 60 * 60 * 1000);
})();
