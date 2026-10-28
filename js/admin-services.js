(function () {
  var P = ProjectStore, S = ServiceStore, $ = function (i) { return document.getElementById(i); };
  var f = $('sf'), editing = null, blob = null, keepImg = '', items = [];
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function msg(t, bad) { var m = $('smsg'); m.textContent = t; m.className = bad ? 'err' : 'ok'; }
  function preview(src) { var p = $('sprev'); if (src) { p.src = src; p.hidden = false; } else { p.hidden = true; p.removeAttribute('src'); } }
  var tabs = [$('at-p'), $('at-s'), $('at-h')], panels = [$('ap-p'), $('ap-s'), $('ap-h')];
  function show(i) { tabs.forEach(function (t, j) { t.setAttribute('aria-selected', i === j); panels[j].hidden = i !== j; }); }
  tabs.forEach(function (t, i) { t.onclick = function () { show(i); }; });
  function resetForm() {
    f.reset(); editing = null; blob = null; keepImg = ''; preview('');
    $('sftitle').textContent = 'Add service'; $('ssave').textContent = 'Add service'; $('scancel').hidden = true;
  }
  function edit(id) {
    var s = items.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    editing = id; blob = null; msg('');
    $('stitle').value = s.title; $('ssummary').value = s.summary; $('sdesc').value = s.desc; $('spoints').value = s.features;
    var isData = (s.img || '').indexOf('data:') === 0;
    keepImg = isData ? s.img : ''; $('spath').value = isData ? '' : s.img; preview(s.img);
    $('sftitle').textContent = 'Edit service'; $('ssave').textContent = 'Save changes'; $('scancel').hidden = false;
    f.scrollIntoView({ behavior: 'smooth', block: 'start' }); $('stitle').focus();
  }
  function del(s) {
    if (!confirm('Delete "' + s.title + '"? Projects already filed under it will keep their label.')) return;
    S.remove(s.id).then(function () { if (editing === s.id) resetForm(); msg('Service deleted.'); return render(); })
      .catch(function (e) { msg('Delete failed: ' + AdminHelp.msg(e), true); });
  }
  function render() {
    var rows = $('srows'); rows.textContent = '';
    return S.list().then(function (list) {
      items = list; $('scount').textContent = '(' + list.length + ')';
      document.dispatchEvent(new CustomEvent('services:changed', { detail: list.map(function (s) { return s.title; }) }));
      if (!list.length) { rows.appendChild(el('p', 'empty', 'No services yet. Add one using the form.')); return; }
      list.forEach(function (s) {
        var row = el('div', 'row'), im = el('img'); im.src = s.img || 'images/logo.png'; im.alt = '';
        var info = el('div', 'info'); info.appendChild(el('strong', null, s.title)); info.appendChild(el('span', null, s.summary));
        var a = el('div', 'acts');
        var e = el('button', 'btn sm ghost', 'Edit'); e.type = 'button'; e.onclick = function () { edit(s.id); };
        var d = el('button', 'btn sm danger', 'Delete'); d.type = 'button'; d.onclick = function () { del(s); };
        a.appendChild(e); a.appendChild(d); row.appendChild(im); row.appendChild(info); row.appendChild(a); rows.appendChild(row);
      });
    }).catch(function (e) { rows.appendChild(el('p', 'empty', 'Could not load services: ' + e.message)); });
  }
  $('sfile').onchange = function () {
    var file = this.files[0]; if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        c.toBlob(function (b) { blob = b; keepImg = ''; $('spath').value = ''; preview(URL.createObjectURL(b)); }, 'image/jpeg', 0.8);
      };
      im.onerror = function () { msg('That file could not be read as an image.', true); };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  };
  $('spath').oninput = function () { blob = null; keepImg = ''; $('sfile').value = ''; preview(this.value.trim()); };
  f.onsubmit = function (e) {
    e.preventDefault();
    var d = { title: $('stitle').value.trim(), summary: $('ssummary').value.trim(), desc: $('sdesc').value.trim(), features: $('spoints').value.trim() };
    if (!d.title || !d.desc) { msg('Title and description are required.', true); return; }
    var path = $('spath').value.trim(), wasEdit = !!editing; $('ssave').disabled = true; msg('Saving…');
    var imgP = path ? Promise.resolve(path) : blob ? P.upload(blob) : Promise.resolve(keepImg);
    imgP.then(function (img) { d.img = img; return wasEdit ? S.update(editing, d) : S.create(d); })
      .then(function () { resetForm(); msg(wasEdit ? 'Service updated.' : 'Service added.'); return render(); })
      .catch(function (err) { msg('Could not save: ' + AdminHelp.msg(err), true); })
      .then(function () { $('ssave').disabled = false; });
  };
  $('scancel').onclick = function () { resetForm(); msg(''); };
  $('sreset').onclick = function () {
    if (!confirm('Replace all services with the original 6? Your changes will be lost.')) return;
    S.reset().then(function () { resetForm(); msg('Restored the original services.'); return render(); });
  };
  document.addEventListener('admin:ready', function () { $('sreset').hidden = P.mode === 'cloud'; render(); });
})();
