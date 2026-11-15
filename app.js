/* Katya Calls v2. No data or keys in this file: everything comes from the private backend (config.js) and needs Roni's link key. */
(function () {
  'use strict';
  var C = window.CALLS_CONFIG || {};
  var KEY = (function () {
    var h = location.hash || '', m = /[#&?]k=([^&]+)/.exec(h);
    if (m) { localStorage.setItem('calls.k', decodeURIComponent(m[1])); history.replaceState(null, '', location.pathname + '#/life/today'); }
    return localStorage.getItem('calls.k') || '';
  })();
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ST = { P: localStorage.getItem('calls.p') || 'life', route: ['today'], boot: null, calls: null, err: '', f: { type: 'All', person: '', persona: '' }, det: {}, ask: null, asking: false, ch: 'Call', draft: {} };
  function api(a, d) {
    return fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ k: KEY, a: a }, d || {})), redirect: 'follow', referrerPolicy: 'no-referrer' })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) throw new Error(j.error || 'failed'); return j; });
  }
  function toast(t) { var e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 2600); }
  function sheet(h) { $('#sheetc').innerHTML = h; $('#sheet').classList.add('on'); }
  function closeSheet() { $('#sheet').classList.remove('on'); }
  var TTG = function () { return ST.P === 'ttg'; };

  /* ---------- install ---------- */
  var STANDALONE = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var DEFER = null;
  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); DEFER = e; showInst(); });
  addEventListener('appinstalled', function () { DEFER = null; STANDALONE = true; showInst(); toast('Installed'); });
  var UA = navigator.userAgent, ANDROID = /Android/i.test(UA);
  /* One install entry point: the header button, shown only when Chrome handed us its prompt (beforeinstallprompt) and
     the app is not already installed. No banner, no sheet. If no prompt was captured, Settings > This phone shows a
     quiet "How to install" link with the manual steps. */
  if (window.matchMedia) try { matchMedia('(display-mode: standalone)').addEventListener('change', function (e) { if (e.matches) { STANDALONE = true; DEFER = null; showInst(); } }); } catch (e) {}
  function showInst() { var b = $('#instb'); if (b) b.hidden = STANDALONE || !DEFER; }
  /* iOS home-screen apps get their own storage, so point the installed app's start URL at the link key on this phone only. */
  if (KEY && !STANDALONE && IOS) { try {
    var base = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, ''), l = document.querySelector('link[rel=manifest]');
    var mf = { name: 'Katya Calls', short_name: 'Calls', id: base, start_url: base + '#k=' + encodeURIComponent(KEY), scope: base, display: 'standalone', orientation: 'portrait', background_color: '#f6f5f2', theme_color: '#f6f5f2',
      icons: [['icon-192.png', '192x192'], ['icon-512.png', '512x512']].map(function (i) { return { src: base + i[0], sizes: i[1], type: 'image/png', purpose: 'any' }; }).concat([{ src: base + 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]) };
    if (l) l.href = 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify(mf));
  } catch (e) {} }
  var SHARE = '<svg class="shr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 11v9h14v-9"/></svg>';
  function install() {
    if (!DEFER) { showInst(); return; }
    var ev = DEFER; DEFER = null; showInst();
    try { ev.prompt(); (ev.userChoice || Promise.resolve({})).then(function (c) { if (!(c && c.outcome === 'accepted')) { DEFER = null; } showInst(); }); } catch (x) { showInst(); }
  }
  function howToInstall() { // quiet fallback, inline in Settings (no sheet); only when no prompt was captured
    if (STANDALONE || DEFER) return '';
    var st = IOS ? ['Tap Share ' + SHARE + ' (Safari: bottom bar; Chrome: top right).', 'Tap <b>Add to Home Screen</b>, then <b>Add</b>.']
      : ['Open the Chrome menu <b>&#8942;</b> at the top right.', 'Tap <b>Install app</b> or <b>Add to Home screen</b>.'];
    return '<details class="howi"><summary>How to install</summary><ol>' + st.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol></details>';
  }
  var go = function (r) { location.hash = '#/' + ST.P + '/' + r; };

  /* ---------- formatting ---------- */
  function dur(m) { m = +m || 0; if (!m) return '0s'; var s = Math.round(m * 60); return s < 60 ? s + 's' : Math.floor(s / 60) + 'm ' + ('0' + s % 60).slice(-2) + 's'; }
  function day(iso) { var d = new Date(iso), n = new Date(), y = new Date(n - 864e5);
    if (d.toDateString() === n.toDateString()) return 'Today'; if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
  function tm(iso) { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
  function when(iso) { return iso ? day(iso) + ', ' + tm(iso) : ''; }
  function fmtNum(n) { var d = String(n || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''); return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : (n || ''); }
  function outTag(o) { var c = /^Answered$/.test(o) ? 'good' : /Voicemail|No answer|unclear|progress/.test(o) ? 'warn' : /Failed/.test(o) ? 'bad' : ''; return '<span class="tag ' + c + '">' + esc(o || 'Unknown') + '</span>'; }
  function guessTag(c) { return c.sure === false ? '<span class="tag guess" title="' + esc(c.why) + '">Type is a guess</span>' : ''; }
  function ini(n) { n = String(n || '?'); return /^(You|Me)$/.test(n) ? 'Me' : n.replace(/[^A-Za-z. ]/g, '').split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase() || '#'; }
  var calls = function () { return (ST.calls || []).filter(function (c) { return (c.portal || 'life') === ST.P && canSee(c); }); };
  /* ---------- phone line (kid agents) ----------
     Provisional. Nothing about the new setup lives in this public file: agent names, who they serve and their calls all come
     from the private backend (boot.lineSetup), and only render when CALLS_CONFIG.LINE_AGENTS_LIVE is true (default false).
     Flag off, or no lineSetup from the backend: the line shows the current setup, Katya on every call and text. */
  var LIVE_FLAG = C.LINE_AGENTS_LIVE === true;
  var ROUTE_OK = { on: ['good', 'On'], paused: ['warn', 'Paused'], problem: ['bad', 'Needs attention'] };
  function isRoni() { return !!(ST.boot && ST.boot.who === 'Roni'); }
  // Kid calls (flagged by the backend) are shown only to Roni's own key, never to the agent or QA keys.
  function canSee(c) { return !c || !c.kid || isRoni(); }
  function lineSetup() {
    var ls = LIVE_FLAG && ST.boot && ST.boot.lineSetup;
    if (!ls || !Array.isArray(ls.agents) || !Array.isArray(ls.routes)) return null;
    var ag = ls.agents.filter(function (a) { return a && a.id && a.name && ROUTE_OK[a.status] && (!a.kid || isRoni()); }); // hide anything not live
    if (!ag.length) return null;
    var ids = {}; ag.forEach(function (a) { ids[a.id] = a; });
    return { agents: ag, byId: ids, routes: ls.routes.filter(function (r) { return r && r.label && ids[r.agent]; }) };
  }
  function agentName(c) { var ls = c && c.agent && lineSetup(), a = ls && ls.byId[c.agent]; return a ? a.name : 'Katya'; }
  var outbox = function () { return ((ST.boot && ST.boot.outbox) || []).filter(function (x) { return x.portal === ST.P && x.status === 'draft'; }); };
  var personas = function () { return ((ST.boot && ST.boot.personaInfo) || []).filter(function (p) { return p.portal === ST.P; }); };
  function loading(t) { return '<div class="empty"><div class="t"><span class="spin"></span>' + esc(t || 'Loading your calls…') + '</div></div>'; }
  function empty(t, s) { return '<div class="empty"><div class="t">' + esc(t) + '</div>' + (s ? '<div>' + esc(s) + '</div>' : '') + '</div>'; }
  function callRow(c) {
    var ok = /^Answered/.test(c.outcome || ''), sum = String(c.summary || '').trim();
    return '<a class="row link crow" href="#/' + ST.P + '/call/' + encodeURIComponent(c.id) + '"><div class="av">' + esc(ini(c.person)) + '</div><div class="grow"><div class="t ell">' + esc(callTitle(c)) + '</div>' +
      (sum ? '<div class="sum">' + esc(sum) + '</div>' : '') +
      '<div class="m ell">' + esc(when(c.at)) + (c.min ? ' · ' + esc(dur(c.min)) : '') + '</div></div>' + (c.safety ? '<span class="tag bad">Safety</span>' : '') + (ok ? '' : outTag(c.outcome)) + '<span class="chev">›</span></a>';
  }
  function callTitle(c) { return c.person === 'You' ? (c.type || 'Call') + ' to you' : (c.person || 'Call') + (c.type ? ' · ' + c.type : ''); }
  /* ---------- call me (Katya calls Roni's own phone) ----------
     The number comes from the private People list ("Me"), never from this public file. The sheet is the confirm step:
     nothing is placed until "Call me now" is tapped. The server still enforces Shabbat/Yom Tov and the daily limit. */
  var PURPOSE = [['checkin', 'Quick check-in', 'Purpose: a quick check-in. Ask how he is doing and what he needs.'],
    ['goodnight', 'Goodnight', 'Purpose: a goodnight call. Be sweet and supportive. Nothing about business or work.'],
    ['plan', 'Plan tomorrow', 'Purpose: help him plan tomorrow. Ask what is on tomorrow, help him put it in order, and read the short plan back at the end.'],
    ['organize', 'Make a to-do list', 'Purpose: help him organize his stuff and make a to-do list. Ask what is on his mind, repeat each item back, and read the final list back at the end.']];
  function meContact() { return people().filter(function (c) { return /^me\b/i.test(c.name || '') && String(c.num || '').replace(/\D/g, '').length >= 10; })[0] || null; }
  function callMeTask(k, note) {
    var p = PURPOSE.filter(function (x) { return x[0] === k; })[0] || PURPOSE[0];
    return 'You are Katya, Roni\u2019s personal assistant. Roni just asked you to call him from the Calls app, so he is expecting you. ' +
      'Open with one short warm line, like "Hi Roni, it\u2019s Katya." Keep your turns short and let him lead. ' + p[2] +
      (note ? ' What he wrote: ' + note + '.' : '') +
      ' If he asks you to do something, repeat it back in his own words. Stay on the line until he is done and never hang up on him early. When he says bye, say goodbye in one line and end the call.';
  }
  function callMeSheet(k, err) {
    var me = meContact(); ST.cm = ST.cm || { k: 'checkin', note: '' }; if (k) ST.cm.k = k;
    if (!me) return sheet('<h3 class="sh">Your cell number</h3><p class="m">Katya needs it once to call you. It is saved in your private People list as "Me", not in the app.</p>' +
      '<input id="menum" type="tel" inputmode="tel" autocomplete="tel" placeholder="(555) 555-5555">' + (err ? '<div class="ferr" role="alert">' + esc(err) + '</div>' : '') +
      '<div class="btns" style="margin-top:14px"><button class="btn ghost" data-act="cancel">Cancel</button><button class="btn" data-act="saveMe">Save and continue</button></div>');
    var d = String(me.num).replace(/\D/g, '');
    sheet('<h3 class="sh">Katya, call me</h3><p class="m">She calls your cell ending ' + esc(d.slice(-4)) + ' right away.</p>' +
      '<div class="flabel">What is it about?</div><div class="chips wrap">' + PURPOSE.map(function (x) { return '<button class="chip' + (ST.cm.k === x[0] ? ' on' : '') + '" data-cmk="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>' +
      '<div class="flabel">Anything to add? (optional)</div><textarea id="cmnote" rows="2" maxlength="400" placeholder="e.g. I need to call the school before 9">' + esc(ST.cm.note || '') + '</textarea>' +
      (err ? '<div class="note warnbox" role="alert" style="margin-top:10px">' + esc(err) + '</div>' : '') +
      '<div class="btns" style="margin-top:14px"><button class="btn ghost" data-act="cancel">Cancel</button><button class="btn" data-act="callMe">Call me now</button></div>');
  }
  /* next time for a routine whose text reads like "Weekdays 7:45 AM"; anything else shows its own text */
  function nextRoutine(w) {
    var m = /^Weekdays\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(w || ''); if (!m) return '';
    var h = (+m[1] % 12) + (/pm/i.test(m[3]) ? 12 : 0), d = new Date(); d.setSeconds(0, 0); d.setHours(h, +m[2]);
    if (d <= new Date()) d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return day(d.toISOString()) + ', ' + tm(d.toISOString());
  }
  function personActions(i) {
    var c = people()[i]; if (!c) return;
    var n = String(c.num || '').replace(/[^\d+]/g, ''), me = /^me\b/i.test(c.name || '');
    sheet('<h3 class="sh">' + esc(c.name) + '</h3><p class="m">' + (n ? esc(fmtNum(n)) : 'No number yet') + '</p><div class="stack">' +
      (n && me ? '<button class="btn w" data-act="callMeOpen">Katya, call me</button>' : '') +
      (n && !me ? '<button class="btn w" data-kcall="' + i + '">Have Katya call ' + esc(String(c.name).split(' ')[0]) + '</button>' : '') +
      (n && !me ? '<div class="btns"><a class="btn ghost" href="tel:' + esc(n) + '">Call from phone</a><a class="btn ghost" href="sms:' + esc(n) + '">Text</a></div>' : '') +
      '<button class="btn ghost w" data-pedit="' + i + '">Edit</button></div>');
  }

  /* ---------- views ---------- */
  var V = {};
  V.today = function () {
    var cs = calls(), q = outbox(), r = TTG() ? [] : ((ST.boot && ST.boot.routines) || []);
    var hero = TTG()
      ? '<div class="card hero"><div class="big">Call someone for TTG</div><div class="hm">Katya calls, says she is an AI assistant, and the call shows up here with a summary.</div><div class="actions"><a class="btn w2" href="#/ttg/new">Start a call</a></div></div>'
      : '<div class="card hero"><div class="big">Katya, call me</div><div class="hm">She calls your phone now. Pick what it is about.</div><div class="actions"><button class="btn w2" data-act="callMeOpen">Call me now</button><button class="btn" data-cm="goodnight">Goodnight call</button></div></div>';
    var pend = ST.pending && Date.now() - ST.pending < 3 * 60e3 ? '<div class="note okbox" role="status" style="margin-top:10px">Katya is calling you now. The call shows up below when it ends.</div>' : '';
    var nq = q.length ? '<a class="card needs" href="#/' + ST.P + '/queue"><div class="grow"><div class="t">' + q.length + ' ' + (q.length === 1 ? 'draft' : 'drafts') + ' waiting for your OK</div><div class="m ell">' + esc(q[0].body) + '</div></div><span class="tag warn">Review</span></a>' : '';
    var up = r.length ? '<h2>Coming up</h2><div class="card">' + r.map(function (x) { var nx = nextRoutine(x.when);
      return '<a class="row link" href="#/' + ST.P + '/routines"><div class="grow"><div class="t">' + esc(x.name) + '</div><div class="m">' + esc(nx ? 'Next: ' + nx : x.when) + '</div></div><span class="chev">›</span></a>'; }).join('') + '</div>' : '';
    return hero + pend + nq + favRow() + up +
      '<h2>Recent <a href="#/' + ST.P + '/calls">All calls</a></h2>' + (!ST.calls ? loading() : cs.length ? '<div class="card">' + cs.slice(0, 4).map(callRow).join('') + '</div>' : empty('No calls yet', TTG() ? 'Calls you start show up here.' : 'Tap Call me now and Katya calls you.'));
  };
  V.calls = function () {
    if (!ST.calls) return loading();
    var cs = calls(), f = ST.f, types = ['All'], ppl = {};
    cs.forEach(function (c) { if (types.indexOf(c.type) < 0) types.push(c.type); ppl[c.person] = 1; });
    types.push('Not reached');
    var list = cs.filter(function (c) {
      if (f.type === 'Not reached') { if (!/Voicemail|No answer|Failed/.test(c.outcome)) return false; } else if (f.type !== 'All' && c.type !== f.type) return false;
      if (f.person && c.person !== f.person) return false;
      return true; });
    var groups = [], last = null;
    list.forEach(function (c) { var d = day(c.at); if (d !== last) { groups.push([d, []]); last = d; } groups[groups.length - 1][1].push(c); });
    var srch = '<form id="askf" class="search" role="search"><span aria-hidden="true">⌕</span><input id="cq" type="search" enterkeyhint="search" aria-label="Search what was said" placeholder="Search what was said, e.g. ' + (TTG() ? 'interview' : 'dentist') + '" value="' + esc(ST.askq || '') + '" autocomplete="off"></form>';
    if (ST.asking || ST.ask) return '<h1>Calls</h1>' + srch + askResults() + '<button class="btn ghost w" data-act="clearAsk" style="margin-top:10px">Back to all calls</button>';
    return '<h1>Calls</h1>' + srch +
      '<div class="chips">' + types.map(function (t) { return '<button class="chip ' + (f.type === t ? 'on' : '') + '" data-ft="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
      (Object.keys(ppl).length > 1 ? '<select id="fperson" aria-label="Person"><option value="">Everyone</option>' + Object.keys(ppl).sort().map(function (p) { return '<option ' + (f.person === p ? 'selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select>' : '') +
      (ST.live === false ? '<p class="m">Saved copy. Bland is not connected right now.</p>' : '') +
      (list.length ? groups.map(function (g) { return '<h2>' + esc(g[0]) + '<span class="m cnt">' + g[1].length + '</span></h2><div class="card">' + g[1].map(callRow).join('') + '</div>'; }).join('') : empty('No calls match', 'Try All or a different person.'));
  };
  function askResults() {
    var a = ST.ask;
    if (ST.asking) return loading('Reading your calls…');
    if (a.err) return empty('Search failed', a.err);
    return '<div class="note">' + esc(a.answer) + '</div>' + (a.hits && a.hits.length ? '<div class="card" style="margin-top:10px">' + a.hits.map(function (h) {
      var s = esc(h.snip); (a.words || []).forEach(function (w) { var x = String(w).replace(/[^a-z0-9]/gi, ''); if (x) s = s.replace(new RegExp('(' + x + ')', 'ig'), '<mark>$1</mark>'); });
      return '<a class="hit" href="#/' + ST.P + '/call/' + encodeURIComponent(h.id) + '"><div class="t">' + esc(h.type) + ' · ' + esc(h.person) + ' <span class="m">' + esc(when(h.at)) + '</span></div><div class="m">…' + s + '…</div></a>'; }).join('') + '</div>' : '');
  }
  V.call = function (id) {
    id = decodeURIComponent(id || '');
    var base = (ST.calls || []).filter(function (c) { return c.id === id; })[0], d = ST.det[id];
    if (!d) { if (!ST.det['_' + id]) { ST.det['_' + id] = 1; api('call2', { id: id }).then(function (j) { ST.det[id] = j; draw(1); }).catch(function (e) { ST.det[id] = { err: e.message }; draw(1); }); } }
    var c = (d && d.call) || base; if (!c) return d && d.err ? empty('Could not open this call', d.err) : loading('Opening call…');
    var tr = d && d.transcript, you = c.person === 'You';
    var again = c.inbound ? '' : you && !TTG() ? '<button class="btn" data-act="callMeOpen">Call me again</button>' : '<button class="btn" data-again="' + esc(c.to) + '">Have Katya call again</button>';
    return '<h1>' + esc(callTitle(c)) + '</h1><p class="sub">' + esc(when(c.at)) + (c.min ? ' · ' + esc(dur(c.min)) : '') + '</p>' +
      '<div class="btns tagrow">' + outTag(c.outcome) + '<span class="tag">' + (c.inbound ? 'Incoming' : 'Outgoing') + '</span>' + guessTag(c) + '</div>' +
      '<h2>Summary</h2><div class="card pad sumtxt">' + (c.summary ? esc(c.summary) : '<span class="m">No summary from Bland for this call.</span>') + '</div>' +
      (c.err ? '<div class="note warnbox">Error: ' + esc(c.err) + '</div>' : '') +
      (again ? '<div class="btns" style="margin-top:12px">' + again + '</div>' : '') +
      '<h2>Transcript</h2>' + (!d ? loading('Loading transcript…') : tr && tr.length ? '<div class="tr">' + tr.map(function (t) { var k = t.u === 'user'; return '<div class="who ' + (k ? 'r' : '') + '">' + (k ? esc(you ? 'You' : c.person) : (t.u === 'assistant' ? esc(agentName(c)) : esc(t.u))) + '</div><div class="bub ' + (k ? 'u' : 'k') + '">' + esc(t.t) + '</div>'; }).join('') + '</div>' : '<div class="card pad m">No transcript (the call was not picked up or was too short).</div>') +
      '<h2>Details</h2><div class="stat"><div><b>' + esc(dur(c.min)) + '</b><span class="m">Length</span></div><div><b>' + esc(c.turns != null ? c.turns : 'n/a') + '</b><span class="m">Lines spoken</span></div><div><b>' + (c.lat != null ? esc(c.lat) + 's' : 'n/a') + '</b><span class="m">Avg. reply gap</span></div></div>' +
      (c.sure === false ? '<div class="note" style="margin-top:10px"><b>Why this type:</b> ' + esc(c.why) + '. It is a best guess from the first sentence and transcript.</div>' : '');
  };
  V.ask = function () { ST.f = ST.f || { type: 'All', person: '' }; return V.calls(); };
  V.queue = function () {
    var q = outbox();
    return '<h1>Approve</h1><p class="sub">Texts and emails wait here. Nothing is sent automatically.</p>' +
      (q.length ? q.map(function (x) { return '<div class="card pad"><div style="display:flex;justify-content:space-between;gap:8px"><div class="t">' + (x.ch === 'email' ? 'Email' : 'Text') + ' to ' + esc(x.to) + '</div><span class="tag">Draft</span></div>' +
        '<div class="m" style="margin:2px 0 8px">' + esc(x.why) + ' · ' + esc(when(x.at)) + '</div>' + (x.subj ? '<div class="flabel">Subject</div><div>' + esc(x.subj) + '</div>' : '') +
        '<div class="flabel">Message</div><textarea rows="3" data-body="' + esc(x.id) + '">' + esc(x.body) + '</textarea>' +
        '<div class="btns" style="margin-top:10px"><button class="btn red" data-ob="outboxDiscard" data-id="' + esc(x.id) + '">Discard</button><button class="btn ghost" data-ob="outboxEdit" data-id="' + esc(x.id) + '">Save edit</button><button class="btn" data-ob="outboxApprove" data-id="' + esc(x.id) + '">Approve</button></div></div>'; }).join('') +
        '<p class="m">Approve records your OK. Delivery is not connected yet, so approved items are not sent by this app.</p>'
        : empty('Nothing waiting', 'Texts and emails you write in New land here first.') + '<a class="btn w ghost" href="#/' + ST.P + '/new">Write a text or email</a>');
  };
  V.new = function () {
    var ch = ST.ch, dr = ST.draft;
    var head = '<h1>New ' + ch.toLowerCase() + '</h1><p class="sub">' + (ch === 'Call' ? 'Katya calls only after you confirm' : 'Goes to Approve first. Nothing sends by itself.') + '</p>' +
      '<div class="seg" style="margin:0 0 14px">' + ['Call', 'Text', 'Email'].map(function (c) { return '<button class="' + (ch === c ? 'on' : '') + '" data-ch="' + c + '">' + c + '</button>'; }).join('') + '</div>';
    var who = people().filter(function (c) { return (c.portal || 'life') === ST.P && !/^me\b/i.test(c.name || '') && String(c.num || '').replace(/\D/g, '').length >= 10; })
      .sort(function (a, b) { return (b.fav ? 1 : 0) - (a.fav ? 1 : 0); }).slice(0, 12);
    if (ch === 'Call') return head + (who.length ? '<div class="flabel">Who</div><div class="chips">' + who.map(function (c) { var on = dr.who === c.name; return '<button class="chip' + (on ? ' on' : '') + '" data-who="' + esc(people().indexOf(c)) + '">' + esc(c.name) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="flabel">Phone number</div><input id="nto" inputmode="tel" placeholder="(555) 555-5555" value="' + esc(dr.to || '') + '">' +
      '<div class="flabel">What is the call for? (keep it short)</div><textarea id="ntask" rows="4" placeholder="' + (TTG() ? 'Ask if they are still interested in the RBT role and when they can talk.' : 'Remind me to leave for the 3 PM pickup.') + '">' + esc(dr.task || '') + '</textarea>' +
      '<div class="m" id="nwords" style="margin-top:4px"></div>' + (TTG() ? '<div class="note" style="margin-top:10px">Business calls always start: “This is an automated AI assistant calling on behalf of Roni Gafni.” Not recorded.</div>' : '') +
      '<button class="btn w" style="margin-top:16px" data-act="confirmCall">Review and call</button>' + (TTG() ? '' : '<p class="m">Want Katya to call you instead? <button class="lnk" data-act="callMeOpen">Katya, call me</button></p>');
    return head + '<div class="flabel">To (' + (ch === 'Text' ? 'name or number' : 'email') + ')</div><input id="nto" value="' + esc(dr.to || '') + '">' +
      (ch === 'Email' ? '<div class="flabel">Subject</div><input id="nsubj" value="' + esc(dr.subj || '') + '">' : '') +
      '<div class="flabel">Message</div><textarea id="nbody" rows="5">' + esc(dr.body || '') + '</textarea>' +
      '<button class="btn w" style="margin-top:16px" data-act="toQueue">Add to Approve</button>';
  };
  V.routines = function () {
    var r = TTG() ? [] : ((ST.boot && ST.boot.routines) || []);
    return '<h1>Routines</h1><p class="sub">Calls that run on a schedule</p>' + (r.length ? r.map(function (x) {
      return '<div class="card pad"><div style="display:flex;justify-content:space-between;gap:8px"><div class="t">' + esc(x.name) + '</div><span class="tag good">On</span></div><div class="big" style="font-size:17px">' + esc(x.when) + '</div>' +
        '<div class="kv"><span class="m">Calls</span><span>' + esc(x.to) + '</span></div><div class="kv"><span class="m">Voice</span><span>' + esc(x.voice) + '</span></div><div class="kv"><span class="m">Longest</span><span>' + esc(x.max) + '</span></div>' +
        '<div class="kv"><span class="m">Voicemail</span><span style="text-align:right;max-width:65%">' + esc(x.vm) + '</span></div><p class="m">' + esc(x.rules) + '</p></div>'; }).join('')
      : empty(TTG() ? 'No TTG routines' : 'No routines', TTG() ? 'Business calls are started one at a time from New.' : '')) +
      '<h2>Everywhere</h2><div class="card"><div class="row"><div class="grow"><div class="t">Shabbat & Yom Tov</div><div class="m">All calls blocked from candle lighting to havdalah (checked by the server)</div></div><span class="tag good">Always on</span></div></div>' +
      '<p class="m">To change a time or turn one off, ask your assistant in chat.</p>';
  };
  V.personas = function () {
    var ps = personas(), cs = calls();
    return '<h1>Personas</h1><p class="sub">How Katya sounds on each kind of call</p>' + ps.map(function (p, i) {
      var n = cs.filter(function (c) { return p.types.indexOf(c.type) >= 0; }), ans = n.filter(function (c) { return /^Answered/.test(c.outcome); }).length;
      return '<a class="card pad" style="display:block" href="#/' + ST.P + '/persona/' + i + '"><div style="display:flex;justify-content:space-between"><div class="t">' + esc(p.name) + '</div><span class="chev">›</span></div><div class="m">' + esc(p.use) + '</div>' +
        '<div class="m" style="margin-top:6px">' + (p.kid ? '' : n.length + ' calls · ' + ans + ' answered · ') + 'voice: ' + esc(p.voice) + '</div></a>'; }).join('');
  };
  V.persona = function (i) {
    var p = personas()[+i]; if (!p) return empty('Persona not found');
    if (ST.pe && ST.pe.key === p.key) return personaForm(p, i);
    var long = p.words > 120, msg = ST.peMsg && ST.peMsg.key === p.key ? ST.peMsg : null, me = isRoni();
    return '<h1>' + esc(p.name) + '</h1><p class="sub">' + esc(p.use) + '</p>' +
      (msg ? '<div class="note ' + (msg.ok ? 'okbox' : 'warnbox') + '" role="status" style="margin-bottom:12px">' + esc(msg.t) + '</div>' : '') +
      '<div class="card"><div class="kv"><span class="m">Voice</span><span>' + esc(p.voice) + '</span></div><div class="kv"><span class="m">Instructions</span><span>' + (p.words ? p.words + ' words' : 'Set per call') + '</span></div>' + (p.kid ? '' : '<div class="kv"><span class="m">Call types</span><span>' + esc(p.types.join(', ')) + '</span></div>') + '</div>' +
      (me ? '<div class="btns" style="margin-top:10px"><button class="btn" data-peedit="' + esc(i) + '">Edit</button></div>' : '') +
      (long ? '<div class="note warnbox">These instructions are ' + p.words + ' words. Long instructions made Katya slow to reply (12 to 19 s). Around 120 words gave 4 to 7 s.</div>' : '') +
      (p.prompt ? '<h2>Instructions</h2><div class="card pad"><pre class="prompt">' + esc(p.prompt) + '</pre></div>' : '') +
      (me && p.kid ? '<p class="m">Saving changes only the stored persona. It does not place, schedule or turn on any call.</p>' : '') +
      (me && !p.kid ? '<h2>Sample call</h2><div class="card"><div class="row"><div class="grow"><div class="t">Private: not recorded, leaves no history in the Calls app</div>' +
        '<div class="m">' + 'Bland still keeps its own transcript. Your assistants have a rule never to open private calls, but anyone with Bland access could.' + (ST.samplePriv ? '' : ' Off now: a normal call, kept like other calls.') + '</div></div>' +
        '<button class="sw' + (ST.samplePriv ? ' on' : '') + '" data-samplepriv="1" role="switch" aria-checked="' + (ST.samplePriv ? 'true' : 'false') + '" aria-label="Private sample call"></button></div></div>' +
        '<div class="btns" style="margin-top:10px"><button class="btn ghost" data-sample="' + esc(i) + '">Call me as a sample</button></div><p class="m">Calls your own phone only, in this persona\u2019s voice and instructions. One sample every 2 minutes.</p>' : '') +
      (me ? '<p class="m">Changes apply to the next call.</p>' : '');
  };
  function personaForm(p, i) {
    var e = ST.pe, er = e.errs || {};
    if (!ST.voices && !ST.vLoading) { ST.vLoading = true; api('voices2').then(function (j) { ST.voices = j.voices; }).catch(function (x) { ST.voices = []; e.msg = 'Could not load voices: ' + x.message; }).then(function () { ST.vLoading = false; peRead(); draw(1); }); }
    var f = function (lab, inner, err) { return '<div class="fld"><div class="flabel">' + lab + '</div>' + inner + (err ? '<div class="ferr" role="alert">' + esc(err) + '</div>' : '') + '</div>'; };
    var vs = (p.voiceChoices || []).filter(function (c) { return !(ST.voices || []).some(function (v) { return v.id === c.id; }); }).concat(ST.voices || []), has = vs.some(function (v) { return v.id === e.voiceId; });
    return '<h1>Edit persona</h1><p class="sub">' + esc(p.name) + '</p>' + (e.msg ? '<div class="note warnbox" role="status" style="margin-bottom:12px">' + esc(e.msg) + '</div>' : '') +
      '<div class="card pad">' +
      f('Name', '<input id="pe_name" maxlength="60" value="' + esc(e.name) + '">', er.name) +
      f('Description', '<input id="pe_use" maxlength="200" value="' + esc(e.use) + '">', er.use) +
      f('Voice', ST.voices ? '<select id="pe_voice"><option value=""' + (has ? '' : ' selected') + '>Pick a voice</option>' + vs.map(function (v) { return '<option value="' + esc(v.id) + '"' + (v.id === e.voiceId ? ' selected' : '') + '>' + esc(v.name) + '</option>'; }).join('') + '</select>' : '<div class="m"><span class="spin"></span>Loading voices</div>', er.voice) +
      f('Instructions', '<textarea id="pe_prompt" rows="10" maxlength="6000">' + esc(e.prompt) + '</textarea><div class="m">What Katya should do and say on these calls. Leave empty to write them per call.</div>', er.prompt) +
      ((p.typeChoices || []).length ? f('Call types', (p.typeChoices || []).map(function (t) { return '<label class="chk"><input type="checkbox" name="pe_type" value="' + esc(t.key) + '"' + (e.types.indexOf(t.key) >= 0 ? ' checked' : '') + '> ' + esc(t.label) + '</label>'; }).join(''), er.types) : '') +
      '</div><p class="m">Changes apply to the next call.' + (p.kid ? ' Saving does not place or schedule a call.' : '') + '</p>' +
      '<div class="savebar"><button class="btn ghost" data-act="peCancel">Cancel</button><button class="btn" data-act="peSave"' + (e.saving ? ' disabled' : '') + '>' + (e.saving ? 'Saving' : 'Save') + '</button></div>';
  }
  function peRead() { var e = ST.pe; if (!e) return; var g = function (id) { var x = $('#' + id); return x ? x.value : null; };
    var n = g('pe_name'), u = g('pe_use'), v = g('pe_voice'), pr = g('pe_prompt'), bx = document.querySelectorAll('input[name=pe_type]');
    if (n != null) e.name = n; if (u != null) e.use = u; if (v != null) e.voiceId = v; if (pr != null) e.prompt = pr;
    if (bx.length) e.types = Array.prototype.filter.call(bx, function (b) { return b.checked; }).map(function (b) { return b.value; }); }
  function peCheck(e) { var r = {};
    if (!e.name.trim()) r.name = 'Name is required'; if (!e.use.trim()) r.use = 'Description is required';
    if (!e.voiceId) r.voice = 'Pick a voice'; if (!e.kid && !e.types.length) r.types = 'Pick at least one call type';
    if (e.prompt.length > 6000) r.prompt = 'Instructions are too long (6000 characters max)'; return r; }
  V.insights = function () {
    var cs = calls(); if (!cs.length) return empty('No calls yet');
    var a = cs.filter(function (c) { return /^Answered/.test(c.outcome); }).length, mins = cs.reduce(function (s, c) { return s + (+c.min || 0); }, 0), L = cs.filter(function (c) { return c.lat != null; });
    var by = {}; cs.forEach(function (c) { var b = by[c.type] = by[c.type] || [0, 0]; b[0]++; if (/^Answered/.test(c.outcome)) b[1]++; });
    return '<h1>Insights</h1><p class="sub">' + (TTG() ? 'TTG' : 'Life') + ' · all ' + cs.length + ' calls</p><div class="stat"><div><b>' + Math.round(a / cs.length * 100) + '%</b><span class="m">Answered</span></div><div><b>' + Math.round(mins) + 'm</b><span class="m">Talk time</span></div><div><b>' + (L.length ? (L.reduce(function (s, c) { return s + c.lat; }, 0) / L.length).toFixed(1) + 's' : 'n/a') + '</b><span class="m">Avg. reply gap</span></div></div>' +
      '<h2>By type</h2><div class="card">' + Object.keys(by).map(function (k) { var b = by[k]; return '<div class="row"><div class="grow"><div class="t">' + esc(k) + '</div><div class="bar" style="margin-top:6px"><i style="width:' + Math.round(b[1] / b[0] * 100) + '%"></i></div></div><span class="m">' + b[1] + ' of ' + b[0] + ' answered</span></div>'; }).join('') + '</div>';
  };
  V.settings = function () {
    var b = ST.boot || {}, r = function (t, s, tag) { return '<div class="row"><div class="grow"><div class="t">' + t + '</div>' + (s ? '<div class="m">' + s + '</div>' : '') + '</div>' + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</div>'; };
    return '<h1>Settings</h1><p class="sub">' + (TTG() ? 'TTG' : 'Life') + '</p><h2>Calling line</h2><div class="card">' + r('Katya’s number', esc(fmtNum(b.line || ''))) + (TTG() ? '' : '<a class="row link" href="#/life/line"><div class="grow"><div class="t">Who answers</div><div class="m">' + (lineSetup() ? 'Agents by caller' : 'Katya, every call and text') + '</div></div><span class="chev">›</span></a>') + r('Data source', b.hasKey ? 'Live from Bland' : 'Saved copy (Bland not connected)', b.hasKey ? 'Live' : 'Saved') + '</div>' +
      '<h2>Safety</h2><div class="card">' + r('Texts & emails need approval', 'No automatic sending exists', 'Always') + r('Calls need a confirm tap', '', 'Always') + r('Business calls say they are AI', 'Added by the server', 'Always') + r('Daily call limit', '20 calls a day', 'On') + r('Shabbat & Yom Tov', 'Calls blocked', 'On') + '</div>' +
      '<h2>Privacy</h2><div class="card">' + r('Student names on TTG', 'Shown as initials', 'On') + r('Life and TTG kept apart', 'Never mixed in lists or search', 'On') + r('Keys', 'Bland key stays on the private server, never in this app') + '</div>' +
      '<h2>This phone</h2><div class="card">' + (STANDALONE ? r('Installed ✓', 'Running as the Home Screen app') : DEFER ? r('Not installed', 'Tap Install app at the top') : r('Not installed', howToInstall())) + '<button class="row link" style="width:100%;background:none;border:0;border-top:1px solid var(--line);text-align:left" data-act="forget"><div class="grow"><div class="t" style="color:#a32020">Forget this device</div><div class="m">Removes your link key from this phone</div></div></button></div>';
  };
  /* ---------- v6: Call settings, voices, people ---------- */
  var CST = { global: 'All calls', wake: 'Wake-up', pre_calendar: 'Calendar brief', personal: 'Personal', business: 'Business' };
  var IRR = ['Never', 'Hard', 'Balanced', 'Easy', 'Instantly'], BG = [['none', 'Quiet'], ['static', 'Phone static'], ['office', 'Office'], ['cafe', 'Cafe'], ['restaurant', 'Restaurant']];
  var VMA = [['hangup', 'Hang up'], ['leave_message', 'Leave message'], ['ignore', 'Keep talking']];
  function csTypes() { return TTG() ? ['global', 'business'] : ['global', 'wake', 'pre_calendar', 'personal']; }
  function csLoad(force) { if (ST.cs && !force) return; api('getCallSettings').then(function (j) { ST.cs = j; ST.csd = JSON.parse(JSON.stringify(j.settings)); ST.csDirty = false; draw(1); }).catch(function (x) { ST.csErr = x.message; draw(1); }); }
  function csVal(t, k) { var d = ST.csd, o = t === 'global' ? d.global : (d.types[t] || {}); return (o[k] != null && o[k] !== '') ? o[k] : (d.global || {})[k]; }
  function csOwn(t, k) { if (t === 'global') return false; var o = ST.csd.types[t] || {}; return o[k] != null && o[k] !== ''; }
  function csSet(t, k, v) { var d = ST.csd; if (t === 'global') d.global[k] = v; else { d.types[t] = d.types[t] || {}; d.types[t][k] = v; } ST.csDirty = true; }
  function voiceName(id) { var v = (ST.voices || []).filter(function (x) { return x.id === id; })[0]; return v ? v.name : (id && id.indexOf('ea40b7a4') === 0 ? 'Michelle' : 'Voice ' + String(id || '').slice(0, 6)); }
  function fhead(t, k, label, val) { return '<div class="fh"><span class="t">' + label + '</span><span class="fv">' + val + '</span></div>' + (csOwn(t, k) ? '<button class="reset" data-csreset="' + k + '">Custom for ' + CST[t] + ' · use All calls</button>' : ''); }
  function sw(k, on) { return '<button class="sw' + (on ? ' on' : '') + '" role="switch" aria-checked="' + !!on + '" data-cssw="' + k + '"></button>'; }
  function tog(t, k, label, hint) { return '<div class="row"><div class="grow"><div class="t">' + label + '</div>' + (hint ? '<div class="m">' + hint + '</div>' : '') + (csOwn(t, k) ? '<button class="reset" data-csreset="' + k + '">Custom · use All calls</button>' : '') + '</div>' + sw(k, csVal(t, k)) + '</div>'; }
  function seg(k, opts, cur) { return '<div class="segs">' + opts.map(function (o) { return '<button class="' + (String(cur) === String(o[0]) ? 'on' : '') + '" data-csseg="' + k + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  function rng(k, min, max, step, v) { return '<input type="range" class="rng" data-csr="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '">'; }
  V.callset = function () {
    csLoad(); if (!ST.cs) return ST.csErr ? empty('Could not load settings', ST.csErr) : loading('Loading call settings…');
    if (!ST.csT || csTypes().indexOf(ST.csT) < 0) ST.csT = 'global';
    var t = ST.csT, it = csVal(t, 'interruptibility'), th = csVal(t, 'interruption_threshold'), vma = csVal(t, 'vm_action') || 'hangup';
    var h = '<h1>Call settings</h1><p class="sub">How Katya behaves on calls</p>' +
      '<div class="flabel">Applies to</div><div class="chips">' + csTypes().map(function (k) { return '<button class="chip' + (k === t ? ' on' : '') + '" data-cst="' + k + '">' + CST[k] + '</button>'; }).join('') + '</div>' +
      (t !== 'global' ? '<p class="m">Only ' + CST[t] + ' calls. Anything not marked Custom follows All calls.</p>' : '<p class="m">Default for every call (Life and TTG).</p>') +
      '<h2>Voice</h2><div class="card"><a class="row link" href="#/' + ST.P + '/voices"><div class="grow"><div class="t">' + esc(voiceName(csVal(t, 'voice'))) + '</div><div class="m">Tap to hear and change</div>' + (csOwn(t, 'voice') ? '<div class="m">Custom for ' + CST[t] + '</div>' : '') + '</div><span class="chev">›</span></a></div>' +
      '<h2>Taking turns</h2><div class="card">' +
      '<div class="fld">' + fhead(t, 'interruptibility', 'Stops when you talk over her', IRR[it]) + rng('interruptibility', 0, 4, 1, it) + '<div class="xl"><span>Never</span><span>Instantly</span></div></div>' +
      tog(t, 'block_interruptions', 'Finish sentences no matter what', 'Ignores interruptions completely') +
      '<div class="fld">' + fhead(t, 'interruption_threshold', 'Pause before she replies', th === 'auto' ? 'Auto' : th + ' ms') + (th === 'auto' ? '' : rng('interruption_threshold', 50, 1000, 10, th) + '<div class="xl"><span>Quick</span><span>Patient</span></div>') +
      '<div class="row"><div class="grow"><div class="t">Let Bland decide</div><div class="m">Adapts to how you speak</div></div><button class="sw' + (th === 'auto' ? ' on' : '') + '" data-csauto="1"></button></div></div>' +
      tog(t, 'wait_for_greeting', 'Wait for "hello" first', 'Off: Katya speaks as soon as you pick up') + '</div>' +
      '<h2>Speech</h2><div class="card"><div class="fld">' + fhead(t, 'temperature', 'Creativity', (+csVal(t, 'temperature')).toFixed(2)) + rng('temperature', 0, 1, 0.05, csVal(t, 'temperature')) + '<div class="xl"><span>Predictable</span><span>Varied</span></div></div>' +
      '<div class="fld">' + fhead(t, 'model', 'Model', csVal(t, 'model') === 'turbo' ? 'Turbo' : 'Base') + seg('model', [['base', 'Base · follows script'], ['turbo', 'Turbo · faster']], csVal(t, 'model')) + '</div></div>' +
      '<h2>Call</h2><div class="card"><div class="fld">' + fhead(t, 'max_duration', 'Longest call', csVal(t, 'max_duration') + ' min') + rng('max_duration', 1, 30, 1, csVal(t, 'max_duration')) + '</div>' +
      tog(t, 'noise_cancellation', 'Filter background noise', 'Helps in loud places; can cut soft speech') +
      '<div class="fld">' + fhead(t, 'background_track', 'Background sound', (BG.filter(function (b) { return b[0] === csVal(t, 'background_track'); })[0] || BG[0])[1]) + seg('background_track', BG, csVal(t, 'background_track') || 'none') + '</div></div>' +
      '<h2>Voicemail</h2><div class="card"><div class="fld">' + fhead(t, 'vm_action', 'If voicemail answers', (VMA.filter(function (b) { return b[0] === vma; })[0] || VMA[0])[1]) + seg('vm_action', VMA, vma) +
      (vma === 'leave_message' ? '<textarea id="csvm" rows="3" maxlength="400" placeholder="Message to leave">' + esc(csVal(t, 'vm_message') || '') + '</textarea>' : '') + '</div>' +
      tog(t, 'vm_sensitive', 'Smarter voicemail detection', 'Slower, fewer mistakes') + '</div>' +
      '<div class="btns" style="margin-top:6px"><button class="btn ghost" data-act="csPreview">See what is sent</button></div>' +
      '<p class="m">Used by app calls and Katya’s routine calls. The Shabbat and Yom Tov block, the AI disclosure and the 20-call limit are enforced for calls started in this app. Routine calls follow their own instructions.</p>' +
      (ST.csDirty ? '<div class="savebar"><button class="btn ghost" data-act="csUndo">Undo</button><button class="btn" data-act="csSave">Save</button></div>' : '<p class="m">Saved · version ' + (ST.cs.settings.rev || 0) + '</p>');
    return h;
  };
  V.voices = function () {
    csLoad(); var t = ST.csT || 'global';
    if (!ST.voices && !ST.vLoading) { ST.vLoading = true; api('voices2').then(function (j) { ST.voices = j.voices; }).catch(function (x) { ST.voices = []; toast(x.message); }).then(function () { ST.vLoading = false; draw(1); }); }
    if (!ST.voices || !ST.cs) return loading('Loading voices…');
    var cur = csVal(t, 'voice');
    return '<h1>Voice</h1><p class="sub">For ' + CST[t] + (t === 'global' ? '' : ' calls') + '</p><div class="chips">' + csTypes().map(function (k) { return '<button class="chip' + (k === t ? ' on' : '') + '" data-cst="' + k + '">' + CST[k] + '</button>'; }).join('') + '</div>' +
      '<div class="card">' + ST.voices.map(function (v) {
        var on = v.id === cur;
        return '<div class="voice"><div class="grow"><div class="t">' + esc(v.name) + (on ? ' <span class="tag acc">In use</span>' : '') + '</div><div class="m">' + esc(v.d) + '</div></div>' +
          (v.pv ? '<button class="btn sm ghost" data-play="' + esc(v.id) + '">' + (ST.playing === v.id ? 'Stop' : 'Play') + '</button>' : '<span class="m" style="font-size:13px">No preview</span>') +
          (on ? '' : '<button class="btn sm" data-setvoice="' + esc(v.id) + '">Use</button>') + '</div>';
      }).join('') + '</div>' + (ST.csDirty ? '<div class="savebar"><button class="btn ghost" data-act="csUndo">Undo</button><button class="btn" data-act="csSave">Save</button></div>' : '') +
      '<p class="m">Preview is a short sample in that voice. Some older voices have no preview.</p>';
  };
  var people = function () { return ((ST.boot && ST.boot.contacts) || []); };
  function favRow() {
    var f = people().filter(function (c) { return c.fav && (c.portal || 'life') === ST.P && !/^me\b/i.test(c.name || '') && c.num; }); if (!f.length) return '';
    return '<h2>Have Katya call <a href="#/' + ST.P + '/people">People</a></h2><div class="favs">' + f.map(function (c) { var i = people().indexOf(c);
      return '<button class="fav" data-pact="' + i + '"><span class="av">' + esc(ini(c.name)) + '</span><span class="fn">' + esc(c.name) + '</span></button>'; }).join('') + '</div>';
  }
  V.people = function () {
    var ps = people(), pick = 'contacts' in navigator && 'ContactsManager' in window;
    return '<h1>People</h1><p class="sub">Favorites and contacts. Private to you.</p>' +
      '<div class="btns"><button class="btn ghost" data-act="pAdd">Add person</button>' + (pick ? '<button class="btn ghost" data-act="pPick">Import from phone</button>' : '<label class="btn ghost">Import .vcf<input type="file" id="vcf" accept=".vcf,text/vcard,text/x-vcard" hidden></label>') + '</div>' +
      (ps.length ? '<div class="card" style="margin-top:12px">' + ps.map(function (c, i) {
        return '<button class="row link plain" data-pact="' + i + '"><div class="av">' + esc(ini(c.name)) + '</div><div class="grow"><div class="t">' + esc(c.name) + '</div><div class="m">' + (c.num ? esc(fmtNum(c.num)) : 'No number yet') + ' · ' + (c.portal === 'ttg' ? 'TTG' : 'Life') + '</div></div>' + (c.fav ? '<span class="tag">Favorite</span>' : '') + '<span class="chev">›</span></button>'; }).join('') + '</div>' : empty('No people yet')) +
      '<p class="m">Tap a person to have Katya call them, or call them yourself.</p>';
  };
  function personSheet(i) {
    var c = people()[i] || { name: '', num: '', email: '', fav: true, portal: ST.P }, n = String(c.num || '').replace(/[^\d+]/g, '');
    sheet('<h3 style="margin:0 0 6px">' + esc(c.name || 'New person') + '</h3>' + (c.name && !n ? '<p class="m">Add a number to call or text.</p>' : '') +
      '<div class="flabel">Name</div><input id="pn" value="' + esc(c.name) + '"><div class="flabel">Phone</div><input id="pt" type="tel" inputmode="tel" value="' + esc(c.num || '') + '" placeholder="Not set"><div class="flabel">Email</div><input id="pe" type="email" value="' + esc(c.email || '') + '" placeholder="Not set">' +
      '<div class="row"><div class="grow"><div class="t">Favorite</div></div><button class="sw' + (c.fav ? ' on' : '') + '" id="pf" data-pfav="1"></button></div>' +
      '<div class="btns">' + (people()[i] ? '<button class="btn red" data-pdel="' + i + '">Remove</button>' : '') + '<button class="btn ghost" data-act="cancel">Cancel</button><button class="btn" data-psave="' + (people()[i] ? i : -1) + '">Save</button></div>');
  }
  function savePeople(list, msg) { return api('saveContacts2', { list: list }).then(function (j) { ST.boot.contacts = j.contacts; toast(msg || 'Saved'); draw(1); }).catch(function (x) { toast(x.message); }); }
  function mergePeople(add) { var ps = people().slice(), names = {}; ps.forEach(function (c) { names[c.name.toLowerCase()] = c; }); var n = 0;
    add.forEach(function (a) { if (!a.name) return; var e = names[a.name.toLowerCase()]; if (e) { if (!e.num && a.num) e.num = a.num; if (!e.email && a.email) e.email = a.email; } else { ps.push({ name: a.name, num: a.num || '', email: a.email || '', fav: false, portal: ST.P }); n++; } });
    return savePeople(ps, n + ' added'); }
  function parseVcf(txt) { return txt.replace(/\r\n[ \t]/g, '').split(/BEGIN:VCARD/i).slice(1).map(function (b) {
    var g = function (re) { var m = re.exec(b); return m ? m[1].trim() : ''; };
    return { name: g(/^FN[^:\n]*:(.+)$/im) || g(/^N[^:\n]*:([^;\n]*)/im), num: g(/^TEL[^:\n]*:(.+)$/im), email: g(/^EMAIL[^:\n]*:(.+)$/im) }; }).slice(0, 300); }
  function playVoice(id) {
    if (ST.audio) { ST.audio.pause(); ST.audio = null; } if (ST.playing === id) { ST.playing = null; return draw(1); }
    ST.playing = id; draw(1); var u = './voice-sample/' + id + '.wav';
    var get = (window.caches ? caches.open('calls-voice-v1').then(function (c) { return c.match(u).then(function (r) { return r || api('voiceSample', { id: id }).then(function (j) {
      var bin = atob(j.b64), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
      var res = new Response(new Blob([a], { type: j.mime })); return c.put(u, res.clone()).then(function () { return res; }); }); }); }) : Promise.reject(new Error('No audio cache')));
    get.then(function (r) { return r.blob(); }).then(function (b) { if (ST.playing !== id) return; var au = new Audio(URL.createObjectURL(b)); ST.audio = au; au.onended = function () { ST.playing = null; draw(1); }; return au.play(); })
      .catch(function (x) { ST.playing = null; toast(x.message); draw(1); });
  }
  V.more = function () {
    var nq = outbox().length;
    var it = [['queue', 'Approve', nq ? nq + ' waiting for your OK' : 'Texts and emails you wrote'], ['routines', 'Routines', 'Wake-up and calendar calls'], ['personas', 'Personas', 'How Katya sounds on each kind of call'], ['callset', 'Call settings', 'Voice, turn-taking, voicemail']]
      .concat(TTG() ? [] : [['line', 'Phone line', 'Who answers each caller']]).concat([['insights', 'Insights', 'Answer rate and talk time'], ['settings', 'Settings', 'Safety, privacy, this phone']]);
    return '<h1>More</h1>' + '<div class="card">' + it.map(function (i) { return '<a class="row link" href="#/' + ST.P + '/' + i[0] + '"><div class="grow"><div class="t">' + i[1] + '</div>' + (i[2] ? '<div class="m">' + i[2] + '</div>' : '') + '</div>' + (i[0] === 'queue' && nq ? '<span class="tag warn">' + nq + '</span>' : '') + '<span class="chev">›</span></a>'; }).join('') + '</div>';
  };
  V.line = function () {
    var ls = lineSetup();
    var head = '<h1>Phone line</h1><p class="sub">Who answers calls and texts on Katya’s line</p>';
    if (!ls) return head + '<div class="card"><div class="row"><div class="av">K</div><div class="grow"><div class="t">Katya</div><div class="m">Answers every call and text on this line</div></div><span class="tag good">On</span></div></div>' +
      '<h2>Callers</h2><div class="card"><div class="row"><div class="grow"><div class="t">Everyone</div><div class="m">Calls and texts</div></div><span class="tag">Katya</span></div></div>';
    var pool = (ST.calls || []).filter(canSee);
    return head + '<h2>Who handles whom</h2><div class="card">' + ls.routes.map(function (r) {
        return '<div class="row"><div class="grow"><div class="t">' + esc(r.label) + (r.role ? ' <span class="m">· ' + esc(r.role) + '</span>' : '') + '</div>' + (r.does ? '<div class="m">' + esc(r.does) + '</div>' : '') + '</div><span class="tag acc">' + esc(ls.byId[r.agent].name) + '</span></div>'; }).join('') + '</div>' +
      '<h2>Agents</h2>' + ls.agents.map(function (a) {
        var st = ROUTE_OK[a.status], mine = pool.filter(function (c) { return c.agent === a.id; }).slice(0, 3);
        return '<div class="card agent"><div class="row"><div class="av">' + esc(ini(a.name)) + '</div><div class="grow"><div class="t">' + esc(a.name) + '</div><div class="m">' + esc([a.serves, a.voice, a.handles || 'Calls and texts'].filter(Boolean).join(' · ')) + '</div></div><span class="tag ' + st[0] + '">' + st[1] + '</span></div>' +
          (mine.length ? mine.map(callRow).join('') : '<div class="row"><div class="m">No calls yet</div></div>') + '</div>'; }).join('');
  };
  V.gate = function () { return '<div class="gate"><h1>Katya Calls</h1><p class="sub">Private app</p><div class="card pad">' + (ST.err ? '<p><b>' + esc(ST.err) + '</b></p>' : '') + '<p>Open this app once from your personal link (it ends in <b>#k=…</b>). After that it remembers this phone.</p><p class="m">No calls or keys are stored in this app; they come from your private server.</p></div></div>'; };

  /* ---------- shell ---------- */
  var ICO = {today: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>', calls: '<path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>', people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>', more: '<path d="M4 6h16M4 12h16M4 18h16"/>'};
  var NAV = [['today', '⌂', 'Home'], ['calls', '☏', 'Calls'], ['people', '', 'People'], ['more', '☰', 'More']];
  var TITLE = { today: 'Home', calls: 'Calls', call: 'Call', ask: 'Ask', queue: 'Approve', new: 'New', routines: 'Routines', personas: 'Personas', persona: 'Persona', insights: 'Insights', settings: 'Settings', more: 'More', callset: 'Call settings', voices: 'Voice', people: 'People', line: 'Phone line' };
  var PARENT = { call: 'calls', ask: 'calls', queue: 'more', persona: 'personas', routines: 'more', personas: 'more', insights: 'more', settings: 'more', new: 'today', callset: 'more', voices: 'callset', line: 'more' };
  var TABOF = { call: 'calls', ask: 'calls', new: 'today' };
  function parse() { var h = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean); if (h[0] === 'life' || h[0] === 'ttg') { ST.P = h.shift(); localStorage.setItem('calls.p', ST.P); } ST.route = h.length ? h : ['today']; if (!V[ST.route[0]] || ST.route[0] === 'gate') ST.route = ['today']; }
  function draw(keep) {
    var r = KEY && !ST.fatal ? ST.route[0] : 'gate', ttg = TTG();
    document.documentElement.style.setProperty('--acc', ttg ? 'var(--ttg)' : 'var(--life)'); document.documentElement.style.setProperty('--accs', ttg ? 'var(--ttgs)' : 'var(--lifes)');
    var act = TABOF[r] || (NAV.some(function (n) { return n[0] === r; }) ? r : 'more'), home = r !== 'today' && r !== 'gate', par = PARENT[r];
    
    $('#loc').innerHTML = (home ? '<a class="homeb" href="#/' + ST.P + '/today" aria-label="Home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>Home</a>' : '') + (par ? '<a class="backl" href="#/' + ST.P + '/' + par + '">‹ ' + TITLE[par] + '</a>' : '<div class="brand">Katya Calls<small>Roni · ' + (ttg ? 'TTG' : 'Life') + '</small></div>');
    $('#seg').innerHTML = '<button class="' + (!ttg ? 'on' : '') + '" data-p="life">Life</button><button class="' + (ttg ? 'on' : '') + '" data-p="ttg">TTG</button>';
    $('#seg').style.display = r === 'gate' ? 'none' : ''; $('#newb').style.display = r === 'gate' || r === 'new' ? 'none' : ''; $('#newb').href = '#/' + ST.P + '/new'; showInst();
    var nq = outbox().length;
    $('#tabs').innerHTML = r === 'gate' ? '' : NAV.map(function (n) { return '<a href="#/' + ST.P + '/' + n[0] + '" class="' + (act === n[0] ? 'on' : '') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICO[n[0]] + '</svg>' + n[2] + (n[0] === 'more' && nq ? '<span class="badge" aria-label="' + nq + ' waiting">' + nq + '</span>' : '') + '</a>'; }).join('');
    var m = $('#m'); m.innerHTML = V[r](ST.route[1]);
    if (!keep) { m.style.animation = 'none'; void m.offsetHeight; m.style.animation = ''; scrollTo(0, 0); }
    var t = $('#ntask'); if (t) { var u = function () { var w = t.value.trim().split(/\s+/).filter(String).length; $('#nwords').textContent = w ? w + ' words' + (w > 120 ? '. Shorter is faster (under 120).' : '') : ''; }; t.oninput = u; u(); }
  }
  function saveDraft() { ['to', 'task', 'subj', 'body'].forEach(function (k) { var e = $('#n' + k); if (e) ST.draft[k] = e.value; });
    if (ST.draft.who) { var w = people().filter(function (c) { return c.name === ST.draft.who; })[0], d10 = function (x) { return String(x || '').replace(/\D/g, '').slice(-10); };
      if (!w || d10(w.num) !== d10(ST.draft.to)) ST.draft.who = ''; } }
  function load() {
    if (!KEY) return draw();
    api('boot').then(function (b) { ST.boot = b; draw(1); return api('calls2', { n: 100 }); })
      .then(function (j) { ST.calls = j.calls || []; ST.live = j.live; draw(1); })
      .catch(function (e) { if (/locked/.test(e.message)) { ST.fatal = 1; ST.err = 'This link key is not valid anymore.'; } else { ST.calls = ST.calls || []; toast('Could not reach the server: ' + e.message); } draw(1); });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button,a'); if (!t) return;
    if (e.target === $('#sheet')) return closeSheet();
    var d = t.dataset;
    if (d.p) { ST.P = d.p; localStorage.setItem('calls.p', ST.P); ST.ask = null; ST.f = { type: 'All', person: '', persona: '' }; var r0 = ST.route[0]; go(/^(call|persona)$/.test(r0) ? PARENT[r0] : r0); return; }
    if (t.matches('a.hit')) ST.from = 'ask'; else if (t.matches('a.row')) ST.from = '';
    if (d.cst) { ST.csT = d.cst; draw(1); return; }
    if (d.cssw) { csSet(ST.csT, d.cssw, !csVal(ST.csT, d.cssw)); draw(1); return; }
    if (d.csauto) { csSet(ST.csT, 'interruption_threshold', csVal(ST.csT, 'interruption_threshold') === 'auto' ? 160 : 'auto'); draw(1); return; }
    if (d.csseg) { csSet(ST.csT, d.csseg, d.v); draw(1); return; }
    if (d.csreset) { delete ST.csd.types[ST.csT][d.csreset]; ST.csDirty = true; draw(1); return; }
    if (d.setvoice) { csSet(ST.csT, 'voice', d.setvoice); draw(1); return; }
    if (d.play) { playVoice(d.play); return; }
    if (d.act === 'csUndo') { ST.csd = JSON.parse(JSON.stringify(ST.cs.settings)); ST.csDirty = false; draw(1); return; }
    if (d.act === 'csSave') { var vm = $('#csvm'); if (vm) csSet(ST.csT, 'vm_message', vm.value); t.disabled = true;
      api('saveCallSettings', { settings: ST.csd }).then(function (j) { ST.cs = j; ST.csd = JSON.parse(JSON.stringify(j.settings)); ST.csDirty = false; toast('Saved. Next calls use this.'); draw(1); }).catch(function (x) { t.disabled = false; toast(x.message); }); return; }
    if (d.act === 'csPreview') { var ty = ST.csT === 'global' ? (TTG() ? 'business' : 'personal') : ST.csT;
      api('previewCall', { type: ty }).then(function (j) { sheet('<h3 style="margin:0 0 4px">Sent to Bland for ' + CST[ty] + '</h3><p class="m">Saved settings only. Nothing is called.</p><pre class="prompt json">' + esc(JSON.stringify(j.body, null, 1)) + '</pre><button class="btn w" data-act="cancel">Close</button>'); }).catch(function (x) { toast(x.message); }); return; }
    if (d.pact != null) { personActions(+d.pact); return; }
    if (d.pedit != null) { personSheet(+d.pedit); return; }
    if (d.kcall != null) { var kc = people()[+d.kcall]; closeSheet(); if (!kc) return; ST.ch = 'Call'; ST.draft = { to: fmtNum(kc.num), who: kc.name }; if (location.hash.indexOf('/new') > 0) draw(); else go('new'); return; }
    if (d.who != null) { saveDraft(); var wc = people()[+d.who]; if (wc) { ST.draft.to = fmtNum(wc.num); ST.draft.who = wc.name; } draw(1); return; }
    if (d.act === 'callMeOpen') { callMeSheet(); return; }
    if (d.cm) { callMeSheet(d.cm); return; }
    if (d.cmk) { var cn = $('#cmnote'); if (cn) ST.cm.note = cn.value; callMeSheet(d.cmk); return; }
    if (d.act === 'saveMe') { var mn = String(($('#menum') || {}).value || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
      if (mn.length !== 10) return callMeSheet(null, 'Enter a 10-digit number');
      t.disabled = true; var pl = people().slice(); pl.push({ name: 'Me', num: mn, email: '', fav: false, portal: 'life' });
      api('saveContacts2', { list: pl }).then(function (j) { ST.boot.contacts = j.contacts; if (meContact()) callMeSheet(); else callMeSheet(null, 'Saved, but the number did not come back. Check People.'); })
        .catch(function (x) { callMeSheet(null, 'Not saved: ' + x.message); }); return; }
    if (d.act === 'callMe') { var me = meContact(); if (!me) return callMeSheet(); var nt = $('#cmnote'); ST.cm.note = nt ? nt.value.trim() : '';
      t.disabled = true; t.textContent = 'Calling…';
      api('start', { to: String(me.num).replace(/\D/g, ''), task: callMeTask(ST.cm.k, ST.cm.note), portal: 'life', type: 'personal' })
        .then(function () { closeSheet(); ST.cm = null; ST.pending = Date.now(); toast('Katya is calling you now'); draw(1); setTimeout(load, 20000); setTimeout(load, 90000); })
        .catch(function (x) { callMeSheet(null, x.message); }); return; }
    if (d.act === 'clearAsk') { ST.ask = null; ST.asking = false; ST.askq = ''; if (ST.route[0] === 'ask') go('calls'); else draw(); return; }
    if (d.act === 'pAdd') { personSheet(-1); return; }
    if (d.pfav) { t.classList.toggle('on'); return; }
    if (d.psave) { var i = +d.psave, ps = people().slice(), c = { name: $('#pn').value.trim(), num: $('#pt').value.trim(), email: $('#pe').value.trim(), fav: $('#pf').classList.contains('on'), portal: (ps[i] || {}).portal || ST.P };
      if (!c.name) return toast('Add a name'); if (i >= 0) ps[i] = c; else ps.push(c); closeSheet(); savePeople(ps); return; }
    if (d.pdel) { var ps2 = people().slice(); ps2.splice(+d.pdel, 1); closeSheet(); savePeople(ps2, 'Removed'); return; }
    if (d.act === 'pPick') { navigator.contacts.select(['name', 'tel', 'email'], { multiple: true }).then(function (l) { return mergePeople(l.map(function (x) { return { name: (x.name || [])[0], num: (x.tel || [])[0], email: (x.email || [])[0] }; })); }).catch(function (x) { toast(x.message); }); return; }
    if (d.ft) { ST.f.type = d.ft; draw(1); }
    if (d.ex) { ST.askq = d.ex; doAsk(); }
    if (d.ch) { saveDraft(); ST.ch = d.ch; draw(1); }
    if (d.again) { ST.ch = 'Call'; var ag = people().filter(function (c) { return String(c.num || '').replace(/\D/g, '').slice(-10) === String(d.again).replace(/\D/g, '').slice(-10); })[0]; ST.draft = { to: fmtNum(d.again), who: ag ? ag.name : '' }; go('new'); }
    if (d.ob) { var b = document.querySelector('[data-body="' + d.id + '"]'); t.disabled = true;
      api(d.ob, { id: d.id, body: b && b.value }).then(function (j) { ST.boot.outbox = j.outbox; toast(d.ob === 'outboxApprove' ? 'Approved. Not sent automatically' : d.ob === 'outboxDiscard' ? 'Discarded' : 'Saved'); draw(1); }).catch(function (x) { t.disabled = false; toast(x.message); }); }
    if (d.act === 'toQueue') { saveDraft(); var dr = ST.draft; if (!dr.to || !dr.body) return toast('Add who it is for and a message');
      t.disabled = true; api('outboxAdd', { ch: ST.ch === 'Email' ? 'email' : 'sms', portal: ST.P, to: dr.to, subj: dr.subj, body: dr.body })
        .then(function (j) { ST.boot.outbox = j.outbox; ST.draft = {}; toast('Added to Approve. Not sent.'); go('queue'); }).catch(function (x) { t.disabled = false; toast(x.message); }); }
    if (d.act === 'confirmCall') { saveDraft(); var dc = ST.draft, dg = String(dc.to || '').replace(/\D/g, '');
      if (dg.length < 10) return toast('Enter a 10-digit number'); if (!dc.task || dc.task.length < 8) return toast('Say what the call is for');
      sheet('<div class="t" style="font-size:19px">Place this call now?</div><p class="m">Katya will call <b>' + esc((dc.who ? dc.who + ', ' : '') + fmtNum(dg)) + '</b> from ' + esc(fmtNum((ST.boot || {}).line)) + '.</p><div class="note" style="margin-bottom:14px">' + esc(dc.task) + '</div>' +
        '<div class="btns"><button class="btn ghost" data-act="cancel">Cancel</button><button class="btn" data-act="placeCall">Call now</button></div>'); }
    if (d.peedit != null) { var pp = personas()[+d.peedit]; if (!pp) return; ST.peMsg = null; ST.pe = { key: pp.key, kid: !!pp.kid, name: pp.name, use: pp.use, voiceId: pp.voiceId || '', prompt: pp.prompt || '', types: (pp.typeKeys || []).slice(), errs: {} }; draw(); return; }
    if (d.act === 'peCancel') { ST.pe = null; draw(1); return; }
    if (d.act === 'peSave') { peRead(); var pe = ST.pe; pe.errs = peCheck(pe); pe.msg = '';
      if (Object.keys(pe.errs).length) { pe.msg = 'Not saved. Fix the fields marked below.'; draw(1); return; }
      pe.saving = true; draw(1);
      api('savePersona', { key: pe.key, persona: { name: pe.name, use: pe.use, voiceId: pe.voiceId, prompt: pe.prompt, types: pe.types } })
        .then(function (j) { ST.boot.personaInfo = j.personas; ST.peMsg = { key: pe.key, ok: true, t: 'Saved. The next call uses these changes.' }; ST.pe = null; draw(); })
        .catch(function (x) { pe.saving = false; pe.msg = 'Not saved: ' + x.message; draw(1); }); return; }
    if (d.samplepriv) { ST.samplePriv = !ST.samplePriv; draw(1); return; }
    if (d.sample != null) { var sp = personas()[+d.sample]; if (!sp) return; ST.sampleKey = sp.key;
      sheet('<div class="t" style="font-size:19px">Call you now as a sample?</div><p class="m">Katya calls your own phone as <b>' + esc(sp.name) + '</b>.</p><div class="note" style="margin-bottom:14px">' + (ST.samplePriv ? 'Private: not recorded, leaves no history in the Calls app. Bland still keeps its own transcript. Your assistants have a rule never to open private calls, but anyone with Bland access could.' : 'Normal call: kept like other calls, with its transcript.') + '</div>' +
        '<div class="btns"><button class="btn ghost" data-act="cancel">Cancel</button><button class="btn" data-act="placeSample">Call me</button></div>'); return; }
    if (d.act === 'placeSample') { t.disabled = true; var sk = ST.sampleKey;
      api('samplePersona', { key: sk, private: !!ST.samplePriv }).then(function () { closeSheet(); ST.peMsg = { key: sk, ok: true, t: 'Calling you now.' }; draw(1); })
        .catch(function (x) { closeSheet(); ST.peMsg = { key: sk, ok: false, t: 'Sample call failed: ' + x.message }; draw(1); }); return; }
    if (d.act === 'cancel') closeSheet();
    if (d.act === 'install') install();
    if (d.act === 'placeCall') { t.disabled = true; api('start', { to: ST.draft.to, task: ST.draft.task, portal: ST.P }).then(function (j) { closeSheet(); ST.draft = {}; toast('Calling… it will show in Calls'); go('calls'); setTimeout(load, 8000); }).catch(function (x) { closeSheet(); toast(x.message); }); }
    if (d.act === 'forget') { if (confirm('Forget the link key on this phone?')) { localStorage.removeItem('calls.k'); location.replace(location.pathname); } }
  });
  document.addEventListener('input', function (e) { var k = e.target.dataset && e.target.dataset.csr; if (!k) return; var v = +e.target.value; csSet(ST.csT, k, v);
    var fv = e.target.parentNode.querySelector('.fv'); if (fv) fv.textContent = k === 'interruptibility' ? IRR[v] : k === 'temperature' ? v.toFixed(2) : k === 'max_duration' ? v + ' min' : v + ' ms'; });
  document.addEventListener('change', function (e) { if (e.target.dataset && e.target.dataset.csr) draw(1);
    if (e.target.id === 'csvm') { csSet(ST.csT, 'vm_message', e.target.value); draw(1); }
    if (e.target.id === 'vcf' && e.target.files[0]) { e.target.files[0].text().then(function (x) { var l = parseVcf(x); if (!l.length) return toast('No contacts found in that file'); mergePeople(l); }); } });
  document.addEventListener('change', function (e) { if (e.target.id === 'fperson') { ST.f.person = e.target.value; draw(1); } if (e.target.id === 'fpersona') { ST.f.persona = e.target.value; draw(1); } });
  function doAsk() { ST.asking = true; draw(1); api('ask', { q: ST.askq, portal: ST.P }).then(function (j) { ST.ask = j; }).catch(function (x) { ST.ask = { err: x.message }; }).then(function () { ST.asking = false; draw(1); }); }
  document.addEventListener('submit', function (e) { if (e.target.id === 'askf') { e.preventDefault(); ST.askq = $('#cq').value.trim(); if (ST.askq) doAsk(); } });
  $('#sheet').addEventListener('click', function (e) { if (e.target.id === 'sheet') closeSheet(); });
  addEventListener('hashchange', function () { parse(); if (ST.route[0] !== 'persona') { ST.pe = null; ST.peMsg = null; } draw(); });
  parse(); draw(); load();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    var swc = navigator.serviceWorker, hadCtl = !!swc.controller, reloaded = false;
    var reloadOnce = function () { if (reloaded || !hadCtl) return; reloaded = true; location.reload(); };
    swc.addEventListener('controllerchange', reloadOnce);
    swc.addEventListener('message', function (e) { if (e.data && e.data.type === 'sw-updated') reloadOnce(); });
    swc.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
      reg.update().catch(function () {});
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}); });
      addEventListener('focus', function () { reg.update().catch(function () {}); });
    }).catch(function () {});
  }
})();
