// =========================================
// 記事データ（JSONから読み込む）
// =========================================
let articles = [];

const rankingData = {
  daily: [102, 107, 104, 101, 106],
  weekly: [102, 101, 107, 103, 105],
  monthly: [105, 103, 102, 104, 106],
  allTime: [102, 107, 101, 105, 103],
};

// =========================================
// グローバル関数（記事ページ・サービスページに飛ぶ）
// =========================================
window.openArticle = function (id) {
  window.location.href = "article.html?id=" + id;
};

window.openService = function (service) {
  const encoded = encodeURIComponent(service);
  window.location.href = "service.html?service=" + encoded;
};

// =========================================
// 表示用の関数
// =========================================

function renderMostViewed() {
  if (!articles || articles.length === 0) return;
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

  if (!items || items.length === 0) {
    html =
      '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #86868B;">該当する記事が見つかりませんでした。</div>';
  } else {
    items.forEach((article) => {
      // サービス名クリックでサービス別ページへ
      html += `
          <article class="article-card" onclick="openArticle(${article.id})">
              <div class="card-image" style="background-image: url('${article.image}')"></div>
              <div class="card-body">
                  <span class="card-service" onclick="event.stopPropagation(); openService('${article.service}')">${article.service}</span>
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
  if (!articles || articles.length === 0) return;
  const sorted = [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  renderArticles(sorted.slice(0, 5), "latest-grid", true);
}

function renderRanking(type) {
  const ids = rankingData[type];
  const listContainer = document.getElementById("ranking-list");
  if (!listContainer || !articles || articles.length === 0) return;

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
            <span class="tag" style="font-size:0.7rem; margin-bottom:4px; cursor:pointer;" onclick="openService('${article.service}')">${article.service}</span>
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
– 検索
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

    const filtered = (articles || []).filter(
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
// JSON読み込み → 初期化
// =========================================

async function loadArticlesAndInit() {
  try {
    const res = await fetch("./data/articles.json");
    articles = await res.json();

    renderMostViewed();
    renderLatest();
    renderRanking("daily");
    initSearch();

    const revealElements = document.querySelectorAll(".reveal");
    revealElements.forEach((el) => observer.observe(el));
  } catch (e) {
    console.error("記事の読み込みに失敗しました", e);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadArticlesAndInit();
});
