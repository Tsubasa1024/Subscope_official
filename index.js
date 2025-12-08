// =====================================
// 記事データを外部 JSON から読み込む（GIZMODO 入口）
// =====================================
window.articles = [];

// 記事一覧を読み込む（最初に1回だけ）
async function loadArticles() {
    if (window.articles && window.articles.length > 0) {
        return window.articles;
    }

    try {
        const res = await fetch("articles.json", { cache: "no-store" });
        if (!res.ok) {
            throw new Error("HTTP error " + res.status);
        }
        const data = await res.json();
        window.articles = Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("記事データの読み込みに失敗しました", e);
        window.articles = window.articles || [];
    }

    return window.articles;
}

// 安全に articles を取るヘルパー
function getArticles() {
    return window.articles || [];
}

// =====================================
// DOM 用の変数
// =====================================
let searchInput;
let clearBtn;
let searchResultsEl;
let heroContainer;
let latestGrid;

// =====================================
// テキスト正規化（小文字化＋スペース除去）
// =====================================
function normalizeText(str) {
    if (!str) return "";
    return str
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "");
}

// =====================================
// ヒーロー記事（もっとも閲覧数が多い記事）
// =====================================
function renderHero() {
    const list = getArticles();
    if (!heroContainer || list.length === 0) return;

    const featured = [...list].sort((a, b) => (b.views || 0) - (a.views || 0))[0];

    heroContainer.innerHTML = `
        <article class="featured-card" style="background-image:url('${featured.image}')"
                 onclick="location.href='article.html?id=${encodeURIComponent(featured.id)}'">
            <div class="featured-content">
                <div class="featured-meta">
                    <span class="tag">${featured.service}</span>
                    <span>${featured.category}</span>
                </div>
                <h2 class="featured-title">${featured.title}</h2>
                <p class="featured-desc">${featured.description}</p>
                <button class="btn-read">詳しく見る</button>
            </div>
        </article>
    `;
}

// =====================================
// 最新記事（date でソートして上位を表示）
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
                <div class="card-service">${a.service}</div>
                <h3 class="card-title">${a.title}</h3>
                <p class="card-desc">${a.description}</p>
                <div class="card-date">${a.date}</div>
            </div>
        </article>
    `
        )
        .join("");
}

// =====================================
// 3D カルーセル（おすすめ記事）
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

    // articles からおすすめ記事を取得（先頭から total 件）
    const recommend = list.slice(0, total);

    // カード中身を注入 & クリックで記事ページへ
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
            item.className = "carousel3d-item"; // いったんリセット
            const offset = (i - currentIndex + total) % total;

            if (offset === 0) {
                item.classList.add("is-center");
            } else if (offset === 1) {
                item.classList.add("is-right");
            } else if (offset === total - 1) {
                item.classList.add("is-left");
            } else {
                item.classList.add("is-back");
            }
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

    // 自動スクロール
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

    // スワイプ操作
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

    // 初期配置
    updatePositions();
}

// =====================================
// 最強検索ロジック
// =====================================

// 記事1件ごとのスコア計算
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

        // タイトル優先
        if (title.includes(token)) {
            totalScore += 50;
            matched = true;
        }

        // 説明
        if (desc.includes(token)) {
            totalScore += 25;
            matched = true;
        }

        // サービス名
        if (service.includes(token)) {
            totalScore += 15;
            matched = true;
        }

        // タグ
        if (tags.includes(token)) {
            totalScore += 15;
            matched = true;
        }

        // どこにもヒットしない → この記事は不採用（AND 検索）
        if (!matched) {
            return 0;
        }
    }

    // 人気度を少し加点
    totalScore += (article.views || 0) * 0.05;

    return totalScore;
}

function searchArticles(query) {
    if (!searchResultsEl) {
        return;
    }

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

    if (scored.length === 0) {
        searchResultsEl.innerHTML =
            `<p style="margin-top:8px;color:#86868B;font-size:0.9rem;">該当する記事は見つかりませんでした。</p>`;
        return;
    }

    searchResultsEl.innerHTML = scored
        .map(({ article }) => {
            return `
            <div class="search-item" onclick="location.href='article.html?id=${encodeURIComponent(
                article.id
            )}'">
                <img src="${article.image}" alt="">
                <div>
                    <h3>${article.title}</h3>
                    <p>${article.description}</p>
                </div>
            </div>
        `;
        })
        .join("");
}

// =====================================
// 検索イベント紐付け
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
        const value = e.target.value;
        searchArticles(value);
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
// Menu / スムーススクロール
// =====================================
function toggleMenu() {
    const overlay = document.getElementById("nav-overlay");
    if (!overlay) return;
    overlay.classList.toggle("open");
}

function smoothScroll(targetSelector) {
    const el = document.querySelector(targetSelector);
    if (!el) return;
    const rectTop = el.getBoundingClientRect().top + window.scrollY;
    const offset = 80; // 固定ヘッダー分
    window.scrollTo({
        top: rectTop - offset,
        behavior: "smooth"
    });
}

window.toggleMenu = toggleMenu;
window.smoothScroll = smoothScroll;

// =====================================
// スクロールリビール（.reveal 用）
// =====================================
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
        {
            threshold: 0.15
        }
    );

    targets.forEach((el) => observer.observe(el));
}

// =====================================
// 初期化
// =====================================
document.addEventListener("DOMContentLoaded", async () => {
    searchInput     = document.getElementById("searchInput");
    clearBtn        = document.getElementById("clear-btn");
    searchResultsEl = document.getElementById("searchResults");
    heroContainer   = document.getElementById("most-viewed-content");
    latestGrid      = document.getElementById("latest-grid");

    // ★ ここで記事データを fetch
    await loadArticles();

    // 記事データが入ったあとに描画系を実行
    renderHero();
    renderLatest();
    initCarousel3D();
    initSearch();
    initScrollReveal();
});
