/* ============================================================
   leaderboard.js — leaderboard screen with Podium & Tabs
   ============================================================ */
(function(){
  var lbAutoRefreshId = null;
  var _fetching = false;
  var activeMode = 'timer'; // 'timer' or 'zen'

  async function renderLeaderboard(){
    if(_fetching) return;
    _fetching = true;
    setLoadingState(true);
    try{
      var list = await window.fbGetLeaderboard(activeMode);
      renderPodiumAndList(list);
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
      icon.style.animation = on ? 'lbSpin .45s linear infinite' : '';
      icon.style.color = on ? 'var(--cyan)' : '';
    }
    if(btn) btn.disabled = on;
  }

  function renderPodiumAndList(list){
    list = list || [];
    var me = window.AppState ? window.AppState.playerName : '';

    /* 1st Place: list[0] */
    var p1Name  = document.getElementById('podiumName1');
    var p1Score = document.getElementById('podiumScore1');
    var p1Elem  = document.getElementById('podium1');
    if(list[0]){
      if(p1Name)  p1Name.textContent  = list[0].name;
      if(p1Score) p1Score.textContent = list[0].score;
      if(p1Elem)  p1Elem.classList.toggle('lb-me', list[0].name === me);
    } else {
      if(p1Name)  p1Name.textContent  = '--';
      if(p1Score) p1Score.textContent = '-';
      if(p1Elem)  p1Elem.classList.remove('lb-me');
    }

    /* 2nd Place: list[1] */
    var p2Name  = document.getElementById('podiumName2');
    var p2Score = document.getElementById('podiumScore2');
    var p2Elem  = document.getElementById('podium2');
    if(list[1]){
      if(p2Name)  p2Name.textContent  = list[1].name;
      if(p2Score) p2Score.textContent = list[1].score;
      if(p2Elem)  p2Elem.classList.toggle('lb-me', list[1].name === me);
    } else {
      if(p2Name)  p2Name.textContent  = '--';
      if(p2Score) p2Score.textContent = '-';
      if(p2Elem)  p2Elem.classList.remove('lb-me');
    }

    /* 3rd Place: list[2] */
    var p3Name  = document.getElementById('podiumName3');
    var p3Score = document.getElementById('podiumScore3');
    var p3Elem  = document.getElementById('podium3');
    if(list[2]){
      if(p3Name)  p3Name.textContent  = list[2].name;
      if(p3Score) p3Score.textContent = list[2].score;
      if(p3Elem)  p3Elem.classList.toggle('lb-me', list[2].name === me);
    } else {
      if(p3Name)  p3Name.textContent  = '--';
      if(p3Score) p3Score.textContent = '-';
      if(p3Elem)  p3Elem.classList.remove('lb-me');
    }

    /* Ranks 4 - 10 */
    var restListEl = document.getElementById('lbRestList');
    if(!restListEl) return;
    restListEl.innerHTML = '';

    var rest = list.slice(3);
    if(!rest.length){
      var emptyLi = document.createElement('li');
      emptyLi.className = 'lb-empty';
      emptyLi.textContent = list.length < 3 ? 'No more scores yet' : 'End of top 10';
      restListEl.appendChild(emptyLi);
      return;
    }

    rest.forEach(function(entry, idx){
      var rankNum = idx + 4;
      var li = document.createElement('li');
      li.className = 'lb-rest-item';
      if(entry.name === me){ li.classList.add('lb-me'); }

      var rankSpan = document.createElement('span');
      rankSpan.className = 'lb-rank-num arcade';
      rankSpan.textContent = '#' + rankNum;

      var nameSpan = document.createElement('span');
      nameSpan.className = 'lb-rank-name';
      nameSpan.textContent = entry.name;

      var scoreSpan = document.createElement('span');
      scoreSpan.className = 'lb-rank-score arcade';
      scoreSpan.textContent = entry.score;

      li.appendChild(rankSpan);
      li.appendChild(nameSpan);
      li.appendChild(scoreSpan);
      restListEl.appendChild(li);
    });
  }

  /* Mode Tabs */
  var tabTimer = document.getElementById('lbTabTimer');
  var tabZen   = document.getElementById('lbTabZen');

  function switchTab(mode){
    if(activeMode === mode) return;
    activeMode = mode;
    if(tabTimer) tabTimer.classList.toggle('active', mode === 'timer');
    if(tabZen)   tabZen.classList.toggle('active', mode === 'zen');
    renderLeaderboard();
  }

  if(tabTimer) tabTimer.addEventListener('click', function(){ switchTab('timer'); });
  if(tabZen)   tabZen.addEventListener('click', function(){ switchTab('zen'); });

  window.PageHandlers['leaderboard'] = {
    onShow: function(){
      if(lbAutoRefreshId){ clearInterval(lbAutoRefreshId); }
      renderLeaderboard();
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

  /* Back button */
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


