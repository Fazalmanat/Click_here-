/* ============================================================
   supabase-client.js — Supabase Auth + DB helpers
   Loaded as type="module". Exposes functions on window.fb*
   ============================================================ */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

var SUPABASE_URL = "https://noudibszgylmzoynqfqd.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdWRpYnN6Z3lsbXpveW5xZnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzIxOTksImV4cCI6MjEwMDcwODE5OX0.I1O0G4R383N5PbmLjf9gh-gr-UVFVGIvKiG9xJCyF9g";

var supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function emailFor(username){
  return username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_') + '@players.local';
}
async function loadProfile(userId){
  var res = await supabase.from('profiles').select('*').eq('id', userId).single();
  if(res.error){ console.error('profile load failed', res.error); return null; }
  return res.data;
}

window.fbLoginOrRegister = async function(username, password){
  var email = emailFor(username);
  try{
    var signIn = await supabase.auth.signInWithPassword({ email, password });
    if(!signIn.error){
      var profile = await loadProfile(signIn.data.user.id);
      return profile ? { ok: true, row: profile } : { ok: false, reason: 'error' };
    }
    var signUp = await supabase.auth.signUp({ email, password });
    if(signUp.error){
      var msg = signUp.error.message || '';
      if(/already registered|already exists/i.test(msg)) return { ok: false, reason: 'bad_password' };
      if(/password/i.test(msg)) return { ok: false, reason: 'short' };
      console.error('signUp failed', signUp.error);
      return { ok: false, reason: 'error' };
    }
    if(!signUp.data.session){
      console.error('No session after signUp — is "Confirm email" turned off?');
      return { ok: false, reason: 'error' };
    }
    var created = await supabase.from('profiles').insert({
      id: signUp.data.user.id,
      display_name: username
    }).select().single();
    if(created.error){ console.error('profile insert failed', created.error); return { ok: false, reason: 'error' }; }
    return { ok: true, row: created.data };
  }catch(e){
    console.error('Supabase auth failed', e);
    return { ok: false, reason: 'error' };
  }
};

window.fbGetLeaderboard = async function(modeKey){
  var col = modeKey === 'timer' ? 'timer_best' : 'zen_best';
  try{
    /* FIX: filter out rows where the score column is NULL so empty
       accounts don’t appear. Also filter score > 0 explicitly. */
    var res = await supabase
      .from('profiles')
      .select('display_name,' + col)
      .not(col, 'is', null)
      .gt(col, 0)
      .order(col, { ascending: false })
      .limit(10);
    if(res.error) throw res.error;
    return res.data.map(function(row){ return { name: row.display_name, score: row[col] }; });
  }catch(e){
    console.error('Supabase leaderboard read failed', e);
    return [];
  }
};

window.fbSubmitScore = async function(modeKey, score, totalXP){
  var col = modeKey === 'timer' ? 'timer_best' : 'zen_best';
  try{
    /* 1. Save totalXP and highscore to Local Storage immediately */
    if(window.AppState && window.AppState.playerName){
      var name = window.AppState.playerName;
      var localKey = 'clickhere_' + modeKey + '_' + name;
      var curLocal = parseInt(localStorage.getItem(localKey), 10) || 0;
      if(score > curLocal){
        try{ localStorage.setItem(localKey, score); }catch(e){}
      }
      if(typeof totalXP === 'number'){
        try{ localStorage.setItem('clickhere_xp_' + name, totalXP); }catch(e){}
      }
    }

    /* 2. Get active Supabase Auth user */
    var sessionRes = await supabase.auth.getSession();
    var user = sessionRes.data && sessionRes.data.session && sessionRes.data.session.user;
    if(!user){
      var userRes = await supabase.auth.getUser();
      user = userRes.data && userRes.data.user;
    }
    if(!user){
      console.warn('fbSubmitScore: No active user session in Supabase Auth');
      return;
    }

    var userId = user.id;

    /* 3. Fetch current profile from Supabase */
    var current = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    var profile = (current && current.data) || {};

    var currentBest = profile[col] || 0;
    var newBest = Math.max(score, currentBest);

    if(window.AppState){
      if(!window.AppState.highScores) window.AppState.highScores = { timer: 0, zen: 0 };
      window.AppState.highScores[modeKey] = newBest;
      if(typeof totalXP === 'number'){
        window.AppState.totalXP = Math.max(totalXP, window.AppState.totalXP || 0);
      }
    }

    /* 4. Prepare update payload (with total_xp if provided) */
    var patch = {
      updated_at: new Date().toISOString()
    };
    patch[col] = newBest;
    if(window.AppState && window.AppState.playerName){
      patch.display_name = window.AppState.playerName;
    }
    if(typeof totalXP === 'number'){
      patch.total_xp = totalXP;
    }

    /* 5. Direct UPDATE query (Auto-detects total_xp column existence) */
    var updateRes = await supabase.from('profiles').update(patch).eq('id', userId);
    
    if(updateRes.error){
      /* If total_xp column is missing in Supabase schema (PGRST204), retry without total_xp */
      var msg = (updateRes.error.message || '');
      if(/total_xp/i.test(msg) || updateRes.error.code === 'PGRST204'){
        delete patch.total_xp;
        updateRes = await supabase.from('profiles').update(patch).eq('id', userId);
      }
      
      if(updateRes.error){
        console.error('Supabase profile update error:', updateRes.error);
        
        /* Fallback: if row doesn't exist yet, insert */
        patch.id = userId;
        patch.display_name = window.AppState.playerName || profile.display_name || 'Player';
        var insertRes = await supabase.from('profiles').insert(patch);
        if(insertRes.error && /total_xp/i.test(insertRes.error.message || '')){
          delete patch.total_xp;
          insertRes = await supabase.from('profiles').insert(patch);
        }
      } else {
        console.log('Successfully updated Supabase profile score:', modeKey, newBest);
      }
    } else {
      console.log('Successfully updated Supabase profile score & total XP:', modeKey, newBest);
    }
  }catch(e){
    console.error('Supabase score write failed', e);
  }
};

window.fbGetSession = async function(){
  try{
    var sessionRes = await supabase.auth.getSession();
    if(sessionRes.error || !sessionRes.data.session) return null;
    return await loadProfile(sessionRes.data.session.user.id);
  }catch(e){
    console.error('session check failed', e);
    return null;
  }
};

window.fbLogout = async function(){
  try{ await supabase.auth.signOut(); }
  catch(e){ console.error('logout failed', e); }
};

window.fbReady = true;
