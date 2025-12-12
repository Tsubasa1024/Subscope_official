// =====================================
// microCMS 設定（記事のみ）
// =====================================
window.articles = window.articles || [];

const SERVICE_ID = "subscope";
const API_KEY = "cxfk9DoKLiD4YR3zIRDDk4iZyzNtBtaFEqzz";
const ENDPOINT = `https://${SERVICE_ID}.microcms.io/api/v1/articles`;

// 画像がない時の保険（軽いURLに）
const FALLBACK_IMAGE = "https://placehold.co/800x500?text=SUBSCOPE";

// =====================================
// Utility
// =====================================
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function normalizeText(str) {
  if (!str) return "";
  return str.toString().toLowerCase().replace(/\s+/g, "");
}

// XSS/崩れ予防（最低限）
function esc(str) {
  return (str ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateDot(dateStr) {
  return (dateStr || "").slice(0, 10).replace(/-/g, ".");
}

// 本文テキスト化は重いので「検索時だけ」作る（キャッシュあり）
function getBodyText(article) {
  if (!article) return "";
  if (typeof article.bodyText === "string") return article.bodyText;

  const raw = article.contentHtml || "";
  if (!raw) {
    article.bodyText = "";
    return "";
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = raw;
  article.bodyText = (tmp.textContent || tmp.innerText || "").trim();
  return article.bodyText;
}

function articleImage(item) {
  return (
    item?.eyecatch?.url ||
    item?.thumbnail?.url ||
    item?.image?.url ||
    item?.heroImage?.url ||
    (typeof item?.image === "string" ? item.image : "") ||
    FALLBACK_IMAGE
  );
}

// =====================================
// Article mapping
// =====================================
function mapCmsArticle(item) {
  const rawCat = item.category;
  let category = "";

  if (Array.isArray(rawCat) && rawCat[0]) {
    const first = rawCat[0];
    category = (first.name || first.id || first).toString().trim();
  } else if (typeof rawCat === "string") {
    category = rawCat.trim();
  } else if (rawCat && typeof rawCat === "object") {
    category = (rawCat.name || rawCat.id || "").toString().trim();
  }
  if (!category) category = "音楽";

  let tags = [];
  if (Array.isArray(item.tags)) {
    tags = item.tags
      .map((t) => (t && (t.name || t.id || t)).toString().trim())
      .filter(Boolean);
  }

  // ★ bodyText はここでは作らない（軽量化）
  return {
    id: item.id,
    title: item.title || "",
    description: item.description || "",
    category,
    categoryName: category,
    service: item.service || "",
    date: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
    image: articleImage(item),

    contentHtml: item.content || "",
    // bodyText: undefined（検索時に生成）
    tags,
  };
}

// =====================================
// Fetch + cache
// =====================================
// セッション中はキャッシュ（同じページ内の無駄fetch削減）
let _articlesPromise = null;

async function loadArticles() {
  if (window.articles && window.articles.length > 0) return window.articles;
  if (_articlesPromise) return _articlesPromise;

  _articlesPromise = (async () => {
    try {
      // 初回表示の重さ対策：depthは必要なければ1にしてOK
      const url = `${ENDPOINT}?limit=100&depth=2`;

      // タイムアウト（重い時の待ちっぱなし防止）
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, {
        headers: { "X-MICROCMS-API-KEY": API_KEY },
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(t);

      if (!res.ok) throw new Error("HTTP error " + res.status);

      const data = await res.json();
      const contents = data.contents || [];
      window.articles = contents.map(mapCmsArticle);
    } catch (e) {
      console.error("microCMS から記事一覧の取得に失敗:", e);
      window.articles = [];
    }
    return window.articles;
  })();

  return _articlesPromise;
}

function getArticles() {
  return window.articles || [];
}

function sortByDateDesc(list) {
  return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// =====================================
// Render: Hero
// =====================================
function renderHero(mountEl) {
  const list = getArticles();
  if (!mountEl || !list.length) return;

  const featured = sortByDateDesc(list)[0];

  // DOM生成（innerHTML最小）
  const card = document.createElement("article");
  card.className = "featured-card";
  card.dataset.href = `article.html?id=${encodeURIComponent(featured.id)}`;

  const img = document.createElement("img");
  img.className = "featured-media";
  img.src = featured.image;
  img.alt = featured.title || "featured";
  img.decoding = "async";
  // ヒーローは eager（最重要）
  img.loading = "eager";

  const content = document.createElement("div");
  content.className = "featured-content";

  const meta = document.createElement("div");
  meta.className = "featured-meta";
  meta.innerHTML = `
    <span class="tag">${esc(featured.service || "SUBSCOPE")}</span>
    <span>${esc(featured.categoryName || featured.category || "")}</span>
  `;

  const title = document.createElement("h2");
  title.className = "featured-title";
  title.textContent = featured.title || "";

  const desc = document.createElement("p");
  desc.className = "featured-desc";
  desc.textContent = featured.description || "";

  content.append(meta, title, desc);
  card.append(img, content);

  // クリック遷移（HTML軽量化）
  card.addEventListener("click", () => {
    location.href = card.dataset.href;
  });

  mountEl.innerHTML = "";
  mountEl.appendChild(card);
}

// =====================================
// Render: Latest Grid
// =====================================
function renderLatest(gridEl, limit = 8) {
  if (!gridEl) return;

  const list = getArticles();
  const sorted = sortByDateDesc(list).slice(0, limit);

  // まとめてDOM生成
  const frag = document.createDocumentFragment();

  sorted.forEach((a) => {
    const card = document.createElement("article");
    card.className = "article-card";
    card.dataset.href = `article.html?id=${encodeURIComponent(a.id)}`;

    const imgDiv = document.createElement("div");
    imgDiv.className = "card-image";
    imgDiv.style.backgroundImage = `url('${a.image}')`;

    const body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = `
      <div class="card-service">${esc(a.service || "SUBSCOPE")}</div>
      <h3 class="card-title">${esc(a.title)}</h3>
      <p class="card-desc">${esc(a.description)}</p>
      <div class="card-date">${esc(formatDateDot(a.date))}</div>
    `;

    card.append(imgDiv, body);
    card.addEventListener("click", () => (location.href = card.dataset.href));

    frag.appendChild(card);
  });

  gridEl.innerHTML = "";
  gridEl.appendChild(frag);
}

// =====================================
// Carousel 3D（おすすめ）
// =====================================
function initCarousel3D(carouselRoot) {
  if (!carouselRoot) return;

  const items = qsa(".carousel3d-item", carouselRoot);
  const prevBtn = qs(".carousel3d-nav-prev", carouselRoot);
  const nextBtn = qs(".carousel3d-nav-next", carouselRoot);
  const inner = qs(".carousel3d-inner", carouselRoot);

  if (!items.length || !prevBtn || !nextBtn || !inner) return;

  const list = getArticles();
  if (!list.length) return;

  const total = items.length;
  let currentIndex = 0;

  // “おすすめ”は最新から先頭4件
  const recommend = sortByDateDesc(list).slice(0, total);

  items.forEach((item, i) => {
    const a = recommend[i % recommend.length];

    const card = document.createElement("div");
    card.className = "carousel3d-card";
    card.dataset.href = `article.html?id=${encodeURIComponent(a.id)}`;

    const img = document.createElement("img");
    img.src = a.image;
    img.alt = a.title || "";
    img.loading = "lazy";
    img.decoding = "async";

    const p = document.createElement("p");
    p.textContent = a.title || "";

    card.append(img, p);
    card.addEventListener("click", () => (location.href = card.dataset.href));

    item.innerHTML = "";
    item.appendChild(card);
  });

  function updatePositions() {
    items.forEach((item, i) => {
      item.className = "carousel3d-item";
      const offset = (i - currentIndex + total) % total;
      if (offset === 0) item.classList.add("is-center");
      else if (offset === 1) item.classList.add("is-right");
      else if (offset === total - 1) item.classList.add("is-left");
      else item.classList.add("is-back");
    });
  }

  function goNext() {
    currentIndex = (currentIndex + 1) % total;
    updatePositions();
  }
  function goPrev() {
    currentIndex = (currentIndex - 1 + total) % total;
    updatePositions();
  }

  // 自動再生（表示中だけ回す）
  let autoTimer = null;
  const AUTO_MS = 4500;

  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }
  function startAuto() {
    stopAuto();
    autoTimer = setInterval(goNext, AUTO_MS);
  }

  // 可視性で停止
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  // 画面外なら止める（さらに軽い）
  const io = new IntersectionObserver(
    (entries) => {
      const isOn = entries.some((e) => e.isIntersecting);
      if (isOn) startAuto();
      else stopAuto();
    },
    { threshold: 0.2 }
  );
  io.observe(carouselRoot);

  nextBtn.addEventListener("click", () => { goNext(); startAuto(); });
  prevBtn.addEventListener("click", () => { goPrev(); startAuto(); });

  // スワイプ（passive）
  let touchStartX = 0;
  let touchEndX = 0;
  const SWIPE = 40;

  inner.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  inner.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;
    if (diff > SWIPE) { goPrev(); startAuto(); }
    else if (diff < -SWIPE) { goNext(); startAuto(); }
  }, { passive: true });

  updatePositions();
}

// =====================================
// Search
// =====================================
function searchArticlesList(query) {
  const q = (query || "").trim();
  if (!q) return [];

  const tokens = q.split(/\s+/).map(normalizeText).filter(Boolean);
  if (!tokens.length) return [];

  const list = getArticles();
  if (!list.length) return [];

  const result = list.filter((article) => {
    const joined = [
      article.title || "",
      article.description || "",
      article.service || "",
      article.categoryName || article.category || "",
      (article.tags || []).join(" "),
      getBodyText(article), // ★ここで初めて生成
    ].join(" ");

    const hay = normalizeText(joined);
    return tokens.every((t) => hay.includes(t));
  });

  result.sort((a, b) => new Date(b.date) - new Date(a.date));
  return result;
}

function renderHeaderSearchResults(resultsEl, query) {
  const q = (query || "").trim();
  if (!q) {
    resultsEl.innerHTML = "";
    resultsEl.style.display = "none";
    return;
  }

  const results = searchArticlesList(q).slice(0, 3);

  if (!results.length) {
    resultsEl.innerHTML =
      `<p style="margin-top:8px;color:#86868B;font-size:0.9rem;">該当する記事は見つかりませんでした。</p>`;
    resultsEl.style.display = "block";
    return;
  }

  resultsEl.innerHTML = results.map((a) => `
    <div class="search-item" data-href="article.html?id=${encodeURIComponent(a.id)}">
      <img src="${esc(a.image)}" alt="" loading="lazy" decoding="async">
      <div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.description)}</p>
      </div>
    </div>
  `).join("");

  resultsEl.style.display = "block";
}

function initHeaderSearch() {
  const fixedHeader = qs("#fixedHeader");
  const searchWrapper = qs("#searchWrapper");
  const searchInput = qs("#searchInput");
  const clearBtn = qs("#clearBtn");
  const resultsEl = qs("#searchResults");

  if (!fixedHeader || !searchWrapper || !searchInput || !resultsEl) return;

  const isMobile = () => window.innerWidth <= 767;
  let isOpen = false;

  // スマホ：タップで展開
  searchWrapper.addEventListener("click", (e) => {
    if (!isMobile()) {
      if (e.target !== searchInput) searchInput.focus();
      return;
    }

    if (!isOpen) {
      fixedHeader.classList.add("search-open");
      isOpen = true;
      setTimeout(() => searchInput.focus(), 60);
    } else {
      // 入力中をタップした時は閉じない
      if (e.target === searchInput) return;
      fixedHeader.classList.remove("search-open");
      isOpen = false;
      searchInput.blur();
    }
  });

  // リサイズ時：スマホ→PCなどで整合
  window.addEventListener("resize", () => {
    if (!isMobile() && isOpen) {
      fixedHeader.classList.remove("search-open");
      isOpen = false;
    }
  }, { passive: true });

  // 入力
  let rafId = 0;
  searchInput.addEventListener("input", () => {
    // 連打で重くならないように1フレームにまとめる
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      renderHeaderSearchResults(resultsEl, searchInput.value);
      if (clearBtn) clearBtn.style.display = searchInput.value.trim() ? "block" : "none";
    });
  });

  // Enter → all.html へ
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const keyword = searchInput.value.trim();
      if (!keyword) return;
      location.href = `all.html?search=${encodeURIComponent(keyword)}`;
    }
  });

  // クリア
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      searchInput.value = "";
      clearBtn.style.display = "none";
      renderHeaderSearchResults(resultsEl, "");
      searchInput.focus();
    });
  }

  // 検索候補クリック（イベント委譲）
  resultsEl.addEventListener("click", (e) => {
    const item = e.target.closest(".search-item");
    if (!item) return;
    const href = item.dataset.href;
    if (href) location.href = href;
  });
}

