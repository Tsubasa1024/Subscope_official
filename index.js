// =========================================
// 記事データ
// =========================================
const articles = [
  {
    id: 101,
    title: "Spotifyの「AI DJ」機能が日本でも解禁。まるでラジオDJ",
    service: "Spotify",
    // =========================================
// 記事データ
// =========================================
const articles = [
  {
    id: 101,
    title: "Spotifyの「AI DJ」機能が日本でも解禁。まるでラジオDJ",
    service: "Spotify",
    description:
      "ユーザーの好みを学習し、曲解説までしてくれる革新的なAI機能がついに日本上陸。使用感を徹底レビュー。",
    views: 12500,
    date: "2023-10-25",
    tags: ["#新機能", "#AI"],
    image:
      "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 102,
    title:
      "Apple Music、カラオケ機能「Sing」の精度が向上。ボーカル調整がより自然に",
    service: "Apple Music",
    description:
      "iOS 17.1アップデートにより、ボーカルキャンセルのアルゴリズムが刷新。微細な息遣いまで消せるように。",
    views: 45000,
    date: "2023-10-28",
    tags: ["#アップデート", "#iOS"],
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 103,
    title: "Netflix、プラン改定を発表。広告付きプランでも画質が1080p対応へ",
    service: "Netflix",
    description:
      "これまで720pだった広告付きベーシックプランがアップグレード。コスパ最強の選択肢となるか？",
    views: 8900,
    date: "2023-10-26",
    tags: ["#ニュース", "#プラン変更"],
    image:
      "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 104,
    title:
      "Notion AIが進化。データベースの自動要約機能がプロジェクト管理を変える",
    service: "Notion",
    description:
      "データベース内のテキストプロパティを一括で読み取り、ステータスや要約を自動生成する新機能。",
    views: 32000,
    date: "2023-10-29",
    tags: ["#機能解説", "#仕事効率化"],
    image:
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 105,
    title:
      "YouTube Premium、動画の「続きを見る」がデバイス間でよりシームレスに",
    service: "YouTube",
    description:
      "スマホで見ていた動画の続きをPCで再生する際の同期速度が大幅改善。細かな使い勝手が向上。",
    views: 15000,
    date: "2023-10-27",
    tags: ["#アップデート", "#UX改善"],
    image:
      "https://images.unsplash.com/photo-1526045612212-70caf35c14df?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 106,
    title:
      "Adobe Lightroom Web版、ブラウザだけで高度なマスキング編集が可能に",
    service: "Adobe CC",
    description:
      "アプリ版に迫る機能をブラウザで実現。外出先での現像作業がiPadなしでも完結するレベルへ。",
    views: 5600,
    date: "2023-10-24",
    tags: ["#Web版", "#新機能"],
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 107,
    title:
      "ChatGPT Plus、画像解析機能が全ユーザーに開放。手書きメモもコード化可能",
    service: "OpenAI",
    description:
      "マルチモーダル機能が標準搭載に。ホワイトボードの写真からWebサイトを作る実験を公開。",
    views: 41000,
    date: "2023-10-29",
    tags: ["#AI", "#検証"],
    image:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
  },
];

const rankingData = {
  daily: [102, 107, 104, 101, 106],
  weekly: [102, 101, 107, 103, 105],
  monthly: [105, 103, 102, 104, 106],
  allTime: [102, 107, 101, 105, 103],
};

// =========================================
// 記事ページに飛ぶ関数
// =========================================
window.openArticle = function (id) {
  window.location.href = "article.html?id=" + id;
};

// =========================================
// 表示用の関数
// =========================================

function renderMostViewed() {
  const topArticle = articles.reduce((prev, current) =>
    prev.views > current.views ? prev : current
  );
  const container = document.getElementById("most-viewed-content");
  if (container) {
    container.innerHTML = `
      <article class="featured-card" style="background-image: url('${topArticle.image}')" onclick="openArticle(${topArticle.id})">
          <div class="featured-content">
              <div class="featured-meta">
                  <span class="tag">${topArticle.tags[0]}</span> ${topArticle.service}
              </div>
              <h3 class="featured-title">${topArticle.title}</h3>
              <p class="featured-desc">${topArticle.description}</p>
              <button class="btn-read">続きを読む</button>
          </div>
      </article>
  `;
  }
}

function renderArticles(items, containerId, showAd = true) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  let html = "";

  if (items.length === 0) {
    html =
      '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #86868B;">該当する記事が見つかりませんでした。</div>';
  } else {
    items.forEach((article) => {
      html += `
          <article class="article-card" onclick="openArticle(${article.id})">
              <div class="card-image" style="background-image: url('${article.image}')"></div>
              <div class="card-body">
                  <span class="card-service">${article.service}</span>
                  <h3 class="card-title">${article.title}</h3>
                  <p class="card-desc">${article.description}</p>
                  <span class="card-date">${article.date.replace(/-/g, ".")}</span>
              </div>
          </article>
      `;
    });

    if (showAd) {
      html += `
          <div class="article-card placeholder-card">
              <div>Advertisement<br><span style="font-size:0.8em; opacity:0.6;">(Placeholder)</span></div>
          </div>
      `;
    }
  }

  grid.innerHTML = html;
}

function renderLatest() {
  const sorted = [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  renderArticles(sorted.slice(0, 5), "latest-grid", true);
}

function renderRanking(type) {
  const ids = rankingData[type];
  const listContainer = document.getElementById("ranking-list");
  if (!listContainer) return;

  listContainer.innerHTML = "";

  ids.forEach((id, index) => {
    const article = articles.find((a) => a.id === id);
    if (!article) return;

    const li = document.createElement("li");
    li.className = "ranking-item";
    li.innerHTML = `
        <span class="rank-number">${index + 1}</span>
        <img class="rank-thumb" src="${article.image}" alt="${article.title}">
        <div class="rank-content">
            <span class="tag" style="font-size:0.7rem; margin-bottom:4px;">${article.service}</span>
            <h4 class="rank-title" onclick="openArticle(${article.id})">${article.title}</h4>
            <div class="rank-meta">
                ${article.views.toLocaleString()} views
            </div>
        </div>
    `;
    listContainer.appendChild(li);
  });
}

// =========================================
// HTML から呼ばれる関数（タブ切り替え・スクロール・メニュー）
// =========================================

window.switchTab = function (type) {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.classList.remove("active");
    const onclickAttr = btn.getAttribute("onclick");
    if (onclickAttr && onclickAttr.includes(`'${type}'`)) {
      btn.classList.add("active");
    }
  });
  renderRanking(type);
};

