/* Public research (checked Oct 14, 2026). No private data. */
window.PROVIDERS = {
  checked: 'Oct 14, 2026',
  rec: {
    title: 'Keep Bland as the dialer for now. Pilot Grok Voice on your own calls.',
    body: 'Bland already runs everything: your number, the wake and calendar routines, recordings and voicemail detection. Moving it all today would break things that work. Grok Voice (xAI) is cheaper (about $0.09/min all-in vs $0.14 on Bland), faster to answer (~0.7 s to first audio), and smarter in conversation. Its weak spot: it is built for calls coming IN, so calling OUT needs a small Twilio bridge (a few hours of setup and about $1/month for a number). Plan: voicemail fixes applied Oct 14 (friend-style settings); verify on next calls, then run your wake call through Grok Voice for one week. If it picks up voicemail reliably and sounds better, move the personal routines (wake + calendar briefs) to Grok and keep Bland only for business calls, or drop it.'
  },
  cols: ['Bland (now)', 'xAI Grok Voice', 'OpenAI Realtime', 'Retell', 'Vapi'],
  rows: [
    ['Price / min', '$0.14 (Start), $0.12 on $299/mo Build; phone line extra', '$0.08 voice + $0.01 xAI number ≈ $0.09', '≈$0.06–0.11 with caching (~$0.30 uncached); mini $0.02–0.05; + Twilio', '$0.07–0.31 all-in, depends on model/voice', '$0.05 platform + STT/LLM/TTS ≈ $0.07–0.14 + phone'],
    ['Speed (vendor claims)', 'Sub-second; we hear pauses and silent voicemail hang-ups', '0.7 s to first audio (Think Fast 2.0)', '~0.3 s model reply; fastest', '~0.6–0.8 s typical', 'Depends on the parts you pick'],
    ['Calling out', 'Built in, one API call', 'Needs a Twilio bridge (inbound SIP is built in)', 'Needs Twilio / SIP glue', 'Built in', 'Built in'],
    ['Voicemail', 'Detects it, but our calls stalled in silence; fixed Oct 14 (hangup on voicemail, 160ms)', 'You build it in the bridge (Twilio detection)', 'You build it', 'Built-in detection + message', 'Built-in detection + message'],
    ['Brains', 'Bland models (base/turbo)', 'Grok, with reasoning, tools, web/X search', 'GPT realtime', 'Pick GPT, Claude, Gemini…', 'Pick anything'],
    ['Setup effort for you', 'Done', 'Medium (one-time)', 'High (DIY)', 'Low–medium', 'Medium'],
  ],
  notes: [
    'xAI Voice Agent Builder: no platform fee, voices included, connects to Gmail, Google Calendar, Notion. Docs: docs.x.ai → Voice.',
    'Bland keeps your current number (+1 443-299-1843). Switching providers means porting it or using a new number.',
    'Prices from vendor pages and Oct 2026 comparisons (Retell pricing page, xAI pricing docs, SuperDupr / costperoutput roundups).'
  ]
};
