/* ============================================================
   profile.js — profile page with XP / level / rank system
   ============================================================ */
(function(){
  /* XP formula */
  function totalXP(scores){
    return (scores.timer * 10) + (scores.zen * 5);
  }

  var XP_PER_LEVEL = 50;

  var RANKS = [
    { maxLevel: 3,  name: 'Rookie',  color: 'var(--cyan)',  avatarGrad: 'linear-gradient(135deg,#00c3e3,#0066cc)' },
    { maxLevel: 7,  name: 'Clicker', color: '#9d7fe3',      avatarGrad: 'linear-gradient(135deg,#9d7fe3,#5e3aad)' },
    { maxLevel: 12, name: 'Hunter',  color: 'var(--pink)',  avatarGrad: 'linear-gradient(135deg,#ff2e88,#a8155a)' },
    { maxLevel: 18, name: 'Phantom', color: '#ff9500',      avatarGrad: 'linear-gradient(135deg,#ff9500,#c05000)' },
    { maxLevel: Infinity, name: 'Legend', color: 'var(--amber)', avatarGrad: 'linear-gradient(135deg,#ffcc00,#e07000)' }
  ];

  function getRankInfo(level){
    for(var i = 0; i < RANKS.length; i++){
      if(level <= RANKS[i].maxLevel) return RANKS[i];
    }
    return RANKS[RANKS.length - 1];
  }

  function getLevelInfo(xp){
    var level        = Math.floor(xp / XP_PER_LEVEL) + 1;
    var xpInto       = xp % XP_PER_LEVEL;
    var progress     = xpInto / XP_PER_LEVEL;
    var rank         = getRankInfo(level);
    return { level, xpInto, xpForNext: XP_PER_LEVEL, progress, rank };
  }

  function renderProfile(){
    var scores = window.AppState.highScores;
    var name   = window.AppState.playerName || '?';
    var xp     = totalXP(scores);
    var info   = getLevelInfo(xp);

    /* Avatar */
    var avatar = document.getElementById('profileAvatar');
    if(avatar){
      avatar.textContent = name.charAt(0).toUpperCase();
      avatar.style.background = info.rank.avatarGrad;
      avatar.style.boxShadow = '0 0 0 3px var(--card-border), 0 0 32px ' + info.rank.color.replace('var(--','').replace(')','');
    }

    /* Level badge */
    var badge = document.getElementById('profileLevelBadge');
    if(badge){ badge.textContent = 'LVL ' + info.level; }

    /* Name & rank */
    var nameEl = document.getElementById('profileName');
    if(nameEl){ nameEl.textContent = name; }

    var rankEl = document.getElementById('profileRank');
    if(rankEl){
      rankEl.textContent = info.rank.name;
      rankEl.style.color = info.rank.color;
    }

    /* XP bar — set to 0 first for transition animation */
    var fill = document.getElementById('xpBarFill');
    if(fill){
      fill.style.transition = 'none';
      fill.style.width = '0%';
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          fill.style.transition = 'width 1.1s cubic-bezier(.4,0,.2,1)';
          fill.style.width = (info.progress * 100).toFixed(1) + '%';
        });
      });
    }

    /* XP bar labels */
    var xpCur  = document.getElementById('xpCurrent');
    var xpNext = document.getElementById('xpNext');
    var xpBase = (info.level - 1) * XP_PER_LEVEL;
    if(xpCur)  xpCur.textContent  = xp + ' XP';
    if(xpNext) xpNext.textContent = 'Next: ' + (xpBase + XP_PER_LEVEL) + ' XP';

    /* Stats */
    var timerEl = document.getElementById('profileTimerBest');
    var zenEl   = document.getElementById('profileZenBest');
    var xpEl    = document.getElementById('profileTotalXP');
    if(timerEl) timerEl.textContent = scores.timer;
    if(zenEl)   zenEl.textContent   = scores.zen;
    if(xpEl)    xpEl.textContent    = xp;
  }

  window.PageHandlers['profile'] = {
    onShow: renderProfile
  };
})();
