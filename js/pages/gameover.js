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

      var previousBest = window.AppState.highScores[mode] || 0;
      var isNewHigh = score > 0 && score > previousBest;
      document.getElementById('newHighBadge').classList.toggle('hidden', !isNewHigh);

      /* Calculate EXP: 1 point = 1 EXP, plus +10 BONUS EXP if new high score! */
      var baseXP = score * 1;
      var bonusXP = isNewHigh ? 10 : 0;
      var earnedXP = baseXP + bonusXP;

      if(isNewHigh){
        window.AppState.highScores[mode] = score;
        if(window.AudioEngine && window.AudioEngine.celebrationSound){
          window.AudioEngine.celebrationSound();
        }
      }

      window.AppState.totalXP = (window.AppState.totalXP || 0) + earnedXP;
      if(window.AppState.playerName){
        try{ localStorage.setItem('clickhere_xp_' + window.AppState.playerName, window.AppState.totalXP); }catch(e){}
      }

      var modeLabel = mode === 'timer' ? 'Timer' : 'Zen';
      document.getElementById('bestLine').textContent = modeLabel + ' best: ' + window.AppState.highScores[mode];

      /* Display EXP Earned on results screen */
      var xpBadge = document.getElementById('xpEarnedBadge');
      if(xpBadge){
        if(isNewHigh){
          xpBadge.textContent = '+' + baseXP + ' EXP + 10 BONUS EXP! 🎉 (Total: ' + window.AppState.totalXP + ' XP)';
        } else {
          xpBadge.textContent = '+' + earnedXP + ' EXP Earned! (Total: ' + window.AppState.totalXP + ' XP)';
        }
      }

      /* Submit score to Supabase asynchronously */
      if(window.fbSubmitScore){ window.fbSubmitScore(mode, score, window.AppState.totalXP); }
    }
  };

  document.getElementById('retryBtn').addEventListener('click', function(){
    window.showScreen('game');
  });
  document.getElementById('menuBtn').addEventListener('click', function(){
    window.showScreen('mode');
  });
})();
