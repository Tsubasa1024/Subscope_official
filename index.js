/* =========================================
   SUBSCOPE | index.js（共通ロジック集約版）
   - microCMS: articles / ads
   - 共通UI: menu, header search, reveal
   - ページ別: home / all / ranking
   - GA4: ranking click/period tracking
   ========================================= */

(() => {
  // ============
  // 0. Config
  // ============
  const SERVICE_ID = "subscope";
  const API_KEY = "cxfk9DoKLiD4YR3zIRDDk4iZyzNtBtaFEqzz";

  // ✅ article.html から参照できるようにグローバル公開
  window.SERVICE_ID = SERVICE_ID;
  window.API_KEY = API_KEY;

  const ENDPOINT = `https://${SERVICE_ID}.microcms.io/api/v1/articles`;
  const ADS_ENDPOINT = `https://${SERVICE_ID}.microcms.io/api/v1/ads`;

  // ✅ ここで広告ON/OFF
  const ADS_ENABLED = false;

  window.articles = window.articles || [];
  window.__ADS__ = window.__ADS__ || {};

  // ============
  // 1. Utils
  // ============
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function normalizeText(str) {
    if (!str) return "";
    return str.toString().toLowerCase().replace(/\s+/g, "");
  }

  function escapeHtml(s = "") {
    return s.toString().replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));
  }

  async function fetchJson(url) {
    const res = await fetch(url, { headers: { "X-MICROCMS-API-KEY": API_KEY } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
function hideLoader() {
  const el = document.getElementById("loader");
  if (!el) return;

  el.classList.add("is-hide");
  el.addEventListener("transitionend", () => el.remove(), { once: true });
  setTimeout(() => el.remove(), 600);
}

  // ============
  // 2. Ads
  // ============
  async function fetchTopAd(position) {
    if (!ADS_ENABLED) return null;

    const url = `${ADS_ENDPOINT}?limit=50&orders=-priority&ts=${Date.now()}`;
    try {
      const data = await fetchJson(url);
      const list = data?.contents || [];
      return (
        list.find((ad) => {
          const pos =
            typeof ad.position === "string"
              ? ad.position
              : (ad.position?.id || ad.position?.name || "");
          return ad.enabled === true && pos === position;
        }) || null
      );
    } catch (e) {
      console.error("[fetchTopAd] failed:", e);
      return null;
    }
  }

  function applyBannerAdToAnchor(anchorEl, ad) {
    if (!anchorEl || !ad) return;

    if (ad.url) anchorEl.href = ad.url;
    anchorEl.target = "_blank";
    anchorEl.rel = "noopener";

    if (ad.image && ad.image.url) {
      anchorEl.innerHTML = `
        <img src="${ad.image.url}" alt="${escapeHtml(ad.title || "ad")}"
          style="width:100%;height:auto;display:block;border-radius:16px;">
      `;
      return;
    }

    const titleNode =
      anchorEl.querySelector(".ad-title") ||
      anchorEl.querySelector(".between-ad-tag") ||
      anchorEl.querySelector(".ad-tag");

    const descNode =
      anchorEl.querySelector(".ad-desc") ||
      anchorEl.querySelector(".between-ad-text");

    if (titleNode && ad.title) titleNode.textContent = ad.title;
    if (descNode && ad.description) descNode.textContent = ad.description;
    if (descNode && !ad.description && ad.title) descNode.textContent = ad.title;
  }

  async function loadAds() {
    if (!ADS_ENABLED) return;

    const heroBottom = $('[data-slot-id="HERO_BOTTOM_1"]');
    const leftAnchor = $('[data-slot-id="SIDE_LEFT_1"]');
    const rightAnchor = $('[data-slot-id="SIDE_RIGHT_1"]');

    const adHero = await fetchTopAd("home_hero_under");
    if (adHero) {
      applyBannerAdToAnchor(heroBottom, adHero);
      window.__ADS__["home_hero_under"] = adHero;
    }

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

    const adGrid = await fetchTopAd("home_grid_sponsor");
    if (adGrid) window.__ADS__["home_grid_sponsor"] = adGrid;
  }

  // ============
  // 3. Articles
  // ============
  function mapCmsArticle(item) {
    const rawCat = item.category;
    let category = "";

    if (Array.isArray(rawCat)) {
      if (rawCat[0]) {
        const first = rawCat[0];
        category = (first.name || first.id || first).toString().trim();
      }
    } else if (typeof rawCat === "string") {
      category = rawCat.trim();
    } else if (rawCat && typeof rawCat === "object") {
      category = (rawCat.name || rawCat.id || "").toString().trim();
    }
    if (!category) category = "音楽";

    const rawContentHtml = item.content || "";
    let bodyText = "";
    if (rawContentHtml) {
      const tmp = document.createElement("div");
      tmp.innerHTML = rawContentHtml;
      bodyText = (tmp.textContent || tmp.innerText || "").trim();
    }

    let tags = [];
    if (Array.isArray(item.tags)) {
      tags = item.tags
        .map((t) => (t && (t.name || t.id || t)).toString().trim())
        .filter(Boolean);
    }

    const imageUrl =
      item?.eyecatch?.url ||
      item?.thumbnail?.url ||
      item?.image?.url ||
      item?.heroImage?.url ||
      (typeof item?.image === "string" ? item.image : "") ||
      "https://placehold.co/800x500?text=SUBSCOPE";

    return {
      id: item.id,
      title: item.title || "",
      description: item.description || "",
      category,
      categoryName: category,
      service: item.service || "",
      date: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
      image: imageUrl,

      // ranking用：なければ 0
      views: item.views ?? 0,
      views_day: item.views_day ?? undefined,
      views_week: item.views_week ?? undefined,
      views_month: item.views_month ?? undefined,

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

  async function loadArticles() {
    if (window.articles && window.articles.length > 0) return window.articles;

    try {
      const data = await fetchJson(`${ENDPOINT}?limit=100&depth=2&ts=${Date.now()}`);
      const contents = data?.contents || [];
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

  // ============
  // 4. Search（共通）
  // ============
  function searchArticlesList(query) {
    const q = (query || "").trim();
    if (!q) return [];

    const tokens = q.split(/\s+/).map(normalizeText).filter(Boolean);
    const list = getArticles();
    if (!list.length || !tokens.length) return [];

    const result = list.filter((a) => {
      const joined = [
        a.title || "",
        a.description || "",
        a.service || "",
        a.categoryName || a.category || "",
        (a.tags || []).join(" "),
        a.bodyText || "",
      ].join(" ");
      const haystack = normalizeText(joined);
      return tokens.every((t) => haystack.includes(t));
    });

    result.sort((a, b) => (b.date ? new Date(b.date) : 0) - (a.date ? new Date(a.date) : 0));
    return result;
  }

  function renderHeaderSearchResults(query) {
    const resultsEl = $("#searchResults");
    if (!resultsEl) return;

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

    resultsEl.innerHTML = results
      .map(
        (a) => `
        <div class="search-item" onclick="location.href='article.html?id=${encodeURIComponent(a.id)}'">
          <img src="${a.image}" alt="">
          <div>
            <h3>${escapeHtml(a.title)}</h3>
            <p>${escapeHtml(a.description)}</p>
          </div>
        </div>
      `
      )
      .join("");

    resultsEl.style.display = "block";
  }

  function initHeaderSearch() {
    const searchInput = $("#searchInput");
    const clearBtn = $("#clearBtn") || $("#clear-btn");
    const fixedHeader = $(".fixed-header");
    const searchWrapper = $(".search-wrapper");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => renderHeaderSearchResults(e.target.value));
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const keyword = searchInput.value.trim();
          if (!keyword) return renderHeaderSearchResults("");
          location.href = `all.html?search=${encodeURIComponent(keyword)}`;
        }
      });
    }

    // ×
    if (searchInput && clearBtn) {
      const update = () => {
        clearBtn.style.display = searchInput.value.trim() ? "block" : "none";
      };
      searchInput.addEventListener("input", update);
      clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        renderHeaderSearchResults("");
        update();
        searchInput.focus();
      });
      update();
    }

    // スマホ：検索ボタンの開閉
    if (fixedHeader && searchWrapper && searchInput) {
      let isOpen = false;
      const isMobile = () => window.innerWidth <= 767;

      searchWrapper.addEventListener("click", (e) => {
        if (!isMobile()) {
          if (e.target !== searchInput) searchInput.focus();
          return;
        }

        if (isOpen && e.target === searchInput) return;

        if (!isOpen) {
          fixedHeader.classList.add("search-open");
          isOpen = true;
          setTimeout(() => searchInput.focus(), 80);
        } else {
          fixedHeader.classList.remove("search-open");
          isOpen = false;
          searchInput.blur();
        }
      });

      window.addEventListener("resize", () => {
        if (!isMobile() && isOpen) {
          fixedHeader.classList.remove("search-open");
          isOpen = false;
          searchInput.blur();
        }
      });
    }
  }

  // ============
  // 5. Menu / Reveal
  // ============
  function toggleMenu(force) {
    const overlay = $("#nav-overlay");
    if (!overlay) return;
    if (typeof force === "boolean") overlay.classList.toggle("open", force);
    else overlay.classList.toggle("open");
  }
  window.toggleMenu = toggleMenu;

  function initMenuOpen() {
    const btn = document.querySelector("#menuBtn") || document.querySelector(".menu-btn");
    const overlay = document.querySelector("#nav-overlay");
    if (!btn || !overlay) return;

    const onClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    };

    // 二重登録防止
    if (!btn.dataset.menuBound) {
      btn.addEventListener("click", onClick);
      btn.addEventListener("touchstart", onClick, { passive: false });
      btn.dataset.menuBound = "true";
    }
  }

  function initMenuCloseBehaviors() {
    const overlay = $("#nav-overlay");
    if (!overlay) return;

    document.addEventListener("click", (e) => {
      const btn = e.target.closest?.(".menu-btn");
      const inside = e.target.closest?.("#nav-overlay");
      if (btn || inside) return;
      if (overlay.classList.contains("open")) toggleMenu(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) toggleMenu(false);
    });
  }

  function initScrollReveal() {
    const targets = $$(".reveal");
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("active");
            observer.unobserve(en.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((el) => observer.observe(el));
  }

  // ============
  // 6. Home（index.html）
  // ============
  function renderHero() {
    const heroContainer = document.querySelector("#heroMount");
    const list = getArticles();
    if (!heroContainer || !list.length) return;

    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    const featured = sorted[0];

    heroContainer.innerHTML = `
      <article class="featured-card"
        onclick="location.href='article.html?id=${encodeURIComponent(featured.id)}'">
        <img class="featured-media" src="${featured.image}" alt="">
        <div class="featured-content">
          <div class="featured-meta">
            <span class="tag">${escapeHtml(featured.service || "SUBSCOPE")}</span>
            <span>${escapeHtml(featured.categoryName || featured.category || "")}</span>
          </div>
          <h2 class="featured-title">${escapeHtml(featured.title)}</h2>
          <p class="featured-desc">${escapeHtml(featured.description)}</p>
        </div>
      </article>
    `;
  }

  function renderLatest(limit = 8) {
    const latestGrid = $("#latest-grid");
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
            <div class="card-service">${escapeHtml(a.service || "SUBSCOPE")}</div>
            <h3 class="card-title">${escapeHtml(a.title)}</h3>
            <p class="card-desc">${escapeHtml(a.description)}</p>
            <div class="card-date">${escapeHtml((a.date || "").replace(/-/g, "."))}</div>
          </div>
        </article>
      `);

      // 3枚目のあとにスポンサー（広告ON時のみ）
      if (index === 2 && ADS_ENABLED) {
        if (ad) {
          const adInner =
            ad.image?.url
              ? `
                <span class="ad-tag">スポンサー</span>
                <div style="margin-top:10px;">
                  <img src="${ad.image.url}" alt="${escapeHtml(ad.title || "ad")}"
                    style="width:100%;border-radius:16px;display:block;">
                </div>
                <div class="ad-title" style="margin-top:12px;">${escapeHtml(ad.title || "スポンサー")}</div>
                <div class="ad-desc">Sponsored</div>
              `
              : `
                <span class="ad-tag">スポンサー</span>
                <div class="ad-title">${escapeHtml(ad.title || "スポンサー")}</div>
                <div class="ad-desc">Sponsored</div>
              `;

          cards.push(`
            <a class="ad-card" href="${ad.url || "index.html"}" target="_blank" rel="noopener" data-slot-id="HOME_SPONSOR_1">
              ${adInner}
            </a>
          `);
        }
      }
    });

    latestGrid.innerHTML = cards.join("");
  }

  function initCarousel3D() {
    const carousel = $(".carousel3d");
    if (!carousel) return;

    const items = $$(".carousel3d-item", carousel);
    const prevBtn = $(".carousel3d-nav-prev", carousel);
    const nextBtn = $(".carousel3d-nav-next", carousel);
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
          <p>${escapeHtml(a.title)}</p>
        </div>
      `;
      const card = $(".carousel3d-card", item);
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
    nextBtn.addEventListener("click", () => { goNext(); startAutoScroll(); });
    prevBtn.addEventListener("click", () => { goPrev(); startAutoScroll(); });

    // swipe
    let touchStartX = 0;
    let touchEndX = 0;
    const SWIPE_THRESHOLD = 40;
    const inner = $(".carousel3d-inner", carousel);

    if (inner) {
      inner.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
      inner.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX;
        if (diff > SWIPE_THRESHOLD) { goPrev(); startAutoScroll(); }
        else if (diff < -SWIPE_THRESHOLD) { goNext(); startAutoScroll(); }
      }, { passive: true });
    }

    updatePositions();
  }

  // ============
  // 7. all.html（すべての記事）
  // ============
  function initAllPage() {
    const tabsEl = $("#tabs");
    const gridEl = $("#all-grid");
    if (!tabsEl || !gridEl) return;

    const all = getArticles();

    const allSearchForm = $("#allSearchForm");
    const allSearchInput = $("#allSearchInput");
    const allSearchInfo = $("#allSearchInfo");
    const allClearBtn = $("#allClearBtn");

    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab") || "すべて";
    const searchParam = params.get("search") || "";

    const categories = [
      "すべて",
      "音楽",
      "映像",
      "学習・資格",
      "健康・フィットネス",
      "ゲーム・エンタメ",
      "生活・ライフスタイル",
      "AI・ツール",
      "その他",
    ];

    function renderList(list) {
      if (!list.length) {
        gridEl.innerHTML = `<div class="empty-message">該当する記事はありません。</div>`;
        return;
      }

      gridEl.innerHTML = list
        .map(
          (a) => `
          <div class="article-card" onclick="openArticle('${a.id}')">
            <div class="card-image" style="background-image:url('${a.image}');"></div>
            <div class="card-body">
              <div class="card-service">${escapeHtml(a.service || "SUBSCOPE")}</div>
              <h3 class="card-title">${escapeHtml(a.title || "")}</h3>
              <p class="card-desc">${escapeHtml(a.description || "")}</p>
              <div class="card-date">${escapeHtml((a.date || "").replace(/-/g, "."))}</div>
            </div>
          </div>
        `
        )
        .join("");
    }

    function filterByCategory(cat) {
      if (cat === "すべて") return all;
      return all.filter((a) => (a.categoryName || a.category) === cat);
    }

    function updateAllClearBtn() {
      if (!allClearBtn || !allSearchInput) return;
      allClearBtn.style.display = allSearchInput.value.trim() ? "flex" : "none";
    }

    tabsEl.innerHTML = categories
      .map(
        (c) => `
        <button class="tab ${c === tabParam && !searchParam ? "active" : ""}" data-category-tab="${c}">
          ${escapeHtml(c)}
        </button>
      `
      )
      .join("");

    const tabButtons = $$(".tab", tabsEl);

    // 初期表示
    if (searchParam) {
      if (allSearchInput) allSearchInput.value = searchParam;
      const results = searchArticlesList(searchParam);
      renderList(results);
      if (allSearchInfo) allSearchInfo.textContent = `「${searchParam}」の検索結果：${results.length}件`;
    } else {
      renderList(filterByCategory(tabParam));
      if (allSearchInfo) allSearchInfo.textContent = "";
    }

    updateAllClearBtn();

    // タブ切替（search解除）
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-category-tab");

        const newParams = new URLSearchParams(location.search);
        newParams.set("tab", cat);
        newParams.delete("search");
        history.replaceState(null, "", "all.html?" + newParams.toString());

        tabButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        if (allSearchInput) allSearchInput.value = "";
        if (allSearchInfo) allSearchInfo.textContent = "";

        renderList(filterByCategory(cat));
        updateAllClearBtn();
      });
    });

    if (allSearchInput) {
      allSearchInput.addEventListener("input", updateAllClearBtn);
    }

    if (allSearchForm && allSearchInput) {
      allSearchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const keyword = allSearchInput.value.trim();

        const newParams = new URLSearchParams(location.search);
        if (keyword) {
          newParams.set("search", keyword);
          newParams.set("tab", "すべて");
        } else {
          newParams.delete("search");
          newParams.set("tab", "すべて");
        }
        history.replaceState(null, "", "all.html?" + newParams.toString());

        tabButtons.forEach((b) =>
          b.classList.toggle("active", b.getAttribute("data-category-tab") === "すべて")
        );

        const results = keyword ? searchArticlesList(keyword) : filterByCategory("すべて");
        renderList(results);

        if (allSearchInfo) {
          allSearchInfo.textContent = keyword ? `「${keyword}」の検索結果：${results.length}件` : "";
        }

        updateAllClearBtn();
      });
    }

    if (allClearBtn && allSearchInput) {
      allClearBtn.addEventListener("click", () => {
        allSearchInput.value = "";
        updateAllClearBtn();

        const newParams = new URLSearchParams(location.search);
        newParams.delete("search");
        newParams.set("tab", "すべて");
        history.replaceState(null, "", "all.html?" + newParams.toString());

        tabButtons.forEach((b) =>
          b.classList.toggle("active", b.getAttribute("data-category-tab") === "すべて")
        );

        renderList(filterByCategory("すべて"));
        if (allSearchInfo) allSearchInfo.textContent = "";
      });
    }
  }

