/* ============================================================
   login.js — login form, session restore, logout, inactivity
   ============================================================ */
(function(){
  var loginBtn  = document.getElementById('loginBtn');
  var nameInput = document.getElementById('playerName');
  var passInput = document.getElementById('playerPassword');
  var nameStatus= document.getElementById('nameStatus');

  var INACTIVITY_MS = 15 * 60 * 1000;
  var lastActivityAt = Date.now();
  var inactivityId   = null;

  /* -- shared activity tracking -- */
  ['click','keydown','touchstart','pointerdown'].forEach(function(e){
    document.addEventListener(e, function(){ lastActivityAt = Date.now(); }, { passive: true });
  });

  /* -- App namespace -- */
  window.App = window.App || {};

  window.App.doLogout = async function(message){
    if(inactivityId){ clearInterval(inactivityId); inactivityId = null; }
    if(window.App.stopClock){ window.App.stopClock(); }
    if(window.fbLogout){ await window.fbLogout(); }
    window.AppState.playerName = '';
    window.AppState.highScores = { timer: 0, zen: 0 };
    nameInput.value = '';
    passInput.value = '';
    nameStatus.style.color = 'var(--ink-dim)';
    nameStatus.textContent = message || '';
    window.showScreen('login');
  };

  window.App.startInactivityWatch = function(){
    lastActivityAt = Date.now();
    if(inactivityId){ clearInterval(inactivityId); }
    inactivityId = setInterval(function(){
      if(Date.now() - lastActivityAt > INACTIVITY_MS){
        window.App.doLogout('logged out due to inactivity');
      }
    }, 60000);
  };

  function updateBestDisplay(){
    var el = document.getElementById('bestScores');
    if(el){ el.textContent = 'Best — Timer: ' + window.AppState.highScores.timer + ' · Zen: ' + window.AppState.highScores.zen; }
  }
  window.App.updateBestDisplay = updateBestDisplay;

  /* -- Login handler -- */
  var _busy = false;
  async function handleLogin(){
    if(_busy) return;
    var name = nameInput.value.trim();
    var pass = passInput.value;
    if(!name){
      nameStatus.style.color = 'var(--pink)';
      nameStatus.textContent = 'enter a name first';
      return;
    }
    if(!pass){
      nameStatus.style.color = 'var(--pink)';
      nameStatus.textContent = 'enter a password';
      return;
    }

    _busy = true;
    loginBtn.disabled = true;
    loginBtn.textContent = '...';
    nameStatus.style.color = 'var(--ink-dim)';
    nameStatus.textContent = 'checking…';

    /* Wait for Supabase module to finish loading */
    var waited = 0;
    while(!window.fbReady && waited < 4000){
      await new Promise(function(r){ setTimeout(r, 30); });
      waited += 30;
    }

    var result = await window.fbLoginOrRegister(name, pass);

    _busy = false;
    loginBtn.disabled = false;
    loginBtn.textContent = 'PLAY →';

    if(!result.ok){
      nameStatus.style.color = 'var(--pink)';
      nameStatus.textContent = ({
        bad_password: 'wrong password for that username',
        short: 'password needs to be at least 6 characters',
        error: "couldn't reach the server — try again"
      })[result.reason] || "couldn't reach the server — try again";
      return;
    }

    nameStatus.textContent = '';
    window.AppState.playerName = result.row.display_name;
    window.AppState.highScores.timer = result.row.timer_best || 0;
    window.AppState.highScores.zen   = result.row.zen_best   || 0;
    document.getElementById('welcomeName').textContent = window.AppState.playerName;
    updateBestDisplay();
    window.AudioEngine.startMusic();
    window.App.startInactivityWatch();
    window.showScreen('mode');
  }

  /* Fix: single pointerup handler avoids the 300ms mobile delay
     AND the "see press but nothing happens" bug caused by a touch
     landing on the button border/shadow area rather than the text. */
  loginBtn.addEventListener('click', function(e){
    e.preventDefault();
    handleLogin();
  });

  nameInput.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); handleLogin(); } });
  passInput.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); handleLogin(); } });

  /* -- Restore existing Supabase session on page load -- */
  (async function restoreSession(){
    var waited = 0;
    while(!window.fbReady && waited < 4000){
      await new Promise(function(r){ setTimeout(r, 30); });
      waited += 30;
    }
    if(!window.fbReady || !window.fbGetSession){ window.showScreen('login'); return; }

    var profile = await window.fbGetSession();
    if(profile){
      window.AppState.playerName        = profile.display_name;
      window.AppState.highScores.timer  = profile.timer_best || 0;
      window.AppState.highScores.zen    = profile.zen_best   || 0;
      document.getElementById('welcomeName').textContent = window.AppState.playerName;
      updateBestDisplay();
      window.App.startInactivityWatch();
      window.showScreen('mode');
    } else {
      window.showScreen('login');
    }
  })();
})();