window.smoothScroll = function (selector) {
  const target = document.querySelector(selector);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

window.toggleMenu = function () {
  const menu = document.getElementById("nav-overlay");
  if (menu) {
    menu.classList.toggle("open");
  }
};

// =========================================
// 検索
// =========================================

function initSearch() {
  const searchInput = document.getElementById("search-input");
  const latestTitle = document.getElementById("latest-title");

  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const target = e.target;
    const query = target.value.toLowerCase().trim();

    const sectionsToHide = [
      document.getElementById("hero-featured-wrapper"),
      document.getElementById("shortcuts"),
      document.getElementById("ranking"),
    ];

    if (!query) {
      renderLatest();
      sectionsToHide.forEach((el) => {
        if (el) el.style.display = "flex";
      });
      if (latestTitle) latestTitle.innerText = "最新の記事";

      const grid = document.getElementById("latest-grid");
      if (grid) grid.classList.add("active");

      return;
    }

    const filtered = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.service.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query))
    );

    renderArticles(filtered, "latest-grid", false);

    sectionsToHide.forEach((el) => {
      if (el) el.style.display = "none";
    });
    if (latestTitle)
      latestTitle.innerText = `検索結果 (${filtered.length}件)`;

    const grid = document.getElementById("latest-grid");
    if (grid) grid.classList.add("active");
  });
}

// =========================================
// スクロール時のフェードイン
// =========================================

const observerOptions = {
  root: null,
  rootMargin: "0px",
  threshold: 0.15,
};

