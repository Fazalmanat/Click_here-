/* ============================================================
   audio.js — AudioEngine + mute button wiring
   ============================================================ */
window.AudioEngine = (function(){
  var muted = false;
  try{
    var savedMute = localStorage.getItem('find-it-muted');
    if(savedMute === '1'){ muted = true; }
  }catch(e){}

  var musicEl = document.getElementById('bgMusic');
  if(musicEl){ musicEl.volume = 0.35; musicEl.muted = muted; }

  var BGM_TRACKS = ['sounds/bgm1.mp3','sounds/bgm2.mp3','sounds/bgm3.mp3'];
  var lastTrackIdx = -1;
  var musicStarted = false;

  function pickTrackIdx(){
    if(BGM_TRACKS.length <= 1) return 0;
    var idx;
    do{ idx = Math.floor(Math.random() * BGM_TRACKS.length); }
    while(idx === lastTrackIdx);
    return idx;
  }
  function playRandomTrack(){
    if(!musicEl) return;
    var idx = pickTrackIdx();
    lastTrackIdx = idx;
    musicEl.src = BGM_TRACKS[idx];
    musicEl.load();
    var p = musicEl.play();
    if(p && typeof p.catch === 'function'){
      p.catch(function(e){ console.error('BGM play() failed:', e); musicStarted = false; });
    }
  }
  if(musicEl){
    musicEl.addEventListener('ended', function(){ if(musicStarted){ playRandomTrack(); } });
  }

  function startMusic(){
    if(!musicEl || musicStarted) return;
    musicStarted = true;
    playRandomTrack();
  }
  function stopMusic(){
    musicStarted = false;
    if(musicEl){ musicEl.pause(); }
  }

  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'visible' && musicStarted && musicEl && musicEl.paused){
      musicEl.play().catch(function(e){ console.error('BGM resume failed:', e); musicStarted = false; });
    }
  });
  window.addEventListener('pageshow', function(){
    if(musicStarted && musicEl && musicEl.paused){
      musicEl.play().catch(function(e){ console.error('BGM pageshow resume failed:', e); musicStarted = false; });
    }
  });

  var ctx = null;
  var buffers = {};

  function ensureCtx(){
    if(!ctx){
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if(!Ctx) return null;
      ctx = new Ctx();
    }
    if(ctx.state === 'suspended'){ ctx.resume(); }
    return ctx;
  }
  function loadBuffer(name, url){
    var c = ensureCtx();
    if(!c) return;
    fetch(url)
      .then(function(res){ return res.arrayBuffer(); })
      .then(function(data){ return c.decodeAudioData(data); })
      .then(function(decoded){ buffers[name] = decoded; })
      .catch(function(){});
  }
  function playBuffer(name, playbackRate){
    if(muted) return;
    var c = ensureCtx();
    var buf = buffers[name];
    if(!c || !buf) return;
    var source = c.createBufferSource();
    var gain = c.createGain();
    source.buffer = buf;
    source.playbackRate.value = playbackRate || 1;
    gain.gain.value = 0.6;
    source.connect(gain);
    gain.connect(c.destination);
    source.start(0);
  }

  function hitSound(){ playBuffer('hit'); }
  function missSound(){ playBuffer('miss'); }
  function timerBeep(urgent){ playBuffer('beep', urgent ? 1.25 : 1); }
  function gameOverSound(){ playBuffer('over'); }
  function blinkSound(){ playBuffer('blink'); }
  function celebrationSound(){
    if(muted) return;
    var c = ensureCtx();
    if(!c) return;
    var notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach(function(freq, i){
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      var startTime = c.currentTime + (i * 0.08);
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  function setMuted(v){
    muted = v;
    try{ localStorage.setItem('find-it-muted', muted ? '1' : '0'); }catch(e){}
    if(musicEl){ musicEl.muted = muted; }
  }
  function isMuted(){ return muted; }

  loadBuffer('hit','sounds/hit.mp3');
  loadBuffer('miss','sounds/miss.mp3');
  loadBuffer('beep','sounds/timer-beep.mp3');
  loadBuffer('over','sounds/game-over.mp3');
  loadBuffer('blink','sounds/blink.mp3');

  return { hitSound, missSound, timerBeep, gameOverSound, blinkSound, celebrationSound, startMusic, stopMusic, setMuted, isMuted, ensureCtx };
})();

/* -- Mute toggle wiring (top nav + in-game HUD button) -- */
(function(){
  function syncMuteBtns(){
    var muted = window.AudioEngine.isMuted();
    var navBtn = document.getElementById('muteToggle');
    var hudBtn = document.getElementById('hudMuteBtn');
    if(navBtn) navBtn.textContent = muted ? '🔇' : '🔊';
    if(hudBtn) hudBtn.textContent = muted ? '🔇' : '🔊';
  }
  syncMuteBtns();

  function toggleMute(){
    window.AudioEngine.ensureCtx();
    window.AudioEngine.setMuted(!window.AudioEngine.isMuted());
    syncMuteBtns();
  }

  var navMute = document.getElementById('muteToggle');
  var hudMute = document.getElementById('hudMuteBtn');
  if(navMute) navMute.addEventListener('click', toggleMute);
  if(hudMute) hudMute.addEventListener('click', toggleMute);

  function firstGesture(){
    window.AudioEngine.ensureCtx();
    window.AudioEngine.startMusic();
  }
  ['touchend','click','keydown','mouseup'].forEach(function(evt){
    document.addEventListener(evt, firstGesture, { once: true, passive: true });
  });
})();
