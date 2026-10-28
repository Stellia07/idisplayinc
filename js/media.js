/* Turns a pasted video link into something the site can show safely. */
(function () {
  window.ProjectMedia = {
    thumb: function (src) {
      if (!src || /^data:/i.test(src)) return src;
      var m = src.match(/^(.*\/storage\/v1\/object\/public\/project-images\/[^?#]+?)(-t)?\.(jpg|webp)(\?.*)?$/i);
      if (m) return m[2] ? src : m[1] + '-t.' + m[3] + (m[4] || '');
      m = src.match(/^images\/([^\/?#]+)$/i);
      if (m) return 'images/thumbs/' + m[1];
      return src;
    },
    parseVideo: function (u) {
      u = (u || '').trim(); if (!u) return null;
      if (/^[a-z][a-z0-9+.-]*:/i.test(u) && !/^https?:\/\//i.test(u)) return null;
      var m = u.match(/^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/i) ||
              u.match(/^https?:\/\/youtu\.be\/([\w-]{11})/i) ||
              u.match(/^https?:\/\/(?:www\.)?youtube\.com\/(?:embed|shorts|live)\/([\w-]{11})/i);
      if (m) return { t: 'embed', src: 'https://www.youtube-nocookie.com/embed/' + m[1] };
      m = u.match(/^https?:\/\/(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/i);
      if (m) return { t: 'embed', src: 'https://player.vimeo.com/video/' + m[1] };
      if (/\.(mp4|webm|m4v)(\?.*)?$/i.test(u)) return { t: 'video', src: u };
      return null;
    }
  };
})();
