/* Test-only stand-in for the Supabase client. Keeps a fake database in localStorage so the game and control panel share it. */
(function(){
  const KEY = "mockdb";
  const load = () => JSON.parse(localStorage.getItem(KEY) || "null") || {users: [], profiles: [], games: [], duels: [], settings: {id:1, signups_open:true, invite_code:null, announcement:null, daily_bonus:true}, session: null, seq: 1};
  const save = db => localStorage.setItem(KEY, JSON.stringify(db));
  const uuid = () => "u" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const listeners = [];
  const emit = (ev, s) => listeners.forEach(f => setTimeout(() => f(ev, s), 0));
  const ok = data => Promise.resolve({data, error: null});
  const fail = msg => Promise.resolve({data: null, error: {message: msg}});
  const me = db => db.session && db.session.user.id;
  const isAdmin = db => !!(db.profiles.find(p => p.id === me(db)) || {}).is_admin;
  function recordGame(db, a){
    const p = db.profiles.find(x => x.id === me(db)); if (!p) return fail("No profile"); if (p.banned) return fail("This account is suspended.");
    const classic = ["random","daily","duel"].includes(a.p_mode), mult = classic ? [1,1,2,3,3] : [1,1,1,1,1];
    const sc = a.p_raws.reduce((s, r, i) => s + r * mult[i], 0), mx = classic ? 1000 : 500;
    if (a.p_mode === "daily" && p.daily && p.daily.date === a.p_day) return fail("You already played today's Daily.");
    let delta = null, isBest = false;
    p.bullseyes += a.p_raws.filter(r => r === 100).length; p.last_played = new Date().toISOString();
    if (classic){
      isBest = p.games > 0 && sc > p.best;
      p.games++; p.score_sum += sc; p.avg = Math.round(p.score_sum / p.games); p.best = Math.max(p.best, sc);
      p.recent = [{s: sc, m: a.p_mode, t: Date.now()}].concat(p.recent).slice(0, 30);
      const exp = 1000 / (1 + Math.pow(10, (1000 - p.rating) / 400)); delta = Math.round((p.rated_games < 10 ? 160 : 80) * (sc - exp) / 1000);
      p.rating = Math.max(100, p.rating + delta); p.rated_games++; p.rating_hist = [{r: p.rating, t: Date.now()}].concat(p.rating_hist).slice(0, 40);
    } else if (a.p_mode === "blitz"){ p.blitz_games++; p.blitz_best = Math.max(p.blitz_best, sc); } else { p.region_games++; p.region_best = Math.max(p.region_best, sc); }
    if (a.p_mode === "daily"){ p.streak = 1; p.daily = {date: a.p_day, score: sc, raws: a.p_raws}; }
    db.games.push({id: db.seq++, user_id: p.id, mode: a.p_mode, score: sc, max: mx, raws: a.p_raws, places: a.p_places, rating: p.rating, delta, created_at: new Date().toISOString()});
    const out = {score: sc, max: mx, rating: p.rating, delta, is_best: isBest};
    if (a.p_mode === "duel"){
      const d = db.duels.find(x => x.id === a.p_duel);
      if (d.challenger === p.id){ d.challenger_score = sc; d.challenger_raws = a.p_raws; } else { d.opponent_score = sc; d.opponent_raws = a.p_raws; }
      if (d.challenger_score != null && d.opponent_score != null && !d.rated){ d.rated = true; out.duel_delta = d.challenger_score > d.opponent_score === (d.challenger === p.id) ? 12 : -12; }
    }
    save(db); return ok(out);
  }
  const RPC = {
    public_settings: db => ok({signups_open: db.settings.signups_open, invite_required: !!db.settings.invite_code, announcement: db.settings.announcement, daily_bonus: db.settings.daily_bonus}),
    check_signup: (db, a) => ok(!db.settings.signups_open ? "New sign-ups are closed right now." : db.settings.invite_code && a.p_invite !== db.settings.invite_code ? "That invite code isn't right." : db.profiles.some(p => p.username.toLowerCase() === a.p_username.toLowerCase()) ? "That username is taken." : null),
    email_for_login: (db, a) => ok(a.p_login.includes("@") ? a.p_login : ((db.users.find(u => (db.profiles.find(p => p.id === u.id) || {}).username?.toLowerCase() === a.p_login.toLowerCase())) || {}).email || null),
    record_game: recordGame,
    create_duel: (db, a) => { const id = uuid(); db.duels.unshift({id, challenger: me(db), opponent: a.p_opponent, picks: a.p_picks, created_at: new Date().toISOString(), challenger_score: null, opponent_score: null, rated: false}); save(db); return ok(id); },
    delete_my_account: db => { const id = me(db); db.users = db.users.filter(u => u.id !== id); db.profiles = db.profiles.filter(p => p.id !== id); db.session = null; save(db); return ok(null); },
    admin_users: db => !isAdmin(db) ? fail("Host only") : ok(db.profiles.map(p => { const u = db.users.find(x => x.id === p.id); return Object.assign({}, p, {email: u.email, email_confirmed: u.confirmed, last_sign_in: u.last_sign_in}); }).sort((a, b) => b.rating - a.rating)),
    admin_overview: db => !isAdmin(db) ? fail("Host only") : ok({players: db.profiles.length, banned: db.profiles.filter(p => p.banned).length, new_7d: db.profiles.length, games: db.games.length, games_today: db.games.length, active_7d: 1, duels: db.duels.length, duels_open: db.duels.filter(d => d.challenger_score == null || d.opponent_score == null).length, avg_rating: Math.round(db.profiles.reduce((s, p) => s + p.rating, 0) / Math.max(1, db.profiles.length))}),
    admin_set_banned: (db, a) => { db.profiles.find(p => p.id === a.p_user).banned = a.p_banned; save(db); return ok(null); },
    admin_set_host: (db, a) => { db.profiles.find(p => p.id === a.p_user).is_admin = a.p_flag; save(db); return ok(null); },
    admin_rename: (db, a) => { db.profiles.find(p => p.id === a.p_user).username = a.p_name; save(db); return ok(null); },
    admin_reset_stats: (db, a) => { Object.assign(db.profiles.find(p => p.id === a.p_user), {games:0, score_sum:0, avg:0, best:0, rating:1000, rated_games:0, rating_hist:[], recent:[]}); db.games = db.games.filter(g => g.user_id !== a.p_user); save(db); return ok(null); },
    admin_delete_user: (db, a) => { db.users = db.users.filter(u => u.id !== a.p_user); db.profiles = db.profiles.filter(p => p.id !== a.p_user); db.games = db.games.filter(g => g.user_id !== a.p_user); db.duels = db.duels.filter(d => d.challenger !== a.p_user && d.opponent !== a.p_user); save(db); return ok(null); },
    admin_delete_duel: (db, a) => { db.duels = db.duels.filter(d => d.id !== a.p_id); save(db); return ok(null); },
    admin_clear_duels: (db, a) => { const n = db.duels.length; db.duels = db.duels.filter(d => a.p_unfinished_only && d.challenger_score != null && d.opponent_score != null); save(db); return ok(n - db.duels.length); },
  };
  class Q {
    constructor(table){ this.t = table; this.f = []; this.o = null; this.n = null; this.upd = null; this.one = false; }
    select(){ return this; } eq(k, v){ this.f.push([k, v]); return this; } order(k, o){ this.o = [k, o && o.ascending === false ? -1 : 1]; return this; }
    limit(n){ this.n = n; return this; } update(v){ this.upd = v; return this; } maybeSingle(){ this.one = true; return this; }
    then(res, rej){ return this.run().then(res, rej); }
    run(){
      const db = load(); const tbl = this.t === "settings" ? [db.settings] : db[this.t];
      if (this.t === "settings" && !isAdmin(db)) return ok(this.one ? null : []);
      let rows = tbl.filter(r => this.f.every(([k, v]) => r[k] === v));
      if (this.t === "games" && !isAdmin(db)) rows = rows.filter(r => r.user_id === me(db));
      if (this.upd){
        if (this.t === "profiles"){
          if (rows.some(r => r.id !== me(db))) return ok(null);
          if (this.upd.username && db.profiles.some(p => p.id !== me(db) && p.username.toLowerCase() === this.upd.username.toLowerCase())) return fail("duplicate key value violates unique constraint");
        }
        rows.forEach(r => Object.assign(r, this.upd)); save(db); return ok(null);
      }
      if (this.o) rows = rows.slice().sort((a, b) => (a[this.o[0]] > b[this.o[0]] ? 1 : -1) * this.o[1]);
      if (this.n) rows = rows.slice(0, this.n);
      return ok(this.one ? (rows[0] || null) : JSON.parse(JSON.stringify(rows)));
    }
  }
  window.supabase = { createClient(){ return {
    from: t => new Q(t),
    rpc: (name, args) => { const db = load(); return RPC[name] ? RPC[name](db, args || {}) : fail("no rpc " + name); },
    auth: {
      getSession: () => ok({session: load().session}),
      onAuthStateChange: cb => { listeners.push(cb); return {data: {subscription: {unsubscribe(){}}}}; },
      signUp: ({email, password, options}) => {
        const db = load(); if (db.users.some(u => u.email === email)) return fail("User already registered");
        const id = uuid(), m = options.data;
        db.users.push({id, email, password, confirmed: false, last_sign_in: null});
        db.profiles.push({id, username: m.username, avatar: m.avatar, color: m.color, is_admin: !db.profiles.some(p => p.is_admin), banned: false, created_at: new Date().toISOString(), last_played: null,
          games: 0, score_sum: 0, avg: 0, best: 0, bullseyes: 0, rating: 1000, rated_games: 0, rating_hist: [], recent: [], daily: null, streak: 0, blitz_games: 0, blitz_best: 0, region_games: 0, region_best: 0});
        save(db); return ok({user: {id, email}, session: null});
      },
      signInWithPassword: ({email, password}) => {
        const db = load(); const u = db.users.find(x => x.email === email);
        if (!u || u.password !== password) return fail("Invalid login credentials");
        u.confirmed = true; u.last_sign_in = new Date().toISOString();
        db.session = {user: {id: u.id, email}}; save(db); emit("SIGNED_IN", db.session); return ok({session: db.session, user: db.session.user});
      },
      signOut: () => { const db = load(); db.session = null; save(db); emit("SIGNED_OUT", null); return ok(null); },
      resetPasswordForEmail: (email) => { window.__resetSentTo = email; return ok({}); },
      resend: () => ok({}),
      updateUser: ({password}) => { const db = load(); const u = db.users.find(x => x.id === me(db)); u.password = password; save(db); return ok({user: {}}); },
    },
  }; } };
})();
