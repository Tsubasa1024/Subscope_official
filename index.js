// ======================================
//  SUBSCOPE メインスクリプト
//  - 記事データ
//  - ヒーロー記事描画
//  - 最新記事描画
//  - 検索機能
//  - メニュー / スクロール
//  - スクロールアニメーション
//  - 3D おすすめカルーセル
// ======================================

document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------
    // 1. 記事データ
    // ----------------------------------
    const articles = [
        {
            id: "apple-music-latest",
            title: "Apple Music の最新機能まとめ",
            service: "Apple Music",
            date: "2025.12.04",
            description: "空間オーディオやロスレスなど、Apple Music の最新機能をまとめて解説。",
            image: "images/sample1.jpg",
            views: 21827
        },
        {
            id: "netflix-2025",
            title: "Netflix 2025年おすすめ作品",
            service: "Netflix",
            date: "2025.11.30",
            description: "新作ドラマから話題の映画まで、2025年にチェックしたい作品をピックアップ。",
            image: "images/sample2.jpg",
            views: 15432
        },
        {
            id: "sub-comparison",
            title: "人気サブスク徹底比較ガイド",
            service: "SUBSCOPE Review",
            date: "2025.11.20",
            description: "音楽・動画・学習系など、主要サブスクリプションの強みと弱みを比較。",
            image: "images/sample3.jpg",
            views: 18740
        },
        {
            id: "spotify-vs-apple-music",
            title: "Spotify vs Apple Music",
            service: "Music",
            date: "2025.11.10",
            description: "音質・料金・機能…どっちを選べばいい？実際の使い勝手をもとに比較。",
            image: "images/sample4.jpg",
            views: 13201
        }
    ];

    // ----------------------------------
    // 2. ヒーロー記事の描画
    // ----------------------------------
    const heroContainer = document.getElementById("most-viewed-content");

    function renderHero() {
        if (!heroContainer || !articles.length) return;

        // 一番閲覧数が多い記事をヒーローにする
        const heroArticle = [...articles].sort((a, b) => b.views - a.views)[0];

        heroContainer.innerHTML = "";

        const card = document.createElement("article");
        card.className = "featured-card";
        card.style.backgroundImage = `url('${heroArticle.image}')`;

        card.innerHTML = `
            <div class="featured-content">
                <div class="featured-meta">
                    <span class="tag">${heroArticle.service}</span>
                    <span>${heroArticle.date}</span>
                </div>
                <h2 class="featured-title">${heroArticle.title}</h2>
                <p class="featured-desc">${heroArticle.description}</p>
                <button class="btn-read">続きを読む</button>
            </div>
        `;

        heroContainer.appendChild(card);
    }

    // ----------------------------------
    // 3. 最新記事の描画
    // ----------------------------------
    const latestGrid = document.getElementById("latest-grid");

    function createArticleCard(article) {
        const card = document.createElement("article");
        card.className = "article-card";
        card.dataset.title = article.title.toLowerCase();
        card.dataset.service = article.service.toLowerCase();
        card.dataset.desc = article.description.toLowerCase();

        card.innerHTML = `
            <div class="card-image" style="background-image:url('${article.image}')"></div>
            <div class="card-body">
                <div class="card-service">${article.service}</div>
                <h3 class="card-title">${article.title}</h3>
                <p class="card-desc">${article.description}</p>
                <div class="card-date">${article.date}</div>
            </div>
        `;
        return card;
    }

    function renderLatest(list) {
        if (!latestGrid) return;

        latestGrid.innerHTML = "";

        if (!list.length) {
            const placeholder = document.createElement("div");
            placeholder.className = "placeholder-card";
            placeholder.textContent = "該当する記事がありません。キーワードを変えてみてください。";
            latestGrid.appendChild(placeholder);
            return;
        }

        list.forEach((article) => {
            latestGrid.appendChild(createArticleCard(article));
        });
    }

    // 初期描画
    renderHero();
    renderLatest(articles);

    // ----------------------------------
    // 4. 検索機能
    // ----------------------------------
    const searchInput = document.getElementById("search-input");
    const clearBtn = document.getElementById("clear-btn");

    function applySearch() {
        if (!searchInput) return;
        const q = searchInput.value.trim().toLowerCase();

        if (!q) {
            renderLatest(articles);
            return;
        }

        const filtered = articles.filter((a) => {
            return (
                a.title.toLowerCase().includes(q) ||
                a.service.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q)
            );
        });

        renderLatest(filtered);
    }

    if (searchInput) {
        searchInput.addEventListener("input", applySearch);
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener("click", () => {
            searchInput.value = "";
            applySearch();
            searchInput.focus();
        });
    }

    // ----------------------------------
    // 5. Menu トグル & スムーススクロール
    // ----------------------------------
    const navOverlay = document.getElementById("nav-overlay");

    window.toggleMenu = function toggleMenu() {
        if (!navOverlay) return;
        navOverlay.classList.toggle("open");
    };

    window.smoothScroll = function smoothScroll(selector) {
        const target = document.querySelector(selector);
        if (!target) return;

        const header = document.querySelector(".fixed-header");
        const headerH = header ? header.offsetHeight : 0;

        const y = target.getBoundingClientRect().top + window.scrollY - headerH - 16;

        window.scrollTo({
            top: y,
            behavior: "smooth"
        });
    };

    // ----------------------------------
    // 6. スクロールアニメーション（.reveal）
    // ----------------------------------
    const revealEls = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("active");
                        io.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        revealEls.forEach((el) => io.observe(el));
    } else {
        // 古い環境向け: すべて表示
        revealEls.forEach((el) => el.classList.add("active"));
    }

    // ----------------------------------
    // 7. 3D おすすめカルーセル
    // ----------------------------------
    const carouselItems = document.querySelectorAll(".carousel3d-item");

    if (carouselItems.length) {
        const total = carouselItems.length;
        let currentIndex = 0;

        function updateCarouselPositions() {
            carouselItems.forEach((item, i) => {
                const offset = (i - currentIndex + total) % total;

                item.className = "carousel3d-item";

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

        updateCarouselPositions();

        setInterval(() => {
            currentIndex = (currentIndex + 1) % total;
            updateCarouselPositions();
        }, 3000);
    }
});
