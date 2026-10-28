(function () {
  var $ = function (i) { return document.getElementById(i); };
  var list = $('svc-list'), jump = $('jump'), sel = $('ssel');
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function mark(id) {
    [].forEach.call(jump.children, function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    sel.value = id;
  }
  function render(items) {
    list.textContent = ''; jump.textContent = ''; sel.textContent = '';
    if (!items.length) { list.appendChild(el('p', 'empty', 'Services will be listed here soon.')); return; }
    var secs = [];
    items.forEach(function (s, i) {
      var id = ServiceStore.slug(s.title);
      var a = el('a', 'chip'); a.href = '#' + id; a.appendChild(el('span', null, s.title));
      a.onclick = function () { mark(id); };
      jump.appendChild(a); sel.add(new Option(s.title, id));
      var sec = el('section', 'svc-item'); sec.id = id;
      var pic = el('div', 'si-img' + (s.img ? '' : ' none')), im = el('img'); im.loading = i === 0 ? 'eager' : 'lazy'; im.decoding = 'async';
      if (s.img) { im.src = s.img; im.alt = s.title; } else { im.src = 'images/logo.png'; im.alt = ''; }
      pic.appendChild(im); sec.appendChild(pic);
      var txt = el('div', 'prose');
      txt.appendChild(el('p', 'kicker', (i < 9 ? '0' : '') + (i + 1)));
      txt.appendChild(el('h2', null, s.title));
      if (s.summary) txt.appendChild(el('p', 'lead', s.summary));
      (s.desc || '').split(/\n\s*\n/).forEach(function (p) { p = p.trim(); if (p) txt.appendChild(el('p', null, p)); });
      var pts = (s.features || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      if (pts.length) { var ul = el('ul', 'pts'); pts.forEach(function (x) { ul.appendChild(el('li', null, x)); }); txt.appendChild(ul); }
      var acts = el('div', 'acts');
      var b1 = el('a', 'btn red', 'Request a quote'); b1.href = 'contact.html?service=' + encodeURIComponent(s.title);
      var b2 = el('a', 'btn ghost', 'See related projects'); b2.href = 'projects.html?cat=' + encodeURIComponent(s.title);
      acts.appendChild(b1); acts.appendChild(b2); txt.appendChild(acts);
      sec.appendChild(txt); list.appendChild(sec); secs.push(sec);
    });
    mark(secs[0].id);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); }); }, { rootMargin: '-15% 0px -70% 0px' });
      secs.forEach(function (s) { io.observe(s); });
    }
    var h = location.hash && $(location.hash.slice(1)); if (h) { h.scrollIntoView(); mark(h.id); }
  }
  sel.onchange = function () { var t = $(this.value); if (t) { t.scrollIntoView({ behavior: 'smooth' }); mark(this.value); } };
  list.appendChild(el('p', 'empty', 'Loading services…'));
  ProjectStore.withTimeout(ServiceStore.list()).then(render).catch(function (err) {
    console.error(err);
    list.textContent = ''; list.appendChild(el('p', 'empty', 'Could not load services. Please try again later.'));
  });
})();
