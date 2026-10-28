/* Shrinks photos before they are uploaded: a full-size copy (max 1920px) and a small thumbnail (max 800px),
   both saved as WebP when the browser supports it (otherwise JPEG).
   Options: { max: 600, quality: 0.9, noThumb: true } (used for logos). */
(function () {
  function load(blob) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { URL.revokeObjectURL(url); res(im); };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('That file is not a readable image.')); };
      im.src = url;
    });
  }
  function toBlob(c, q) {
    return new Promise(function (res) {
      c.toBlob(function (b) {
        if (b && b.type === 'image/webp') { res(b); return; }
        var w = document.createElement('canvas'); w.width = c.width; w.height = c.height;
        var x = w.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w.width, w.height); x.drawImage(c, 0, 0);
        w.toBlob(function (j) { res(j); }, 'image/jpeg', q);
      }, 'image/webp', q);
    });
  }
  function draw(im, max, q) {
    var k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
    var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, c.width, c.height);
    return toBlob(c, q);
  }
  window.ImageTools = {
    process: function (blob, opts) {
      opts = opts || {};
      return load(blob).then(function (im) {
        return Promise.all([draw(im, opts.max || 1920, opts.quality || 0.78), opts.noThumb ? Promise.resolve(null) : draw(im, 800, 0.7)]).then(function (r) {
          var type = r[0].type || 'image/jpeg';
          return { full: r[0], thumb: r[1], type: type, ext: type === 'image/webp' ? 'webp' : 'jpg' };
        });
      });
    }
  };
})();
