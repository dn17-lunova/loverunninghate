/* Shared by the product waitlists and footer signup. */
const SUBSCRIBE_URL = 'https://xhvunpdtaucxmgxvfxou.supabase.co/functions/v1/subscribe';
function bindForm(form, source) {
  const field = form.querySelector('input[type="email"]');
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('[role="status"]');
  const label = button.textContent;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.getAttribute('aria-busy') === 'true' || field.disabled) return;
    field.value = field.value.trim();
    if (!form.reportValidity()) return;
    const email = field.value;
    form.setAttribute('aria-busy', 'true');
    button.disabled = true;
    field.readOnly = true;
    button.textContent = 'Sending…';
    status.textContent = 'Sending your email…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(SUBSCRIBE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Subscription failed');
      button.textContent = "You're on the list";
      status.textContent = "You're on the list. We'll email you with updates.";
      field.disabled = true;
    } catch (error) {
      button.disabled = false;
      button.textContent = label;
      status.textContent = "We couldn't add you to the list. Please try again.";
      field.focus();
    } finally {
      clearTimeout(timeout);
      field.readOnly = false;
      form.setAttribute('aria-busy', 'false');
    }
  });
}
document.querySelectorAll('.notify-form').forEach(form => {
  bindForm(form, form.closest('.acc-item').dataset.product.toLowerCase());
});
bindForm(document.getElementById('subscribeForm'), 'subscribe');
