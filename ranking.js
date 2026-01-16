/* =========================
   ranking.js（完全版：タイトル表示対応）
   - PVランキングAPIの key(URL) から id を取り出す
   - microCMS記事一覧（window.articles）を読み込み、id→titleに変換
   - キャッシュは v3 に更新（古いURLキャッシュを無効化）
   - 初回描画完了でローダー解除
   ========================= */

(async () => {
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

  // ✅ 記事一覧を読み込んで id→記事 を作る
  if ((!window.articles || window.articles.length === 0) && typeof window.loadArticles === "function") {
    try { await window.loadArticles(); } catch (e) { /* 無視して続行 */ }
  }
  const list = Array.isArray(window.articles) ? window.articles : [];
  const articleById = new Map(list.map(a => [a.id, a]));

  const getIdFromKey = (k) => {
    if (!k) return "";
    const s = String(k).trim();
    try {
      const u = new URL(s.startsWith("http") ? s : location.origin + s);
      let id = u.searchParams.get("id");
      if (!id) return "";
      return String(id).split(/[?&]/)[0];
    } catch {
      return "";
    }
  };

  const toArticlePath = (id) => id ? `/article.html?id=${encodeURIComponent(id)}` : "";

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
  // 🔥 v3 にして、URLだけの古いキャッシュを強制リセット
  const RANK_CACHE_KEY = "subscope_rank_page_cache_v3";
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

  const escapeHtml = (s = "") =>
    String(s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));

  let firstRenderDone = false;

  // ✅ rows に title が無い時でも、描画時に補完する
  const enrichRows = (rows) => {
    return rows.map(r => {
      if (r.title) return r;
      const a = r.id ? articleById.get(r.id) : null;
      return { ...r, title: a?.title || "" };
    });
  };

  const draw = (period, rowsRaw) => {
    const rows = enrichRows(rowsRaw);
    const days = periodToDays(period);

    const top = rows.slice(0, 3).map((r, i) => {
      const rank = i + 1;
      const title = r.title || r.path; // 最後の保険
      return `
        <div class="rank-hero" onclick="location.href='${r.path}'">
          <div class="rank-badge rank-badge-large ${badgeClass(rank)}">${rank}</div>
          <div class="rank-hero-content">
            <div class="ranking-service">PAGE VIEW</div>
            <div class="rank-hero-title">${escapeHtml(title)}</div>
            <div class="rank-hero-desc">直近 ${days} 日間で多く見られたページ</div>
            <div class="rank-hero-meta"><span>${Number(r.views || 0).toLocaleString()} views</span></div>
          </div>
        </div>
      `;
    }).join("");

    const others = rows.slice(3).map((r, i) => {
      const rank = i + 4;
      const title = r.title || r.path;
      return `
        <div class="ranking-row" onclick="location.href='${r.path}'">
          <div class="ranking-row-rank">${rank}</div>
          <div class="ranking-row-main">
            <div class="ranking-row-title">${escapeHtml(title)}</div>
            <div class="ranking-row-meta"><span>${Number(r.views || 0).toLocaleString()} views</span></div>
          </div>
        </div>
      `;
    }).join("");

    top3.innerHTML = top;
    rest.innerHTML = others || `<div style="padding:12px 0;color:#86868b;">データがありません</div>`;

    if (!firstRenderDone) {
      firstRenderDone = true;
      window.hideLoader?.();
    }
  };

  const buildRowsFromApi = (data) => {
    const merged = new Map(); // id -> views

    (data.rows || []).forEach((r) => {
      const id = getIdFromKey(r.key);
      if (!id) return;
      const v = Number(r.views || 0);
      merged.set(id, (merged.get(id) || 0) + v);
    });

    const rows = [...merged.entries()]
      .map(([id, views]) => {
        const a = articleById.get(id);
        return {
          id,
          path: toArticlePath(id),
          title: a?.title || "", // ✅ ここでタイトルに変換
          views
        };
      })
      .filter(r => r.path) // 念のため
      .sort((a, b) => b.views - a.views)
      .slice(0, 30);

    return rows;
  };

  const render = async (period) => {
    const cachedRows = readCache(period);
    if (cachedRows && cachedRows.length) {
      draw(period, cachedRows);
    } else {
      top3.innerHTML = "";
      rest.innerHTML = `<div style="padding:12px 0;color:#86868b;">読み込み中…</div>`;
    }

    try {
      const days = periodToDays(period);
      const data = await fetchRank(days);
      const rows = buildRowsFromApi(data);

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
      window.hideLoader?.();
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

  // 1時間に1回更新（開きっぱ用）
  setInterval(() => {
    const activePeriod = document.querySelector(".period-btn.active")?.dataset?.period || "all";
    render(activePeriod);
  }, 60 * 60 * 1000);
})();
