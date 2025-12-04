// ===============================
//   3D おすすめ記事カルーセル
// ===============================
(function () {
    const carousel = document.querySelector('.carousel3d');
    if (!carousel) return;

    const inner = carousel.querySelector('.carousel3d-inner');
    const items = inner.querySelectorAll('.carousel3d-item');
    const itemCount = items.length;

    if (itemCount === 0) return;

    const radius = 320; // メリーゴーランドの奥行き距離
    let currentIndex = 0;

    // 円周上の配置
    items.forEach((item, i) => {
        const angle = (360 / itemCount) * i;
        item.style.transform =
            `rotateY(${angle}deg) translateZ(${radius}px) translate(-50%, -50%)`;
    });

    // 回転
    function rotateCarousel() {
        const angle = - (360 / itemCount) * currentIndex;
        inner.style.transform = `translateZ(-260px) rotateY(${angle}deg)`;

        items.forEach((item, i) => {
            item.classList.toggle('is-active', i === currentIndex);
        });
    }

    rotateCarousel();

    // 自動ループ 3秒
    setInterval(() => {
        currentIndex = (currentIndex + 1) % itemCount;
        rotateCarousel();
    }, 3000);
})();
