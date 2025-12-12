// =====================================
// 1. microCMS から記事を読む設定
// =====================================
window.articles = window.articles || [];

const SERVICE_ID = "subscope";
const API_KEY = "cxfk9DoKLiD4YR3zIRDDk4iZyzNtBtaFEqzz";
const ENDPOINT = `https://${SERVICE_ID}.microcms.io/api/v1/articles`;

// =====================================
// A. microCMS から広告を読む設定（ads）
// =====================================
window.__ADS__ = window.__ADS__ || {};
const ADS_ENDPOINT = `https://${SERVICE_ID}.microcms.io/api/v1/ads`;

/**
 * position（= 表示位置）で1件引く
 * enabled（= 表示する）が true のものだけ（※フィールドIDが enabled 前提）
 */
async function fetchTopAd(position) {
  // いったん全部取って、JS側で絞る（microCMSセレクト対策）
  const url = `${ADS_ENDPOINT}?limit=50&orders=-priority&ts=${Date.now()}`;

  const res = await fetch(url, {
    headers: { "X-MICROCMS-API-KEY": API_KEY },
  });

  if (!res.ok) {
    console.error("[fetchTopAd] HTTP error", res.status);
    return null;
  }

  const data = await res.json();

  if (!data || !data.contents) return null;

return (
  data.contents.find((ad) => {
    const pos =
      typeof ad.position === "string"
        ? ad.position
        : (ad.position?.id || ad.position?.name || "");

    return ad.enabled === true && pos === position;
  }) || null
);
}

/**
 * 広告を <a> に反映する（サイド/ヒーロー下/グリッド 共通）
 * - 画像があればバナー化
 * - 画像がなければタイトル/説明を該当ノードに差し替え
 */
function applyBannerAdToAnchor(anchorEl, ad) {
  if (!anchorEl || !ad) return;

  // URL反映
  if (ad.url) anchorEl.href = ad.url;
  anchorEl.target = "_blank";
  anchorEl.rel = "noopener";

  // 画像があるなら、枠内を画像で置換（崩れにくい）
  if (ad.image && ad.image.url) {
    anchorEl.innerHTML = `
      <img src="${ad.image.url}" alt="${ad.title || "ad"}"
           style="width:100%;height:auto;display:block;border-radius:16px;">
    `;
    return;
  }

  // 画像なし：テキスト差し替え（サイドは .ad-title/.ad-desc、ヒーロー下は .between-ad-text 等）
  const titleNode =
    anchorEl.querySelector(".ad-title") ||
    anchorEl.querySelector(".between-ad-tag") ||
    anchorEl.querySelector(".ad-tag");

  const descNode =
    anchorEl.querySelector(".ad-desc") ||
    anchorEl.querySelector(".between-ad-text");

  if (titleNode && ad.title) titleNode.textContent = ad.title;
  if (descNode && ad.description) descNode.textContent = ad.description;

  // descriptionが無い場合の保険
  if (descNode && !ad.description && ad.title) descNode.textContent = ad.title;
}  // ← これは if じゃなくて applyBannerAdToAnchor の終わり

// ✅ ここから次の処理に入る
/**
 * ads を読み込んで、各スロットに反映
 */
async function loadAds() {

  const heroBottom = document.querySelector('[data-slot-id="HERO_BOTTOM_1"]');
  const leftAnchor = document.querySelector('[data-slot-id="SIDE_LEFT_1"]');
  const rightAnchor = document.querySelector('[data-slot-id="SIDE_RIGHT_1"]');

  // ヒーロー直下
  const adHero = await fetchTopAd("home_hero_under");
  if (adHero) {
    applyBannerAdToAnchor(heroBottom, adHero);
    window.__ADS__["home_hero_under"] = adHero;
  }

  // 左右サイド
  const adLeft = await fetchTopAd("home_side_left");
  if (adLeft) {
    applyBannerAdToAnchor(leftAnchor, adLeft);
    window.__ADS__["home_side_left"] = adLeft;
  }

  const adRight = await fetchTopAd("home_side_right");
  if (adRight) {
    applyBannerAdToAnchor(rightAnchor, adRight);
    window.__ADS__["home_side_right"] = adRight;
  }

  // 最新記事グリッド差し込み用
  const adGrid = await fetchTopAd("home_grid_sponsor");
  if (adGrid) {
    window.__ADS__["home_grid_sponsor"] = adGrid;
  }
}

/**
 * microCMS の1件分を、フロント用の形にマッピング
 */
