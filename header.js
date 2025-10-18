// header.js — place in site root (e.g. https://youruser.github.io/yourrepo/header.js)
// Exposes window.initHeader(), idempotent.

(function () {
  // make idempotent
  function initHeader() {
    if (window._headerInitDone) return;
    window._headerInitDone = true;

    const btn = document.getElementById('topMenuBtn');
    const dropdown = document.getElementById('topMenuDropdown');
    if (!btn || !dropdown) return;

    let menuLoaded = false;

    async function loadMenuHtml() {
      try {
        const url = new URL('menu.html', location.href).href;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
        const html = await res.text();
        dropdown.innerHTML = html.trim();

        // add roles & keyboard handling to links
        dropdown.querySelectorAll('a').forEach(a => {
          a.setAttribute('role', 'menuitem');
          a.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
          });
        });

        // fallback if menu empty
        if (!dropdown.querySelector('ul') && dropdown.querySelectorAll('a').length === 0) {
          dropdown.innerHTML = '<div class="menu-note">No navigation found.</div>';
        }

        menuLoaded = true;
      } catch (err) {
        console.error('Menu load failed:', err);
        dropdown.innerHTML = '<div class="menu-note" style="color:#b33;">Failed to load menu</div>';
        menuLoaded = true;
      }
    }

    function openMenu() {
      btn.setAttribute('aria-expanded', 'true');
      dropdown.classList.add('open');
      // focus first focusable or the dropdown itself
      const first = dropdown.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      if (first) first.focus(); else dropdown.focus();
      document.addEventListener('click', outsideClickHandler);
      document.addEventListener('keydown', keyHandler);
    }

    function closeMenu() {
      btn.setAttribute('aria-expanded', 'false');
      dropdown.classList.remove('open');
      try { btn.focus(); } catch (e) {}
      document.removeEventListener('click', outsideClickHandler);
      document.removeEventListener('keydown', keyHandler);
    }

    function outsideClickHandler(e) {
      if (!dropdown.contains(e.target) && !btn.contains(e.target)) closeMenu();
    }

    function keyHandler(e) {
      if (e.key === 'Escape') return closeMenu();

      if (['ArrowDown', 'ArrowUp'].includes(e.key) && dropdown.classList.contains('open')) {
        const items = Array.from(dropdown.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')).filter(Boolean);
        if (items.length === 0) return;
        e.preventDefault();
        const idx = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') {
          const next = items[(idx + 1) % items.length];
          next.focus();
        } else {
          const prev = items[(idx - 1 + items.length) % items.length];
          prev.focus();
        }
      }
    }

    btn.addEventListener('click', async (e) => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      if (open) { closeMenu(); return; }

      if (!menuLoaded) {
        dropdown.innerHTML = '<div class="menu-note">Loading navigation…</div>';
        await loadMenuHtml();
      }
      openMenu();
    });

    // allow keyboard to open and focus first item
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!dropdown.classList.contains('open')) btn.click();
        const first = dropdown.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
        if (first) first.focus();
      }
    });

    // close when a link inside is clicked (let navigation proceed)
    dropdown.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) closeMenu();
    });

    // adaptive behaviour: nothing heavy needed; CSS handles the small-screen layout
    window.addEventListener('resize', () => { /* kept intentionally minimal */ });
  }

  // Expose globally so index.html can call initHeader after injecting header.html
  window.initHeader = initHeader;
})();
