// ======================================
//  SUBSCOPE メインスクリプト
// ======================================

document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------
    // 1. 記事データ（ここを書き換えれば中身を増減できる）
    // ----------------------------------
    const articles = [
        {
            id: "apple-music-latest",
            title: "Apple Music の最新機能まとめ",
            service: "Apple Music",
            date: "2025.12.04",
            description: "空間オーディオやロスレスなど、Apple Music の最新機能をまとめて解説。",
            image: "images/apple-music-hero.jpg",
            views: 21827
        },
        {
            id: "netflix-2025",
            title: "Netflix 2025年おすすめ作品",
            service: "Netflix",
            date: "2025.11.30",
            description: "新作ドラマから話題の映画まで、2025年にチェックしたい作品をピックアップ。",
            image: "images/netflix-2025.jpg",
            views: 15432
        },
        {
            id: "sub-comparison",
            title: "人気サブスク徹底比較ガイド",
            service: "SUBSCOPE Review",
            date: "2025.11.25",
            description: "音楽・動画・学習系など、主要サブスクリプションの強みと弱みを比較。",
            image: "images/sub-comparison.jpg",
            views: 18740
        },
        {
            id: "spotify-vs-apple-music",
            title: "Spotify vs Apple Music",
            service: "Music",
            date: "2025.11.20",
            description: "音質・料金・機能…どっちを選べばいい？実際の使い勝手をもとに比較。",
            image: "images/spotify-vs-apple.jpg",
            views: 13201
        },
        {
            id: "youtube-premium",
            title: "YouTube Premium を本気で使い倒す",
            service: "YouTube Premium",
            date: "2025.11.15",
            description: "広告なし視聴だけじゃない、オフライン再生・バックグラウンド再生のメリットを解説。",
            image: "images/youtube-premium.jpg",
            views: 9800
        },
        {
            id: "fitplace24-review",
            title: "FitPlace24 の実際の使い心地",
            service: "FitPlace24",
            date: "2025.11.10",
            description: "料金・混雑状況・設備など、24時間ジム FitPlace24 を実体験でレビュー。",
            image: "images/fitplace24.jpg",
            views: 7200
        },
        {
            id: "abceed-toeic",
            title: "Abceed でTOEICスコアを伸ばすコツ",
            service: "Abceed",
            date: "2025.11.05",
            description: "3ヶ月でどこまでスコアを伸ばせるか、勉強法と機能をセットで紹介。",
            image: "images/abceed-toeic.jpg",
            views: 6500
        },
        {
            id: "spotify-new-feature",
            title: "Spotify の新しい発見系プレイリスト",
            service: "Spotify",
            date: "2025.10.28",
            description: "Release Radar や Discover Weekly を使いこなして、新しい音楽との出会い方を広げよう。",
            image: "images/spotify-discover.jpg",
            views: 5400
        },
        {
            id: "learning-subs",
            title: "英語学習に使いたいサブスク3選",
            service: "Learning",
            date: "2025.10.20",
            description: "スタディサプリENGLISH・Abceed・Netflix を組み合わせた学習プラン。",
            image: "images/learning-subs.jpg",
            views: 5000
        }
    ];

    // ----------------------------------
    // 2. ヒーロー記事の描画
    // ----------------------------------
    const heroContainer = document.getElementById("most-viewed-content");

    function renderHero() {
        if (!heroContainer || !articles.length) return;

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

        // クリックで記事ページへ
        card.addEventListener("click", () => {
            window.location.href = `article.html?id=${encodeURIComponent(heroArticle.id)}`;
        });

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

        card.addEventListener("click", () => {
            window.location.href = `article.html?id=${encodeURIComponent(article.id)}`;
        });

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
        revealEls.forEach((el) => el.classList.add("active"));
    }

// ----------------------------------
// 7. 3D おすすめカルーセル（ボタン＋スワイプ）
//    → articles の先頭 4件を使用
// ----------------------------------
const carousel = document.querySelector(".carousel3d");
if (carousel) {
    const inner = carousel.querySelector(".carousel3d-inner");
    const carouselItems = inner.querySelectorAll(".carousel3d-item");
    const prevBtn = carousel.querySelector(".carousel3d-nav-prev");
    const nextBtn = carousel.querySelector(".carousel3d-nav-next");

    if (carouselItems.length) {
        const recommend = articles.slice(0, 4);
        carouselItems.forEach((item, i) => {
            const a = recommend[i % recommend.length];
            item.innerHTML = `
                <div class="carousel3d-card">
                    <img src="${a.image}" alt="">
                    <p>${a.title}</p>
                </div>
            `;
            item.addEventListener("click", () => {
                window.location.href = `article.html?id=${encodeURIComponent(a.id)}`;
            });
        });

        const total = carouselItems.length;
        let currentIndex = 0;
        let autoTimer = null;

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

        function goNext() {
            currentIndex = (currentIndex + 1) % total;
            updateCarouselPositions();
        }

        function goPrev() {
            currentIndex = (currentIndex - 1 + total) % total;
            updateCarouselPositions();
        }

        function resetAuto() {
            if (autoTimer) clearInterval(autoTimer);
            autoTimer = setInterval(goNext, 3000);
        }

        // 初期表示 + 自動スクロール開始
        updateCarouselPositions();
        resetAuto();

        // ボタンクリック
        if (nextBtn) {
            nextBtn.addEventListener("click", () => {
                goNext();
                resetAuto();
            });
        }
        if (prevBtn) {
            prevBtn.addEventListener("click", () => {
                goPrev();
                resetAuto();
            });
        }

        // スワイプ操作（スマホ）
        let touchStartX = null;
        let touchDragging = false;

        carousel.addEventListener("touchstart", (e) => {
            if (!e.touches[0]) return;
            touchStartX = e.touches[0].clientX;
            touchDragging = true;
        });

        carousel.addEventListener("touchend", (e) => {
            if (!touchDragging || touchStartX === null) return;
            const endX = e.changedTouches[0].clientX;
            const diff = endX - touchStartX;

            if (Math.abs(diff) > 40) {
                if (diff < 0) {
                    goNext();
                } else {
                    goPrev();
                }
                resetAuto();
            }
            touchDragging = false;
            touchStartX = null;
        });

        // マウスドラッグ（PC）
        let mouseStartX = null;
        let mouseDragging = false;

        carousel.addEventListener("mousedown", (e) => {
            mouseStartX = e.clientX;
            mouseDragging = true;
        });

        window.addEventListener("mouseup", () => {
            mouseDragging = false;
            mouseStartX = null;
        });

        carousel.addEventListener("mouseup", (e) => {
            if (!mouseDragging || mouseStartX === null) return;
            const diff = e.clientX - mouseStartX;

            if (Math.abs(diff) > 40) {
                if (diff < 0) {
                    goNext();
                } else {
                    goPrev();
                }
                resetAuto();
            }
            mouseDragging = false;
            mouseStartX = null;
        });
    }
}
