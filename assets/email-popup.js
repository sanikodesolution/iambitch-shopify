(function () {
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, value, days) {
    let expires = '';
    if (days > 0) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
  }

  function initPopup(popup) {
    // Move the popup to be a direct child of <body>. This guarantees it can
    // never be visually trapped "inside" a transparent/sticky header or any
    // other ancestor that establishes its own stacking context, transform,
    // or overflow clipping — it always centers on the full viewport, above
    // everything else on the page.
    if (popup.parentElement !== document.body) {
      document.body.appendChild(popup);
    }

    const cookieName = popup.dataset.cookieName;
    const delay = parseInt(popup.dataset.delay, 10) || 0;
    const frequencyDays = parseInt(popup.dataset.frequency, 10) || 0;
    const overlay = popup.querySelector('[data-email-popup-overlay]');
    const closeBtn = popup.querySelector('[data-email-popup-close]');
    const form = popup.querySelector('form');

    // Skip auto-open if a submission just happened (Shopify reloads with a query string on error/success)
    const hasFormResponse =
      window.location.search.includes('customer%5Btags%5D') ||
      form?.querySelector('.email-popup__success, .email-popup__error');

    function openPopup() {
      popup.classList.add('is-visible');
      popup.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const input = popup.querySelector('input[type="email"]');
      if (input) input.focus({ preventScroll: true });
    }

    function closePopup(remember) {
      popup.classList.remove('is-visible');
      popup.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (remember) {
        setCookie(cookieName, 'true', frequencyDays);
      }
    }

    closeBtn.addEventListener('click', () => closePopup(true));
    overlay.addEventListener('click', () => closePopup(true));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('is-visible')) {
        closePopup(true);
      }
    });

    if (form && form.querySelector('.email-popup__success')) {
      // Successful subscribe: don't show again, and open briefly to show the message
      setCookie(cookieName, 'true', frequencyDays || 365);
      openPopup();
      return;
    }

    if (getCookie(cookieName) && !hasFormResponse) {
      return;
    }

    if (hasFormResponse) {
      openPopup();
      return;
    }

    window.setTimeout(openPopup, delay);
  }

  function initAll() {
    document.querySelectorAll('[data-email-popup]').forEach(initPopup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();