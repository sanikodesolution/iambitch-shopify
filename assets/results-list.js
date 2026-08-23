import { mediaQueryLarge, requestIdleCallback, startViewTransition } from '@theme/utilities';
import PaginatedList from '@theme/paginated-list';

/**
 * A custom element that renders a paginated results list in Horizon theme
 */
export default class ResultsList extends PaginatedList {
  #observer = null;

  connectedCallback() {
    super.connectedCallback();

    mediaQueryLarge.addEventListener('change', this.#handleMediaQueryChange);
    this.setAttribute('initialized', '');

    // Observe changes when filters update or reset via AJAX
    this.#setupObserver();
  }

  disconnectedCallback() {
    if (typeof super.disconnectedCallback === 'function') {
      super.disconnectedCallback();
    }
    mediaQueryLarge.removeEventListener('change', this.#handleMediaQueryChange);

    if (this.#observer) {
      this.#observer.disconnect();
    }
  }

  /**
   * Updates the layout.
   *
   * @param {Event} event
   */
  updateLayout({ target }) {
    if (!(target instanceof HTMLInputElement)) return;

    this.#animateLayoutChange(target.value);
  }

  /**
   * Animates the layout change.
   *
   * @param {string} value
   */
  #animateLayoutChange = async (value) => {
    const { grid } = this.refs || {};

    if (!grid) return;

    await startViewTransition(() => this.#setLayout(value), ['product-grid']);

    requestIdleCallback(() => {
      const viewport = mediaQueryLarge.matches ? 'desktop' : 'mobile';
      sessionStorage.setItem(`product-grid-view-${viewport}`, value);
    });
  };

  /**
   * Sets the layout.
   *
   * @param {string} value
   */
  #setLayout(value) {
    const { grid } = this.refs || {};
    const targetGrid = grid || this.querySelector('.collection-wrapper') || this;
    if (!targetGrid) return;
    targetGrid.setAttribute('product-grid-view', value || 'default');
  }

  /**
   * Re-initializes Horizon web components and section scripts after AJAX filter/clear
   */
  #setupObserver() {
    this.#observer = new MutationObserver(() => {
      // Re-upgrade custom web components inside newly loaded cards
      if (typeof customElements !== 'undefined' && customElements.upgrade) {
        customElements.upgrade(this);
      }

      // Notify theme and review apps to re-render card contents
      const sectionId = this.getAttribute('section-id') || this.dataset.sectionId;
      document.dispatchEvent(
        new CustomEvent('shopify:section:load', {
          bubbles: true,
          detail: { sectionId },
        })
      );
    });

    this.#observer.observe(this, { childList: true, subtree: true });
  }

  /**
   * Handles the media query change event.
   *
   * @param {MediaQueryListEvent} event
   */
  #handleMediaQueryChange = (event) => {
    const targetElement = event.matches
      ? this.querySelector('[data-grid-layout="desktop-default-option"]')
      : this.querySelector('[data-grid-layout="mobile-option"]');

    if (!(targetElement instanceof HTMLInputElement)) return;

    targetElement.checked = true;
    this.#setLayout('default');
  };
}

if (!customElements.get('results-list')) {
  customElements.define('results-list', ResultsList);
}