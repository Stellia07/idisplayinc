(function () {
  var hero = document.querySelector('.v2hero'); if (!hero) return;
  var bg = hero.querySelector('.bg'), done = false;
  function reveal() { if (!done) { done = true; bg.classList.add('on'); } }
  setTimeout(reveal, 1200);
  function apply(imgs) {
    var slides = [bg], inner = hero.querySelector('.inner');
    bg.src = imgs[0];
    for (var i = 1; i < imgs.length; i++) {
      var s = document.createElement('img'); s.className = 'bg'; s.alt = ''; s.loading = 'lazy'; s.src = imgs[i];
      hero.insertBefore(s, inner); slides.push(s);
    }
    if (slides.length > 1 && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      var n = 0;
      setInterval(function () { slides[n].classList.remove('on'); n = (n + 1) % slides.length; slides[n].classList.add('on'); }, 6000);
    }
  }
  if (window.SettingsStore) {
    SettingsStore.get('hero').then(function (v) { var imgs = (v && v.images) || []; if (imgs.length) apply(imgs); reveal(); }).catch(reveal);
  } else reveal();
})();
