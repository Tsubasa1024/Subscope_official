// ----------------------------------
// 7. 3D おすすめカルーセル
//    → .carousel3d 内の .carousel3d-item を3D配置
// ----------------------------------
(function () {
    const carousel = document.querySelector(".carousel3d");
    if (!carousel) return;

    const items = carousel.querySelectorAll(".carousel3d-item");
    const prevBtn = carousel.querySelector(".carousel3d-nav-prev");
    const nextBtn = carousel.querySelector(".carousel3d-nav-next");

    if (!items.length || !prevBtn || !nextBtn) return;

    const total = items.length;
    let currentIndex = 0;

    // 位置を更新（is-center / is-left / is-right / is-back を付け替える）
    function updatePositions() {
        items.forEach((item, i) => {
            item.classList.remove("is-center", "is-left", "is-right", "is-back");

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

    // 🔹左右どっちもちゃんとイベントを付ける
    nextBtn.addEventListener("click", goNext);
    prevBtn.addEventListener("click", goPrev);

    // 初期配置
    updatePositions();
})();
