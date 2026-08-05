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
    /* Local backup storage */
    if(window.AppState && window.AppState.playerName){
      var localKey = 'clickhere_' + modeKey + '_' + window.AppState.playerName;
      var curLocal = parseInt(localStorage.getItem(localKey), 10) || 0;
      if(score > curLocal){
        try{ localStorage.setItem(localKey, score); }catch(e){}
      }
    }

    var sessionRes = await supabase.auth.getSession();
    var user = sessionRes.data && sessionRes.data.session && sessionRes.data.session.user;
    if(!user){
      var userRes = await supabase.auth.getUser();
      user = userRes.data && userRes.data.user;
    }
    if(!user) return;

    var userId = user.id;
    var current = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    var profile = (current && current.data) || {};

    var patch = {
      id: userId,
      display_name: window.AppState.playerName || profile.display_name || 'Player',
      updated_at: new Date().toISOString()
    };

    var currentBest = profile[col] || 0;
    if(score > currentBest){
      patch[col] = score;
    } else {
      patch[col] = currentBest;
    }

    var currentXP = profile.total_xp || 0;
    if(typeof totalXP === 'number' && totalXP > currentXP){
      patch.total_xp = totalXP;
    } else {
      patch.total_xp = currentXP;
    }

    var res = await supabase.from('profiles').upsert(patch).select();
    if(res.error){
      console.error('Supabase profile upsert error:', res.error);
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
