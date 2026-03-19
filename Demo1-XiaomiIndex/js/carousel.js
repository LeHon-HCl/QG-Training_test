const carouselInner = document.querySelector('.carousel-inner');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
const dots = document.querySelectorAll('.dot');
const totalSlides = document.querySelectorAll('.carousel-inner img').length;
let currentIndex = 0;       // 当前显示第几张（0 开始）

// 更新轮播位置和指示点状态
function updateCarousel() {
  // 移动容器，负值向左移动
  carouselInner.style.transform = `translateX(-${currentIndex * 992}px)`;
  // 更新指示点激活状态
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentIndex);
  });
}

// 下一张
function nextSlide() {
  currentIndex = (currentIndex + 1) % totalSlides; // 取模实现循环
  updateCarousel();
}

// 上一张
function prevSlide() {
  currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
  updateCarousel();
}

// 点击按钮
nextBtn.addEventListener('click', nextSlide);
prevBtn.addEventListener('click', prevSlide);

// 点击指示点
dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    currentIndex = index;
    updateCarousel();
  });
});

// 可选：自动播放（每 3 秒切换）
let autoPlay = setInterval(nextSlide, 3000);

// 鼠标悬停时暂停自动播放
const carousel = document.querySelector('.carousel');
carousel.addEventListener('mouseenter', () => clearInterval(autoPlay));
carousel.addEventListener('mouseleave', () => {
  autoPlay = setInterval(nextSlide, 3000);
});