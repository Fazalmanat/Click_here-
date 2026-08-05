/* ============================================================
   game.js — gameplay: target, decoys, timer, disco colours
   ============================================================ */
(function(){
  var target     = document.getElementById('target');
  var stage      = document.getElementById('stage');
  var scoreValue = document.getElementById('scoreValue');
  var timerValue = document.getElementById('timerValue');
  var timerBlock = document.getElementById('timerBlock');

  var decoys = [];
  var DECOY_CHANCE = 0.35;
  var score = 0;
  var timerId = null;
  var timeLeft = 5.0;
  var lastBeepSecond = null;

  window.App = window.App || {};
  window.App.stopClock = stopClock;

  /* ---- Decoy taunt slogans ---- */
  var DECOY_SLOGANS = [
    "WRONG ONE! −2s ⏱",
    "Not here, genius! −2s",
    "Nope! Try again −2s 😂",
    "Classic mistake −2s",
    "The real one is hiding −2s",
    "Eyes open! −2s 👀",
    "Gotcha! −2s 😈",
    "False alarm! −2s",
    "Fooled you! −2s 🥡",
    "Haha no. −2s"
  ];

  /* Show a floating taunt near a given element */
  function showDecoyTaunt(nearEl){
    var rect = nearEl.getBoundingClientRect();
    var stageRect = stage.getBoundingClientRect();
    var popup = document.createElement('div');
    popup.className = 'decoy-taunt';
    popup.textContent = DECOY_SLOGANS[Math.floor(Math.random() * DECOY_SLOGANS.length)];
    var left = rect.left - stageRect.left + rect.width / 2;
    var top  = rect.top  - stageRect.top  - 28;
    popup.style.left = Math.max(4, Math.min(left, stageRect.width - 180)) + 'px';
    popup.style.top  = Math.max(4, top) + 'px';
    stage.appendChild(popup);
    setTimeout(function(){ popup.remove(); }, 1400);
  }

  /* ---- disco colour ---- */
  function randColor(min, max){
    var span = max - min;
    return { x: Math.trunc(Math.random()*span)+min, y: Math.trunc(Math.random()*span)+min, z: Math.trunc(Math.random()*span)+min };
  }
  function disco(){
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    var bg, stageBg, textC;
    if(isLight){
      var hue = Math.trunc(Math.random()*360);
      var sat = 60 + Math.trunc(Math.random()*30);
      var light = 78 + Math.trunc(Math.random()*12);
      bg = 'hsla('+hue+','+sat+'%,'+light+'%,0.92)';
      stageBg = 'hsl('+hue+','+sat+'%,'+light+'%)';
      textC = 'hsl('+((hue+180)%360)+','+sat+'%,28%)';
    } else {
      var c = randColor(0,256);
      bg = 'rgba('+c.x+','+c.y+','+c.z+',0.85)';
      stageBg = 'rgb('+c.x+','+c.y+','+c.z+')';
      textC = 'rgba('+Math.min(c.z+40,255)+','+c.x+','+c.y+',1)';
    }
    document.documentElement.style.setProperty('--disco-bg', bg);
    document.documentElement.style.setProperty('--disco-text', textC);
    document.documentElement.style.setProperty('--disco-stage', stageBg);
  }

  /* ---- placement helpers ---- */
  function safeTopOffset(){
    var stageRect = stage.getBoundingClientRect();
    var hud  = document.getElementById('hud');
    var quit = document.getElementById('quitBtn');
    var bottoms = [hud, quit].filter(Boolean).map(function(el){ return el.getBoundingClientRect().bottom; });
    return Math.max(Math.max.apply(null, bottoms) - stageRect.top, 0) + 12;
  }
  function placeTarget(){
    var rect = stage.getBoundingClientRect();
    var tw = target.offsetWidth  || 140;
    var th = target.offsetHeight || 110;
    var topOffset = safeTopOffset();
    var maxX = Math.max(rect.width  - tw - 10, 10);
    var maxY = Math.max(rect.height - th - topOffset - 10, 10);
    target.style.left = (Math.trunc(Math.random()*maxX) + 5) + 'px';
    target.style.top  = (Math.trunc(Math.random()*maxY) + topOffset) + 'px';
  }

  /* ---- timer ---- */
  function getTimeLimit(s){
    if(s < 10)  return 10;   if(s < 20) return 7; if(s < 30) return 6;
    if(s < 40)  return 5;    if(s < 50) return 4; if(s < 60) return 3;
    if(s < 70)  return 2;    if(s < 80) return 1.5;
    if(s < 90)  return 1.2;  if(s < 100) return 1.05;
    var steps = Math.floor((s-100)/10);
    var time = 1, decrement = 0.1;
    for(var i = 0; i < steps; i++){
      time = Math.round((time - decrement)*100000)/100000;
      if(time <= decrement){ decrement = decrement/10; }
    }
    return Math.max(time, 0.01);
  }
  function updateTimerDisplay(){
    var decimals = timeLeft < 0.1 ? 3 : (timeLeft < 1 ? 2 : 1);
    timerValue.textContent = timeLeft.toFixed(decimals);
    timerValue.classList.toggle('warn', timeLeft <= 2 && timeLeft > 0);
  }
  function stopClock(){
    if(timerId){ clearInterval(timerId); timerId = null; }
  }
  function startRound(){
    timeLeft = getTimeLimit(score);
    lastBeepSecond = null;
    updateTimerDisplay();
    requestAnimationFrame(placeTarget);
    maybeShowDecoy();
    stopClock();
    timerId = setInterval(function(){
      timeLeft -= 0.1;
      if(timeLeft <= 0){
        timeLeft = 0; updateTimerDisplay(); endRound("TIME'S UP"); return;
      }
      updateTimerDisplay();
      var whole = Math.ceil(timeLeft - 0.001);
      if(whole <= 3 && whole >= 1 && whole !== lastBeepSecond){
        lastBeepSecond = whole;
        window.AudioEngine.timerBeep(whole === 1);
      }
    }, 100);
  }

  /* ---- decoys ---- */
  function maxDecoysForScore(s){
    if(s < 20) return 0; if(s < 150) return 1;
    if(s < 300) return 2; if(s < 500) return 3;
    return 4;
  }
  function removeDecoy(){
    decoys.forEach(function(el){ el.remove(); });
    decoys = [];
  }
  function placeDecoyAwayFrom(el){
    var rect = stage.getBoundingClientRect();
    var topOffset = safeTopOffset();
    var maxX = Math.max(rect.width  - (el.offsetWidth  || 60) - 10, 10);
    var maxY = Math.max(rect.height - (el.offsetHeight || 20) - topOffset - 10, 10);
    el.style.left = (Math.trunc(Math.random()*maxX) + 5) + 'px';
    el.style.top  = (Math.trunc(Math.random()*maxY) + topOffset) + 'px';
  }
  function spawnOneDecoy(){
    var el = document.createElement('button');
    el.className = 'decoy';
    el.textContent = 'Not Here!';
    stage.appendChild(el);
    requestAnimationFrame(function(){ placeDecoyAwayFrom(el); });
    el.addEventListener('click', function(e){
      el.blur();
      window.AudioEngine.missSound();
      showDecoyTaunt(el);
      var idx = decoys.indexOf(el);
      if(idx > -1){ decoys.splice(idx,1); }
      el.remove();
      if(window.AppState.mode === 'timer'){
        /* BUG FIX / Feature: increased penalty from -1s to -2s for false touch */
        timeLeft = Math.max(timeLeft - 2, 0.01);
        updateTimerDisplay();
      }
    });
    decoys.push(el);
  }
  function maybeShowDecoy(){
    removeDecoy();
    var cap = maxDecoysForScore(score);
    if(cap <= 0) return;
    for(var i = 0; i < cap; i++){
      if(Math.random() < DECOY_CHANCE){ spawnOneDecoy(); }
    }
  }

  /* ---- round end / game over ---- */
  function endRound(label){
    stopClock(); removeDecoy();
    window.AppState._overLabel = label;
    target.classList.add('missed');
    window.AudioEngine.blinkSound();
    setTimeout(function(){
      target.classList.remove('missed');
      gameOver();
    }, 850);
  }
  function gameOver(){
    removeDecoy();
    window.AppState.score = score;
    var isNew = score > window.AppState.highScores[window.AppState.mode];
    if(isNew){ window.AppState.highScores[window.AppState.mode] = score; }
    if(window.App.updateBestDisplay){ window.App.updateBestDisplay(); }
    window.AudioEngine.gameOverSound();
    window.showScreen('over');
  }

  /* ---- start game ---- */
  window.PageHandlers['game'] = {
    onShow: function(){
      score = 0;
      window.AppState.score = 0;
      window.AppState.gameStartXP = window.AppState.totalXP || 0;
      scoreValue.textContent = '0';
      timerBlock.classList.toggle('hidden', window.AppState.mode === 'zen');
      disco();
      requestAnimationFrame(placeTarget);
      maybeShowDecoy();
      if(window.AppState.mode === 'timer'){ startRound(); }
      else { stopClock(); }
    }
  };

  /* ---- target click ---- */
  target.addEventListener('click', function(){
    target.blur();
    window.AudioEngine.hitSound();
    score++;
    scoreValue.textContent = String(score);
    disco();
    if(window.AppState.mode === 'timer'){ startRound(); }
    else { requestAnimationFrame(placeTarget); maybeShowDecoy(); }
  });

  document.getElementById('quitBtn').addEventListener('click', function(){
    endRound('GAVE UP');
  });

  /* Prevent Enter/Space from firing the target while in-game */
  document.addEventListener('keydown', function(e){
    if(document.getElementById('screen-game').classList.contains('active') &&
       (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); }
  });

  window.addEventListener('resize', function(){
    if(document.getElementById('screen-game').classList.contains('active')){ placeTarget(); }
  });
})();