// =====================================
// Menu + Smooth scroll
// =====================================
function initMenu() {
  const menuBtn = qs("#menuBtn");
  const overlay = qs("#nav-overlay");
  if (!menuBtn || !overlay) return;

  menuBtn.addEventListener("click", () => overlay.classList.toggle("open"));

  // overlay内の scroll link
  overlay.addEventListener("click", (e) => {
    const link = e.target.closest(".nav-link");
    if (!link) return;

    const target = link.getAttribute("data-scroll");
    if (target) {
      e.preventDefault();
      overlay.classList.remove("open");
      smoothScroll(target);
    } else {
      overlay.classList.remove("open");
    }
  });

  // 画面タップで閉じる（外側）
  document.addEventListener("click", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.target.closest("#nav-overlay") || e.target.closest("#menuBtn")) return;
    overlay.classList.remove("open");
  });
}

function smoothScroll(selector) {
  const el = qs(selector);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY;
  const offset = 80;
  window.scrollTo({ top: y - offset, behavior: "smooth" });
}

// =====================================
// Scroll Reveal
// =====================================
function initScrollReveal() {
  const targets = qsa(".reveal");
  if (!targets.length) return;

  // reduced motionなら全部表示
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    targets.forEach((el) => el.classList.add("active"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach((el) => observer.observe(el));
}

// =====================================
// Boot
// =====================================
document.addEventListener("DOMContentLoaded", async () => {
  // 先にUIだけ（体感速く）
  initMenu();
  initHeaderSearch();
  initScrollReveal();

  await loadArticles();

  // Home pageだけ描画（要素がある時だけ）
  const heroMount = qs("#heroMount");
  const latestGrid = qs("#latest-grid");
  const carousel = qs("#carousel3d");

  if (heroMount) renderHero(heroMount);
  if (latestGrid) renderLatest(latestGrid, 8);
  if (carousel) initCarousel3D(carousel);
});