function mapCmsArticle(item) {
  const rawCat = item.category;
  let category = "";

  // 配列パターン
  if (Array.isArray(rawCat)) {
    if (rawCat.length > 0 && rawCat[0]) {
      const first = rawCat[0];
      category = (first.name || first.id || first).toString().trim();
    }
  } else if (typeof rawCat === "string") {
    category = rawCat.trim();
  } else if (rawCat && typeof rawCat === "object") {
    category = (rawCat.name || rawCat.id || "").toString().trim();
  }

  if (!category) category = "音楽";

  // 本文HTML
  const rawContentHtml = item.content || "";

  // 本文プレーンテキスト（検索用）
  let bodyText = "";
  if (rawContentHtml) {
    const tmp = document.createElement("div");
    tmp.innerHTML = rawContentHtml;
    bodyText = (tmp.textContent || tmp.innerText || "").trim();
  }

  // タグ
  let tags = [];
  if (Array.isArray(item.tags)) {
    tags = item.tags
      .map((t) => (t && (t.name || t.id || t)).toString().trim())
      .filter(Boolean);
  }

  // 画像URL（フィールド名の揺れに対応）
  const imageUrl =
    item?.eyecatch?.url ||
    item?.thumbnail?.url ||
    item?.image?.url ||
    item?.heroImage?.url ||
    item?.image || // 文字列で来るケース
    "images/sample1.jpg";

  return {
    id: item.id,
    title: item.title || "",
    description: item.description || "",
    category,
    categoryName: category,
    service: item.service || "",
    date: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
    image: imageUrl,
    views: 0,

    contentHtml: rawContentHtml,
    bodyText,
    tags,

    priceSummary: item.priceSummary || "",

    author: item.author || null,
    authorName: item.author?.name || "",
    authorImage: item.author?.avatar?.url || "",
    authorId: item.author?.id || "",

    officialLinks: [
      { label: (item.officialLabel1 || "").trim(), url: (item.officialUrl1 || "").trim() },
      { label: (item.officialLabel2 || "").trim(), url: (item.officialUrl2 || "").trim() },
      { label: (item.officialLabel3 || "").trim(), url: (item.officialUrl3 || "").trim() },
      { label: (item.officialLabel4 || "").trim(), url: (item.officialUrl4 || "").trim() },
    ].filter((link) => link.url),
  };
}

// 一覧取得
async function loadArticles() {
  if (window.articles && window.articles.length > 0) {
    return window.articles;
  }

  try {
    const res = await fetch(`${ENDPOINT}?limit=100&depth=2`, {
      headers: { "X-MICROCMS-API-KEY": API_KEY },
    });

    if (!res.ok) throw new Error("HTTP error " + res.status);

    const data = await res.json();
    const contents = data.contents || [];
    window.articles = contents.map(mapCmsArticle);
  } catch (e) {
    console.error("microCMS から記事一覧の取得に失敗:", e);
    window.articles = [];
  }

  return window.articles;
}

function getArticles() {
  return window.articles || [];
}

// =====================================
// 2. DOM 変数
// =====================================
let searchInput;
let clearBtn;
let searchResultsEl;
let heroContainer;
let latestGrid;

let allSearchForm;
let allSearchInput;
let allSearchInfo;
let allArticlesList;

// =====================================
// 3. テキスト正規化
// =====================================
function normalizeText(str) {
  if (!str) return "";
  return str.toString().toLowerCase().replace(/\s+/g, "");
}

// =====================================
// 4. ヒーロー記事（最新日付）
// =====================================
function renderHero() {
  const list = getArticles();
  if (!heroContainer || list.length === 0) return;

  const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  const featured = sorted[0];

  heroContainer.innerHTML = `
    <article class="featured-card" style="background-image:url('${featured.image}')"
             onclick="location.href='article.html?id=${encodeURIComponent(featured.id)}'">
      <div class="featured-content">
        <div class="featured-meta">
          <span class="tag">${featured.service || "SUBSCOPE"}</span>
          <span>${featured.categoryName || featured.category || ""}</span>
        </div>
        <h2 class="featured-title">${featured.title}</h2>
        <p class="featured-desc">${featured.description}</p>
        <button class="btn-read">詳しく見る</button>
      </div>
    </article>
  `;
}

