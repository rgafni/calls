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
  /* In-app browsers (WebViews) never fire beforeinstallprompt; detect them so the button can hand off to real Chrome. */
  var WV = ANDROID && (/; wv\)/.test(UA) || /Version\/\d+\.\d+ Chrome/.test(UA) || /FBAN|FBAV|Instagram|Line\/|GSA\//.test(UA));
  var NOBIP = false; setTimeout(function () { if (!DEFER) NOBIP = true; }, 1500);
  function showInst() { var b = document.querySelectorAll('.instban,.instb'); for (var i = 0; i < b.length; i++) b[i].hidden = STANDALONE; }
  if (window.__qa) window.__qa.ci = function () { return chromeIntent(); };
  function chromeIntent() {
    var base = location.href.replace(/[#?].*$/, ''), u = new URL(base);
    var frag = KEY ? '#k=' + encodeURIComponent(KEY) : '';
    return 'intent://' + u.host + u.pathname + frag + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(base + frag) + ';end';
  }
  /* iOS home-screen apps get their own storage, so point the installed app's start URL at the link key on this phone only. */
  if (KEY && !STANDALONE && IOS) { try {
    var base = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, ''), l = document.querySelector('link[rel=manifest]');
    var mf = { name: 'Katya Calls', short_name: 'Calls', id: base, start_url: base + '#k=' + encodeURIComponent(KEY), scope: base, display: 'standalone', orientation: 'portrait', background_color: '#f6f5f2', theme_color: '#f6f5f2',
      icons: [['icon-192.png', '192x192'], ['icon-512.png', '512x512']].map(function (i) { return { src: base + i[0], sizes: i[1], type: 'image/png' }; }).concat([{ src: base + 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]) };
    if (l) l.href = 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify(mf));
  } catch (e) {} }
  var SHARE = '<svg class="shr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 11v9h14v-9"/></svg>';
  function chromeSheet() {
    sheet('<div class="ios"><h3>Install Katya Calls</h3><p class="m">' + (WV ? 'Open this page in Chrome first, then:' : 'In Chrome:') + '</p><ol>' +
      '<li><span class="n">1</span><span>Tap the <b>&#8942; menu</b> at the <b>top right</b> of Chrome.</span></li>' +
      '<li><span class="n">2</span><span>Tap <b>Install app</b> (or <b>Add to Home screen</b>).</span></li></ol>' +
      '<button class="btn w" data-act="cancel">Got it</button></div>');
  }
  function install() {
    if (DEFER) { DEFER.prompt(); DEFER.userChoice.then(function () { DEFER = null; showInst(); }); return; }
    if (ANDROID && (WV || NOBIP) && !window.__noIntent) {
      var gone = false, vis = function () { if (document.hidden) gone = true; };
      document.addEventListener('visibilitychange', vis);
      location.href = chromeIntent();
      setTimeout(function () { document.removeEventListener('visibilitychange', vis); if (!gone) chromeSheet(); }, 1200);
      return;
    }
    if (!IOS) { chromeSheet(); return; }
    var crios = /CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
    sheet('<div class="ios"><h3>Install Katya Calls</h3><p class="m">Adds the app to your Home Screen. Takes 10 seconds.</p><ol>' +
      '<li><span class="n">1</span><span>Tap the <b>Share</b> icon ' + SHARE + ' ' + (crios ? 'at the <b>top right</b> of Chrome' : 'at the <b>bottom</b> of Safari') + '.</span></li>' +
      '<li><span class="n">2</span><span>Scroll down and tap <b>Add to Home Screen</b>.</span></li>' +
      '<li><span class="n">3</span><span>Tap <b>Add</b> in the top right corner.</span></li></ol>' +
      '<div class="note">' + (crios ? 'In Safari, the Share icon is at the bottom instead.' : 'Using Chrome on iPhone? The Share icon is at the <b>top right</b>, next to the address bar.') + ' Then open <b>Calls</b> from your Home Screen.</div>' +
      '<button class="btn w" data-act="cancel">Got it</button></div>');
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
  var calls = function () { return (ST.calls || []).filter(function (c) { return (c.portal || 'life') === ST.P; }); };
  var outbox = function () { return ((ST.boot && ST.boot.outbox) || []).filter(function (x) { return x.portal === ST.P && x.status === 'draft'; }); };
  var personas = function () { return ((ST.boot && ST.boot.personaInfo) || []).filter(function (p) { return p.portal === ST.P; }); };
  function loading(t) { return '<div class="empty"><div class="t"><span class="spin"></span>' + esc(t || 'Loading your calls…') + '</div></div>'; }
  function empty(t, s) { return '<div class="empty"><div class="t">' + esc(t) + '</div>' + (s ? '<div>' + esc(s) + '</div>' : '') + '</div>'; }
  function callRow(c) {
    return '<a class="row link" href="#/' + ST.P + '/call/' + encodeURIComponent(c.id) + '"><div class="av">' + esc(ini(c.person)) + '</div><div class="grow"><div class="t ell">' + esc(c.type || 'Call') + ' · ' + esc(c.person || '') + '</div>' +
      '<div class="m ell">' + esc(when(c.at)) + ' · ' + esc(dur(c.min)) + '</div></div>' + outTag(c.outcome) + '<span class="chev">›</span></a>';
  }

  /* ---------- views ---------- */
  var V = {};
  V.today = function () {
    if (!ST.calls) return loading();
    var cs = calls(), td = cs.filter(function (c) { return day(c.at) === 'Today'; }), q = outbox();
    var wk = Date.now() - 7 * 864e5, miss = cs.filter(function (c) { return new Date(c.at) > wk && /Voicemail|No answer|Failed/.test(c.outcome); });
    var r = ((ST.boot && ST.boot.routines) || []), nx = TTG() ? null : r[0];
    var hr = new Date().getHours();
    return (STANDALONE ? '' : '<button class="instban" data-act="install"><span class="ib-t">Install app</span><span class="ib-m">Put Calls on your Home Screen</span></button>') + '<h1>' + (hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening') + '</h1><p class="sub">' + (TTG() ? 'TTG business calls' : 'Your life calls') + '</p>' +
      (nx ? '<div class="card hero"><div class="m">Scheduled routine</div><div class="big">' + esc(nx.name) + '</div><div class="m">' + esc(nx.when) + '</div><div class="actions"><a class="btn" href="#/' + ST.P + '/routines">See routines</a></div></div>'
        : '<div class="card hero"><div class="m">TTG</div><div class="big">No scheduled business calls</div><div class="m">Business calls only go out when you start one and confirm.</div><div class="actions"><a class="btn w2" href="#/ttg/new">Start a call</a></div></div>') +
      '<div class="grid2" style="margin-top:10px"><a class="tile" href="#/' + ST.P + '/calls"><b>' + td.length + '</b><span class="m">Calls today</span></a><a class="tile" href="#/' + ST.P + '/queue"><b>' + q.length + '</b><span class="m">Waiting for approval</span></a></div>' +
      '<h2>Latest calls <a href="#/' + ST.P + '/calls">All calls</a></h2>' + (cs.length ? '<div class="card">' + cs.slice(0, 3).map(callRow).join('') + '</div>' : empty('No calls yet')) +
      (miss.length ? '<h2>Missed this week</h2><div class="card">' + miss.slice(0, 3).map(callRow).join('') + '</div>' + (miss.length > 3 ? '<p class="m">' + (miss.length - 3) + ' more in Calls → filter “Not reached”.</p>' : '') : '') +
      (q.length ? '<h2>Waiting for you <a href="#/' + ST.P + '/queue">Open</a></h2><div class="card">' + q.slice(0, 2).map(function (x) { return '<div class="row"><div class="grow"><div class="t ell">' + (x.ch === 'email' ? 'Email' : 'Text') + ' to ' + esc(x.to) + '</div><div class="m ell">' + esc(x.body) + '</div></div></div>'; }).join('') + '</div>' : '');
  };
  V.calls = function () {
    if (!ST.calls) return loading();
    var cs = calls(), f = ST.f, types = ['All'], ppl = {};
    cs.forEach(function (c) { if (types.indexOf(c.type) < 0) types.push(c.type); ppl[c.person] = 1; });
    types.push('Not reached');
    var ps = personas();
    var list = cs.filter(function (c) {
      if (f.type === 'Not reached') { if (!/Voicemail|No answer|Failed/.test(c.outcome)) return false; } else if (f.type !== 'All' && c.type !== f.type) return false;
      if (f.person && c.person !== f.person) return false;
      if (f.persona) { var p = ps.filter(function (x) { return x.name === f.persona; })[0]; if (p && p.types.indexOf(c.type) < 0) return false; }
      return true; });
    var groups = [], last = null;
    list.forEach(function (c) { var d = day(c.at); if (d !== last) { groups.push([d, []]); last = d; } groups[groups.length - 1][1].push(c); });
    return '<h1>Calls</h1><p class="sub">' + cs.length + ' calls in ' + (TTG() ? 'TTG' : 'Life') + (ST.live === false ? ' · saved copy' : '') + '</p>' +
      '<div class="flabel" style="margin-top:0">Type</div><div class="chips">' + types.map(function (t) { return '<button class="chip ' + (f.type === t ? 'on' : '') + '" data-ft="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
      '<div class="grid2"><div><div class="flabel">Persona</div><select id="fpersona"><option value="">All personas</option>' + ps.map(function (p) { return '<option ' + (f.persona === p.name ? 'selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></div>' +
      '<div><div class="flabel">Person</div><select id="fperson"><option value="">Everyone</option>' + Object.keys(ppl).sort().map(function (p) { return '<option ' + (f.person === p ? 'selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select></div></div>' +
      (list.length ? groups.map(function (g) { return '<h2>' + esc(g[0]) + '<span class="m" style="text-transform:none;letter-spacing:0">' + g[1].length + '</span></h2><div class="card">' + g[1].map(callRow).join('') + '</div>'; }).join('') : empty('No calls match', 'Try “All” or a different person.'));
  };
  V.call = function (id) {
    id = decodeURIComponent(id || '');
    var base = (ST.calls || []).filter(function (c) { return c.id === id; })[0], d = ST.det[id];
    if (!d) { if (!ST.det['_' + id]) { ST.det['_' + id] = 1; api('call2', { id: id }).then(function (j) { ST.det[id] = j; draw(1); }).catch(function (e) { ST.det[id] = { err: e.message }; draw(1); }); } }
    var c = (d && d.call) || base; if (!c) return d && d.err ? empty('Could not open this call', d.err) : loading('Opening call…');
    var tr = d && d.transcript;
    return '<h1>' + esc(c.type || 'Call') + '</h1><p class="sub">' + esc(c.person) + ' · ' + esc(when(c.at)) + '</p>' +
      '<div class="btns" style="margin-bottom:12px">' + outTag(c.outcome) + '<span class="tag">' + (c.inbound ? 'Incoming' : 'Outgoing') + '</span>' + guessTag(c) + '</div>' +
      (c.sure === false ? '<div class="note" style="margin-bottom:10px"><b>Why this type:</b> ' + esc(c.why) + '. It is a best guess from the first sentence and transcript.</div>' : '') +
      '<div class="stat"><div><b>' + esc(dur(c.min)) + '</b><span class="m">Length</span></div><div><b>' + esc(c.turns != null ? c.turns : '—') + '</b><span class="m">Lines spoken</span></div><div><b>' + (c.lat != null ? esc(c.lat) + 's' : '—') + '</b><span class="m">Avg. gap per reply</span></div></div>' +
      '<h2>Summary</h2><div class="card pad sumtxt">' + (c.summary ? esc(c.summary) : '<span class="m">No summary from Bland for this call.</span>') + '</div>' +
      (c.err ? '<div class="note warnbox">Error: ' + esc(c.err) + '</div>' : '') +
      '<h2>Transcript</h2>' + (!d ? loading('Loading transcript…') : tr && tr.length ? '<div class="tr">' + tr.map(function (t) { var k = t.u === 'user'; return '<div class="who ' + (k ? 'r' : '') + '">' + (k ? esc(c.person === 'You' ? 'You' : c.person) : (t.u === 'assistant' ? 'Katya' : esc(t.u))) + '</div><div class="bub ' + (k ? 'u' : 'k') + '">' + esc(t.t) + '</div>'; }).join('') + '</div>' : '<div class="card pad m">No transcript (the call was not picked up or was too short).</div>') +
      '<h2>Actions</h2><div class="btns"><a class="btn ghost" href="#/' + ST.P + '/ask">Ask across calls</a>' + (!c.inbound ? '<button class="btn" data-again="' + esc(c.to) + '">Call again…</button>' : '') + '</div>';
  };
  V.ask = function () {
    var a = ST.ask;
    var ex = TTG() ? ['RBT application', 'interview', 'availability'] : ['Shacharit', 'kollel', 'therapy', 'wake up'];
    return '<h1>Ask</h1><p class="sub">Search what was said on every ' + (TTG() ? 'TTG' : 'Life') + ' call</p>' +
      '<form id="askf" class="search"><span>⌕</span><input id="cq" placeholder="e.g. ' + esc(ex[0]) + '" value="' + esc(ST.askq || '') + '" autocomplete="off"></form>' +
      '<div class="chips">' + ex.map(function (e) { return '<button class="chip" data-ex="' + esc(e) + '">' + esc(e) + '</button>'; }).join('') + '</div>' +
      (ST.asking ? loading('Reading transcripts…') : a ? (a.err ? empty('Search failed', a.err) : '<div class="note">' + esc(a.answer) + '</div>' + (a.hits.length ? '<div class="card" style="margin-top:10px">' + a.hits.map(function (h) {
        var s = esc(h.snip); (a.words || []).forEach(function (w) { s = s.replace(new RegExp('(' + w.replace(/[^a-z0-9]/g, '') + ')', 'ig'), '<mark>$1</mark>'); });
        return '<a class="hit" href="#/' + ST.P + '/call/' + encodeURIComponent(h.id) + '"><div class="t">' + esc(h.type) + ' · ' + esc(h.person) + ' <span class="m">' + esc(when(h.at)) + '</span></div><div class="m">…' + s + '…</div></a>'; }).join('') + '</div>' : '')) :
        '<p class="m">Searches summaries and transcripts. Only ' + (TTG() ? 'TTG' : 'Life') + ' calls are searched; the two are never mixed.</p>');
  };
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
    if (ch === 'Call') return head + '<div class="flabel">Phone number</div><input id="nto" inputmode="tel" placeholder="(555) 555-5555" value="' + esc(dr.to || '') + '">' +
      '<div class="flabel">What is the call for? (keep it short)</div><textarea id="ntask" rows="4" placeholder="' + (TTG() ? 'Ask if they are still interested in the RBT role and when they can talk.' : 'Remind me to leave for the 3 PM pickup.') + '">' + esc(dr.task || '') + '</textarea>' +
      '<div class="m" id="nwords" style="margin-top:4px"></div>' + (TTG() ? '<div class="note" style="margin-top:10px">Business calls always start: “This is an automated AI assistant calling on behalf of Roni Gafni.” Not recorded.</div>' : '') +
      '<button class="btn w" style="margin-top:16px" data-act="confirmCall">Review and call…</button>';
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
      '<p class="m">To change a time or turn one off, ask your assistant in chat. Editing here comes next.</p>';
  };
  V.personas = function () {
    var ps = personas(), cs = calls();
    return '<h1>Personas</h1><p class="sub">How Katya sounds on each kind of call</p>' + ps.map(function (p, i) {
      var n = cs.filter(function (c) { return p.types.indexOf(c.type) >= 0; }), ans = n.filter(function (c) { return /^Answered/.test(c.outcome); }).length;
      return '<a class="card pad" style="display:block" href="#/' + ST.P + '/persona/' + i + '"><div style="display:flex;justify-content:space-between"><div class="t">' + esc(p.name) + '</div><span class="chev">›</span></div><div class="m">' + esc(p.use) + '</div>' +
        '<div class="m" style="margin-top:6px">' + n.length + ' calls · ' + ans + ' answered · voice: ' + esc(p.voice) + '</div></a>'; }).join('');
  };
  V.persona = function (i) {
    var p = personas()[+i]; if (!p) return empty('Persona not found');
    var long = p.words > 120;
    return '<h1>' + esc(p.name) + '</h1><p class="sub">' + esc(p.use) + '</p><div class="card"><div class="kv"><span class="m">Voice</span><span>' + esc(p.voice) + '</span></div><div class="kv"><span class="m">Instructions</span><span>' + (p.words ? p.words + ' words' : 'Set per call') + '</span></div><div class="kv"><span class="m">Call types</span><span>' + esc(p.types.join(', ')) + '</span></div></div>' +
      (long ? '<div class="note warnbox">These instructions are ' + p.words + ' words. Long instructions made Katya slow to reply (12–19 s). Around 120 words gave 4–7 s.</div>' : '') +
      (p.prompt ? '<h2>Instructions (start)</h2><div class="card pad"><pre class="prompt">' + esc(p.prompt) + (p.prompt.length >= 900 ? '…' : '') + '</pre></div>' : '') +
      '<p class="m">Read-only here. Ask your assistant in chat to change a persona.</p>';
  };
  V.insights = function () {
    var cs = calls(); if (!cs.length) return empty('No calls yet');
    var a = cs.filter(function (c) { return /^Answered/.test(c.outcome); }).length, mins = cs.reduce(function (s, c) { return s + (+c.min || 0); }, 0), L = cs.filter(function (c) { return c.lat != null; });
    var by = {}; cs.forEach(function (c) { var b = by[c.type] = by[c.type] || [0, 0]; b[0]++; if (/^Answered/.test(c.outcome)) b[1]++; });
    return '<h1>Insights</h1><p class="sub">' + (TTG() ? 'TTG' : 'Life') + ' · all ' + cs.length + ' calls</p><div class="stat"><div><b>' + Math.round(a / cs.length * 100) + '%</b><span class="m">Answered</span></div><div><b>' + Math.round(mins) + 'm</b><span class="m">Talk time</span></div><div><b>' + (L.length ? (L.reduce(function (s, c) { return s + c.lat; }, 0) / L.length).toFixed(1) + 's' : '—') + '</b><span class="m">Avg. reply gap</span></div></div>' +
      '<h2>By type</h2><div class="card">' + Object.keys(by).map(function (k) { var b = by[k]; return '<div class="row"><div class="grow"><div class="t">' + esc(k) + '</div><div class="bar" style="margin-top:6px"><i style="width:' + Math.round(b[1] / b[0] * 100) + '%"></i></div></div><span class="m">' + b[1] + ' of ' + b[0] + ' answered</span></div>'; }).join('') + '</div>';
  };
  V.settings = function () {
    var b = ST.boot || {}, r = function (t, s, tag) { return '<div class="row"><div class="grow"><div class="t">' + t + '</div>' + (s ? '<div class="m">' + s + '</div>' : '') + '</div>' + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</div>'; };
    return '<h1>Settings</h1><p class="sub">' + (TTG() ? 'TTG' : 'Life') + '</p><h2>Calling line</h2><div class="card">' + r('Katya’s number', esc(fmtNum(b.line || ''))) + r('Data source', b.hasKey ? 'Live from Bland' : 'Saved copy (Bland not connected)', b.hasKey ? 'Live' : 'Saved') + '</div>' +
      '<h2>Safety</h2><div class="card">' + r('Texts & emails need approval', 'No automatic sending exists', 'Always') + r('Calls need a confirm tap', '', 'Always') + r('Business calls say they are AI', 'Added by the server', 'Always') + r('Daily call limit', '20 calls a day', 'On') + r('Shabbat & Yom Tov', 'Calls blocked', 'On') + '</div>' +
      '<h2>Privacy</h2><div class="card">' + r('Student names on TTG', 'Shown as initials', 'On') + r('Life and TTG kept apart', 'Never mixed in lists or search', 'On') + r('Keys', 'Bland key stays on the private server, never in this app') + '</div>' +
      '<h2>This phone</h2><div class="card">' + (STANDALONE ? r('Installed ✓', 'Running as the Home Screen app') : r('Not installed', 'Tap Install app at the top')) + '<button class="row link" style="width:100%;background:none;border:0;border-top:1px solid var(--line);text-align:left" data-act="forget"><div class="grow"><div class="t" style="color:#a32020">Forget this device</div><div class="m">Removes your link key from this phone</div></div></button></div>';
  };
  V.more = function () {
    var it = [['routines', 'Routines', 'Scheduled calls and pauses'], ['personas', 'Personas', 'Voice and instructions'], ['insights', 'Insights', 'Answer rate and talk time'], ['new', 'New call, text or email', ''], ['settings', 'Settings', 'Safety, privacy, this phone']];
    return '<h1>More</h1><p class="sub">' + (TTG() ? 'TTG' : 'Life') + '</p>' + (STANDALONE ? '<div class="card"><div class="row"><div class="grow"><div class="t">Installed ✓</div><div class="m">This is the Home Screen app</div></div></div></div>' : '') + '<div class="card">' + it.map(function (i) { return '<a class="row link" href="#/' + ST.P + '/' + i[0] + '"><div class="grow"><div class="t">' + i[1] + '</div>' + (i[2] ? '<div class="m">' + i[2] + '</div>' : '') + '</div><span class="chev">›</span></a>'; }).join('') + '</div>';
  };
  V.gate = function () { return '<div class="gate"><h1>Katya Calls</h1><p class="sub">Private app</p><div class="card pad">' + (ST.err ? '<p><b>' + esc(ST.err) + '</b></p>' : '') + '<p>Open this app once from your personal link (it ends in <b>#k=…</b>). After that it remembers this phone.</p><p class="m">No calls or keys are stored in this app; they come from your private server.</p></div></div>'; };

  /* ---------- shell ---------- */
  var ICO = {today: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>', calls: '<path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>', ask: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', queue: '<path d="M4 12l5 5L20 6"/>', more: '<path d="M4 6h16M4 12h16M4 18h16"/>'};
  var NAV = [['today', '⌂', 'Today'], ['calls', '☏', 'Calls'], ['ask', '⌕', 'Ask'], ['queue', '✓', 'Approve'], ['more', '☰', 'More']];
  var TITLE = { today: 'Today', calls: 'Calls', call: 'Call', ask: 'Ask', queue: 'Approve', new: 'New', routines: 'Routines', personas: 'Personas', persona: 'Persona', insights: 'Insights', settings: 'Settings', more: 'More' };
  var PARENT = { call: 'calls', persona: 'personas', routines: 'more', personas: 'more', insights: 'more', settings: 'more', new: 'today' };
  function parse() { var h = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean); if (h[0] === 'life' || h[0] === 'ttg') { ST.P = h.shift(); localStorage.setItem('calls.p', ST.P); } ST.route = h.length ? h : ['today']; if (!V[ST.route[0]] || ST.route[0] === 'gate') ST.route = ['today']; }
  function draw(keep) {
    var r = KEY && !ST.fatal ? ST.route[0] : 'gate', ttg = TTG();
    document.documentElement.style.setProperty('--acc', ttg ? 'var(--ttg)' : 'var(--life)'); document.documentElement.style.setProperty('--accs', ttg ? '#e3f2ec' : '#e8eefc');
    var act = PARENT[r] && r !== 'new' ? (r === 'call' ? 'calls' : 'more') : r, par = PARENT[r];
    if (r === 'call' && ST.from === 'ask') par = 'ask';
    $('#loc').innerHTML = par ? '<a class="backl" href="#/' + ST.P + '/' + par + '">‹ ' + TITLE[par] + '</a>' : '<div class="brand">Katya Calls<small>Roni · ' + (ttg ? 'TTG' : 'Life') + '</small></div>';
    $('#seg').innerHTML = '<button class="' + (!ttg ? 'on' : '') + '" data-p="life">Life</button><button class="' + (ttg ? 'on' : '') + '" data-p="ttg">TTG</button>';
    $('#seg').style.display = r === 'gate' ? 'none' : ''; $('#newb').style.display = r === 'gate' || r === 'new' ? 'none' : ''; $('#newb').href = '#/' + ST.P + '/new'; showInst();
    var nq = outbox().length;
    $('#tabs').innerHTML = r === 'gate' ? '' : NAV.map(function (n) { return '<a href="#/' + ST.P + '/' + n[0] + '" class="' + (act === n[0] ? 'on' : '') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICO[n[0]] + '</svg>' + n[2] + (n[0] === 'queue' && nq ? ' (' + nq + ')' : '') + '</a>'; }).join('');
    var m = $('#m'); m.innerHTML = V[r](ST.route[1]);
    if (!keep) { m.style.animation = 'none'; void m.offsetHeight; m.style.animation = ''; scrollTo(0, 0); }
    var t = $('#ntask'); if (t) { var u = function () { var w = t.value.trim().split(/\s+/).filter(String).length; $('#nwords').textContent = w ? w + ' words' + (w > 120 ? ' — shorter is faster (under 120)' : '') : ''; }; t.oninput = u; u(); }
  }
  function saveDraft() { ['to', 'task', 'subj', 'body'].forEach(function (k) { var e = $('#n' + k); if (e) ST.draft[k] = e.value; }); }
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
    if (d.ft) { ST.f.type = d.ft; draw(1); }
    if (d.ex) { ST.askq = d.ex; doAsk(); }
    if (d.ch) { saveDraft(); ST.ch = d.ch; draw(1); }
    if (d.again) { ST.ch = 'Call'; ST.draft = { to: fmtNum(d.again) }; go('new'); }
    if (d.ob) { var b = document.querySelector('[data-body="' + d.id + '"]'); t.disabled = true;
      api(d.ob, { id: d.id, body: b && b.value }).then(function (j) { ST.boot.outbox = j.outbox; toast(d.ob === 'outboxApprove' ? 'Approved — not sent automatically' : d.ob === 'outboxDiscard' ? 'Discarded' : 'Saved'); draw(1); }).catch(function (x) { t.disabled = false; toast(x.message); }); }
    if (d.act === 'toQueue') { saveDraft(); var dr = ST.draft; if (!dr.to || !dr.body) return toast('Add who it is for and a message');
      t.disabled = true; api('outboxAdd', { ch: ST.ch === 'Email' ? 'email' : 'sms', portal: ST.P, to: dr.to, subj: dr.subj, body: dr.body })
        .then(function (j) { ST.boot.outbox = j.outbox; ST.draft = {}; toast('Added to Approve. Not sent.'); go('queue'); }).catch(function (x) { t.disabled = false; toast(x.message); }); }
    if (d.act === 'confirmCall') { saveDraft(); var dc = ST.draft, dg = String(dc.to || '').replace(/\D/g, '');
      if (dg.length < 10) return toast('Enter a 10-digit number'); if (!dc.task || dc.task.length < 8) return toast('Say what the call is for');
      sheet('<div class="t" style="font-size:19px">Place this call now?</div><p class="m">Katya will call <b>' + esc(fmtNum(dg)) + '</b> from ' + esc(fmtNum((ST.boot || {}).line)) + '.</p><div class="note" style="margin-bottom:14px">' + esc(dc.task) + '</div>' +
        '<div class="btns"><button class="btn ghost" data-act="cancel">Cancel</button><button class="btn" data-act="placeCall">Call now</button></div>'); }
    if (d.act === 'cancel') closeSheet();
    if (d.act === 'install') install();
    if (d.act === 'placeCall') { t.disabled = true; api('start', { to: ST.draft.to, task: ST.draft.task }).then(function (j) { closeSheet(); ST.draft = {}; toast('Calling… it will show in Calls'); go('calls'); setTimeout(load, 8000); }).catch(function (x) { closeSheet(); toast(x.message); }); }
    if (d.act === 'forget') { if (confirm('Forget the link key on this phone?')) { localStorage.removeItem('calls.k'); location.replace(location.pathname); } }
  });
  document.addEventListener('change', function (e) { if (e.target.id === 'fperson') { ST.f.person = e.target.value; draw(1); } if (e.target.id === 'fpersona') { ST.f.persona = e.target.value; draw(1); } });
  function doAsk() { ST.asking = true; draw(1); api('ask', { q: ST.askq, portal: ST.P }).then(function (j) { ST.ask = j; }).catch(function (x) { ST.ask = { err: x.message }; }).then(function () { ST.asking = false; draw(1); }); }
  document.addEventListener('submit', function (e) { if (e.target.id === 'askf') { e.preventDefault(); ST.askq = $('#cq').value.trim(); if (ST.askq) doAsk(); } });
  $('#sheet').addEventListener('click', function (e) { if (e.target.id === 'sheet') closeSheet(); });
  addEventListener('hashchange', function () { parse(); draw(); });
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
