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
  let drag = null;
  let moved = false;
  track.addEventListener('dragstart', event => event.preventDefault());
  track.addEventListener('pointerdown', event => {
    moved = false;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { x: event.clientX, left: track.scrollLeft };
    track.setPointerCapture(event.pointerId);
  });
  track.addEventListener('pointermove', event => {
    if (!drag) return;
    const distance = event.clientX - drag.x;
    if (Math.abs(distance) > 8) moved = true;
    if (!moved) return;
    track.classList.add('is-dragging');
    track.scrollLeft = drag.left - distance;
  });
  function finishDrag() {
    if (!drag) return;
    drag = null;
    const index = current();
    track.classList.remove('is-dragging');
    if (moved) show(index);
  }
  track.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  track.addEventListener('click', () => { if (!moved) show(current() + 1); });
  track.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(current() + (event.key === 'ArrowRight' ? 1 : -1));
  });
});
