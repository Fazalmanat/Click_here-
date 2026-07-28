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
})();
