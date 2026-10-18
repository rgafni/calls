# Katya Calls
Private phone app (installable PWA) for Roni's Katya calls: Life/TTG, Today, Calls, Call detail, Ask, Approve, Routines, Personas, Settings.
Contains no call data and no keys. It only talks to a private Apps Script backend (config.js) that requires a personal link key.
Texts and emails only go to the Approve queue; there is no sending path. Calls need an explicit confirm tap.
Phone line view (More > Phone line): off until `LINE_AGENTS_LIVE` in config.js is set to true. Agent names and caller labels come only from the private backend (`boot.lineSetup`); none are in this repo.
