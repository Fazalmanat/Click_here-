/* ============================================================
   leaderboard.js — leaderboard screen
   ============================================================ */
(function(){
  var lbAutoRefreshId = null;
  var _fetching = false;

  async function renderLeaderboard(){
    if(_fetching) return;   /* debounce — skip if already fetching */
    _fetching = true;
    setLoadingState(true);
    try{
      var timerList = await window.fbGetLeaderboard('timer');
      var zenList   = await window.fbGetLeaderboard('zen');
      renderList('lbTimerList', timerList);
      renderList('lbZenList',   zenList);
    } catch(e){
      console.error('leaderboard render failed', e);
    }
    setLoadingState(false);
    _fetching = false;
  }

  function setLoadingState(on){
    var icon = document.querySelector('.lb-refresh-icon');
    var btn  = document.getElementById('lbRefreshBtn');
    if(icon){
      icon.style.animation = on ? 'lbSpin .55s linear infinite' : '';
      icon.style.color = on ? 'var(--cyan)' : '';
    }
    if(btn) btn.disabled = on;
  }

  function renderList(elId, list){
    var el = document.getElementById(elId);
    if(!el) return;
    el.innerHTML = '';
    if(!list || !list.length){
      var li = document.createElement('li');
      li.textContent = 'No scores yet';
      li.className = 'lb-empty';
      el.appendChild(li);
      return;
    }
    list.forEach(function(entry, i){
      var li = document.createElement('li');
      var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
      li.textContent = (medal ? medal + ' ' : '') + entry.name + ' — ' + entry.score;
      if(entry.name === window.AppState.playerName){ li.className = 'lb-me'; }
      el.appendChild(li);
    });
  }

  window.PageHandlers['leaderboard'] = {
    onShow: function(){
      if(lbAutoRefreshId){ clearInterval(lbAutoRefreshId); }
      renderLeaderboard();
      /* Restart auto-refresh every 10s */
      lbAutoRefreshId = setInterval(renderLeaderboard, 10000);
    },
    onHide: function(){
      if(lbAutoRefreshId){ clearInterval(lbAutoRefreshId); lbAutoRefreshId = null; }
    }
  };

  /* Refresh button */
  var lbRefreshBtn = document.getElementById('lbRefreshBtn');
  if(lbRefreshBtn){
    lbRefreshBtn.addEventListener('click', function(){
      renderLeaderboard();
    });
  }

  /* Back button — guard against unauthenticated bypass */
  var lbBackBtn = document.getElementById('lbBackBtn');
  if(lbBackBtn){
    lbBackBtn.addEventListener('click', function(){
      if(window.AppState && window.AppState.playerName){
        window.showScreen('mode');
      } else {
        window.showScreen('login');
      }
    });
  }
})();