// =====================================
// 5. 最新記事グリッド（8 + スポンサー1）
// =====================================
function renderLatest(limit = 8) {
  if (!latestGrid) return;

  const list = getArticles();
  const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  const target = sorted.slice(0, limit);

  const ad = window.__ADS__ && window.__ADS__["home_grid_sponsor"];

  const cards = [];
  target.forEach((a, index) => {
    cards.push(`
      <article class="article-card" onclick="location.href='article.html?id=${encodeURIComponent(a.id)}'">
        <div class="card-image" style="background-image:url('${a.image}')"></div>
        <div class="card-body">
          <div class="card-service">${a.service || "SUBSCOPE"}</div>
          <h3 class="card-title">${a.title}</h3>
          <p class="card-desc">${a.description}</p>
          <div class="card-date">${(a.date || "").replace(/-/g, ".")}</div>
        </div>
      </article>
    `);

    // 3枚目のあとにスポンサー
    if (index === 2) {
      if (ad) {
        const adInner =
          ad.image && ad.image.url
            ? `
              <span class="ad-tag">スポンサー</span>
              <div style="margin-top:10px;">
                <img src="${ad.image.url}" alt="${ad.title || "ad"}"
                     style="width:100%;border-radius:16px;display:block;">
              </div>
              <div class="ad-title" style="margin-top:12px;">${ad.title || "スポンサー"}</div>
              <div class="ad-desc">Sponsored</div>
            `
            : `
              <span class="ad-tag">スポンサー</span>
              <div class="ad-title">${ad.title || "スポンサー"}</div>
              <div class="ad-desc">Sponsored</div>
            `;

        cards.push(`
          <a class="ad-card" href="${ad.url || "index.html"}" target="_blank" rel="noopener" data-slot-id="HOME_SPONSOR_1">
            ${adInner}
          </a>
        `);
      } else {
        cards.push(`
          <a class="ad-card" href="index.html" data-slot-id="HOME_SPONSOR_1">
            <span class="ad-tag">スポンサー</span>
            <div class="ad-title">サブスクならサブスコープ</div>
            <div class="ad-desc">迷ったときは、ここを見ればいい。</div>
          </a>
        `);
      }
    }
  });

  latestGrid.innerHTML = cards.join("");
}

// =====================================
// 6. 3D カルーセル（おすすめ）
// =====================================
function initCarousel3D() {
  const carousel = document.querySelector(".carousel3d");
  if (!carousel) return;

  const items = carousel.querySelectorAll(".carousel3d-item");
  const prevBtn = carousel.querySelector(".carousel3d-nav-prev");
  const nextBtn = carousel.querySelector(".carousel3d-nav-next");
  if (!items.length || !prevBtn || !nextBtn) return;

  const list = getArticles();
  if (!list.length) return;

  const total = items.length;
  let currentIndex = 0;
  const recommend = list.slice(0, total);

  items.forEach((item, i) => {
    const a = recommend[i % recommend.length];

    item.innerHTML = `
      <div class="carousel3d-card">
        <img src="${a.image}" alt="">
        <p>${a.title}</p>
      </div>
    `;

    const card = item.querySelector(".carousel3d-card");
    if (card) {
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        location.href = `article.html?id=${encodeURIComponent(a.id)}`;
      });
    }
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

  let autoTimer = null;
  function startAutoScroll() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(goNext, 4000);
  }

  startAutoScroll();
  nextBtn.addEventListener("click", () => {
    goNext();
    startAutoScroll();
  });
  prevBtn.addEventListener("click", () => {
    goPrev();
    startAutoScroll();
  });

  // スワイプ対応
  let touchStartX = 0;
  let touchEndX = 0;
  const SWIPE_THRESHOLD = 40;
  const carouselInner = carousel.querySelector(".carousel3d-inner");

  if (carouselInner) {
    carouselInner.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
      },
      { passive: true }
    );

    carouselInner.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX;
        if (diff > SWIPE_THRESHOLD) {
          goPrev();
          startAutoScroll();
        } else if (diff < -SWIPE_THRESHOLD) {
          goNext();
          startAutoScroll();
        }
      },
      { passive: true }
    );
  }

  updatePositions();
}

// =====================================
// 7. 検索ロジック（AND検索・新しい順）
// =====================================
function searchArticlesList(query) {
  const q = (query || "").trim();
  if (!q) return [];

  const tokens = q
    .split(/\s+/)
    .map(normalizeText)
    .filter(Boolean);

  const list = getArticles();
  if (!list.length || !tokens.length) return [];

  const result = list.filter((article) => {
    const joined = [
      article.title || "",
      article.description || "",
      article.service || "",
      article.categoryName || article.category || "",
      (article.tags || []).join(" "),
      article.bodyText || "",
    ].join(" ");

    const haystack = normalizeText(joined);
    return tokens.every((token) => haystack.includes(token));
  });

  result.sort((a, b) => {
    const da = a.date ? new Date(a.date) : 0;
    const db = b.date ? new Date(b.date) : 0;
    return db - da;
  });

  return result;
}

// =====================================
// 8. ヘッダー検索（候補3件 + Enterで all.html）
// =====================================
function renderHeaderSearchResults(query) {
  if (!searchResultsEl) return;

  const q = (query || "").trim();

  if (!q) {
    searchResultsEl.innerHTML = "";
    searchResultsEl.style.display = "none";
    return;
  }

  const results = searchArticlesList(q).slice(0, 3);

  if (!results.length) {
    searchResultsEl.innerHTML =
      `<p style="margin-top:8px;color:#86868B;font-size:0.9rem;">該当する記事は見つかりませんでした。</p>`;
    searchResultsEl.style.display = "block";
    return;
  }

  searchResultsEl.innerHTML = results
    .map(
      (article) => `
      <div class="search-item" onclick="location.href='article.html?id=${encodeURIComponent(article.id)}'">
        <img src="${article.image}" alt="">
        <div>
          <h3>${article.title}</h3>
          <p>${article.description}</p>
        </div>
      </div>
    `
    )
    .join("");

  searchResultsEl.style.display = "block";
}

