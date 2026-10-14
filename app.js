(function () {
  'use strict';
  var C = window.CALLS_CONFIG, PV = window.PROVIDERS;
  var KEY = (function () {
    var h = new URLSearchParams((location.hash || '').slice(1)), k = h.get('k');
    if (k) { localStorage.setItem('calls.k', k); history.replaceState(null, '', location.pathname); }
    return localStorage.getItem('calls.k') || '';
  })();
  var S = { calls: [], live: false, at: null, boot: null, filter: 'all', open: {} };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function api(a, data) {
    var b = Object.assign({ k: KEY, a: a }, data || {});
    return fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(b), redirect: 'follow', referrerPolicy: 'no-referrer' })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) throw new Error(j.error || 'failed'); return j; });
  }
  function toast(t) { var e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 2600); }
  function fmtNum(n) { var d = String(n || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''); return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : (n || '—'); }
  function who(n) { var d = String(n || '').replace(/\D/g, '').slice(-10), cs = (S.boot && S.boot.contacts) || []; for (var i = 0; i < cs.length; i++) if (String(cs[i].num).replace(/\D/g, '').slice(-10) === d) return cs[i].name; return fmtNum(n); }
  function dur(m) { m = +m || 0; if (m < 1) return Math.round(m * 60) + 's'; return Math.floor(m) + 'm ' + Math.round((m % 1) * 60) + 's'; }
  function when(iso) { if (!iso) return ''; var d = new Date(iso), now = new Date(), y = new Date(now - 864e5);
    var t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return 'Today ' + t; if (d.toDateString() === y.toDateString()) return 'Yesterday ' + t;
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + t; }
  function kind(c) {
    if (c.err || /fail|error|no-answer|busy|canceled/i.test(c.status || '')) return 'bad';
    if (/queued|in-progress|started|ringing/i.test(c.status || '') && !c.min) return 'live';
    if (c.by === 'voicemail') return c.min >= 1.25 ? 'stall' : 'vm';
    if (c.by === 'human') return 'ok';
    if (!c.min || c.min < 0.1) return 'bad';
    return 'na';
  }
  var KL = { ok: ['ok', 'Talked'], vm: ['vm', 'Voicemail'], stall: ['bad', 'Voicemail stalled'], bad: ['bad', 'Failed / no answer'], na: ['na', 'Unclear'], live: ['ok', 'In progress'] };
  function alerts() { var seen = (S.boot && S.boot.seen) || {}, wk = Date.now() - 7 * 864e5;
    return S.calls.filter(function (c) { var k = kind(c); return (k === 'stall' || k === 'bad' || k === 'vm') && !seen[c.id] && new Date(c.at) > wk; }); }

  /* ---------- render ---------- */
  function render() {
    var today = S.calls.filter(function (c) { return new Date(c.at).toDateString() === new Date().toDateString(); });
    var al = alerts(), stall = al.filter(function (c) { return kind(c) === 'stall'; }).length;
    var mins = S.calls.reduce(function (a, c) { return a + (+c.min || 0); }, 0);
    var talked = S.calls.filter(function (c) { return kind(c) === 'ok'; }).length;
    $('#tiles').innerHTML =
      '<button class="tile call" data-act="new"><div><div class="lbl">Start a call</div><div class="sub">Number + what it\'s for → confirm → dial</div></div><span class="ic">📞</span></button>' +
      tile('alert' + (al.length ? ' hot' : ''), 'alerts', al.length, 'Needs attention', stall ? stall + ' stalled on voicemail' : al.length ? 'voicemail / failed this week' : 'all clear') +
      tile('log', 'log', today.length, 'Calls today', S.calls.length + ' in log') +
      tile('rout', 'routines', ((S.boot && S.boot.routines) || []).length, 'Routines', 'wake + calendar briefs') +
      tile('stat', 'stats', S.calls.length ? Math.round(talked / S.calls.length * 100) + '%' : '—', 'Pick-up rate', Math.round(mins) + ' min total') +
      tile('prov', 'providers', '⚖️', 'Voice providers', 'Bland vs Grok & others');
    $('#banner').innerHTML = (S.boot && S.boot.offline) ? '<div class="card" style="padding:8px 12px;font-size:13px">💾 <b>Showing saved calls</b> <span class="mut">– live updates after one-time setup</span></div>' : (S.boot && !S.boot.hasKey) ? '<div class="card"><b>Read-only snapshot' + (S.at ? ' from ' + esc(when(S.at)) : '') + '.</b><div class="mut">Connect Bland once (menu → Connect Bland) for live calls, transcripts, recordings and dialing.</div></div>' : '';
    $('#sections').innerHTML = sec('alerts', '🚨 Needs attention', al.length, alertsHtml(al)) + sec('log', '📋 Call log', S.calls.length, logHtml()) +
      sec('routines', '⏰ Scheduled routines', '', routinesHtml()) + sec('stats', '📊 Stats', '', statsHtml()) + sec('providers', '⚖️ Voice providers', '', provHtml());
  }
  function tile(cls, go, big, lbl, sub) { return '<button class="tile ' + cls + '" data-go="' + go + '"><div class="big">' + esc(big) + '</div><div><div class="lbl">' + esc(lbl) + '</div><div class="sub">' + esc(sub) + '</div></div></button>'; }
  function sec(id, title, cnt, html) { return '<details class="sec" id="s-' + id + '"' + (S.open[id] ? ' open' : '') + '><summary>' + title + '<span class="cnt">' + esc(cnt) + '</span></summary><div class="body">' + html + '</div></details>'; }
  function row(c) { var k = kind(c), l = KL[k];
    return '<button class="row" data-call="' + esc(c.id) + '"><span class="dot ' + l[0] + '"></span><div class="m"><div class="t">' + esc(c.inbound ? '↙ ' + who(c.from) : who(c.to)) + '</div><div class="s">' + esc(c.summary || l[1]) + '</div></div><div class="r">' + esc(when(c.at)) + '<br>' + esc(dur(c.min)) + '</div></button>'; }
  function alertsHtml(al) {
    if (!al.length) return '<p class="mut">Nothing needs you. Voicemails and failed calls from the last 7 days show up here.</p>';
    var st = al.filter(function (c) { return kind(c) === 'stall'; }).length;
    return (st ? '<div class="card"><h4>Voicemail is stalling</h4><div class="mut">' + st + ' call(s) hit voicemail and kept the line open well past the time a message takes. The agent usually went silent instead of leaving the message. Tap one to see what happened.</div></div>' : '') +
      al.map(row).join('') + '<button class="btn alt" data-act="seenAll">Mark all as seen</button>';
  }
  function logHtml() {
    var f = S.filter, F = [['all', 'All'], ['ok', 'Talked'], ['vm', 'Voicemail'], ['bad', 'Failed'], ['in', 'Incoming']];
    var list = S.calls.filter(function (c) { var k = kind(c); return f === 'all' || (f === 'ok' && k === 'ok') || (f === 'vm' && (k === 'vm' || k === 'stall')) || (f === 'bad' && k === 'bad') || (f === 'in' && c.inbound); });
    return '<div class="filters">' + F.map(function (x) { return '<button data-filter="' + x[0] + '" class="' + (f === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      (list.length ? list.slice(0, 60).map(row).join('') : '<p class="mut">No calls here.</p>');
  }
  function routinesHtml() {
    var r = (S.boot && S.boot.routines) || [];
    return '<p class="mut">Read-only. These run from your assistant; ask it in chat to change one.</p>' + r.map(function (x) {
      return '<div class="card rec"><h4>' + esc(x.name) + '</h4><div><b>' + esc(x.when) + '</b></div><div class="mut">' + esc(x.to) + ' · ' + esc(x.voice) + ' · up to ' + esc(x.max) + '</div><p class="mut">' + esc(x.rules) + '</p><div class="mut"><i>Voicemail it leaves:</i> “' + esc(x.vm) + '”</div></div>'; }).join('');
  }
  function statsHtml() {
    if (!S.calls.length) return '<p class="mut">No calls yet.</p>';
    var cnt = { ok: 0, vm: 0, stall: 0, bad: 0, na: 0, live: 0 }, mins = 0, days = {}, cost = 0;
    S.calls.forEach(function (c) { cnt[kind(c)]++; mins += +c.min || 0; cost += +c.price || 0; var d = new Date(c.at).toDateString(); days[d] = (days[d] || 0) + 1; });
    var last7 = []; for (var i = 6; i >= 0; i--) { var d = new Date(Date.now() - i * 864e5); last7.push([d.toLocaleDateString([], { weekday: 'narrow' }), days[d.toDateString()] || 0]); }
    var mx = Math.max.apply(null, last7.map(function (x) { return x[1]; }).concat(1));
    return '<div class="kv"><div class="card"><b>' + S.calls.length + '</b><span class="mut">calls in log</span></div><div class="card"><b>' + Math.round(mins) + 'm</b><span class="mut">talk time · avg ' + dur(mins / S.calls.length) + '</span></div>' +
      '<div class="card"><b>' + cnt.ok + '</b><span class="mut">picked up</span></div><div class="card"><b>' + (cnt.vm + cnt.stall) + '</b><span class="mut">voicemail (' + cnt.stall + ' stalled)</span></div>' +
      '<div class="card"><b>' + cnt.bad + '</b><span class="mut">failed / no answer</span></div><div class="card"><b>≈$' + (cost ? cost.toFixed(2) : (mins * 0.14).toFixed(2)) + '</b><span class="mut">' + (cost ? 'billed' : 'est. at $0.14/min') + '</span></div></div>' +
      '<div class="card"><h4>Last 7 days</h4><div class="bars">' + last7.map(function (x) { return '<div style="height:' + (x[1] / mx * 100) + '%"><span>' + x[0] + '</span></div>'; }).join('') + '</div><br></div>';
  }
  function provHtml() {
    return '<div class="card" style="border-left:4px solid var(--coral)"><h4>My take: ' + esc(PV.rec.title) + '</h4><div class="mut" style="color:var(--txt)">' + esc(PV.rec.body) + '</div></div>' +
      PV.rows.map(function (r) { return '<div class="card"><h4>' + esc(r[0]) + '</h4><table>' + PV.cols.map(function (c, i) { return '<tr><th>' + esc(c) + '</th><td>' + esc(r[i + 1]) + '</td></tr>'; }).join('') + '</table></div>'; }).join('') +
      '<div class="mut" style="margin-top:10px">' + PV.notes.map(esc).join('<br>') + '<br>Checked ' + esc(PV.checked) + '.</div>';
  }

  /* ---------- sheets ---------- */
  function sheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').classList.remove('hidden'); }
  function close() { $('#sheet').classList.add('hidden'); }
  function openCall(id) {
    var c = S.calls.find(function (x) { return x.id === id; }) || { id: id }, l = KL[kind(c)];
    sheet('<h3>' + esc(c.inbound ? who(c.from) : who(c.to)) + '</h3><div class="mut">' + esc(when(c.at)) + ' · ' + esc(dur(c.min)) + ' · <span class="pill ' + l[0] + '">' + l[1] + '</span></div>' +
      (c.err ? '<div class="card"><b>Error:</b> ' + esc(c.err) + '</div>' : '') + '<div class="card"><h4>Summary</h4><div id="sum" class="mut">' + esc(c.summary || 'Loading…') + '</div></div>' +
      '<div id="recBox"></div><div class="card"><h4>Transcript</h4><div id="tr" class="tr mut">Loading…</div></div>' +
      '<button class="btn alt" data-act="redial" data-num="' + esc(c.inbound ? c.from : c.to) + '">Call this number again</button><button class="btn alt" data-act="close">Close</button>');
    if (!S.boot.hasKey) { $('#tr').textContent = 'Transcripts and recordings appear after you connect Bland (menu → Connect Bland).'; if (!c.summary) $('#sum').textContent = 'No summary saved in the snapshot.'; return; }
    api('call', { id: id }).then(function (j) {
      $('#sum').textContent = j.call.summary || 'Bland did not write a summary for this call.';
      $('#tr').innerHTML = j.transcript.length ? j.transcript.map(function (t) { var u = t.u === 'user'; return '<p class="' + (u ? 'u' : '') + '"><b>' + (u ? 'Them' : 'Agent') + '</b>' + esc(t.t) + '</p>'; }).join('') : esc(j.text || 'No transcript.');
      if (j.call.rec) $('#recBox').innerHTML = '<button class="btn ok" data-act="rec" data-id="' + esc(id) + '">▶ Play recording</button>';
    }).catch(function (e) { $('#tr').textContent = e.message; });
  }
  function newCall(num) {
    var cs = (S.boot.contacts || []), sc = (S.boot.scripts || []);
    sheet('<h3>Start a call</h3><div class="mut">From ' + esc(fmtNum(S.boot.line)) + ' · Katya voice</div>' +
      (cs.length ? '<label>Saved contacts</label><div class="chips">' + cs.map(function (c, i) { return '<button data-pick="' + i + '">' + esc(c.name) + '</button>'; }).join('') + '</div>' : '') +
      '<label>Phone number</label><input id="nNum" inputmode="tel" placeholder="(555) 123-4567" value="' + esc(num ? fmtNum(num) : '') + '">' +
      (sc.length ? '<label>Scripts</label><div class="chips">' + sc.map(function (s, i) { return '<button data-script="' + i + '">' + esc(s.name) + '</button>'; }).join('') + '</div>' : '') +
      '<label>What is this call for? (the agent follows this)</label><textarea id="nTask" placeholder="e.g. Call the pharmacy and ask if Roni Gafni\'s prescription is ready for pickup today. Be brief and polite."></textarea>' +
      '<label>Opening line (optional)</label><input id="nFirst" placeholder="Hi, this is Katya, calling for Roni Gafni.">' +
      '<label>Max length</label><select id="nMax"><option value="5">5 min</option><option value="10" selected>10 min</option><option value="15">15 min</option></select>' +
      '<button class="btn" data-act="review">Review call</button><button class="btn alt" data-act="close">Cancel</button>');
  }
  function review() {
    var n = $('#nNum').value, t = $('#nTask').value.trim(), d = n.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
    if (d.length !== 10) return toast('Enter a 10-digit number'); if (t.length < 8) return toast('Say what the call is for');
    S.draft = { to: '+1' + d, task: t, first: $('#nFirst').value.trim(), max: $('#nMax').value };
    sheet('<h3>Confirm call</h3><div class="card"><div class="mut">Calling</div><b style="font-size:24px">' + esc(who(S.draft.to)) + '</b><div class="mut">' + esc(fmtNum(S.draft.to)) + ' · up to ' + esc(S.draft.max) + ' min · from ' + esc(fmtNum(S.boot.line)) + '</div></div>' +
      '<div class="card"><h4>Purpose</h4><div class="mut" style="white-space:pre-wrap">' + esc(t) + '</div>' + (S.draft.first ? '<h4 style="margin-top:10px">Opens with</h4><div class="mut">' + esc(S.draft.first) + '</div>' : '') + '</div>' +
      '<button class="btn" data-act="dial">📞 Yes, place the call</button><button class="btn alt" data-act="back">Edit</button>');
  }
  function contactsSheet() { var cs = S.boot.contacts || [];
    sheet('<h3>Saved contacts</h3><div class="mut">Stored privately in your backend, not on GitHub.</div>' + cs.map(function (c, i) { return '<div class="row"><div class="m"><div class="t">' + esc(c.name) + '</div><div class="s">' + esc(fmtNum(c.num)) + (c.note ? ' · ' + esc(c.note) : '') + '</div></div><button class="ghost" data-act="callC" data-i="' + i + '">📞</button><button class="ghost" data-act="delC" data-i="' + i + '">🗑</button></div>'; }).join('') +
      '<label>Name</label><input id="cName"><label>Number</label><input id="cNum" inputmode="tel"><label>Note (optional)</label><input id="cNote"><button class="btn" data-act="addC">Save contact</button><button class="btn alt" data-act="close">Done</button>'); }
  function scriptsSheet() { var sc = S.boot.scripts || [];
    sheet('<h3>Call scripts</h3><div class="mut">Reusable purposes you can drop into “Start a call”.</div>' + sc.map(function (s, i) { return '<div class="row"><div class="m"><div class="t">' + esc(s.name) + '</div><div class="s">' + esc(s.task) + '</div></div><button class="ghost" data-act="delS" data-i="' + i + '">🗑</button></div>'; }).join('') +
      '<label>Name</label><input id="sName" placeholder="Check appointment"><label>What the agent should do</label><textarea id="sTask"></textarea><button class="btn" data-act="addS">Save script</button><button class="btn alt" data-act="close">Done</button>'); }
  function settingsSheet() {
    sheet('<h3>Connect Bland</h3><div class="mut">' + (S.boot.hasKey ? '✅ Connected. Live log, transcripts, recordings and dialing are on.' : 'One time: paste your Bland API key (Bland dashboard → API keys). It is stored only inside your private Google Apps Script, never sent back to this page or saved on GitHub.') + '</div>' +
      '<label>Bland API key</label><input id="bk" type="password" autocomplete="off" placeholder="' + (S.boot.hasKey ? '•••••• (replace)' : 'org_…') + '"><button class="btn" data-act="saveKey">Save key</button>' +
      (S.boot.hasKey ? '<button class="btn alt" data-act="clearKey">Disconnect</button>' : '') + '<button class="btn alt" data-act="close">Close</button>');
  }
  function privacySheet() { sheet('<h3>Privacy</h3><div class="card mut">• This page is public code with no data and no keys in it.<br>• Your private link key is kept on this device only and removed from the address bar.<br>• Every request goes to your own Google Apps Script, which checks the key (only a hash is stored) before answering.<br>• The Bland API key lives only in that script\'s private settings.<br>• Search engines are told not to index this page.</div><button class="btn alt" data-act="close">Close</button>'); }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button,summary'); if (!t) { if (e.target.id === 'sheet') close(); return; }
    var go = t.dataset.go, act = t.dataset.act;
    if (t.tagName === 'SUMMARY') { var id = t.parentNode.id.slice(2); setTimeout(function () { S.open[id] = t.parentNode.open; }, 0); return; }
    if (go) { drawer(false); if (go === 'contacts') return contactsSheet(); if (go === 'scripts') return scriptsSheet(); if (go === 'settings') return settingsSheet(); if (go === 'privacy') return privacySheet();
      S.open[go] = true; render(); var el = $('#s-' + go); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (t.dataset.call) return openCall(t.dataset.call);
    if (t.dataset.filter) { S.filter = t.dataset.filter; render(); return; }
    if (t.dataset.pick) { $('#nNum').value = fmtNum(S.boot.contacts[+t.dataset.pick].num); return; }
    if (t.dataset.script) { $('#nTask').value = S.boot.scripts[+t.dataset.script].task; return; }
    var i = +t.dataset.i;
    switch (act) {
      case 'new': return S.boot.hasKey ? newCall() : (toast('Connect Bland first'), settingsSheet());
      case 'close': return close();
      case 'review': return review();
      case 'back': newCall(S.draft.to); $('#nTask').value = S.draft.task; $('#nFirst').value = S.draft.first; return;
      case 'dial': t.disabled = true; t.textContent = 'Dialing…';
        return api('start', S.draft).then(function (j) { close(); toast('Call placed ✓'); S.draft = null; setTimeout(load, 4000); }).catch(function (er) { t.disabled = false; t.textContent = '📞 Yes, place the call'; toast(er.message); });
      case 'redial': return S.boot.hasKey ? newCall(t.dataset.num) : toast('Connect Bland first');
      case 'rec': t.textContent = 'Loading audio…'; return api('rec', { id: t.dataset.id }).then(function (j) { $('#recBox').innerHTML = '<audio controls autoplay style="width:100%;margin-top:10px" src="data:' + j.mime + ';base64,' + j.b64 + '"></audio>'; }).catch(function (er) { t.textContent = er.message; });
      case 'seenAll': var ids = alerts().map(function (c) { return c.id; }); ids.forEach(function (x) { S.boot.seen[x] = 1; }); render(); return api('seen', { ids: ids }).catch(function () {});
      case 'addC': var nm = $('#cName').value.trim(), nu = $('#cNum').value.replace(/\D/g, ''); if (!nm || nu.length < 10) return toast('Name and 10-digit number');
        S.boot.contacts.push({ name: nm, num: nu.slice(-10), note: $('#cNote').value.trim() }); return saveList('saveContacts', S.boot.contacts, contactsSheet);
      case 'delC': S.boot.contacts.splice(i, 1); return saveList('saveContacts', S.boot.contacts, contactsSheet);
      case 'callC': return S.boot.hasKey ? newCall(S.boot.contacts[i].num) : toast('Connect Bland first');
      case 'addS': var sn = $('#sName').value.trim(), st = $('#sTask').value.trim(); if (!sn || st.length < 8) return toast('Name and instructions');
        S.boot.scripts.push({ name: sn, task: st }); return saveList('saveScripts', S.boot.scripts, scriptsSheet);
      case 'delS': S.boot.scripts.splice(i, 1); return saveList('saveScripts', S.boot.scripts, scriptsSheet);
      case 'saveKey': var k = $('#bk').value.trim(); t.textContent = 'Checking with Bland…';
        return api('setKey', { bland: k }).then(function () { toast('Bland connected ✓'); close(); start(); }).catch(function (er) { t.textContent = 'Save key'; toast(er.message); });
      case 'clearKey': return api('clearKey').then(function () { toast('Disconnected'); close(); start(); });
    }
  });
  function saveList(a, list, re) { re(); api(a, { list: list }).then(function () { toast('Saved'); }).catch(function (e) { toast(e.message); }); }
  function drawer(on) { $('#drawer').classList.toggle('open', on); $('#scrim').classList.toggle('on', on); }
  $('#menuBtn').onclick = function () { drawer(true); }; $('#closeDrawer').onclick = $('#scrim').onclick = function () { drawer(false); };
  $('#refreshBtn').onclick = function () { load(); toast('Refreshing…'); };
  $('#lockBtn').onclick = function () { if (confirm('Forget the private key on this device?')) { localStorage.removeItem('calls.k'); location.reload(); } };

  function load() { if (S.boot && S.boot.offline) { toast('Showing saved calls – live updates after one-time setup'); return Promise.resolve(); } return api('calls').then(function (j) { S.calls = (j.calls || []).sort(function (a, b) { return new Date(b.at) - new Date(a.at); }); S.live = j.live; S.at = j.at; render(); }).catch(function (e) { toast(e.message); }); }
  function gate(msg) { $('#tiles').innerHTML = ''; var g = $('#gate'); g.classList.remove('hidden'); g.innerHTML = '<h3>🔒 Private</h3><p class="mut">' + msg + '</p>'; }
  function start() {
    if (!KEY) return gate('Open this app from your private link.');
    $('#tiles').innerHTML = '<div class="card mut" style="grid-column:1/-1">Loading your calls…</div>';
    api('boot').then(function (b) { S.boot = b; b.contacts = b.contacts || []; b.scripts = b.scripts || []; b.seen = b.seen || {}; $('#lineLbl').textContent = 'Line ' + fmtNum(b.line) + (b.hasKey ? ' · live' : ' · snapshot'); render(); return load(); })
      .catch(function (e) { if (e.message === 'locked') { localStorage.removeItem('calls.k'); gate('This link key is not valid. Open your private link again.'); } else offline(e); });
  }
  function b64(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
  function decryptSnap() {
    var X = window.CALLS_SNAP, cs = window.crypto && crypto.subtle;
    if (!X || !cs) return Promise.reject(new Error('no snapshot'));
    return cs.importKey('raw', new TextEncoder().encode(KEY), 'PBKDF2', false, ['deriveKey'])
      .then(function (m) { return cs.deriveKey({ name: 'PBKDF2', salt: b64(X.salt), iterations: X.iter, hash: 'SHA-256' }, m, { name: 'AES-GCM', length: 256 }, false, ['decrypt']); })
      .then(function (k) { return cs.decrypt({ name: 'AES-GCM', iv: b64(X.iv) }, k, b64(X.ct)); })
      .then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); });
  }
  function offline(e) {
    decryptSnap().then(function (d) {
      S.boot = { offline: true, hasKey: false, routines: d.routines || [], line: d.line, contacts: d.contacts || [], scripts: [], seen: {} };
      S.calls = (d.calls || []).sort(function (a, b) { return new Date(b.at) - new Date(a.at); }); S.live = false; S.at = d.at;
      $('#lineLbl').textContent = 'Line ' + fmtNum(d.line) + ' · saved';
      render();
    }).catch(function () { gate('Could not reach your backend: ' + esc(e.message)); });
  }
  start();
})();