// ============
// 8. ranking.html（Cloud Run / GA4 API）
// ============
function initRankingPage() {
  const top3El = $("#ranking-top3");
  const restEl = $("#ranking-rest");
  const periodBtns = $$(".period-btn");
  if (!top3El || !restEl || !periodBtns.length) return;

  // ✅ Cloud Run の固定URL（おすすめの方）
  const RANK_API = "https://subscope-ranking-319660105312.asia-northeast1.run.app";

  // period -> days
  const DAYS_MAP = { day: 1, week: 7, month: 30, all: 365 };

  const DEFAULT_THUMB = "https://www.subscope.jp/ogp-default-v3.png";
  let currentPeriod = "all";

  function periodLabel(p) {
    if (p === "day") return "DAY";
    if (p === "week") return "WEEK";
    if (p === "month") return "MONTH";
    return "ALL";
  }

  // ✅ GA: クリック/期間イベント（1回だけ）
  function bindRankingGAOnce() {
    if (document.body.dataset.rankGaBound) return;
    document.body.dataset.rankGaBound = "1";

    // ランキングアイテムクリック
    document.addEventListener("click", (e) => {
      const card = e.target.closest?.("[data-rank-item]") || e.target.closest?.(".ranking-row");
      if (!card) return;

      const key = card.dataset.key || "";          // 例: "xxxxx"（記事ID）
      const title = card.dataset.title || "";
      const rank = Number(card.dataset.rank || 0);
      const period = currentPeriod || "all";
      const views = Number(card.dataset.views || 0);

      window.gtag?.("event", "rank_item_click", {
        item_key: key,
        item_name: title,
        rank,
        period,
        views,
      });
    });

    // 期間切替
    periodBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        window.gtag?.("event", "rank_period_change", {
          period: btn.dataset.period || "all",
        });
      });
    });
  }

  // ✅ rows: [{ key: "microcmsArticleId", views: number, article: {...} }]
  function render(rows = []) {
    const items = rows.slice(0, 20); // 上位20
    top3El.innerHTML = "";
    restEl.innerHTML = "";

    const hero = items[0];
    const mids = items.slice(1, 3);
    const rest = items.slice(3);

    const makeTitle = (item) => item?.article?.title || item?.key || "";
    const makeDesc  = (item) => item?.article?.description || "";
    const makeThumb = (item) => item?.article?.image || DEFAULT_THUMB;
    const makeLink  = (item) => `article.html?id=${encodeURIComponent(item.key)}`;
     const makeService = (item) => item?.article?.service || item?.article?.serviceName || "";
const makeCategory = (item) => item?.article?.categoryName || item?.article?.category || "";
const makeLabel = (item) => {
  const s = (makeService(item) || "").trim();
  const c = (makeCategory(item) || "").trim();
  return [s, c].filter(Boolean).join(" / ") || "その他";
};


    // 1位
    if (hero) {
      const title = makeTitle(hero);
      top3El.innerHTML += `
        <a class="rank-hero"
          href="${makeLink(hero)}"
          data-rank-item="1"
          data-key="${hero.key}"
          data-title="${escapeHtml(title)}"
          data-rank="1"
          data-views="${hero.views}">
          <div class="rank-badge rank-1 rank-badge-large">1</div>
          <div class="rank-hero-thumb" style="background-image:url('${makeThumb(hero)}');"></div>
          <div class="rank-hero-content">
            <div class="ranking-service">${escapeHtml(makeLabel(hero))}</div>
            <div class="rank-hero-title">${escapeHtml(title)}</div>
            <div class="rank-hero-desc">${escapeHtml(makeDesc(hero))}</div>
            <div class="rank-hero-meta"><span>Views: ${hero.views}</span></div>
          </div>
        </a>
      `;
    }

    // 2-3位
    mids.forEach((item, idx) => {
      const rank = idx + 2;
      const title = makeTitle(item);
      top3El.innerHTML += `
        <a class="rank-mid"
          href="${makeLink(item)}"
          data-rank-item="1"
          data-key="${item.key}"
          data-title="${escapeHtml(title)}"
          data-rank="${rank}"
          data-views="${item.views}">
          <div class="rank-badge rank-${rank} rank-badge-medium">${rank}</div>
          <div class="rank-mid-thumb" style="background-image:url('${makeThumb(item)}');"></div>
          <div class="ranking-content">
            <div class="ranking-service">${escapeHtml(makeLabel(item))}</div>
            <div class="rank-mid-title">${escapeHtml(title)}</div>
            <div class="rank-mid-desc">${escapeHtml(makeDesc(item))}</div>
            <div class="rank-mid-meta"><span>Views: ${item.views}</span></div>
          </div>
        </a>
      `;
    });

    // 4位以降
    rest.forEach((item, idx) => {
      const rank = idx + 4;
      const title = makeTitle(item);

      const row = document.createElement("a");
      row.className = "ranking-row";
      row.href = makeLink(item);

      row.dataset.rankItem = "1";
      row.dataset.key = item.key;              // ✅ 記事ID
      row.dataset.title = title;
      row.dataset.rank = String(rank);
      row.dataset.views = String(item.views);

      row.innerHTML = `
        <div class="ranking-row-rank">${rank}</div>
        <div class="ranking-row-thumb" style="background-image:url('${makeThumb(item)}');"></div>
        <div class="ranking-row-main">
          <div class="ranking-row-title">${escapeHtml(title)}</div>
          <div class="ranking-row-meta">
  <span class="ranking-row-service">${escapeHtml(makeService(item) || "")}</span>
  <span>${escapeHtml(makeCategory(item) || "")}</span>
  <span>Views: ${item.views}</span>
          </div>
        </div>
      `;
      restEl.appendChild(row);
    });

    // アニメ付け直し
    [top3El, restEl].forEach((el) => {
      el.classList.remove("ranking-animate");
      void el.offsetWidth;
      el.classList.add("ranking-animate");
    });
  }

  async function load(period) {
    currentPeriod = period || "all";
    const days = DAYS_MAP[currentPeriod] ?? 7;

    // ✅ ここが本命：記事IDで取る
    const url = `${RANK_API}/?days=${days}&limit=50&mode=article_id`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!data.ok) {
        top3El.innerHTML = `<div style="padding:16px;color:#666;">ランキング取得失敗: ${escapeHtml(data.message || "unknown")}</div>`;
        restEl.innerHTML = "";
        return;
      }

      // ✅ GA側 rows(key=記事ID) を microCMS記事と合体
      const list = window.articles || [];
      const merged = (data.rows || [])
        .map((r) => {
          const a = list.find((x) => x.id === r.key);
          if (!a) return null; // microCMSに存在しないIDは除外
          return { ...r, article: a };
        })
        .filter(Boolean)
        .slice(0, 20); // 表示は上位20に絞る

      if (!merged.length) {
        top3El.innerHTML = `<div style="padding:16px;color:#666;">記事ランキングのデータがまだありません（article_view送信後に反映されます）</div>`;
        restEl.innerHTML = "";
        return;
      }

      render(merged);
    } catch (e) {
      console.error("[ranking] fetch failed:", e);
      top3El.innerHTML = `<div style="padding:16px;color:#666;">ランキング取得に失敗しました</div>`;
      restEl.innerHTML = "";
    }
  }

  // period切替
  periodBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      periodBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      load(btn.dataset.period || "all");
    });
  });

  bindRankingGAOnce();

  // 初回（activeから）
  const active = document.querySelector(".period-btn.active")?.dataset?.period || "all";
  load(active);
}


  // ============
  // 9. Global helpers
  // ============
  window.loadArticles = loadArticles;
  window.getArticles = getArticles;
  window.searchArticlesList = searchArticlesList;

  window.openArticle = (id) => {
    location.href = "article.html?id=" + encodeURIComponent(id);
  };

  // ============
  // 10. Boot
  // ============
  document.addEventListener("DOMContentLoaded", async () => {
    initMenuCloseBehaviors();
    initMenuOpen();
    initHeaderSearch();

    await loadArticles();
    await loadAds();

     hideLoader();
     
function hideLoader() {
  const el = document.getElementById("loader");
  if (!el) return;

  el.classList.add("is-hide"); // CSSでフェードアウト
  el.addEventListener("transitionend", () => el.remove(), { once: true });

  // transitionend が来ない保険
  setTimeout(() => el.remove(), 600);
}

    const page = document.body?.dataset?.page || "";

    if (page === "home") {
      renderHero();
      renderLatest(9);
      initCarousel3D();
    }
    if (page === "all") initAllPage();
    if (page === "ranking" && !window.__USE_EXTERNAL_RANKING__) initRankingPage();

    initScrollReveal();
  });
})();




