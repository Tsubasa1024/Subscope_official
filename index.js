// =====================================
// 1. microCMS から記事を読む設定
// =====================================
window.articles = window.articles || [];

const SERVICE_ID = "subscope";
const API_KEY    = "cxfk9DoKLiD4YR3zIRDDk4iZyzNtBtaFEqzz";
const ENDPOINT   = `https://${SERVICE_ID}.microcms.io/api/v1/articles`;

/**
 * microCMS の1件分を、フロント用の形にマッピング
 */
function mapCmsArticle(item) {
    const rawCat = item.category;
    let category = "";

    // ★ 配列パターン（microCMS が [ { name, id } ] を返すやつ）
    if (Array.isArray(rawCat)) {
        if (rawCat.length > 0 && rawCat[0]) {
            const first = rawCat[0];
            category = (
                first.name ||
                first.id ||
                first
            ).toString().trim();
        }

    // ★ 文字列パターン
    } else if (typeof rawCat === "string") {
        category = rawCat.trim();

    // ★ オブジェクトパターン
    } else if (rawCat && typeof rawCat === "object") {
        category = (
            rawCat.name ||
            rawCat.id ||
            ""
        ).toString().trim();
    }

    if (!category) category = "音楽";

    console.log("[index.js mapCmsArticle]", item.id, "category =", rawCat, "=>", category);

    // ★ 本文HTML
    const rawContentHtml = item.content || "";

    // ★ 本文プレーンテキスト（検索用）
    let bodyText = "";
    if (rawContentHtml) {
        const tmp = document.createElement("div");
        tmp.innerHTML = rawContentHtml;
        bodyText = (tmp.textContent || tmp.innerText || "").trim();
    }

    // ★ タグ（あれば検索用に拾っておく）
    let tags = [];
    if (Array.isArray(item.tags)) {
        tags = item.tags
            .map(t => (t && (t.name || t.id || t)).toString().trim())
            .filter(Boolean);
    }

    return {
        id: item.id,
        title: item.title || "",
        description: item.description || "",
        category,
        categoryName: category,
        service: item.service || "",
        date: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
        image: item.eyecatch ? item.eyecatch.url : "images/sample1.jpg",
        views: 0,

        // 本文HTML（記事ページ用）
        contentHtml: rawContentHtml,

        // ★ 追加：検索用の本文テキスト
        bodyText,

        // ★ タグ
        tags,

        // ★ 料金プラン（microCMS のフィールドID: priceSummary）
        priceSummary: item.priceSummary || "",

        // ★ 著者データ（安全に）
        author: item.author || null,
        authorName: item.author?.name || "",
        authorImage: item.author?.avatar?.url || "",
        authorId: item.author?.id || "",

        // ★ 公式サイトリンク（最大4つ）
        officialLinks: [
            {
                label: (item.officialLabel1 || "").trim(),
                url:   (item.officialUrl1   || "").trim(),
            },
            {
                label: (item.officialLabel2 || "").trim(),
                url:   (item.officialUrl2   || "").trim(),
            },
            {
                label: (item.officialLabel3 || "").trim(),
                url:   (item.officialUrl3   || "").trim(),
            },
            {
                label: (item.officialLabel4 || "").trim(),
                url:   (item.officialUrl4   || "").trim(),
            },
        ].filter(link => link.url),
    };
}

// 一覧取得
async function loadArticles() {
    if (window.articles && window.articles.length > 0) {
        return window.articles;
    }

    try {
        const res = await fetch(`${ENDPOINT}?limit=100&depth=2`, {
            headers: {
                "X-MICROCMS-API-KEY": API_KEY
            }
        });

        if (!res.ok) {
            throw new Error("HTTP error " + res.status);
        }

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
let searchInput;      // ヘッダー左上の検索
let clearBtn;
let searchResultsEl;  // ヘッダーの候補表示用
let heroContainer;
let latestGrid;

// 「すべての記事」ページ用
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

    const sorted = [...list].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );
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
// 5. 最新記事グリッド
// =====================================
function renderLatest(limit = 6) {
    if (!latestGrid) return;

    const list = getArticles();
    const sorted = [...list].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );
    const target = sorted.slice(0, limit);

    latestGrid.innerHTML = target
        .map(
            (a) => `
        <article class="article-card" onclick="location.href='article.html?id=${encodeURIComponent(
            a.id
        )}'">
            <div class="card-image" style="background-image:url('${a.image}')"></div>
            <div class="card-body">
                <div class="card-service">${a.service || "SUBSCOPE"}</div>
                <h3 class="card-title">${a.title}</h3>
                <p class="card-desc">${a.description}</p>
                <div class="card-date">${(a.date || "").replace(/-/g, ".")}</div>
            </div>
        </article>
    `
        )
        .join("");
}

