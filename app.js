// DEMO FM V5.4

(function () {
  'use strict';

  var playing = false;
  var isDesktop = window.innerWidth >= 768;

  // Update isDesktop on resize (debounced)
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var wasDesktop = isDesktop;
      isDesktop = window.innerWidth >= 768;
      if (wasDesktop !== isDesktop) {
        if (isDesktop) {
          initDesktopPositions();
          initDrag();
          // Hide all windows, clear dock active
          wins.forEach(function (w) { w.style.display = 'none'; });
          dks.forEach(function (b) { b.classList.remove('active'); });
        } else {
          var activeTab = document.querySelector('.dk.active');
          var activeId = activeTab ? activeTab.dataset.tab : 'live';
          switchTab(activeId);
        }
      }
    }, 200);
  });

  var dock = document.getElementById('dock');
  var dks = document.querySelectorAll('.dk');
  var wins = document.querySelectorAll('.win--content');
  var viz = document.getElementById('visualizer');
  var btnPlay = document.getElementById('btn-play');
  var pStatus = document.getElementById('p-status');
  var pTrack = document.getElementById('p-track');
  var clockEl = document.getElementById('clock');
  var clockDesk = document.getElementById('clock-desk');
  var modalBg = document.getElementById('modal-overlay');
  var modalClose = document.getElementById('modal-close');
  var modalName = document.getElementById('modal-name');
  var modalBio = document.getElementById('modal-bio');
  var modalTitle = document.getElementById('modal-title');
  var crewGrid = document.getElementById('crew-grid');

  var crew = [
    { name: 'SELECTOR A', bio: 'bass frequencies and broken beats. every set is a dispatch.' },
    { name: 'SELECTOR B', bio: 'digging through crates and continents. sound system culture.' },
    { name: 'SELECTOR C', bio: 'ambient transmissions from the periphery. signal over noise.' }
  ];

  // ====== CLOCK ======
  function tick() {
    var d = new Date();
    var t = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    if (clockEl) clockEl.textContent = t;
    if (clockDesk) clockDesk.textContent = t;
  }
  tick();
  setInterval(tick, 10000);

  // ====== TABS / WINDOWS ======
  var topZ = 20;

  function updateDockState() {
    if (!isDesktop) return;
    dks.forEach(function (b) {
      var w = document.getElementById('win-' + b.dataset.tab);
      b.classList.toggle('active', w && w.style.display !== 'none');
    });
  }

  function switchTab(id) {
    if (isDesktop) {
      // Desktop: toggle window on/off
      var win = document.getElementById('win-' + id);
      if (!win) return;

      if (win.style.display === 'none') {
        // Show window and bring to front
        win.style.display = '';
        topZ++;
        win.style.zIndex = topZ;
      } else {
        // Hide window
        win.style.display = 'none';
      }
      updateDockState();
    } else {
      // Mobile: focused switching (one window at a time)
      dks.forEach(function (b) { b.classList.toggle('active', b.dataset.tab === id); });
      wins.forEach(function (w) {
        w.style.display = w.dataset.panel === id ? '' : 'none';
      });
    }
  }

  dock.addEventListener('click', function (e) {
    var b = e.target.closest('.dk');
    if (b) switchTab(b.dataset.tab);
  });

  // Window close buttons
  document.querySelectorAll('.win-close').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var panel = btn.dataset.close;
      var win = document.getElementById('win-' + panel);
      if (win) win.style.display = 'none';
      updateDockState();
    });
  });

  // ====== PLAYER ======
  function setPlay(on) {
    playing = on;
    btnPlay.classList.toggle('playing', on);
    viz.classList.toggle('active', on);
    btnPlay.textContent = on ? '||' : '>';
    pStatus.textContent = on ? 'PLAY' : 'IDLE';
    if (!on) pTrack.textContent = 'DEMO FM';
  }

  btnPlay.addEventListener('click', function () {
    if (!playing) {
      if (window._scWidget) {
        window._scWidget.play();
      }
      pTrack.textContent = 'DEMO FM -- live';
      setPlay(true);
    } else {
      if (window._scWidget) {
        window._scWidget.pause();
      }
      setPlay(false);
    }
  });

  document.getElementById('btn-prev').addEventListener('click', function () {
    if (window._scWidget) window._scWidget.prev();
  });
  document.getElementById('btn-next').addEventListener('click', function () {
    if (window._scWidget) window._scWidget.next();
  });

  // Live check
  var btnLive = document.getElementById('btn-check-live');
  var loText = document.getElementById('lo-text');
  if (btnLive) {
    btnLive.addEventListener('click', function () {
      loText.textContent = '...';
      btnLive.disabled = true;
      setTimeout(function () {
        loText.textContent = 'OFF AIR';
        btnLive.disabled = false;
      }, 2000);
    });
  }

  // ====== SOUNDCLOUD WIDGET ======
  function initSoundCloud() {
    var iframe = document.getElementById('sc-player');
    if (!iframe || typeof SC === 'undefined') return;

    var widget = SC.Widget(iframe);
    window._scWidget = widget;

    widget.bind(SC.Widget.Events.READY, function () {
      // Populate archive with playlist tracks
      widget.getSounds(function (sounds) {
        var container = document.querySelector('#win-mixtape .win-body');
        if (!container || !sounds.length) return;

        var html = '<table class="tape-tbl"><thead><tr><th>#</th><th>SESSION</th><th>DUR</th><th></th></tr></thead><tbody>';

        sounds.forEach(function (track, i) {
          var durMs = track.duration || 0;
          var dur = Math.floor(durMs / 60000);
          var sec = Math.floor((durMs % 60000) / 1000);
          var durStr = durMs > 0 ? dur + ':' + String(sec).padStart(2, '0') : '--:--';
          var title = track.title || 'Untitled';
          if (title === 'Untitled' && durMs === 0) return;

          html += '<tr class="tape-row" data-sc-index="' + i + '">';
          html += '<td class="tc-n">' + String(i + 1).padStart(3, '0') + '</td>';
          html += '<td>' + title + '</td>';
          html += '<td class="tc-d">' + durStr + '</td>';
          html += '<td><button class="tb-play">&gt;</button></td>';
          html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        // Wire up play buttons
        container.querySelectorAll('.tape-row').forEach(function (row) {
          row.addEventListener('click', function () {
            var idx = parseInt(row.dataset.scIndex, 10);
            widget.skip(idx);
            widget.play();
          });
        });
      });
    });

    // Sync player display with SC events
    widget.bind(SC.Widget.Events.PLAY, function () {
      widget.getCurrentSound(function (sound) {
        if (sound) {
          pTrack.textContent = sound.title;
          setPlay(true);
        }
      });
    });

    widget.bind(SC.Widget.Events.PAUSE, function () {
      setPlay(false);
    });

    widget.bind(SC.Widget.Events.FINISH, function () {
      setPlay(false);
    });
  }

  // ====== CREW MODAL ======
  crewGrid.addEventListener('click', function (e) {
    var card = e.target.closest('.crew-c');
    if (!card) return;
    var i = parseInt(card.dataset.crew, 10);
    var c = crew[i];
    if (!c) return;
    modalName.textContent = c.name;
    modalBio.textContent = c.bio;
    modalTitle.textContent = c.name.toLowerCase();
    modalBg.classList.add('open');
  });

  modalClose.addEventListener('click', function () { modalBg.classList.remove('open'); });
  modalBg.addEventListener('click', function (e) {
    if (e.target === modalBg) modalBg.classList.remove('open');
  });

  // ====== DITHERED AVATARS (1-bit, red-orange) ======
  document.querySelectorAll('.dither-av').forEach(function (canvas, idx) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var img = ctx.createImageData(w, h);
    var d = img.data;
    var seed = (idx + 1) * 7919;
    function rng() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

    var cx = w / 2, cy = h / 2, maxR = w * 0.45;
    var bayer = [[0.0, 0.5], [0.75, 0.25]];

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var dx = x - cx, dy = y - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var grad = Math.max(0, Math.min(1, 1 - dist / maxR));

        var eyeL = Math.sqrt((x-cx+10)*(x-cx+10) + (y-cy+6)*(y-cy+6));
        var eyeR = Math.sqrt((x-cx-10)*(x-cx-10) + (y-cy+6)*(y-cy+6));
        if (eyeL < 5 || eyeR < 5) grad *= 0.3;

        var thr = bayer[y % 2][x % 2];
        var val = grad + rng() * 0.15;
        var on = val > thr && dist <= maxR;

        var off = (y * w + x) * 4;
        d[off]     = on ? 40 : 212;
        d[off + 1] = on ? 40 : 208;
        d[off + 2] = on ? 40 : 200;
        d[off + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });

  // ====== DRAGGABLE WINDOWS (desktop only) ======
  var dragState = null;

  function initDrag() {
    if (!isDesktop) return;

    document.querySelectorAll('.win-bar').forEach(function (bar) {
      bar.addEventListener('mousedown', function (e) {
        if (e.target.closest('.win-x')) return;

        var win = bar.closest('.win');
        if (!win || win.closest('.modal-bg')) return;
        e.preventDefault();

        topZ++;
        win.style.zIndex = topZ;

        var rect = win.getBoundingClientRect();
        var container = document.getElementById('desktop');
        var cRect = container.getBoundingClientRect();

        dragState = {
          win: win,
          offsetX: e.clientX - rect.left,
          offsetY: e.clientY - rect.top,
          cLeft: cRect.left,
          cTop: cRect.top,
          cWidth: cRect.width,
          cHeight: cRect.height
        };
      });
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragState) return;
      var x = e.clientX - dragState.cLeft - dragState.offsetX;
      var y = e.clientY - dragState.cTop - dragState.offsetY;
      x = Math.max(0, Math.min(x, dragState.cWidth - 100));
      y = Math.max(0, Math.min(y, dragState.cHeight - 40));
      dragState.win.style.left = x + 'px';
      dragState.win.style.top = y + 'px';
    });

    document.addEventListener('mouseup', function () {
      dragState = null;
    });

    // Raise window on click
    document.querySelectorAll('.win').forEach(function (w) {
      w.addEventListener('mousedown', function () {
        if (isDesktop && !w.closest('.modal-bg')) {
          topZ++;
          w.style.zIndex = topZ;
        }
      });
    });
  }

  // ====== DESKTOP: set cascade positions (windows start hidden) ======
  function initDesktopPositions() {
    if (!isDesktop) return;

    var panels = ['live', 'mixtape', 'news', 'club', 'about'];
    var baseLeft = 310;
    var baseTop = 12;
    var cascade = 24;

    panels.forEach(function (id, i) {
      var win = document.getElementById('win-' + id);
      if (!win) return;
      win.style.position = 'absolute';
      win.style.left = (baseLeft + i * cascade) + 'px';
      win.style.top = (baseTop + i * cascade) + 'px';
      win.style.zIndex = 5 + i;
      // Windows start hidden on desktop -- user toggles from dock
    });

    topZ = 5 + panels.length + 1;
  }

  // ====== ANIMATED DITHERED BACKGROUND (mouse-interactive) ======
  var mouseX = 0.5, mouseY = 0.5;
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  });

  function initBackground() {
    var canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var scale = 3;
    var w, h;

    function resize() {
      w = Math.ceil(window.innerWidth / scale);
      h = Math.ceil(window.innerHeight / scale);
      canvas.width = w;
      canvas.height = h;
      canvas.style.imageRendering = 'crisp-edges';
      canvas.style.imageRendering = 'pixelated';
    }
    resize();
    window.addEventListener('resize', resize);

    var bayer4 = [
      [ 0/16,  8/16,  2/16, 10/16],
      [12/16,  4/16, 14/16,  6/16],
      [ 3/16, 11/16,  1/16,  9/16],
      [15/16,  7/16, 13/16,  5/16]
    ];

    var gridSize = 32;
    var noiseGrid = [];
    for (var i = 0; i < gridSize * gridSize; i++) {
      noiseGrid[i] = Math.random();
    }

    function noise2d(x, y) {
      var xi = Math.floor(x) & (gridSize - 1);
      var yi = Math.floor(y) & (gridSize - 1);
      var xf = x - Math.floor(x);
      var yf = y - Math.floor(y);
      xf = xf * xf * (3 - 2 * xf);
      yf = yf * yf * (3 - 2 * yf);
      var xi1 = (xi + 1) & (gridSize - 1);
      var yi1 = (yi + 1) & (gridSize - 1);
      var a = noiseGrid[yi * gridSize + xi];
      var b = noiseGrid[yi * gridSize + xi1];
      var c = noiseGrid[yi1 * gridSize + xi];
      var d = noiseGrid[yi1 * gridSize + xi1];
      return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
    }

    var time = 0;
    var img = null;

    function render() {
      if (!img || img.width !== w || img.height !== h) {
        img = ctx.createImageData(w, h);
      }
      var data = img.data;

      // Slower movement
      var speed = playing ? 0.012 : 0.003;
      time += speed;

      // Mouse influence on noise field
      var mx = (mouseX - 0.5) * 2;
      var my = (mouseY - 0.5) * 2;

      // Transparent bg -- dark semi-transparent grain over CSS gradient
      var intensity = playing ? 0.50 : 0.35;
      var dotA = playing ? 50 : 30;

      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var nx = x * 0.06 + mx * 0.4;
          var ny = y * 0.06 + my * 0.4;
          var v = noise2d(nx + time, ny + time * 0.7) * 0.5
                + noise2d(nx * 2 + time * 1.3, ny * 2 - time * 0.5) * 0.3
                + noise2d(nx * 4 - time * 0.8, ny * 4 + time * 0.3) * 0.2;

          var threshold = bayer4[y & 3][x & 3];
          var on = (v * intensity) > threshold ? 1 : 0;

          var off = (y * w + x) * 4;
          if (on) {
            data[off]     = 20;
            data[off + 1] = 10;
            data[off + 2] = 15;
            data[off + 3] = dotA;
          } else {
            data[off]     = 0;
            data[off + 1] = 0;
            data[off + 2] = 0;
            data[off + 3] = 0;
          }
        }
      }

      ctx.putImageData(img, 0, 0);
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  // ====== NOVARA MEDIA RSS FEED ======
  function fetchNews() {
    var feedUrl = 'https://novaramedia.com/feed/';
    var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(feedUrl);
    var container = document.getElementById('news-feed');
    if (!container) return;

    fetch(proxyUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('Feed fetch failed');
        return res.text();
      })
      .then(function (xml) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xml, 'text/xml');
        var items = doc.querySelectorAll('item');
        var html = '';
        var count = Math.min(items.length, 4);

        for (var i = 0; i < count; i++) {
          var item = items[i];
          var title = item.querySelector('title') ?
            item.querySelector('title').textContent : 'Untitled';
          var link = item.querySelector('link') ?
            item.querySelector('link').textContent : '#';
          var pubDate = item.querySelector('pubDate') ?
            item.querySelector('pubDate').textContent : '';
          var desc = item.querySelector('description') ?
            item.querySelector('description').textContent : '';

          var dateStr = '';
          if (pubDate) {
            var d = new Date(pubDate);
            dateStr = d.getFullYear() + '.' +
              String(d.getMonth() + 1).padStart(2, '0') + '.' +
              String(d.getDate()).padStart(2, '0');
          }

          var imgUrl = '';
          var imgMatch = desc.match(/<img[^>]+src="([^"]+)"/);
          if (imgMatch) imgUrl = imgMatch[1];

          var tmp = document.createElement('div');
          tmp.innerHTML = desc;
          var excerpt = tmp.textContent || tmp.innerText || '';
          excerpt = excerpt.trim().substring(0, 140);
          if (excerpt.length >= 140) excerpt += '...';

          html += '<article class="news-card">';
          html += '<a class="nc-link" href="' + link + '" target="_blank" rel="noopener">';
          if (imgUrl) {
            html += '<img class="nc-img" src="' + imgUrl + '" alt="" loading="lazy">';
          }
          html += '<div class="nc-top">';
          html += '<span class="nc-date">' + dateStr + '</span>';
          html += '</div>';
          html += '<h3 class="nc-title">' + title + '</h3>';
          html += '<p class="nc-excerpt">' + excerpt + '</p>';
          html += '</a>';
          html += '</article>';
        }

        container.innerHTML = html;
      })
      .catch(function () {
        container.innerHTML =
          '<article class="news-card">' +
          '<div class="nc-top"><span class="nc-date">--</span></div>' +
          '<h3 class="nc-title">feed unavailable</h3>' +
          '<p class="nc-excerpt">could not connect to novara media. check back later.</p>' +
          '</article>';
      });
  }

  // ====== INIT ======
  if (isDesktop) {
    initDesktopPositions();
    // Desktop: all windows start hidden, no active dock buttons
    wins.forEach(function (w) { w.style.display = 'none'; });
    dks.forEach(function (b) { b.classList.remove('active'); });
  } else {
    // Mobile: show only live on init
    wins.forEach(function (w) {
      if (w.dataset.panel !== 'live') w.style.display = 'none';
    });
    dks.forEach(function (b) { b.classList.toggle('active', b.dataset.tab === 'live'); });
  }

  fetchNews();
  initBackground();
  initDrag();

  // Init SoundCloud after API loads
  if (typeof SC !== 'undefined') {
    initSoundCloud();
  } else {
    // Wait for SC API script to load
    var scCheck = setInterval(function () {
      if (typeof SC !== 'undefined') {
        clearInterval(scCheck);
        initSoundCloud();
      }
    }, 500);
    // Stop checking after 10s
    setTimeout(function () { clearInterval(scCheck); }, 10000);
  }

  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
