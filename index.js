/* =========================================
   SUBSCOPE index.js 完全版
   - localStorage でビュー数記録
   - 1番人気を HERO に表示
   - 最新記事 3×3 の9件表示（広告1つ含む）
   - all / ranking / article も共通で動く
========================================= */

/* ---------- ビュー数（localStorage） ---------- */
function getViews(id) {
  return Number(localStorage.getItem("views_" + id) || 0);
}

function addView(id) {
  const current = getViews(id) + 1;
  localStorage.setItem("views_" + id, String(current));
  return current;
}

/* ---------- 記事データ読み込み ---------- */
async function loadArticles() {
  const res = await fetch("./data/articles.json");
  const data = await res.json();
  return data;
}

/* localStorage のビュー数をマージ */
function withLocalViews(articles) {
  return articles.map((a) => ({
    ...a,
    localViews: getViews(a.id),
  }));
}

/* ---------- HERO：一番人気の記事 ---------- */
async function renderHero() {
  const container = document.getElementById("most-viewed-content");
  if (!container) return;

  const raw = await loadArticles();
  const articles = withLocalViews(raw);

  if (!articles.length) return;

  const sorted = [...articles].sort(
    (a, b) =>
      b.views + b.localViews - (a.views + a.localViews)
  );
  const top = sorted[0];

  container.innerHTML = `
    <article class="featured-card" style="background-image:url('${top.image}')">
      <div class="featured-content">
        <div class="featured-meta">
          <span class="featured-tag">${top.service}</span>
          <span>${top.date.replace(/-/g, ".")}</span>
        </div>
        <h2 class="featured-title">${top.title}</h2>
        <p class="featured-desc">${top.description}</p>
        <button class="btn-read" data-article-id="${top.id}">
          続きを読む
        </button>
      </div>
    </article>
  `;

  const btn = container.querySelector(".btn-read");
  if (btn) {
    btn.addEventListener("click", () => {
      addView(top.id);
      window.location.href = "article.html?id=" + top.id;
    });
  }
}

/* ---------- 最新記事 3×3（広告含む） ---------- */
async function renderLatest() {
  const grid = document.getElementById("latest-grid");
  if (!grid) return;

  const articles = await loadArticles();

  const latest = [...articles]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8); // 8件 + 広告1件 = 9

  const AD = {
    isAd: true,
    title: "AD — SUBSCOPE パートナー募集中",
    desc: "あなたのサブスクをここに掲載しませんか？",
  };

  const cards = [...latest, AD];

  grid.innerHTML = cards
    .map((item) => {
      if (item.isAd) {
        return `
          <div class="article-card placeholder-card">
            <div>
              <div style="font-size:0.75rem; letter-spacing:0.08em; margin-bottom:4px;">SPONSORED</div>
              <div style="font-weight:700; margin-bottom:6px;">${item.title}</div>
              <div style="font-size:0.9rem;">${item.desc}</div>
            </div>
          </div>
        `;
      }
      return `
        <article class="article-card" data-article-id="${item.id}">
          <div class="card-image" style="background-image:url('${item.image}')"></div>
          <div class="card-body">
            <div class="card-service">${item.service}</div>
            <h3 class="card-title">${item.title}</h3>
            <div class="card-date">${item.date.replace(/-/g, ".")}</div>
            <p class="card-desc">${item.description}</p>
          </div>
        </article>
      `;
    })
    .join("");

  latest.forEach((item) => {
    const el = grid.querySelector(
      `[data-article-id="${item.id}"]`
    );
    if (!el) return;
    el.addEventListener("click", () => {
      addView(item.id);
      window.location.href = "article.html?id=" + item.id;
    });
  });
}

/* ---------- ランキングページ ---------- */
async function renderRanking() {
  const wrapper = document.getElementById("ranking-list");
  if (!wrapper) return;

  const raw = await loadArticles();
  const articles = withLocalViews(raw);

  const sorted = [...articles].sort(
    (a, b) =>
      b.views + b.localViews - (a.views + a.localViews)
  );

  wrapper.innerHTML = sorted
    .map((a, i) => {
      const totalViews = a.views + a.localViews;
      return `
        <div class="ranking-item" data-article-id="${a.id}">
          <div class="rank-number">${i + 1}</div>
          <img src="${a.image}" class="rank-thumb" alt="">
          <div class="rank-content">
            <h3 class="rank-title">${a.title}</h3>
            <div class="rank-meta">
              ${a.service} ／ ${a.date.replace(/-/g, ".")} ／
              合計ビュー数：${totalViews.toLocaleString()}
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  wrapper.querySelectorAll(".ranking-item").forEach((el) => {
    const id = Number(el.getAttribute("data-article-id"));
    el.addEventListener("click", () => {
      addView(id);
      window.location.href = "article.html?id=" + id;
    });
  });
}

/* ---------- 記事ページ（article.html） ---------- */
async function renderArticlePage() {
  const container = document.getElementById("article-body");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));

  const articles = await loadArticles();
  const article = articles.find((a) => a.id === id);

  if (!article) {
    container.innerHTML = "<p>記事が見つかりませんでした。</p>";
    return;
  }

  addView(article.id);
  document.title = `${article.title} | SUBSCOPE`;

  const bodyHtml =
    (article.content && article.content.length
      ? article.content
          .map(
            (p) =>
              `<p style="margin-bottom:1.2em; line-height:1.7;">${p}</p>`
          )
          .join("")
      : `<p>${article.description}</p>`);

  container.innerHTML = `
    <article>
      <p style="font-size:0.85rem; color:#86868B; margin-bottom:8px;">
        ${article.service} ／ ${article.date.replace(/-/g, ".")}
      </p>
      <h1 style="font-size:1.8rem; font-weight:700; margin-bottom:16px;">
        ${article.title}
      </h1>
      <img src="${article.image}"
           alt=""
           style="width:100%; border-radius:24px; margin-bottom:24px; object-fit:cover; max-height:360px;">
      ${bodyHtml}
    </article>
  `;
}

/* ---------- 検索（Enter で all.html へ） ---------- */
function setupSearch() {
  const input = document.getElementById("search-input");
  if (!input) return;

  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const q = input.value.trim();
    if (!q) return;
    // いったん all.html に飛ばす（クエリは今後拡張用）
    window.location.href =
      "all.html?search=" + encodeURIComponent(q);
  });
}

/* ---------- スクロールのフェードイン ---------- */
function setupScrollReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("active"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        io.unobserve(entry.target);
      }
    });
  });

  targets.forEach((el) => io.observe(el));
}

/* ---------- ヘッダー Menu ボタン ---------- */
function toggleMenu() {
  const overlay = document.getElementById("nav-overlay");
  if (!overlay) return;
  overlay.classList.toggle("open");
}

/* ---------- DOM 準備できたら実行 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  setupScrollReveal();
  renderHero();
  renderLatest();
  renderRanking();
  renderArticlePage();
});
