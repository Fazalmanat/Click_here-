/* ============================================================
   theme.js — dark / light mode toggle
   ============================================================ */
(function(){
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  var theme = prefersLight ? 'light' : 'dark';

  try{
    var saved = localStorage.getItem('find-it-theme');
    if(saved === 'light' || saved === 'dark'){ theme = saved; }
  }catch(e){}

  function applyTheme(){
    root.setAttribute('data-theme', theme);
    if(toggle) toggle.textContent = theme === 'light' ? '☀️' : '🌙';
    try{ localStorage.setItem('find-it-theme', theme); }catch(e){}
  }
  applyTheme();

  if(toggle){
    toggle.addEventListener('click', function(){
      theme = theme === 'light' ? 'dark' : 'light';
      applyTheme();
    });
  }
})();
