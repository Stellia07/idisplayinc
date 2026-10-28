(function () {
  var sec = document.getElementById('clients'); if (!sec || !window.ProjectStore) return;
  var track = document.getElementById('ctrack'), wrap = document.getElementById('ctrackwrap'), nav = document.getElementById('cnav');
  var timer = null, paused = false, loaded = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function initials(n) { return n.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }
  function step() { var c = track.querySelector('.cc'); return c ? c.getBoundingClientRect().width + 16 : 240; }
  function canScroll() { return wrap.scrollWidth > wrap.clientWidth + 4; }
  function scrollNext(dir) {
    var max = wrap.scrollWidth - wrap.clientWidth;
    if (dir > 0 && wrap.scrollLeft >= max - 4) wrap.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
    else if (dir < 0 && wrap.scrollLeft <= 4) wrap.scrollTo({ left: max, behavior: reduce ? 'auto' : 'smooth' });
    else wrap.scrollBy({ left: dir * step(), behavior: reduce ? 'auto' : 'smooth' });
  }
  function play() {
    clearInterval(timer);
    if (reduce || !canScroll()) return;
    timer = setInterval(function () { if (!paused && !document.hidden) scrollNext(1); }, 3500);
  }
  function render(list) {
    if (!list.length) { sec.hidden = true; return; }
    track.textContent = '';
    list.forEach(function (c) {
      var li = el('li', 'cc'), lg = el('div', 'lg');
      function fallback() { lg.textContent = ''; lg.appendChild(el('span', 'ini', initials(c.name))); }
      if (c.logo) {
        var im = el('img'); im.loading = 'lazy'; im.decoding = 'async'; im.alt = ''; im.onerror = fallback; im.src = c.logo; lg.appendChild(im);
      } else fallback();
      li.appendChild(lg); li.appendChild(el('p', 'nm', c.name)); track.appendChild(li);
    });
    nav.hidden = !canScroll();
    window.addEventListener('resize', function () { nav.hidden = !canScroll(); play(); });
    document.getElementById('cprev').onclick = function () { scrollNext(-1); };
    document.getElementById('cnext').onclick = function () { scrollNext(1); };
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { sec.addEventListener(ev, function () { paused = true; }, { passive: true }); });
    ['mouseleave', 'focusout', 'touchend'].forEach(function (ev) { sec.addEventListener(ev, function () { paused = false; }, { passive: true }); });
    play();
  }
  function load() {
    if (loaded) return; loaded = true;
    ProjectStore.withTimeout(ProjectStore.listClients()).then(render).catch(function (e) { console.error(e); sec.hidden = true; });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '600px' });
    io.observe(sec);
  } else load();
})();
