// ===============================
//   3D おすすめ記事カルーセル
// ===============================

document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('.carousel3d');
    if (!carousel) return;

    const inner = carousel.querySelector('.carousel3d-inner');
    const items = inner.querySelectorAll('.carousel3d-item');
    const itemCount = items.length;
    if (itemCount === 0) return;

    const radius = 320;  // メリーゴーランドの半径
    let currentIndex = 0;

    // ① スライドを円周上に配置
    items.forEach((item, i) => {
        const angle = (360 / itemCount) * i;
        item.style.transform =
            `rotateY(${angle}deg) translateZ(${radius}px) translate(-50%, -50%)`;
    });

    // ② 回転させて「手前の1枚」を切り替え
    function rotateCarousel() {
        const angle = - (360 / itemCount) * currentIndex;
        inner.style.transform = `translateZ(-260px) rotateY(${angle}deg)`;

        items.forEach((item, i) => {
            item.classList.toggle('is-active', i === currentIndex);
        });
    }

    // 初期状態
    rotateCarousel();

    // ③ 3秒ごとに自動で次へ
    setInterval(() => {
        currentIndex = (currentIndex + 1) % itemCount;
        rotateCarousel();
    }, 3000);
});
