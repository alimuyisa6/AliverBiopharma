export function initRevealObserver() {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealSelector = [
    '#main-content [data-scroll-reveal]',
    '#main-content .section',
    '#main-content .section > .card',
    '#main-content .section > .grid > *',
    '#main-content .section > .section-grid > *',
    '#main-content .reveal',
    '#main-content .scroll-reveal'
  ].join(', ');

  const revealImmediately = () => {
    document.querySelectorAll(revealSelector).forEach((element) => {
      element.classList.add('scroll-reveal', 'is-visible');
      element.classList.add('in');
    });
  };

  if (!('IntersectionObserver' in window) || motionQuery.matches) {
    revealImmediately();
    return () => {};
  }

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible', 'in');
      activeObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.04,
    rootMargin: '0px 0px -32px 0px'
  });

  const prepare = (root = document) => {
    if (root.nodeType === Node.ELEMENT_NODE && root.matches?.(revealSelector)) {
      root.classList.add('scroll-reveal');
      if (!root.classList.contains('is-visible')) observer.observe(root);
    }

    root.querySelectorAll?.(revealSelector).forEach((element) => {
      element.classList.add('scroll-reveal');
      if (!element.classList.contains('is-visible')) observer.observe(element);
    });
  };

  prepare();

  let frame = 0;
  const mutations = new MutationObserver((records) => {
    if (!records.some((record) => record.addedNodes.length)) return;
    if (frame) return;

    frame = requestAnimationFrame(() => {
      frame = 0;
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) prepare(node);
        });
      });
    });
  });

  mutations.observe(document.body, { childList: true, subtree: true });

  const handleMotionChange = (event) => {
    if (!event.matches) return;
    revealImmediately();
    observer.disconnect();
  };

  motionQuery.addEventListener?.('change', handleMotionChange);

  return () => {
    observer.disconnect();
    mutations.disconnect();
    motionQuery.removeEventListener?.('change', handleMotionChange);
    if (frame) cancelAnimationFrame(frame);
  };
}