function initSearch() {
  if (!searchInput) return;

  // searchResultsEl がなかったら body の最後に作る
  if (!searchResultsEl) {
    const container = document.createElement("div");
    container.className = "search-results-container";
    container.innerHTML = `<div id="searchResults"></div>`;
    document.body.appendChild(container);
    searchResultsEl = container.querySelector("#searchResults");
  }

  searchInput.addEventListener("input", (e) => {
    renderHeaderSearchResults(e.target.value);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const keyword = searchInput.value.trim();
      if (!keyword) {
        renderHeaderSearchResults("");
        return;
      }
      window.location.href = `all.html?search=${encodeURIComponent(keyword)}`;
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      if (searchResultsEl) {
        searchResultsEl.innerHTML = "";
        searchResultsEl.style.display = "none";
      }
      searchInput.focus();
    });
  }
}

// =====================================
// 9. 「すべての記事」ページ専用 検索
// =====================================
function renderAllPageArticles(articles, keyword) {
  if (!allArticlesList) return;

  if (!articles || articles.length === 0) {
    allArticlesList.innerHTML = `
      <p class="all-empty">
        「${keyword || ""}」に該当する記事はありませんでした。<br>
        キーワードを変えるか、ジャンルから探してみてください。
      </p>
    `;
    return;
  }

  allArticlesList.innerHTML = articles
    .map(
      (a) => `
      <article class="all-article-card">
        <a href="article.html?id=${encodeURIComponent(a.id)}">
          <div class="all-article-thumb">
            <img src="${a.image}" alt="${a.title}">
          </div>
          <div class="all-article-body">
            <div class="all-article-meta">
              <span class="all-article-service">${a.service || "SUBSCOPE"}</span>
              <span class="all-article-category">${a.categoryName || a.category || ""}</span>
            </div>
            <h2 class="all-article-title">${a.title}</h2>
            <p class="all-article-desc">${a.description || ""}</p>
            <p class="all-article-date">${(a.date || "").replace(/-/g, ".")}</p>
          </div>
        </a>
      </article>
    `
    )
    .join("");
}

function initAllPageSearch() {
  allSearchForm = document.getElementById("allSearchForm");
  allSearchInput = document.getElementById("allSearchInput");
  allSearchInfo = document.getElementById("allSearchInfo");
  allArticlesList = document.getElementById("allArticlesList");

  if (!allSearchForm || !allSearchInput || !allArticlesList) return;

  function runSearch(keyword) {
    const q = (keyword || "").trim();
    if (!q) {
      if (allSearchInfo) allSearchInfo.textContent = "";
      return;
    }

    const results = searchArticlesList(q);
    renderAllPageArticles(results, q);

    if (allSearchInfo) {
      allSearchInfo.textContent = `「${q}」の検索結果：${results.length}件`;
    }

    const newUrl = `${location.pathname}?search=${encodeURIComponent(q)}`;
    window.history.replaceState(null, "", newUrl);
  }

  const params = new URLSearchParams(window.location.search);
  const initialKeyword = params.get("search") || "";
  if (initialKeyword) {
    allSearchInput.value = initialKeyword;
    runSearch(initialKeyword);
  }

  allSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    runSearch(allSearchInput.value);
  });
}

// =====================================
// 10. Menu / スクロールリビール
// =====================================
function toggleMenu() {
  const overlay = document.getElementById("nav-overlay");
  if (!overlay) return;
  overlay.classList.toggle("open");
}
window.toggleMenu = toggleMenu;

function smoothScroll(targetSelector) {
  const el = document.querySelector(targetSelector);
  if (!el) return;
  const rectTop = el.getBoundingClientRect().top + window.scrollY;
  const offset = 80;
  window.scrollTo({ top: rectTop - offset, behavior: "smooth" });
}
window.smoothScroll = smoothScroll;

function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
}

// =====================================
// 11. 起動
// =====================================
document.addEventListener("DOMContentLoaded", async () => {
  searchInput = document.getElementById("searchInput");
  clearBtn = document.getElementById("clear-btn");
  searchResultsEl = document.getElementById("searchResults");

  heroContainer = document.getElementById("most-viewed-content");
  latestGrid = document.getElementById("latest-grid");

  await loadArticles();
  await loadAds();

  renderHero();
  renderLatest(8);
  initCarousel3D();
  initSearch();
  initAllPageSearch();
  initScrollReveal();
});




