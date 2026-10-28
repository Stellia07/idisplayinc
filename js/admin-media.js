/* Reusable photo list for the admin: upload (several at once), paste a link, reorder, remove. */
(function () {
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function prep(f) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () {
        var im = new Image();
        im.onload = function () {
          var k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          c.toBlob(function (b) { b ? res(b) : rej(new Error('Could not process the image.')); }, 'image/jpeg', 0.8);
        };
        im.onerror = function () { rej(new Error('"' + f.name + '" is not a readable image.')); };
        im.src = r.result;
      };
      r.onerror = function () { rej(new Error('Could not read the file.')); };
      r.readAsDataURL(f);
    });
  }
  window.ImageList = function (root, opts) {
    opts = opts || {};
    var max = opts.max || 12, items = [];
    var ul = el('ul', 'il'), add = el('div', 'il-add'), msg = el('p', 'hint il-msg'); msg.setAttribute('role', 'status');
    var lab = el('label', 'btn sm ghost'), file = el('input', 'vh'); file.type = 'file'; file.accept = 'image/*'; file.multiple = true;
    lab.appendChild(document.createTextNode('Add photos')); lab.appendChild(file);
    var path = el('input'); path.type = 'text'; path.placeholder = 'or paste an image path / link'; path.autocomplete = 'off'; path.setAttribute('aria-label', 'Image path or link');
    var addB = el('button', 'btn sm ghost', 'Add link'); addB.type = 'button';
    add.appendChild(lab); add.appendChild(path); add.appendChild(addB);
    root.textContent = ''; root.appendChild(ul); root.appendChild(add); root.appendChild(msg);
    function say(t, bad) { msg.textContent = t; msg.className = 'hint il-msg' + (bad ? ' err' : ''); }
    function changed() { render(); if (opts.onChange) opts.onChange(items.slice()); }
    function push(src) { if (items.length >= max) { say('You can add up to ' + max + ' photos here.', true); return false; } items.push(src); return true; }
    function btn(txt, label, fn) { var b = el('button', null, txt); b.type = 'button'; b.setAttribute('aria-label', label); b.onclick = fn; return b; }
    function move(i, d) { var j = i + d; if (j < 0 || j >= items.length) return; var t = items[i]; items[i] = items[j]; items[j] = t; changed(); }
    function render() {
      ul.textContent = '';
      items.forEach(function (src, i) {
        var li = el('li'), im = el('img'); im.src = src; im.alt = '';
        var nm = el('span', 'nm', src.indexOf('data:') === 0 ? 'Uploaded photo ' + (i + 1) : src.split('/').pop().split('?')[0]);
        var ctl = el('div', 'ctl');
        ctl.appendChild(btn('↑', 'Move photo ' + (i + 1) + ' up', function () { move(i, -1); }));
        ctl.appendChild(btn('↓', 'Move photo ' + (i + 1) + ' down', function () { move(i, 1); }));
        ctl.appendChild(btn('✕', 'Remove photo ' + (i + 1), function () { items.splice(i, 1); changed(); }));
        li.appendChild(im); li.appendChild(nm); li.appendChild(ctl); ul.appendChild(li);
      });
    }
    addB.onclick = function () {
      var v = path.value.trim(); if (!v) return;
      if (/^[a-z][a-z0-9+.-]*:/i.test(v) && !/^https?:\/\//i.test(v)) { say('Use an image path (images/photo.jpg) or an https link.', true); return; }
      if (push(v)) { path.value = ''; say(''); changed(); }
    };
    file.onchange = function () {
      var fs = [].slice.call(file.files); file.value = ''; if (!fs.length) return;
      say('Uploading ' + fs.length + ' photo' + (fs.length > 1 ? 's' : '') + '…');
      fs.reduce(function (p, f) {
        return p.then(function () { return f; }).then(function (b) { return ProjectStore.upload(b); }).then(function (url) { push(url); });
      }, Promise.resolve()).then(function () { say(''); changed(); }).catch(function (e) { say('Upload failed: ' + AdminHelp.msg(e), true); changed(); });
    };
    return { get: function () { return items.slice(); }, set: function (a) { items = (a || []).slice(); render(); } };
  };
})();