// =====================================
// 6. 3D カルーセル（おすすめ）
// =====================================
function initCarousel3D() {
    const carousel = document.querySelector(".carousel3d");
    if (!carousel) return;

    const items  = carousel.querySelectorAll(".carousel3d-item");
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
// 7. 検索ロジック（共通配列を返す）
// =====================================

/**
 * キーワードで記事を検索して、
 * ・タイトル / 説明 / サービス名 / カテゴリ / tags / 本文 を対象に
 * ・AND 検索（すべてのトークンを含む）
 * ・日付の新しい順に並べて返す
 */
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
            article.bodyText || ""          // ★ 本文も検索対象に追加
        ].join(" ");

        const haystack = normalizeText(joined);
        return tokens.every((token) => haystack.includes(token));
    });

    // ★ 新しい順
    result.sort((a, b) => {
        const da = a.date ? new Date(a.date) : 0;
        const db = b.date ? new Date(b.date) : 0;
        return db - da;
    });

    return result;
}

// =====================================
// 8. ヘッダー検索（候補3件＋Enterで all.html に飛ぶ）
// =====================================

function renderHeaderSearchResults(query) {
    if (!searchResultsEl) return;

    const q = (query || "").trim();

    if (!q) {
        searchResultsEl.innerHTML = "";
        searchResultsEl.style.display = "none";
        return;
    }

    const results = searchArticlesList(q).slice(0, 3); // ★最新3件まで

    if (!results.length) {
        searchResultsEl.innerHTML =
            `<p style="margin-top:8px;color:#86868B;font-size:0.9rem;">該当する記事は見つかりませんでした。</p>`;
        searchResultsEl.style.display = "block";
        return;
    }

    searchResultsEl.innerHTML = results
        .map(
            (article) => `
        <div class="search-item" onclick="location.href='article.html?id=${encodeURIComponent(
            article.id
        )}'">
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

    // 入力中：最新3件だけ候補表示
    searchInput.addEventListener("input", (e) => {
        renderHeaderSearchResults(e.target.value);
    });

    // Enter：すべての記事ページに遷移し、検索済み状態で開く
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const keyword = searchInput.value.trim();
            if (!keyword) {
                renderHeaderSearchResults("");
                return;
            }
            const url = `all.html?search=${encodeURIComponent(keyword)}`;
            window.location.href = url;
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
    allSearchForm   = document.getElementById("allSearchForm");
    allSearchInput  = document.getElementById("allSearchInput");
    allSearchInfo   = document.getElementById("allSearchInfo");
    allArticlesList = document.getElementById("allArticlesList");

    // 「すべての記事」ページ以外では何もしない
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

    // URL パラメータに search があればそれで初期検索
    const params = new URLSearchParams(window.location.search);
    const initialKeyword = params.get("search") || "";
    if (initialKeyword) {
        allSearchInput.value = initialKeyword;
        runSearch(initialKeyword);
    }

    // 検索フォーム送信時
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
    window.scrollTo({
        top: rectTop - offset,
        behavior: "smooth"
    });
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
// 11. 初期化（トップページ / 共通）
// =====================================
document.addEventListener("DOMContentLoaded", async () => {
    // ヘッダー検索まわり
    searchInput     = document.getElementById("searchInput");
    clearBtn        = document.getElementById("clear-btn");
    searchResultsEl = document.getElementById("searchResults");

    // トップページ用
    heroContainer   = document.getElementById("most-viewed-content");
    latestGrid      = document.getElementById("latest-grid");

    await loadArticles();

    renderHero();
    renderLatest();
    initCarousel3D();
    initSearch();
    initAllPageSearch();
    initScrollReveal();
});
