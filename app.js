// ============================================
// DEMO FM -- APP LOGIC
// ============================================

(function () {
  'use strict';

  // ---- STATE ----
  const state = {
    currentTab: 'live',
    isPlaying: false,
    isLive: false,
  };

  // ---- DOM REFS ----
  const tabBar = document.getElementById('tab-bar');
  const panels = document.querySelectorAll('.tab-panel');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const vuMeter = document.getElementById('vu-meter');
  const reelLeft = document.getElementById('reel-left');
  const reelRight = document.getElementById('reel-right');
  const btnPlay = document.getElementById('btn-play');
  const playIcon = document.getElementById('play-icon');
  const npTitle = document.getElementById('np-title');
  const liveBadge = document.getElementById('live-badge');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalClose = document.getElementById('modal-close');
  const modalName = document.getElementById('modal-name');
  const modalRole = document.getElementById('modal-role');
  const modalBio = document.getElementById('modal-bio');
  const crewGrid = document.getElementById('crew-grid');

  // ---- CREW DATA ----
  const crewData = {
    founder: {
      name: 'THE FOUNDER',
      role: 'STATION ARCHITECT',
      bio: 'Built this station from a bedroom and a belief that local radio is political infrastructure. Third World Manager. Community-first, always.',
    },
    dj1: {
      name: 'DJ SIGNAL',
      role: 'RESIDENT DJ',
      bio: 'Bass frequencies and broken beats. Every set is a dispatch from the front lines of sonic resistance.',
    },
    dj2: {
      name: 'SELECTOR K',
      role: 'GUEST ROTATION',
      bio: 'Digging through crates and continents. Sound system culture runs deep.',
    },
  };

  // ---- TAB NAVIGATION ----
  function switchTab(tabId) {
    state.currentTab = tabId;

    tabBtns.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    panels.forEach(function (panel) {
      panel.classList.toggle('active', panel.id === 'panel-' + tabId);
    });

    // scroll content to top on tab switch
    var contentArea = document.getElementById('content-area');
    contentArea.scrollTop = 0;
  }

  tabBar.addEventListener('click', function (e) {
    var btn = e.target.closest('.tab-btn');
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });

  // ---- TRANSPORT CONTROLS ----
  function setPlaying(playing) {
    state.isPlaying = playing;
    btnPlay.classList.toggle('playing', playing);

    if (playing) {
      playIcon.innerHTML = '<rect fill="currentColor" x="6" y="4" width="4" height="16"/><rect fill="currentColor" x="14" y="4" width="4" height="16"/>';
      vuMeter.classList.add('active');
      reelLeft.classList.add('spinning');
      reelRight.classList.add('spinning');
      npTitle.textContent = 'DEMO FM -- LIVE MIX';
    } else {
      playIcon.innerHTML = '<path fill="currentColor" d="M8 5v14l11-7z"/>';
      vuMeter.classList.remove('active');
      reelLeft.classList.remove('spinning');
      reelRight.classList.remove('spinning');
      npTitle.textContent = 'PAUSED';
    }
  }

  btnPlay.addEventListener('click', function () {
    setPlaying(!state.isPlaying);
  });

  document.getElementById('btn-stop').addEventListener('click', function () {
    setPlaying(false);
    npTitle.textContent = 'SELECT A STATION';
  });

  // ---- TAPE PLAY BUTTONS ----
  document.querySelectorAll('.btn--play-tape').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tapeId = btn.dataset.tape;
      var title = btn.closest('.tape-card').querySelector('.tape-card-title').textContent;
      npTitle.textContent = title;
      setPlaying(true);
    });
  });

  // ---- CREW MODAL ----
  crewGrid.addEventListener('click', function (e) {
    var card = e.target.closest('.crew-card');
    if (!card) return;

    var crewId = card.dataset.crew;
    var data = crewData[crewId];
    if (!data) return;

    modalName.textContent = data.name;
    modalRole.textContent = data.role;
    modalBio.textContent = data.bio;
    modalOverlay.classList.add('open');
  });

  modalClose.addEventListener('click', function () {
    modalOverlay.classList.remove('open');
  });

  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('open');
    }
  });

  // ---- LIVE CHECK (placeholder) ----
  var btnCheckLive = document.getElementById('btn-check-live');
  if (btnCheckLive) {
    btnCheckLive.addEventListener('click', function () {
      var statusEl = document.getElementById('stream-status');
      statusEl.textContent = 'CHECKING SIGNAL...';
      btnCheckLive.disabled = true;

      setTimeout(function () {
        // Replace this with real stream check logic
        statusEl.textContent = 'NO LIVE SIGNAL DETECTED -- ARCHIVE MODE';
        btnCheckLive.disabled = false;
        liveBadge.classList.add('off-air');
      }, 2000);
    });
  }

  // ---- SERVICE WORKER REGISTRATION ----
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {
      // SW registration failed silently
    });
  }
})();
