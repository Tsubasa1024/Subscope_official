/* =========================================
   SUBSCOPE | index.js（完成版）
   - microCMS: articles / ads
   - 共通UI: menu, header search, reveal
   - ページ別: home / all / ranking
   ========================================= */

(() => {
  // ============
  // 0. Config
  // ============
  const SERVICE_ID = "subscope";
  const API_KEY = "cxfk9DoKLiD4YR3zIRDDk4iZyzNtBtaFEqzz";

  // article.html から参照できるように
  window.SERVICE_ID = SERVICE_ID;
  window.API_KEY = API_KEY;

  const ENDPOINT = `https://${SERVICE_ID}.microcms.io/api/v1/articles`;
  const ADS_ENDPOINT = `https://${SERVICE_ID}.microcms.io/api/v1/ads`;

  const ADS_ENABLED = false;

  window.articles = window.articles || [];
  window.__ADS__ = window.__ADS__ || {};

  // ============
  // 1. Utils
  // ============
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const normalizeText = (str) =>
    (str || "").toString().toLowerCase().replace(/\s+/g, "");

  async function fetchJson(url) {
    const res = await fetch(url, {
      headers: { "X-MICROCMS-API-KEY": API_KEY },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  // ============
  // 2. Articles
  // ============
  function mapCmsArticle(item) {
    const rawCat = item.category;
    let category = "";

    if (Array.isArray(rawCat)) {
      category = rawCat[0]?.name || rawCat[0]?.id || "";
    } else if (typeof rawCat === "string") {
      category = rawCat;
    } else if (rawCat) {
      category = rawCat.name || rawCat.id || "";
    }
    if (!category) category = "その他";

    const tmp = document.createElement("div");
    tmp.innerHTML = item.content || "";
    const bodyText = (tmp.textContent || "").trim();

    return {
      id: item.id,
      title: item.title || "",
      description: item.description || "",
      category,
      categoryName: category,
      service: item.service || "",
      date: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
      image:
        item?.eyecatch?.url ||
        item?.image?.url ||
        "https://placehold.co/800x500?text=SUBSCOPE",
      bodyText,
      contentHtml: item.content || "",
      priceSummary: item.priceSummary || "",
      author: item.author || null,
      authorName: item.author?.name || "",
      authorImage: item.author?.avatar?.url || "",
    };
  }

  async function loadArticles() {
    if (window.articles.length) return window.articles;
    try {
      const data = await fetchJson(`${ENDPOINT}?limit=100&depth=2&ts=${Date.now()}`);
      window.articles = (data.contents || []).map(mapCmsArticle);
    } catch (e) {
      console.error("記事取得失敗", e);
      window.articles = [];
    }
    return window.articles;
  }

  const getArticles = () => window.articles || [];

  // ============
  // 3. Search
  // ============
  function searchArticlesList(query) {
    const tokens = normalizeText(query).split(" ").filter(Boolean);
    if (!tokens.length) return [];

    return getArticles().filter((a) => {
      const hay = normalizeText(
        [a.title, a.description, a.service, a.categoryName, a.bodyText].join(" ")
      );
      return tokens.every((t) => hay.includes(t));
    });
  }

  function renderHeaderSearchResults(query) {
    const el = $("#searchResults");
    if (!el) return;

    if (!query) {
      el.innerHTML = "";
      el.style.display = "none";
      return;
    }

    const results = searchArticlesList(query).slice(0, 3);
    if (!results.length) {
      el.innerHTML = `<p style="margin:8px;color:#86868b;">該当する記事はありません</p>`;
      el.style.display = "block";
      return;
    }

    el.innerHTML = results
      .map(
        (a) => `
        <div class="search-item" onclick="location.href='article.html?id=${a.id}'">
          <img src="${a.image}" alt="">
          <div>
            <h3>${a.title}</h3>
            <p>${a.description}</p>
          </div>
        </div>`
      )
      .join("");
    el.style.display = "block";
  }

  function initHeaderSearch() {
    const input = $("#searchInput");
    const clearBtn = $("#clear-btn");
    const header = $(".fixed-header");
    const wrapper = $(".search-wrapper");

    if (!input || !wrapper || !header) return;

    input.addEventListener("input", (e) =>
      renderHeaderSearchResults(e.target.value)
    );

    let open = false;
    const isMobile = () => window.innerWidth <= 767;

    wrapper.addEventListener("click", (e) => {
      if (!isMobile()) return input.focus();

      if (!open) {
        header.classList.add("search-open");
        open = true;
        setTimeout(() => input.focus(), 80);
      } else if (e.target !== input) {
        header.classList.remove("search-open");
        open = false;
        input.blur();
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        renderHeaderSearchResults("");
        input.focus();
      });
    }
  }

  // ============
  // 4. Menu（完成形）
  // ============
  function toggleMenu(force) {
    const overlay = $("#nav-overlay");
    if (!overlay) return;
    overlay.classList.toggle("open", force ?? !overlay.classList.contains("open"));
  }
  window.toggleMenu = toggleMenu;

  function initMenu() {
    const btn = $("#menuBtn") || $(".menu-btn");
    const overlay = $("#nav-overlay");
    const header = $(".fixed-header");

    if (!btn || !overlay || btn.dataset.bound) return;

    btn.addEventListener("click", () => {
      // 検索が開いてたら閉じる
      header?.classList.remove("search-open");
      toggleMenu();
    });

    // 外クリックで閉じる
    document.addEventListener("click", (e) => {
      if (
        overlay.classList.contains("open") &&
        !e.target.closest("#nav-overlay") &&
        !e.target.closest(".menu-btn")
      ) {
        toggleMenu(false);
      }
    });

    btn.dataset.bound = "true";
  }

  // ============
  // 5. Reveal
  // ============
  function initScrollReveal() {
    const els = $$(".reveal");
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("active");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    els.forEach((el) => io.observe(el));
  }

  // ============
  // 6. Boot
  // ============
  document.addEventListener("DOMContentLoaded", async () => {
    initMenu();
    initHeaderSearch();

    await loadArticles();

    const page = document.body?.dataset?.page || "";
    if (page === "all" && window.initAllPage) initAllPage();
    if (page === "ranking" && window.initRankingPage) initRankingPage();

    initScrollReveal();
  });
})();
