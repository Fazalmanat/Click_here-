/* ============================================================
   leaderboard.js — leaderboard screen
   ============================================================ */
(function(){
  var lbAutoRefreshId = null;

  async function renderLeaderboard(){
    var timerList = await window.fbGetLeaderboard('timer');
    var zenList   = await window.fbGetLeaderboard('zen');
    renderList('lbTimerList', timerList);
    renderList('lbZenList',   zenList);
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
    list.forEach(function(entry){
      var li = document.createElement('li');
      li.textContent = entry.name + ' — ' + entry.score;
      if(entry.name === window.AppState.playerName){ li.className = 'lb-me'; }
      el.appendChild(li);
    });
  }

  window.PageHandlers['leaderboard'] = {
    onShow: function(){
      if(lbAutoRefreshId){ clearInterval(lbAutoRefreshId); }
      renderLeaderboard();
      lbAutoRefreshId = setInterval(renderLeaderboard, 8000);
    },
    onHide: function(){
      if(lbAutoRefreshId){ clearInterval(lbAutoRefreshId); lbAutoRefreshId = null; }
    }
  };

  /* Refresh button — bottom-center of leaderboard screen */
  var lbRefreshBtn = document.getElementById('lbRefreshBtn');
  if(lbRefreshBtn){
    lbRefreshBtn.addEventListener('click', async function(){
      lbRefreshBtn.disabled = true;
      var icon = lbRefreshBtn.querySelector('.lb-refresh-icon');
      if(icon) icon.style.animation = 'spin .6s linear infinite';
      await renderLeaderboard();
      if(icon) icon.style.animation = '';
      lbRefreshBtn.disabled = false;
    });
  }
})();
