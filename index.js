/* =========================================================
   1. 記事データ
   ========================================================= */
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
        description: "2025年に観るべき Netflix のおすすめ作品を紹介。",
        service: "Netflix",
        tags: ["映画", "ドラマ", "動画配信"],
        category: "映像",
        date: "2025-11-20",
        image: "images/sample2.jpg",
        views: 420
    },
    {
        id: "spotify-vs-applemusic",
        title: "Spotify vs Apple Music 徹底比較",
        description: "音質 / 機能 / 料金 / UI / レコメンドを総合比較。",
        service: "音楽比較",
        tags: ["音楽", "比較"],
        category: "音楽",
        date: "2025-11-10",
        image: "images/sample3.jpg",
        views: 510
    }
];


/* =========================================================
   2. DOMContentLoaded
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {

    initHeaderSearchToggle();
    renderLatestArticles();
    initSearchSystem();

});


/* =========================================================
   3. 固定ヘッダーの検索トグル（🔍 → バー展開）
   ========================================================= */
function initHeaderSearchToggle() {
    const header = document.querySelector(".global-header");
    const toggleBtn = document.querySelector(".search-toggle");
    const searchInput = document.getElementById("searchInput");

    if (!header || !toggleBtn || !searchInput) return;

    // 🔍クリック → 検索バー展開/閉じる
    toggleBtn.addEventListener("click", () => {
        const isOpen = header.classList.toggle("is-search-open");
        if (isOpen) {
            setTimeout(() => searchInput.focus(), 180);
        } else {
            searchInput.blur();
        }
    });

    // ESC鍵で閉じる
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            header.classList.remove("is-search-open");
            searchInput.blur();
        }
    });
}


/* =========================================================
   4. 最新記事の表示（TOPページ）
   ========================================================= */
function renderLatestArticles() {
    const container = document.getElementById("latestArticles");
    if (!container) return;

    // 日付順でソートして3件表示
    const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sorted.slice(0, 3);

    container.innerHTML = recent
        .map(
            (a) => `
        <article class="article-card" onclick="location.href='article.html?id=${a.id}'">
            <h3>${a.title}</h3>
            <p>${a.description}</p>
        </article>`
        )
        .join("");
}


/* =========================================================
   5. 最強検索システム
   ========================================================= */
function initSearchSystem() {
    const input = document.getElementById("searchInput");
    const resultAreaId = "searchResultsArea";

    if (!input) return;

    // 結果表示用エリアを main の最初に追加
    let resultsArea = document.getElementById(resultAreaId);
    if (!resultsArea) {
        resultsArea = document.createElement("div");
        resultsArea.id = resultAreaId;
        resultsArea.style.marginTop = "20px";
        document.querySelector("main").prepend(resultsArea);
    }

    // 入力イベント
    input.addEventListener("input", () => {
        const keyword = input.value.trim().toLowerCase();

        if (keyword === "") {
            resultsArea.innerHTML = "";
            return;
        }

        // タイトル・説明・サービス名・タグ すべて検索対象
        const results = articles.filter((a) =>
            a.title.toLowerCase().includes(keyword) ||
            a.description.toLowerCase().includes(keyword) ||
            a.service.toLowerCase().includes(keyword) ||
            a.tags.some((t) => t.toLowerCase().includes(keyword))
        );

        // 検索結果を表示
        resultsArea.innerHTML = `
            <h2 style="font-size:16px;margin-bottom:12px;">検索結果 (${results.length} 件)</h2>
            ${results
                .map(
                    (a) => `
                <div class="article-card" onclick="location.href='article.html?id=${a.id}'">
                    <h3>${a.title}</h3>
                    <p>${a.description}</p>
                </div>
            `
                )
                .join("")}
        `;
    });
}
