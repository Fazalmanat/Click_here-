/* ============================================================
   gameover.js — game-over / results screen
   ============================================================ */
(function(){
  window.PageHandlers['over'] = {
    onShow: function(){
      var score = window.AppState.score || 0;
      var mode  = window.AppState.mode  || 'timer';
      var label = window.AppState._overLabel || "TIME'S UP";

      document.getElementById('overLabel').textContent = label;
      document.getElementById('finalScore').textContent = String(score);

      var isNew = score > 0 && score >= window.AppState.highScores[mode];
      document.getElementById('newHighBadge').classList.toggle('hidden', !isNew);

      var modeLabel = mode === 'timer' ? 'Timer' : 'Zen';
      document.getElementById('bestLine').textContent = modeLabel + ' best: ' + window.AppState.highScores[mode];

      /* Submit score to Supabase asynchronously */
      if(window.fbSubmitScore){ window.fbSubmitScore(mode, score); }
    }
  };

  document.getElementById('retryBtn').addEventListener('click', function(){
    window.showScreen('game');
  });
  document.getElementById('menuBtn').addEventListener('click', function(){
    window.showScreen('mode');
  });
})();
