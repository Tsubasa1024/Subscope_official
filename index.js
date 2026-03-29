/* =========================================
   SUBSCOPE | index.js
   ========================================= */

(() => {
  const SERVICE_ID = "subscope";
  const API_KEY = "cxfk9DoKLiD4YR3zIRDDk4iZyzNtBtaFEqzz";
  window.SERVICE_ID = SERVICE_ID;
  window.API_KEY = API_KEY;

  const ENDPOINT = `https://${SERVICE_ID}.microcms.io/api/v1/articles`;
  const ADS_ENDPOINT = `https://${SERVICE_ID}.microcms.io/api/v1/ads`;
  const ADS_ENABLED = false;

  window.articles = window.articles || [];
  window.__ADS__ = window.__ADS__ || {};

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function normalizeText(str) {
    if (!str) return "";
    return str.toString().toLowerCase().replace(/\s+/g, "");
  }

  function escapeHtml(s = "") {
    return s.toString().replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
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
  // Ads
  // ============
  async function fetchTopAd(position) {
    if (!ADS_ENABLED) return null;
    const url = `${ADS_ENDPOINT}?limit=50&orders=-priority&ts=${Date.now()}`;
    try {
      const data = await fetchJson(url);
      const list = data?.contents || [];
      return list.find((ad) => {
        const pos = typeof ad.position === "string" ? ad.position : (ad.position?.id || ad.position?.name || "");
        return ad.enabled === true && pos === position;
      }) || null;
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
      anchorEl.innerHTML = `<img src="${ad.image.url}" alt="${escapeHtml(ad.title || "ad")}" style="width:100%;height:auto;display:block;border-radius:16px;">`;
      return;
    }
    const titleNode = anchorEl.querySelector(".ad-title") || anchorEl.querySelector(".between-ad-tag") || anchorEl.querySelector(".ad-tag");
    const descNode = anchorEl.querySelector(".ad-desc") || anchorEl.querySelector(".between-ad-text");
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
    if (adHero) { applyBannerAdToAnchor(heroBottom, adHero); window.__ADS__["home_hero_under"] = adHero; }
    const adLeft = await fetchTopAd("home_side_left");
    if (adLeft) { applyBannerAdToAnchor(leftAnchor, adLeft); window.__ADS__["home_side_left"] = adLeft; }
    const adRight = await fetchTopAd("home_side_right");
    if (adRight) { applyBannerAdToAnchor(rightAnchor, adRight); window.__ADS__["home_side_right"] = adRight; }
    const adGrid = await fetchTopAd("home_grid_sponsor");
    if (adGrid) window.__ADS__["home_grid_sponsor"] = adGrid;
  }

  // ============
  // Articles
  // ============
  function mapCmsArticle(item) {
    const rawCat = item.category;
    let category = "";
    if (Array.isArray(rawCat)) {
      if (rawCat[0]) { const first = rawCat[0]; category = (first.name || first.id || first).toString().trim(); }
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
      tags = item.tags.map((t) => (t && (t.name || t.id || t)).toString().trim()).filter(Boolean);
    }

    const imageUrl =
      item?.eyecatch?.url || item?.thumbnail?.url || item?.image?.url || item?.heroImage?.url ||
      (typeof item?.image === "string" ? item.image : "") ||
      "https://placehold.co/800x500?text=SUBSCOPE";

    return {
      id: item.id,
      title: item.title || "",
      description: item.description || "",
      category, categoryName: category,
      service: item.service || "",
      date: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
      image: imageUrl,
      views: item.views ?? 0,
      views_day: item.views_day ?? undefined,
      views_week: item.views_week ?? undefined,
      views_month: item.views_month ?? undefined,
      contentHtml: rawContentHtml, bodyText, tags,
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
      window.articles = (data?.contents || []).map(mapCmsArticle);
    } catch (e) {
      console.error("microCMS から記事一覧の取得に失敗:", e);
      window.articles = [];
    }
    return window.articles;
  }

  function getArticles() { return window.articles || []; }

  // ============
  // Search
  // ============
  function searchArticlesList(query) {
    const q = (query || "").trim();
    if (!q) return [];
    const tokens = q.split(/\s+/).map(normalizeText).filter(Boolean);
    const list = getArticles();
    if (!list.length || !tokens.length) return [];
    const result = list.filter((a) => {
      const haystack = normalizeText([a.title, a.description, a.service, a.categoryName || a.category, (a.tags || []).join(" "), a.bodyText].join(" "));
      return tokens.every((t) => haystack.includes(t));
    });
    result.sort((a, b) => (b.date ? new Date(b.date) : 0) - (a.date ? new Date(a.date) : 0));
    return result;
  }

  function renderHeaderSearchResults(query) {
    const resultsEl = $("#searchResults");
    if (!resultsEl) return;
    const q = (query || "").trim();
    if (!q) { resultsEl.innerHTML = ""; resultsEl.style.display = "none"; return; }
    const results = searchArticlesList(q).slice(0, 3);
    if (!results.length) {
      resultsEl.innerHTML = `<p style="margin-top:8px;color:#86868B;font-size:0.9rem;">該当する記事は見つかりませんでした。</p>`;
      resultsEl.style.display = "block";
      return;
    }
    resultsEl.innerHTML = results.map((a) => `
      <div class="search-item" onclick="location.href='article.html?id=${encodeURIComponent(a.id)}'">
        <img src="${a.image}" alt="">
        <div><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.description)}</p></div>
      </div>
    `).join("");
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

    if (searchInput && clearBtn) {
      const update = () => { clearBtn.style.display = searchInput.value.trim() ? "block" : "none"; };
      searchInput.addEventListener("input", update);
      clearBtn.addEventListener("click", () => { searchInput.value = ""; renderHeaderSearchResults(""); update(); searchInput.focus(); });
      update();
    }

    if (fixedHeader && searchWrapper && searchInput) {
      let isOpen = false;
      const isMobile = () => window.innerWidth <= 767;
      searchWrapper.addEventListener("click", (e) => {
        if (!isMobile()) { if (e.target !== searchInput) searchInput.focus(); return; }
        if (isOpen && e.target === searchInput) return;
        if (!isOpen) { fixedHeader.classList.add("search-open"); isOpen = true; setTimeout(() => searchInput.focus(), 80); }
        else { fixedHeader.classList.remove("search-open"); isOpen = false; searchInput.blur(); }
      });
      window.addEventListener("resize", () => {
        if (!isMobile() && isOpen) { fixedHeader.classList.remove("search-open"); isOpen = false; searchInput.blur(); }
      });
    }
  }

  // ============
  // Menu / Reveal
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
    const onClick = (e) => { e.preventDefault(); e.stopPropagation(); toggleMenu(); };
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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("active"); observer.unobserve(en.target); } });
    }, { threshold: 0.15 });
    targets.forEach((el) => observer.observe(el));
  }

  // ============
  // Home
  // ============
  function renderHero() {
    const heroContainer = document.querySelector("#heroMount");
    const list = getArticles();
    if (!heroContainer || !list.length) return;
    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    const featured = sorted[0];
    heroContainer.innerHTML = `
      <article class="featured-card" onclick="location.href='article.html?id=${encodeURIComponent(featured.id)}'">
        <img class="featured-media" src="${featured.image}" alt="${escapeHtml(featured.title)}">
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

  function renderLatest(limit = 9) {
    const latestGrid = $("#latest-grid");
    if (!latestGrid) return;
    const list = getArticles();
    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    const target = sorted.slice(0, limit);
    const ad = window.__ADS__ && window.__ADS__["home_grid_sponsor"];
    const cards = [];

    target.forEach((a, index) => {
      const dateStr = (a.date || "").replace(/-/g, ".");
      const category = escapeHtml(a.categoryName || a.category || "");
      const title = escapeHtml(a.title);

      cards.push(`
        <article class="article-card" onclick="location.href='article.html?id=${encodeURIComponent(a.id)}'">
          <div class="card-image-wrap">
            <img src="${a.image}" alt="${title}" loading="lazy" decoding="async">
            ${category ? `<span class="card-category-tag">${category}</span>` : ""}
          </div>
          <div class="card-body">
            <div class="card-service">${escapeHtml(a.service || "SUBSCOPE")}</div>
            <h3 class="card-title">${title}</h3>
            <p class="card-desc">${escapeHtml(a.description)}</p>
          </div>
          <div class="card-footer">
            <span class="card-date">${dateStr}</span>
            <div class="card-arrow" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#1d1d1f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 6h8M6 2l4 4-4 4"/>
              </svg>
            </div>
          </div>
        </article>
      `);

      if (index === 2 && ADS_ENABLED && ad) {
        const adInner = ad.image?.url
          ? `<span class="ad-tag">スポンサー</span><div style="margin-top:10px;"><img src="${ad.image.url}" alt="${escapeHtml(ad.title || "ad")}" style="width:100%;border-radius:16px;display:block;"></div><div class="ad-title" style="margin-top:12px;">${escapeHtml(ad.title || "スポンサー")}</div><div class="ad-desc">Sponsored</div>`
          : `<span class="ad-tag">スポンサー</span><div class="ad-title">${escapeHtml(ad.title || "スポンサー")}</div><div class="ad-desc">Sponsored</div>`;
        cards.push(`<a class="ad-card" href="${ad.url || "index.html"}" target="_blank" rel="noopener" data-slot-id="HOME_SPONSOR_1">${adInner}</a>`);
      }
    });

    latestGrid.innerHTML = cards.join("");

    const cardEls = latestGrid.querySelectorAll(".article-card");
    cardEls.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      requestAnimationFrame(() => {
        setTimeout(() => {
          el.style.transition = "opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s cubic-bezier(0.22,1,0.36,1)";
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }, i * 80);
      });
    });
  }

  // ============
  // カルーセル（フラット新デザイン）
  // ============
  function initCarousel(articlesToShow = 6) {
    const track = document.getElementById("carouselTrack");
    const viewport = document.getElementById("carouselViewport");
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");
    const dotsEl = document.getElementById("carouselDots");

    if (!track || !viewport) return;

    const list = getArticles();
    if (!list.length) return;

    const items = list.slice(0, articlesToShow);

    function getVisibleCount() {
      if (window.innerWidth <= 767) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }

    let currentIndex = 0;

    // スライド生成
    track.innerHTML = items.map((a) => {
      const dateStr = (a.date || "").replace(/-/g, ".");
      const category = escapeHtml(a.categoryName || a.category || "");
      const title = escapeHtml(a.title);
      return `
        <div class="carousel-slide">
          <article class="carousel-card" onclick="location.href='article.html?id=${encodeURIComponent(a.id)}'">
            <div class="card-image-wrap">
              <img src="${a.image}" alt="${title}" loading="lazy" decoding="async">
              ${category ? `<span class="card-category-tag">${category}</span>` : ""}
            </div>
            <div class="card-body">
              <div class="card-service">${escapeHtml(a.service || "SUBSCOPE")}</div>
              <h3 class="card-title">${title}</h3>
            </div>
            <div class="card-footer">
              <span class="card-date">${dateStr}</span>
              <div class="card-arrow" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#1d1d1f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 6h8M6 2l4 4-4 4"/>
                </svg>
              </div>
            </div>
          </article>
        </div>
      `;
    }).join("");

    function getMaxIndex() {
      return Math.max(0, items.length - getVisibleCount());
    }

    // ドット生成
    function renderDots() {
      if (!dotsEl) return;
      const max = getMaxIndex();
      dotsEl.innerHTML = Array.from({ length: max + 1 }, (_, i) =>
        `<button class="carousel-dot ${i === currentIndex ? "active" : ""}" data-index="${i}" aria-label="${i + 1}枚目"></button>`
      ).join("");
    }

    function updateDots() {
      if (!dotsEl) return;
      dotsEl.querySelectorAll(".carousel-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === currentIndex);
      });
    }

    function slideTo(index) {
      const max = getMaxIndex();
      currentIndex = Math.max(0, Math.min(index, max));

      // スライド幅 + gap(20px) で移動量を計算
      const slideEl = track.children[0];
      const gap = 20;
      const slideWidth = slideEl ? slideEl.offsetWidth + gap : 0;
      track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;

      updateDots();
      if (prevBtn) prevBtn.style.opacity = currentIndex === 0 ? "0.3" : "1";
      if (nextBtn) nextBtn.style.opacity = currentIndex >= max ? "0.3" : "1";
    }

    renderDots();
    slideTo(0);

    prevBtn?.addEventListener("click", () => slideTo(currentIndex - 1));
    nextBtn?.addEventListener("click", () => slideTo(currentIndex + 1));

    dotsEl?.addEventListener("click", (e) => {
      const dot = e.target.closest(".carousel-dot");
      if (dot) slideTo(Number(dot.dataset.index));
    });

    // タッチスワイプ（感度改善版）
    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging = false;

    viewport.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isDragging = true;
    }, { passive: true });

    viewport.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (dx > dy) e.preventDefault(); // 横スワイプ時はページスクロールをブロック
    }, { passive: false });

    viewport.addEventListener("touchend", (e) => {
      if (!isDragging) return;
      isDragging = false;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 30) {
        dx < 0 ? slideTo(currentIndex + 1) : slideTo(currentIndex - 1);
      }
    }, { passive: true });

    // 自動スクロール（タッチしたら停止）
    let autoTimer = setInterval(() => {
      slideTo(currentIndex >= getMaxIndex() ? 0 : currentIndex + 1);
    }, 4000);
    viewport.addEventListener("touchstart", () => clearInterval(autoTimer), { passive: true });

    // リサイズ対応
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderDots();
        slideTo(Math.min(currentIndex, getMaxIndex()));
      }, 150);
    });
  }

  // ============
  // all.html
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

    const categories = ["すべて", "音楽", "映像", "学習・資格", "健康・フィットネス", "ゲーム・エンタメ", "生活・ライフスタイル", "AI・ツール", "その他"];

    function renderList(list) {
      if (!list.length) { gridEl.innerHTML = `<div class="empty-message">該当する記事はありません。</div>`; return; }
      gridEl.innerHTML = list.map((a) => {
        const category = escapeHtml(a.categoryName || a.category || "");
        const title = escapeHtml(a.title || "");
        return `
          <div class="article-card" onclick="openArticle('${a.id}')">
            <div class="card-image-wrap">
              <img src="${a.image}" alt="${title}" loading="lazy" decoding="async">
              ${category ? `<span class="card-category-tag">${category}</span>` : ""}
            </div>
            <div class="card-body">
              <div class="card-service">${escapeHtml(a.service || "SUBSCOPE")}</div>
              <h3 class="card-title">${title}</h3>
              <p class="card-desc">${escapeHtml(a.description || "")}</p>
            </div>
            <div class="card-footer">
              <span class="card-date">${escapeHtml((a.date || "").replace(/-/g, "."))}</span>
              <div class="card-arrow" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#1d1d1f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 6h8M6 2l4 4-4 4"/>
                </svg>
              </div>
            </div>
          </div>
        `;
      }).join("");

      const cardEls = gridEl.querySelectorAll(".article-card");
      cardEls.forEach((el, i) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        requestAnimationFrame(() => {
          setTimeout(() => {
            el.style.transition = "opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)";
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }, i * 60);
        });
      });
    }

    function filterByCategory(cat) {
      if (cat === "すべて") return all;
      return all.filter((a) => (a.categoryName || a.category) === cat);
    }

    function updateAllClearBtn() {
      if (!allClearBtn || !allSearchInput) return;
      allClearBtn.style.display = allSearchInput.value.trim() ? "flex" : "none";
    }

    tabsEl.innerHTML = categories.map((c) =>
      `<button class="tab ${c === tabParam && !searchParam ? "active" : ""}" data-category-tab="${c}">${escapeHtml(c)}</button>`
    ).join("");

    const tabButtons = $$(".tab", tabsEl);

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

    if (allSearchInput) allSearchInput.addEventListener("input", updateAllClearBtn);

    if (allSearchForm && allSearchInput) {
      allSearchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const keyword = allSearchInput.value.trim();
        const newParams = new URLSearchParams(location.search);
        if (keyword) { newParams.set("search", keyword); newParams.set("tab", "すべて"); }
        else { newParams.delete("search"); newParams.set("tab", "すべて"); }
        history.replaceState(null, "", "all.html?" + newParams.toString());
        tabButtons.forEach((b) => b.classList.toggle("active", b.getAttribute("data-category-tab") === "すべて"));
        const results = keyword ? searchArticlesList(keyword) : filterByCategory("すべて");
        renderList(results);
        if (allSearchInfo) allSearchInfo.textContent = keyword ? `「${keyword}」の検索結果：${results.length}件` : "";
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
        tabButtons.forEach((b) => b.classList.toggle("active", b.getAttribute("data-category-tab") === "すべて"));
        renderList(filterByCategory("すべて"));
        if (allSearchInfo) allSearchInfo.textContent = "";
      });
    }
  }

  // ============
  // ranking.html
  // ============
  function initRankingPage() {
    const top3El = $("#ranking-top3");
    const restEl = $("#ranking-rest");
    const periodBtns = $$(".period-btn");
    if (!top3El || !restEl || !periodBtns.length) return;

    const RANK_API = "https://subscope-ranking-319660105312.asia-northeast1.run.app";
    const DAYS_MAP = { day: 1, week: 7, month: 30, all: 365 };
    const DEFAULT_THUMB = "https://www.subscope.jp/ogp-default-v3.png";
    let currentPeriod = "all";

    function bindRankingGAOnce() {
      if (document.body.dataset.rankGaBound) return;
      document.body.dataset.rankGaBound = "1";
      document.addEventListener("click", (e) => {
        const card = e.target.closest?.("[data-rank-item]") || e.target.closest?.(".ranking-row");
        if (!card) return;
        window.gtag?.("event", "rank_item_click", { item_key: card.dataset.key || "", item_name: card.dataset.title || "", rank: Number(card.dataset.rank || 0), period: currentPeriod || "all", views: Number(card.dataset.views || 0) });
      });
      periodBtns.forEach((btn) => {
        btn.addEventListener("click", () => { window.gtag?.("event", "rank_period_change", { period: btn.dataset.period || "all" }); });
      });
    }

    function render(rows = []) {
      const items = rows.slice(0, 20);
      top3El.innerHTML = "";
      restEl.innerHTML = "";

      const hero = items[0];
      const mids = items.slice(1, 3);
      const rest = items.slice(3);

      const makeTitle = (item) => item?.article?.title || item?.key || "";
      const makeDesc = (item) => item?.article?.description || "";
      const makeThumb = (item) => item?.article?.image || DEFAULT_THUMB;
      const makeLink = (item) => `article.html?id=${encodeURIComponent(item.key)}`;
      const makeService = (item) => item?.article?.service || item?.article?.serviceName || "";
      const makeCategory = (item) => item?.article?.categoryName || item?.article?.category || "";
      const makeLabel = (item) => { const s = (makeService(item) || "").trim(); const c = (makeCategory(item) || "").trim(); return [s, c].filter(Boolean).join(" / ") || "その他"; };

      if (hero) {
        const title = makeTitle(hero);
        top3El.innerHTML += `
          <a class="rank-hero" href="${makeLink(hero)}" data-rank-item="1" data-key="${hero.key}" data-title="${escapeHtml(title)}" data-rank="1" data-views="${hero.views}">
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

      mids.forEach((item, idx) => {
        const rank = idx + 2;
        const title = makeTitle(item);
        top3El.innerHTML += `
          <a class="rank-mid" href="${makeLink(item)}" data-rank-item="1" data-key="${item.key}" data-title="${escapeHtml(title)}" data-rank="${rank}" data-views="${item.views}">
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

      rest.forEach((item, idx) => {
        const rank = idx + 4;
        const title = makeTitle(item);
        const row = document.createElement("a");
        row.className = "ranking-row";
        row.href = makeLink(item);
        row.dataset.rankItem = "1";
        row.dataset.key = item.key;
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

      [top3El, restEl].forEach((el) => { el.classList.remove("ranking-animate"); void el.offsetWidth; el.classList.add("ranking-animate"); });
    }

    async function load(period) {
      currentPeriod = period || "all";
      const days = DAYS_MAP[currentPeriod] ?? 7;
      const url = `${RANK_API}/?days=${days}&limit=50&mode=article_id`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.ok) { top3El.innerHTML = `<div style="padding:16px;color:#666;">ランキング取得失敗: ${escapeHtml(data.message || "unknown")}</div>`; restEl.innerHTML = ""; return; }
        const list = window.articles || [];
        const merged = (data.rows || []).map((r) => { const a = list.find((x) => x.id === r.key); if (!a) return null; return { ...r, article: a }; }).filter(Boolean).slice(0, 20);
        if (!merged.length) { top3El.innerHTML = `<div style="padding:16px;color:#666;">記事ランキングのデータがまだありません。</div>`; restEl.innerHTML = ""; return; }
        render(merged);
      } catch (e) {
        console.error("[ranking] fetch failed:", e);
        top3El.innerHTML = `<div style="padding:16px;color:#666;">ランキング取得に失敗しました</div>`;
        restEl.innerHTML = "";
      }
    }

    periodBtns.forEach((btn) => {
      btn.addEventListener("click", () => { periodBtns.forEach((b) => b.classList.remove("active")); btn.classList.add("active"); load(btn.dataset.period || "all"); });
    });

    bindRankingGAOnce();
    const active = document.querySelector(".period-btn.active")?.dataset?.period || "all";
    load(active);
  }

  // ============
  // Global
  // ============
  window.loadArticles = loadArticles;
  window.getArticles = getArticles;
  window.searchArticlesList = searchArticlesList;
  window.openArticle = (id) => { location.href = "article.html?id=" + encodeURIComponent(id); };

  // ============
  // Boot
  // ============
  document.addEventListener("DOMContentLoaded", async () => {
    initMenuCloseBehaviors();
    initMenuOpen();
    initHeaderSearch();

    await loadArticles();
    await loadAds();

    hideLoader();

    const page = document.body?.dataset?.page || "";

    if (page === "home") {
      renderHero();
      renderLatest(9);
      initCarousel(6);  // 記事6本をカルーセルに表示
    }
    if (page === "all") initAllPage();
    if (page === "ranking" && !window.__USE_EXTERNAL_RANKING__) initRankingPage();

    initScrollReveal();
  });
})();
