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

      var prevTotalXP = (typeof window.AppState.gameStartXP === 'number') ? window.AppState.gameStartXP : (window.AppState.totalXP || 0);

      if(isNewHigh){
        window.AppState.highScores[mode] = score;
        if(window.AudioEngine && window.AudioEngine.celebrationSound){
          window.AudioEngine.celebrationSound();
        }
      }

      var newTotalXP = prevTotalXP + earnedXP;
      window.AppState.totalXP = newTotalXP;
      window.AppState.gameStartXP = newTotalXP;

      if(window.AppState.playerName){
        try{ localStorage.setItem('clickhere_xp_' + window.AppState.playerName, window.AppState.totalXP); }catch(e){}
      }

      var modeLabel = mode === 'timer' ? 'Timer' : 'Zen';
      document.getElementById('bestLine').textContent = modeLabel + ' best: ' + window.AppState.highScores[mode];

      /* EXP Progress Slider Animation */
      var earnedTextEl = document.getElementById('overXpEarnedText');
      var prevTextEl   = document.getElementById('overXpPrev');
      var totalTextEl  = document.getElementById('overXpTotal');
      var baseFillEl   = document.getElementById('overXpBaseFill');
      var addedFillEl  = document.getElementById('overXpAddedFill');

      if(earnedTextEl){
        earnedTextEl.textContent = isNewHigh ? ('+' + baseXP + ' XP + 10 BONUS! 🎉') : ('+' + earnedXP + ' XP');
      }
      if(prevTextEl)  prevTextEl.textContent  = 'Prev: ' + prevTotalXP + ' XP';
      if(totalTextEl) totalTextEl.textContent = 'Total: ' + newTotalXP + ' XP';

      /* Calculate fill percentages for slider (within 50 XP level buckets) */
      var XP_PER_LEVEL = 50;
      var prevPercent  = ((prevTotalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
      var addedPercent = (earnedXP / XP_PER_LEVEL) * 100;
      var visibleAdded = Math.max(addedPercent, earnedXP > 0 ? 8 : 0);
      if(prevPercent + visibleAdded > 100){
        visibleAdded = Math.max(100 - prevPercent, 3);
      }

      if(baseFillEl && addedFillEl){
        baseFillEl.style.transition = 'none';
        addedFillEl.style.transition = 'none';
        baseFillEl.style.width = prevPercent.toFixed(1) + '%';
        addedFillEl.style.left = prevPercent.toFixed(1) + '%';
        addedFillEl.style.width = '0%';

        requestAnimationFrame(function(){
          requestAnimationFrame(function(){
            addedFillEl.style.transition = 'width 1s cubic-bezier(.4,0,.2,1)';
            addedFillEl.style.width = visibleAdded.toFixed(1) + '%';
          });
        });
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
