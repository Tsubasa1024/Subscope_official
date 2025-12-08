// =====================================
// 1. microCMS から記事を読む設定
// =====================================
window.articles = [];

const SERVICE_ID = "subscope";
const API_KEY    = "cxfk9DoKLiD4YR3zIRDDk4iZyzNtBtaFEqzz";
const ENDPOINT   = `https://${SERVICE_ID}.microcms.io/api/v1/articles`;

// HTML → プレーンテキスト（description 用）
function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return tmp.textContent || tmp.innerText || "";
}

// microCMS の1件を SUBSCOPE 形式に変換
function mapCmsArticle(item) {
    // --- カテゴリを安全に取り出す ---
    let categoryId = "";
    let categoryName = "";

    const rawCat = item.category;   // ← microCMS のフィールドID「category」

    if (typeof rawCat === "string") {
        // 例: "音楽" とか "music"
        categoryId = rawCat;
        categoryName = rawCat;      // すでに日本語ならそのまま
    } else if (rawCat && typeof rawCat === "object") {
        // 例: { id: "music", name: "音楽" } みたいな場合の保険
        categoryId   = rawCat.id    || rawCat.value || "";
        categoryName = rawCat.name  || rawCat.label || categoryId;
    }

    return {
        id: item.id,
        title: item.title || "",
        description: item.content
            ? stripHtml(item.content).slice(0, 80) + "…"
            : "",

        // ★ここだけ増やす
        categoryId,
        categoryName,
        category: categoryName,   // 既存コード用に一応残しておく

        service: item.service || "",
        tags: [],
        date: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
        image: item.eyecatch ? item.eyecatch.url : "images/sample1.jpg",
        views: 0,
        contentHtml: item.content || ""
    };
}


// microCMS の1件を SUBSCOPE 形式に変換
function mapCmsArticle(item) {
    const rawCat = item.category;   // microCMS の category フィールド

    let categoryId = "";
    let categoryName = "";

    if (typeof rawCat === "string") {
        // "music" / "音楽" など
        categoryId = rawCat;
        categoryName = CATEGORY_LABELS[rawCat] || rawCat;
    } else if (rawCat && typeof rawCat === "object") {
        // { id: "music", name: "音楽" } みたいな形にも対応
        if (rawCat.id) categoryId = rawCat.id;
        if (rawCat.name) categoryName = rawCat.name;

        if (!categoryName && categoryId) {
            categoryName = CATEGORY_LABELS[categoryId] || categoryId;
        }
    }

    return {
        id: item.id,
        title: item.title || "",
        description: item.content
            ? stripHtml(item.content).slice(0, 80) + "…"
            : "",

        // 🔸 ID（"music" とか）。フィルタなどに使う用
        category: categoryId,

        // 🔸 表示用の日本語ラベル（"音楽" など）
        categoryName: categoryName,

        // テキストフィールド「サービス名」 → "Apple Music" など
        service: item.service || "",

        tags: [],
        date: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
        image: item.eyecatch ? item.eyecatch.url : "images/sample1.jpg",
        views: 0,
        contentHtml: item.content || ""
    };
}



// 一覧取得
async function loadArticles() {
    if (window.articles && window.articles.length > 0) {
        return window.articles;
    }

    try {
        const res = await fetch(`${ENDPOINT}?limit=100`, {
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
let searchInput;
let clearBtn;
let searchResultsEl;
let heroContainer;
let latestGrid;

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
// 7. 検索ロジック
// =====================================
function calcArticleScore(article, tokens) {
    const title = normalizeText(article.title);
    const desc = normalizeText(article.description);
    const service = normalizeText(article.service);
    const tags = normalizeText((article.tags || []).join(" "));

    let totalScore = 0;

    for (const t of tokens) {
        const token = normalizeText(t);
        if (!token) continue;

        let matched = false;

        if (title.includes(token)) {
            totalScore += 50;
            matched = true;
        }
        if (desc.includes(token)) {
            totalScore += 25;
            matched = true;
        }
        if (service.includes(token)) {
            totalScore += 15;
            matched = true;
        }
        if (tags.includes(token)) {
            totalScore += 15;
            matched = true;
        }

        if (!matched) return 0;
    }

    totalScore += (article.views || 0) * 0.05;
    return totalScore;
}

function searchArticles(query) {
    if (!searchResultsEl) return;

    const q = query.trim();
    if (!q) {
        searchResultsEl.innerHTML = "";
        return;
    }

    const tokens = q.split(/\s+/);
    const list = getArticles();

    const scored = list
        .map((article) => {
            const score = calcArticleScore(article, tokens);
            return { article, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

    if (!scored.length) {
        searchResultsEl.innerHTML =
            `<p style="margin-top:8px;color:#86868B;font-size:0.9rem;">該当する記事は見つかりませんでした。</p>`;
        return;
    }

    searchResultsEl.innerHTML = scored
        .map(({ article }) => `
            <div class="search-item" onclick="location.href='article.html?id=${encodeURIComponent(
                article.id
            )}'">
                <img src="${article.image}" alt="">
                <div>
                    <h3>${article.title}</h3>
                    <p>${article.description}</p>
                </div>
            </div>
        `)
        .join("");
}

// =====================================
// 8. 検索イベント紐付け
// =====================================
function initSearch() {
    if (!searchInput) return;

    if (!searchResultsEl) {
        const container = document.createElement("div");
        container.className = "search-results-container";
        container.innerHTML = `<div id="searchResults"></div>`;
        document.body.appendChild(container);
        searchResultsEl = container.querySelector("#searchResults");
    }

    searchInput.addEventListener("input", (e) => {
        searchArticles(e.target.value);
    });

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            searchArticles(searchInput.value);
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            searchInput.value = "";
            searchResultsEl.innerHTML = "";
            searchInput.focus();
        });
    }
}

// =====================================
// 9. 「すべての記事」ページ
// =====================================
function renderAllArticles(list) {
    const grid =
        document.getElementById("all-articles-grid") ||
        document.getElementById("all-grid");
    if (!grid) return;

    grid.innerHTML = list
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

function initAllPage() {
    const grid =
        document.getElementById("all-articles-grid") ||
        document.getElementById("all-grid");
    if (!grid) return;

    const list = getArticles();
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab") || "すべて";

    function filterByCategory(cat) {
        if (cat === "すべて") return list;
        return list.filter((a) => a.category === cat);
    }

    const initial = filterByCategory(tab);
    renderAllArticles(initial);

    const tabs = document.querySelectorAll("[data-category-tab]");
    tabs.forEach((btn) => {
        btn.addEventListener("click", () => {
            const cat = btn.getAttribute("data-category-tab");
            const filtered = filterByCategory(cat);
            renderAllArticles(filtered);

            tabs.forEach((b) => b.classList.remove("is-active"));
            btn.classList.add("is-active");
        });
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
// 11. 初期化
// =====================================
document.addEventListener("DOMContentLoaded", async () => {
    searchInput     = document.getElementById("searchInput");
    clearBtn        = document.getElementById("clear-btn");
    searchResultsEl = document.getElementById("searchResults");
    heroContainer   = document.getElementById("most-viewed-content");
    latestGrid      = document.getElementById("latest-grid");

    await loadArticles();

    renderHero();
    renderLatest();
    initCarousel3D();
    initSearch();
    initScrollReveal();
    initAllPage();
});




