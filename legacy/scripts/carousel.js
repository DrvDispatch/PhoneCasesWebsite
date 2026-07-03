export function initCarousel({ trackSelector, prevSelector, nextSelector, items }) {
  const track = document.querySelector(trackSelector);
  const prevButton = document.querySelector(prevSelector);
  const nextButton = document.querySelector(nextSelector);

  if (!track || !prevButton || !nextButton) return;

  track.innerHTML = items
    .map(
      item => `
        <a class="carousel-item" href="${item.href}" target="_blank" rel="noopener noreferrer">
          <img src="${item.image}" alt="${item.name} collection" loading="lazy" referrerpolicy="no-referrer" />
          <span class="carousel-item-title">${item.name}</span>
        </a>
      `
    )
    .join("");

  let currentIndex = 0;

  const getStep = () => {
    const firstItem = track.querySelector(".carousel-item");
    if (!firstItem) return 0;
    const gap = 16;
    return firstItem.offsetWidth + gap;
  };

  const getMaxIndex = () => {
    const step = getStep();
    if (!step) return 0;
    const viewport = track.parentElement;
    const hiddenWidth = Math.max(0, track.scrollWidth - viewport.clientWidth);
    return Math.ceil(hiddenWidth / step);
  };

  const update = () => {
    const step = getStep();
    track.style.transform = `translateX(-${currentIndex * step}px)`;
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex >= getMaxIndex();
  };

  prevButton.addEventListener("click", () => {
    currentIndex = Math.max(0, currentIndex - 1);
    update();
  });

  nextButton.addEventListener("click", () => {
    currentIndex = Math.min(getMaxIndex(), currentIndex + 1);
    update();
  });

  window.addEventListener("resize", update);
  update();
}
