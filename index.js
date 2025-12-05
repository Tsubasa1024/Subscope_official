// =====================================
// 記事データ
// ※あとで自由に増やして OK
// =====================================
const articles = [
    {
        id: "apple-music-latest",
        title: "Apple Music の最新機能まとめ",
        description: "空間オーディオ、ロスレス、オートミックスなど Apple Music の最新機能を徹底解説。",
        service: "Apple Music",
        tags: ["音楽", "ストリーミング", "ハイレゾ"],
        category: "音楽",
        date: "2025-12-01",
        image: "images/sample1.jpg",
        views: 320
    },
    {
        id: "netflix-2025-best",
        title: "Netflix 2025年おすすめ作品",
        description: "2025年に絶対観ておきたい Netflix オリジナル作品を厳選紹介。",
        service: "Netflix",
        tags: ["映画", "ドラマ", "VOD"],
        category: "映像",
        date: "2025-11-28",
        image: "images/sample2.jpg",
        views: 280
    },
    {
        id: "subscription-comparison",
        title: "人気サブスク徹底比較ガイド",
        description: "音楽・映像・学習系など主要サブスクサービスを横断比較。あなたに合う1本を見つけよう。",
        service: "All",
        tags: ["比較", "ガイド"],
        category: "比較",
        date: "2025-11-20",
        image: "images/sample3.jpg",
        views: 400
    },
    {
        id: "spotify-vs-applemusic",
        title: "Spotify vs Apple Music",
        description: "音質、料金、レコメンド精度まで。2大音楽サブスクを本音レビュー。",
        service: "Spotify",
        tags: ["音楽", "比較"],
        category: "音楽",
        date: "2025-11-10",
        image: "images/sample4.jpg",
        views: 250
    },
    {
        id: "study-apps-best",
        title: "勉強がはかどる学習系サブスク5選",
        description: "TOEIC 対策から資格勉強まで。学生にも社会人にも刺さる学習系サブスクをピックアップ。",
        service: "Study",
        tags: ["学習", "教育", "TOEIC"],
        category: "学習",
        date: "2025-11-05",
        image: "images/sample5.jpg",
        views: 150
    }
];

// =====================================
// DOM 取得
// =====================================
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clear-btn");
const searchResultsEl = document.getElementById("searchResults");
const heroContainer = document.getElementById("most-viewed-content");
const latestGrid = document.getElementById("latest-grid");

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
    if (!heroContainer || articles.length === 0) return;

    const featured = [...articles].sort((a, b) => b.views - a.views)[0];

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

    const sorted = [...articles].sort(
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
// 3D カルーセル：既存のデザインそのままに、左右ボタンだけ制御
// =====================================
function initCarousel3D() {
    const items = document.querySelectorAll(".carousel3d-item");
    const prevBtn = document.querySelector(".carousel3d-nav-prev");
    const nextBtn = document.querySelector(".carousel3d-nav-next");
    if (!items.length || !prevBtn || !nextBtn) return;

    let currentIndex = 0;
    const total = items.length;

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

    prevBtn.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + total) % total;
        updatePositions();
    });

    nextBtn.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % total;
        updatePositions();
    });

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
    const q = query.trim();
    if (!q) {
        // 何も入力されていないときは検索結果を消す
        searchResultsEl.innerHTML = "";
        return;
    }

    const tokens = q.split(/\s+/);

    const scored = articles
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
    if (!searchInput || !searchResultsEl) return;

    // 入力のたびに検索
    searchInput.addEventListener("input", (e) => {
        const value = e.target.value;
        searchArticles(value);
    });

    // Enter で検索確定（挙動は input と同じだが、将来拡張用）
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            searchArticles(searchInput.value);
        }
    });

    // クリアボタン
    clearBtn?.addEventListener("click", () => {
        searchInput.value = "";
        searchResultsEl.innerHTML = "";
        searchInput.focus();
    });
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

// グローバル関数として window に出す（HTML から呼べるように）
window.toggleMenu = toggleMenu;
window.smoothScroll = smoothScroll;

// =====================================
// スクロールリビール（既存 .reveal クラス用）
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
document.addEventListener("DOMContentLoaded", () => {
    renderHero();
    renderLatest();
    initCarousel3D();
    initSearch();
    initScrollReveal();
});
