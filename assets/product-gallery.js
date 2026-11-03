/* Native horizontal scrolling supports touch, trackpads and keyboard browsing. */
document.querySelectorAll('.product-gallery').forEach(gallery => {
  const track = gallery.querySelector('.gallery-track');
  const thumbs = [...gallery.querySelectorAll('.gallery-thumbs button')];
  const status = gallery.querySelector('[role="status"]');
  const current = () => Math.round(track.scrollLeft / track.clientWidth);
  function show(index) {
    index = (index + thumbs.length) % thumbs.length;
    track.scrollTo({ left: index * track.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function update() {
    const index = current();
    thumbs.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    status.textContent = `${index + 1} / ${thumbs.length}`;
  }
  gallery.querySelector('[data-prev]').addEventListener('click', () => show(current() - 1));
  gallery.querySelector('[data-next]').addEventListener('click', () => show(current() + 1));
  thumbs.forEach((button, i) => button.addEventListener('click', () => show(i)));
  track.addEventListener('scroll', update, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(current() + (event.key === 'ArrowRight' ? 1 : -1));
  });
});
