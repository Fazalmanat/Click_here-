/* ============================================================
   mode.js — mode selection screen
   ============================================================ */
(function(){
  function renderBest(){
    var el = document.getElementById('bestScores');
    if(el){ el.textContent = 'Best — Timer: ' + window.AppState.highScores.timer + ' · Zen: ' + window.AppState.highScores.zen; }
  }

  window.PageHandlers['mode'] = {
    onShow: function(){
      document.getElementById('welcomeName').textContent = window.AppState.playerName;
      renderBest();
    }
  };

  document.getElementById('pickTimer').addEventListener('click', function(){
    window.AppState.mode = 'timer';
    window.showScreen('game');
  });

  document.getElementById('pickZen').addEventListener('click', function(){
    window.AppState.mode = 'zen';
    window.showScreen('game');
  });
})();
