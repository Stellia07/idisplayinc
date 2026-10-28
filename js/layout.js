/* Shared header and footer. Edit the menu or footer here once and every page updates.
   Each page needs: <body data-page="home|projects|about|services|contact"> and <script src="js/layout.js"></script> as the first thing in <body>. */
(function () {
  var CATS = ['Custom exhibits', 'Kiosks', 'Promotional events', 'Permanent displays & shop fittings', 'Commercial interior design & architecture', 'Graphic displays'];
  var S = { cats: CATS, email: (window.NB_CONFIG && window.NB_CONFIG.CONTACT_EMAIL) || 'idisplayinc.2013@gmail.com', phone: '02-7219-2951', tel: '+63272192951',
    address: 'Velasquez St., Sitio Bangiad, Brgy. San Juan, Taytay, Rizal, Philippines 1920', facebook: 'https://www.facebook.com/idisplayinc' };
  window.NB_SITE = S;
  var contactLinks = '<a href="mailto:' + S.email + '">' + S.email + '</a><a href="tel:' + S.tel + '">' + S.phone + '</a><span>' + S.address + '</span><a href="' + S.facebook + '" target="_blank" rel="noopener">Facebook: IDisplay Inc.</a>';
  var page = document.body.getAttribute('data-page') || '';
  function cur(p) { return page === p ? ' aria-current="page"' : ''; }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function cl(c) { return 'projects.html?cat=' + encodeURIComponent(c); }
  var logo = '<a class="logo" href="index.html"><img class="mk" src="images/logo.png" alt="" width="29" height="38"><img class="wm" src="images/wordmark.png" alt="IDisplay Inc." width="101" height="24"></a>';
  var sub = CATS.map(function (c) { return '<a href="' + cl(c) + '">' + esc(c) + '</a>'; }).join('');
  var header = '<header class="top"><div class="wrap bar">' + logo +
    '<button class="burger" id="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu"><span></span></button>' +
    '<nav id="nav" aria-label="Main"><a href="index.html"' + cur('home') + '>Home</a>' +
    '<div class="dd' + (page === 'projects' ? ' cur' : '') + '"><a href="projects.html"' + cur('projects') + '>Projects</a><button class="dd-t" type="button" aria-expanded="false" aria-label="Show project categories"></button><div class="dd-m">' + sub + '</div></div>' +
    '<a href="about.html"' + cur('about') + '>About</a><a href="services.html"' + cur('services') + '>Services</a><a href="contact.html"' + cur('contact') + '>Contact</a></nav></div></header>';
  var footer = '<footer class="sf"><div class="wrap"><div class="sf-grid">' +
    '<div><a class="logo" href="index.html"><img class="mk" src="images/logo.png" alt="" width="29" height="38" loading="lazy" decoding="async"><img class="wm" src="images/wordmark.png" alt="IDisplay Inc." width="101" height="24" loading="lazy" decoding="async"></a>' +
    '<p class="sf-about">A premier full-service provider in the exhibition, display and events industry in the Philippines, serving clients since 2013.</p></div>' +
    '<div><h4>Company</h4><a href="index.html">Home</a><a href="about.html">About</a><a href="services.html">Services</a><a href="contact.html">Contact</a></div>' +
    '<div><h4>Projects</h4>' + sub + '</div>' +
    '<div><h4>Get in touch</h4>' + contactLinks + '<a class="btn red" href="contact.html">Start a project</a></div>' +
    '</div><div class="sf-bar"><span>© 2026 IDisplay Inc.</span></div></div></footer>';
  document.body.insertAdjacentHTML('afterbegin', header);
  var b = document.getElementById('burger'), n = document.getElementById('nav'), dd = document.querySelector('.dd'), t = document.querySelector('.dd-t');
  b.onclick = function () { var o = n.classList.toggle('open'); b.setAttribute('aria-expanded', o); };
  t.onclick = function (e) { e.stopPropagation(); var o = dd.classList.toggle('open'); t.setAttribute('aria-expanded', o); };
  document.addEventListener('click', function (e) { if (!dd.contains(e.target)) { dd.classList.remove('open'); t.setAttribute('aria-expanded', false); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { dd.classList.remove('open'); n.classList.remove('open'); b.setAttribute('aria-expanded', false); t.setAttribute('aria-expanded', false); }
  });
  document.addEventListener('DOMContentLoaded', function () { document.body.insertAdjacentHTML('beforeend', footer); });
})();
