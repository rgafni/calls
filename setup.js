/* Setup: Bland personas + call behavior. Saves go through the private Apps Script (Bland key stays server-side). */
(function () {
  'use strict';
  var X, P = { list: null, svc: 'bland', voices: null, edit: null, draft: null };
  var VOICES = ['michelle', 'maya', 'june', 'paige', 'tina', 'nat', 'josh', 'ryan', 'mason', 'derek', 'florian', 'evelyn'];
  var MODELS = [['base', 'Base (best for following scripts)'], ['turbo', 'Turbo (fastest replies)'], ['enhanced', 'Enhanced']];
  var LANGS = [['en-US', 'English (US)'], ['en-GB', 'English (UK)'], ['he', 'Hebrew'], ['es', 'Spanish'], ['fr', 'French'], ['ru', 'Russian']];
  function def() { return { name: 'Katya', prompt: 'You are Katya, a friendly, concise assistant calling on behalf of Roni Gafni. Be brief and polite.', voice: 'michelle', model: 'base', temperature: 0.45, language: 'en-US',
    wait_for_greeting: false, interruption_threshold: 160, block_interruptions: false, backchannels: false, noise_cancellation: false,
    vm_action: 'hangup', vm_message: '', max_duration: 10, record: false, first_sentence: 'Hi, this is Katya, an automated AI assistant calling on behalf of Roni Gafni.' }; }
  function canSave() { return !!(X.S.boot && X.S.boot.hasKey && !X.S.boot.offline); }
  function list() { if (!P.list) { var b = X.S.boot || {}; P.list = (b.personas && b.personas.length) ? b.personas : [def()]; P.svc = b.service || 'bland'; } return P.list; }
  function e(s) { return X.esc(s); }
  function note() { return canSave() ? '' : '<div class="card" style="padding:10px 12px;font-size:13px">👀 <b>Preview</b> <span class="mut">– saving and test calls turn on after the one-time backend setup.</span></div>'; }
  function html() {
    var L = list();
    return note() + '<h4 style="margin:12px 0 0">Voice service</h4><div class="svc">' +
      '<button class="svcb' + (P.svc === 'bland' ? ' on' : '') + '" data-sx="svc" data-v="bland"><b>Bland</b><span>Active</span></button>' +
      '<button class="svcb soon" data-sx="soon"><b>xAI Grok Voice</b><span>Coming soon</span></button></div>' +
      '<h4 style="margin:16px 0 0">Personas</h4>' + L.map(function (p, i) {
        return '<button class="row" data-sx="edit" data-i="' + i + '"><span style="font-size:26px">🎭</span><div class="m"><div class="t">' + e(p.name) + '</div><div class="s">' + e(p.voice + ' · ' + p.model + ' · ' + p.language + ' · ' + p.max_duration + ' min') + '</div></div><div class="r">Edit ›</div></button>';
      }).join('') + '<button class="btn alt" data-sx="new">＋ New persona</button>';
  }
  function tog(id, lbl, on, sub) { return '<label class="tg"><span><b>' + lbl + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '></label>'; }
  function sl(id, lbl, v, mn, mx, st, unit) { return '<label>' + lbl + ': <b id="' + id + 'V">' + v + unit + '</b></label><input type="range" id="' + id + '" min="' + mn + '" max="' + mx + '" step="' + st + '" value="' + v + '" oninput="document.getElementById(\'' + id + 'V\').textContent=this.value+\'' + unit + '\'">'; }
  function opt(arr, v) { return arr.map(function (o) { o = Array.isArray(o) ? o : [o, o]; return '<option value="' + e(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + e(o[1]) + '</option>'; }).join(''); }
  function editor(i) {
    P.edit = i; var p = i < 0 ? (P.draft || def()) : list()[i]; var vs = P.voices || VOICES; if (vs.indexOf(p.voice) < 0) vs = [p.voice].concat(vs);
    var dis = canSave() ? '' : ' disabled';
    X.sheet('<h3>' + (i < 0 ? 'New persona' : 'Edit ' + e(p.name)) + '</h3>' + note() +
      '<label>Name</label><input id="pName" value="' + e(p.name) + '">' +
      '<label>Prompt (who the agent is and how it behaves)</label><textarea id="pPrompt">' + e(p.prompt) + '</textarea>' +
      '<label>First sentence</label><input id="pFirst" value="' + e(p.first_sentence) + '">' +
      '<label>Voice' + (P.voices ? '' : ' (full Bland list loads after setup)') + '</label><select id="pVoice">' + opt(vs, p.voice) + '</select>' +
      '<label>Model</label><select id="pModel">' + opt(MODELS, p.model) + '</select>' +
      '<label>Language</label><select id="pLang">' + opt(LANGS, p.language) + '</select>' +
      sl('pTemp', 'Temperature', p.temperature, 0, 1, 0.1, '') +
      '<h4 style="margin:18px 0 4px">Conversation</h4>' +
      tog('pWait', 'Wait for greeting', p.wait_for_greeting, 'Let them say hello first') +
      sl('pInt', 'Interruption threshold', p.interruption_threshold, 50, 500, 10, ' ms') +
      tog('pBlock', 'Block interruptions', p.block_interruptions, 'Agent keeps talking when interrupted') +
      tog('pBack', 'Backchannels', p.backchannels, '“mm-hmm”, “got it”') +
      tog('pNoise', 'Noise cancellation', p.noise_cancellation) +
      tog('pRec', 'Record calls', p.record) +
      sl('pMax', 'Max duration', p.max_duration, 1, 30, 1, ' min') +
      '<h4 style="margin:18px 0 4px">Voicemail</h4><label>When voicemail picks up</label><select id="pVm">' + opt([['leave_message', 'Leave a message'], ['hangup', 'Hang up'], ['ignore', 'Keep talking (not recommended)']], p.vm_action) + '</select>' +
      '<label>Voicemail message</label><textarea id="pVmMsg">' + e(p.vm_message) + '</textarea>' +
      '<button class="btn"' + dis + ' data-sx="review">' + (canSave() ? 'Review & save' : 'Saving after setup') + '</button>' +
      (i >= 0 ? '<button class="btn ok"' + dis + ' data-sx="test">📞 Test call to me</button><button class="btn alt" data-sx="dup">⧉ Duplicate</button>' : '') +
      '<button class="btn alt" data-act="close">Close</button>');
  }
  function read() { var g = function (id) { return document.getElementById(id); };
    return { name: g('pName').value.trim() || 'Persona', prompt: g('pPrompt').value.trim(), first_sentence: g('pFirst').value.trim(), voice: g('pVoice').value, model: g('pModel').value, language: g('pLang').value,
      temperature: +g('pTemp').value, wait_for_greeting: g('pWait').checked, interruption_threshold: +g('pInt').value, block_interruptions: g('pBlock').checked, backchannels: g('pBack').checked,
      noise_cancellation: g('pNoise').checked, record: g('pRec').checked, max_duration: +g('pMax').value, vm_action: g('pVm').value, vm_message: g('pVmMsg').value.trim() }; }
  function confirmSave() { if (!canSave()) return X.toast('Saving turns on after setup');
    P.draft = read(); var p = P.draft;
    X.sheet('<h3>Save persona?</h3><div class="card"><b style="font-size:20px">' + e(p.name) + '</b><div class="mut">' + e(p.voice + ' · ' + p.model + ' · ' + p.language + ' · temp ' + p.temperature + ' · max ' + p.max_duration + ' min · voicemail: ' + p.vm_action) + '</div><div class="mut" style="margin-top:8px;white-space:pre-wrap">' + e(p.prompt.slice(0, 400)) + '</div></div>' +
      '<button class="btn" data-sx="save">✓ Yes, save</button><button class="btn alt" data-sx="back">Edit</button>'); }
  function persist(L, msg) { return X.api('savePersonas', { list: L, service: P.svc }).then(function () { P.list = L; X.S.boot.personas = L; X.toast(msg); X.close(); X.render(); }).catch(function (er) { X.toast(er.message); }); }
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-sx]'); if (!t) return; var a = t.dataset.sx, i = +t.dataset.i;
    switch (a) {
      case 'edit': P.draft = null; if (canSave() && !P.voices) X.api('voices').then(function (j) { P.voices = j.voices; }).catch(function () {}); return editor(i);
      case 'new': P.draft = null; return editor(-1);
      case 'dup': var c = JSON.parse(JSON.stringify(list()[P.edit])); c.name += ' (copy)'; P.draft = c; return editor(-1);
      case 'review': return confirmSave();
      case 'back': return editor(P.edit);
      case 'save': var L = list().slice(); if (P.edit < 0) L.push(P.draft); else L[P.edit] = P.draft; return persist(L, 'Persona saved ✓');
      case 'svc': return;
      case 'soon': return X.toast('xAI Grok Voice is coming soon');
      case 'test': if (!canSave()) return X.toast('Test calls turn on after setup'); var p = list()[P.edit];
        return X.sheet('<h3>Test call to you?</h3><div class="card"><div class="mut">Katya will call your saved “Me” number using</div><b style="font-size:20px">' + e(p.name) + '</b><div class="mut">' + e(p.voice) + ' · up to ' + e(Math.min(p.max_duration, 5)) + ' min</div></div><button class="btn ok" data-sx="dialTest">📞 Yes, call me now</button><button class="btn alt" data-sx="back">Cancel</button>');
      case 'dialTest': t.disabled = true; t.textContent = 'Dialing…';
        return X.api('testPersona', { i: P.edit }).then(function () { X.close(); X.toast('Test call placed ✓'); }).catch(function (er) { t.disabled = false; t.textContent = '📞 Yes, call me now'; X.toast(er.message); });
    }
  });
  window.CallsSetup = { init: function (x) { X = x; }, html: html, count: function () { return list().length; } };
})();
