/* ============================================================
   nav.js — top nav bar wiring
   ============================================================ */
(function(){
  var navLbBtn     = document.getElementById('navLeaderboardBtn');
  var navProfileBtn= document.getElementById('navProfileBtn');
  var navLogoutBtn = document.getElementById('navLogoutBtn');

  /* Called by showScreen() in index.html after every navigation */
  window.updateNav = function(screenName){
    var loggedIn = !!(window.AppState && window.AppState.playerName);
    document.body.classList.toggle('logged-out', !loggedIn || screenName === 'login' || screenName === 'loading');

    var profileNameEl = document.getElementById('navProfileName');
    if(profileNameEl){
      profileNameEl.textContent = loggedIn ? window.AppState.playerName : 'Profile';
    }

    /* Dim the button for the screen we are already on */
    if(navLbBtn)      navLbBtn.setAttribute('aria-current',      screenName === 'leaderboard' ? 'page' : 'false');
    if(navProfileBtn) navProfileBtn.setAttribute('aria-current', screenName === 'profile'     ? 'page' : 'false');
  };

  if(navLbBtn){
    navLbBtn.addEventListener('click', function(){
      /* Anyone can VIEW the leaderboard (read-only) — no login guard needed here.
         The back button in leaderboard guards the return path. */
      window.showScreen('leaderboard');
    });
  }

  if(navProfileBtn){
    navProfileBtn.addEventListener('click', function(){
      window.showScreen('profile');
    });
  }

  if(navLogoutBtn){
    navLogoutBtn.addEventListener('click', async function(){
      if(window.App && window.App.doLogout){ await window.App.doLogout(); }
    });
  }

  /* Help Modal wiring */
  var helpToggle = document.getElementById('helpToggle');
  var helpModal  = document.getElementById('helpModal');
  var closeHelpBtn = document.getElementById('closeHelpBtn');
  var understandHelpBtn = document.getElementById('understandHelpBtn');

  function openHelp(){ if(helpModal) helpModal.classList.remove('hidden'); }
  function closeHelp(){ if(helpModal) helpModal.classList.add('hidden'); }

  if(helpToggle) helpToggle.addEventListener('click', openHelp);
  if(closeHelpBtn) closeHelpBtn.addEventListener('click', closeHelp);
  if(understandHelpBtn) understandHelpBtn.addEventListener('click', closeHelp);
  if(helpModal){
    helpModal.addEventListener('click', function(e){
      if(e.target === helpModal) closeHelp();
    });
  }
})();