const observer = new IntersectionObserver((entries, observerInstance) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
      observerInstance.unobserve(entry.target);
    }
  });
}, observerOptions);

// =========================================
// 初期化
// =========================================

window.addEventListener("DOMContentLoaded", () => {
  renderMostViewed();
  renderLatest();
  renderRanking("daily");
  initSearch();

  const revealElements = document.querySelectorAll(".reveal");
  revealElements.forEach((el) => observer.observe(el));
});
:
      "ユーザーの好みを学習し、曲解説までしてくれる革新的なAI機能がついに日本上陸。使用感を徹底レビュー。",
    views: 12500,
    date: "2023-10-25",
    tags: ["#新機能", "#AI"],
    image:
      "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 102,
    title: "Apple Music、カラオケ機能「Sing」の精度が向上。ボーカル調整がより自然に",
    service: "Apple Music",
    description:
      "iOS 17.1アップデートにより、ボーカルキャンセルのアルゴリズムが刷新。微細な息遣いまで消せるように。",
    views: 45000,
    date: "2023-10-28",
    tags: ["#アップデート", "#iOS"],
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 103,
    title: "Netflix、プラン改定を発表。広告付きプランでも画質が1080p対応へ",
    service: "Netflix",
    description:
      "これまで720pだった広告付きベーシックプランがアップグレード。コスパ最強の選択肢となるか？",
    views: 8900,
    date: "2023-10-26",
    tags: ["#ニュース", "#プラン変更"],
    image:
      "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 104,
    title: "Notion AIが進化。データベースの自動要約機能がプロジェクト管理を変える",
    service: "Notion",
    description:
      "データベース内のテキストプロパティを一括で読み取り、ステータスや要約を自動生成する新機能。",
    views: 32000,
    date: "2023-10-29",
    tags: ["#機能解説", "#仕事効率化"],
    image:
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 105,
    title: "YouTube Premium、動画の「続きを見る」がデバイス間でよりシームレスに",
    service: "YouTube",
    description:
      "スマホで見ていた動画の続きをPCで再生する際の同期速度が大幅改善。細かな使い勝手が向上。",
    views: 15000,
    date: "2023-10-27",
    tags: ["#アップデート", "#UX改善"],
    image:
      "https://images.unsplash.com/photo-1526045612212-70caf35c14df?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 106,
    title: "Adobe Lightroom Web版、ブラウザだけで高度なマスキング編集が可能に",
    service: "Adobe CC",
    description:
      "アプリ版に迫る機能をブラウザで実現。外出先での現像作業がiPadなしでも完結するレベルへ。",
    views: 5600,
    date: "2023-10-24",
    tags: ["#Web版", "#新機能"],
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 107,
    title: "ChatGPT Plus、画像解析機能が全ユーザーに開放。手書きメモもコード化可能",
    service: "OpenAI",
    description:
      "マルチモーダル機能が標準搭載に。ホワイトボードの写真からWebサイトを作る実験を公開。",
    views: 41000,
    date: "2023-10-29",
    tags: ["#AI", "#検証"],
    image:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
  },
];

const rankingData = {
  daily: [102, 107, 104, 101, 106],
  weekly: [102, 101, 107, 103, 105],
  monthly: [105, 103, 102, 104, 106],
  allTime: [102, 107, 101, 105, 103],
};

// =========================================
// 表示用の関数
// =========================================

function renderMostViewed() {
  const topArticle = articles.reduce((prev, current) =>
    prev.views > current.views ? prev : current
  );
  const container = document.getElementById("most-viewed-content");
  if (container) {
    container.innerHTML = `
      <article class="featured-card" style="background-image: url('${topArticle.image}')">
          <div class="featured-content">
              <div class="featured-meta">
                  <span class="tag">${topArticle.tags[0]}</span> ${topArticle.service}
              </div>
              <h3 class="featured-title">${topArticle.title}</h3>
              <p class="featured-desc">${topArticle.description}</p>
              <button class="btn-read">続きを読む</button>
          </div>
      </article>
  `;
  }
}

