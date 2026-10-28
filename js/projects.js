(function () {
  if (!window.ProjectStore) { var g0 = document.getElementById('grid'); if (g0) g0.textContent = 'The site scripts did not load. Check that js/store.js and js/config.js are in the folder.'; return; }
  var $ = function (i) { return document.getElementById(i); };
  var grid = $('grid'), fl = $('filters'), dlg = $('dlg'), gh = $('gh'), stage = $('stage');
  var items = [], base = null, PAGE = 6, limit = PAGE, shownList = [], io = null, media = [], mi = 0, timer = null;
  var params = new URLSearchParams(location.search);
  var cur = params.get('cat') || 'All', q = params.get('q') || '', client = params.get('client') || '';
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }

  // image that loads lazily, uses the small thumbnail when one exists, and fades in
  function makeImg(src, alt, eager, thumb) {
    var im = el('img', 'ld'); im.alt = alt || ''; im.decoding = 'async'; if (!eager) im.loading = 'lazy';
    var t = thumb && window.ProjectMedia ? ProjectMedia.thumb(src) : src;
    if (t !== src) im.onerror = function () { im.onerror = null; im.src = src; };
    im.onload = function () { im.classList.add('in'); };
    im.src = t;
    if (im.complete && im.naturalWidth) im.classList.add('in');
    return im;
  }

  // ----- gallery viewer
  function mediaOf(p) {
    var m = [{ t: 'img', src: p.img, alt: p.alt || p.title }];
    (p.gallery || []).forEach(function (s) { m.push({ t: 'img', src: s, alt: p.title }); });
    var v = window.ProjectMedia && ProjectMedia.parseVideo(p.video); if (v) m.push(v);
    return m;
  }
  function clearStage() { [].slice.call(stage.querySelectorAll('img,iframe,video')).forEach(function (n) { n.remove(); }); }
  function showMedia(i) {
    mi = (i + media.length) % media.length; var m = media[mi], n;
    clearStage();
    if (m.t === 'img') { n = el('img'); n.decoding = 'async'; n.src = m.src; n.alt = m.alt; }
    else if (m.t === 'embed') { n = el('iframe'); n.src = m.src; n.title = 'Project video'; n.loading = 'lazy'; n.setAttribute('allow', 'fullscreen; picture-in-picture; encrypted-media'); n.setAttribute('allowfullscreen', ''); n.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin'); }
    else { n = el('video'); n.controls = true; n.setAttribute('playsinline', ''); n.preload = 'metadata'; n.src = m.src; }
    stage.insertBefore(n, stage.firstChild);
    [].forEach.call($('thumbs').children, function (b, j) { if (j === mi) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    $('gp').hidden = $('gn').hidden = media.length < 2;
  }
  function open(p) {
    media = mediaOf(p);
    var th = $('thumbs'); th.textContent = '';
    if (media.length > 1) media.forEach(function (m, j) {
      var b = el('button', 'th' + (m.t === 'img' ? '' : ' vid')); b.type = 'button'; b.setAttribute('aria-label', m.t === 'img' ? 'Photo ' + (j + 1) : 'Video');
      if (m.t === 'img') b.appendChild(makeImg(m.src, '', false, true)); else b.appendChild(el('span', null, '▶'));
      b.onclick = function () { showMedia(j); }; th.appendChild(b);
    });
    th.hidden = media.length < 2;
    $('dm').textContent = [p.cat, p.client ? 'Client: ' + p.client : ''].filter(Boolean).join(' · ');
    $('dt').textContent = p.title; $('dd').textContent = p.desc || '';
    dlg.scrollTop = 0;
    showMedia(0); dlg.showModal();
  }

  // ----- filtering: service + client + search words
  function hay(p) { return p._s || (p._s = [p.title, p.client, p.place, p.desc, p.cat].join(' ').toLowerCase()); }
  function passText(p) {
    if (client && p.client !== client) return false;
    var words = q.toLowerCase().split(/\s+/).filter(Boolean), h = hay(p);
    for (var i = 0; i < words.length; i++) if (h.indexOf(words[i]) < 0) return false;
    return true;
  }
  function count(c) { return items.filter(function (p) { return (c === 'All' || p.cat === c) && passText(p); }).length; }
  function syncUrl() {
    var s = new URLSearchParams();
    if (cur !== 'All') s.set('cat', cur); if (q) s.set('q', q); if (client) s.set('client', client);
    try { history.replaceState(null, '', s.toString() ? '?' + s.toString() : location.pathname); } catch (e) {}
  }
  function refilter() { limit = PAGE; syncUrl(); render(); }
  function setCur(c) { cur = c; refilter(); }

  // ----- cards, loaded a few at a time
  function card(p, idx) {
    var b = el('button', 'card'); b.type = 'button';
    var im = el('div', 'im'); im.appendChild(makeImg(p.img, p.alt || p.title, idx < 3, true)); im.appendChild(el('span', 'tag', p.cat));
    var extra = (p.gallery || []).length, hasV = window.ProjectMedia && ProjectMedia.parseVideo(p.video);
    if (extra || hasV) {
      var bd = el('div', 'badges');
      if (extra) bd.appendChild(el('span', null, '+' + extra + (extra > 1 ? ' photos' : ' photo')));
      if (hasV) bd.appendChild(el('span', null, '▶ Video'));
      im.appendChild(bd);
    }
    var m = el('div', 'meta'); m.appendChild(el('h3', null, p.title)); m.appendChild(el('span', null, p.place || ''));
    b.appendChild(im); b.appendChild(m);
    if (p.client) { var c = el('p', 'cl'); c.appendChild(el('b', null, 'Client')); c.appendChild(document.createTextNode(p.client)); b.appendChild(c); }
    b.appendChild(el('p', null, p.desc || ''));
    b.onclick = function () { open(p); };
    return b;
  }
  function addMore() {
    var wrap = el('div', 'more'), b = el('button', 'btn ghost', 'Show more projects (' + (shownList.length - limit) + ' more)'); b.type = 'button';
    b.onclick = loadMore; wrap.appendChild(b); grid.appendChild(wrap);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) loadMore(); }, { rootMargin: '500px' });
      io.observe(wrap);
    }
  }
  function loadMore() {
    if (io) { io.disconnect(); io = null; }
    var old = grid.querySelector('.more'); if (old) old.remove();
    var from = limit; limit += PAGE;
    shownList.slice(from, limit).forEach(function (p, i) { grid.appendChild(card(p, from + i)); });
    if (shownList.length > limit) addMore();
  }
  function skeleton() {
    grid.textContent = ''; grid.setAttribute('aria-busy', 'true');
    for (var i = 0; i < 4; i++) {
      var s = el('div', 'sk'); s.setAttribute('aria-hidden', 'true');
      s.appendChild(el('div', 'im')); s.appendChild(el('i', 'w7')); s.appendChild(el('i', 'w4')); grid.appendChild(s);
    }
  }
  function buildClients() {
    var names = [], sel = $('clsel');
    items.forEach(function (p) { if (p.client && names.indexOf(p.client) < 0) names.push(p.client); });
    names.sort(function (a, b) { return a.localeCompare(b); });
    if (client && names.indexOf(client) < 0) client = '';
    sel.textContent = ''; sel.add(new Option('All clients', ''));
    names.forEach(function (n) { sel.add(new Option(n, n)); });
    sel.value = client; sel.parentNode.hidden = names.length < 2;
  }
  function render() {
    if (io) { io.disconnect(); io = null; }
    var cats = ['All'].concat(ProjectStore.categories(items, base));
    if (cats.indexOf(cur) < 0) cur = 'All';
    fl.textContent = '';
    cats.forEach(function (c) {
      var b = el('button', 'chip'); b.type = 'button'; b.setAttribute('aria-pressed', c === cur);
      b.appendChild(el('span', null, c === 'All' ? 'All projects' : c)); b.appendChild(el('small', null, String(count(c))));
      b.onclick = function () { setCur(c); };
      fl.appendChild(b);
    });
    var sel = $('svcsel'); sel.textContent = '';
    cats.forEach(function (c) { sel.add(new Option((c === 'All' ? 'All projects' : c) + ' (' + count(c) + ')', c)); });
    sel.value = cur;
    gh.textContent = cur === 'All' ? 'All projects' : cur;
    var scope = items.filter(function (p) { return cur === 'All' || p.cat === cur; });
    shownList = scope.filter(passText);
    var filtered = !!(q || client || cur !== 'All');
    $('rc').textContent = 'Showing ' + shownList.length + ' of ' + scope.length + ' project' + (scope.length === 1 ? '' : 's') + (q || client ? ' matching your filters' : '');
    $('clr').hidden = !filtered;
    grid.textContent = ''; grid.setAttribute('aria-busy', 'false');
    if (!shownList.length) {
      grid.appendChild(el('p', 'empty', items.length ? 'No projects match your search. Try different words or clear the filters.' : 'No projects yet.'));
      return;
    }
    shownList.slice(0, limit).forEach(function (p, i) { grid.appendChild(card(p, i)); });
    if (shownList.length > limit) addMore();
  }

  $('q').value = q;
  $('q').addEventListener('input', function () { var v = this.value.trim(); clearTimeout(timer); timer = setTimeout(function () { q = v; refilter(); }, 160); });
  $('clsel').onchange = function () { client = this.value; refilter(); };
  $('clr').onclick = function () { q = ''; client = ''; cur = 'All'; $('q').value = ''; $('clsel').value = ''; refilter(); $('q').focus(); };
  $('svcsel').onchange = function () { setCur(this.value); };
  $('dx').onclick = function () { dlg.close(); };
  $('gp').onclick = function () { showMedia(mi - 1); };
  $('gn').onclick = function () { showMedia(mi + 1); };
  dlg.addEventListener('keydown', function (e) { if (media.length > 1 && e.key === 'ArrowLeft') showMedia(mi - 1); else if (media.length > 1 && e.key === 'ArrowRight') showMedia(mi + 1); });
  dlg.addEventListener('close', clearStage);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  skeleton();
  ProjectStore.withTimeout(Promise.all([
    ProjectStore.list(),
    window.ServiceStore ? ServiceStore.list().then(function (s) { return s.map(function (x) { return x.title; }); }).catch(function () { return null; }) : Promise.resolve(null)
  ])).then(function (r) { items = r[0]; base = r[1]; buildClients(); render(); }).catch(function (err) {
    console.error(err);
    grid.textContent = ''; grid.setAttribute('aria-busy', 'false');
    grid.appendChild(el('p', 'empty', 'Could not load projects. Please try again later.' + (ProjectStore.isDev ? ' Details: ' + ((err && err.message) || err) + ' (open status.html to diagnose)' : '')));
  });
})();