function renderArticles(items, containerId, showAd = true) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  let html = "";

  if (items.length === 0) {
    html =
      '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #86868B;">該当する記事が見つかりませんでした。</div>';
  } else {
    items.forEach((article) => {
      html += `
          <article class="article-card">
              <div class="card-image" style="background-image: url('${article.image}')"></div>
              <div class="card-body">
                  <span class="card-service">${article.service}</span>
                  <h3 class="card-title">${article.title}</h3>
                  <p class="card-desc">${article.description}</p>
                  <span class="card-date">${article.date.replace(/-/g, ".")}</span>
              </div>
          </article>
      `;
    });

    if (showAd) {
      html += `
          <div class="article-card placeholder-card">
              <div>Advertisement<br><span style="font-size:0.8em; opacity:0.6;">(Placeholder)</span></div>
          </div>
      `;
    }
  }

  grid.innerHTML = html;
}

function renderLatest() {
  const sorted = [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  renderArticles(sorted.slice(0, 5), "latest-grid", true);
}

function renderRanking(type) {
  const ids = rankingData[type];
  const listContainer = document.getElementById("ranking-list");
  if (!listContainer) return;

  listContainer.innerHTML = "";

  ids.forEach((id, index) => {
    const article = articles.find((a) => a.id === id);
    if (!article) return;

    const li = document.createElement("li");
    li.className = "ranking-item";
    li.innerHTML = `
        <span class="rank-number">${index + 1}</span>
        <img class="rank-thumb" src="${article.image}" alt="${article.title}">
        <div class="rank-content">
            <span class="tag" style="font-size:0.7rem; margin-bottom:4px;">${article.service}</span>
            <h4 class="rank-title">${article.title}</h4>
            <div class="rank-meta">
                ${article.views.toLocaleString()} views
            </div>
        </div>
    `;
    listContainer.appendChild(li);
  });
}

// =========================================
// HTML から呼ばれる関数（タブ切り替え・スクロール・メニュー）
// =========================================

window.switchTab = function (type) {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.classList.remove("active");
    const onclickAttr = btn.getAttribute("onclick");
    if (onclickAttr && onclickAttr.includes(`'${type}'`)) {
      btn.classList.add("active");
    }
  });
  renderRanking(type);
};

window.smoothScroll = function (selector) {
  const target = document.querySelector(selector);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

window.toggleMenu = function () {
  const menu = document.getElementById("nav-overlay");
  if (menu) {
    menu.classList.toggle("open");
  }
};

// =========================================
// 検索
// =========================================

function initSearch() {
  const searchInput = document.getElementById("search-input");
  const latestTitle = document.getElementById("latest-title");

  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const target = e.target;
    const query = target.value.toLowerCase().trim();

    const sectionsToHide = [
      document.getElementById("hero-featured-wrapper"),
      document.getElementById("shortcuts"),
      document.getElementById("ranking"),
    ];

    if (!query) {
      renderLatest();
      sectionsToHide.forEach((el) => {
        if (el) el.style.display = "flex";
      });
      if (latestTitle) latestTitle.innerText = "最新の記事";

      const grid = document.getElementById("latest-grid");
      if (grid) grid.classList.add("active");

      return;
    }

    const filtered = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.service.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query))
    );

    renderArticles(filtered, "latest-grid", false);

    sectionsToHide.forEach((el) => {
      if (el) el.style.display = "none";
    });
    if (latestTitle)
      latestTitle.innerText = `検索結果 (${filtered.length}件)`;

    const grid = document.getElementById("latest-grid");
    if (grid) grid.classList.add("active");
  });
}

// =========================================
// スクロール時のフェードイン
// =========================================

const observerOptions = {
  root: null,
  rootMargin: "0px",
  threshold: 0.15,
};

const observer = new IntersectionObserver((entries, observerInstance) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
      observerInstance.unobserve(entry.target);
    }
  });
}, observerOptions);

// =========================================
// 初期化
// =========================================

window.addEventListener("DOMContentLoaded", () => {
  renderMostViewed();
  renderLatest();
  renderRanking("daily");
  initSearch();

  const revealElements = document.querySelectorAll(".reveal");
  revealElements.forEach((el) => observer.observe(el));
});

