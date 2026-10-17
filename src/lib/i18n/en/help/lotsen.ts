import type { Shape } from '../../format'
import type { lotsen as de } from '../../de/help/lotsen'

/** Guides — texts of the guided tours. Paths, anchors, scenes and order live in `lotsen.ts`. American English. */
export const lotsen = {
  tours: {
    einrichtung: {
      title: 'First setup',
      subtitle: 'The guided way from an empty property to the first check-in',
    },
    uebersicht: {
      title: 'The room overview',
      subtitle: 'The front desk screen: reading colors, check-in, check-out, priorities',
    },
    anfragen: {
      title: 'Requests',
      subtitle: 'The front desk board: what guests have ordered and how to check it off',
    },
    zimmer: {
      title: 'Rooms & floors',
      subtitle: 'Create whole floors at once, correct numbers, take rooms out of service',
    },
    regeln: {
      title: 'Property & rules',
      subtitle: 'Time zone, daily cleaning, check-out time, PIN length — the property’s rules',
    },
    gastzugang: {
      title: 'Guest access',
      subtitle: 'Fixed room QR with PIN or personal access per stay — including room signs',
    },
    aushang: {
      title: 'Room signs & check-in sheets',
      subtitle: 'What gets printed: room sign, check-in sheet, access card — and how long each is valid',
    },
    personal: {
      title: 'Staff',
      subtitle: 'Housekeeping, front desk and managers — create, end access, print access cards',
    },
    services: {
      title: 'Service builder',
      subtitle: 'The service builder: what guests can order in the portal',
    },
    reinigung: {
      title: 'The housekeeping board',
      subtitle: 'Replica: sign-in, shift, floors, sliders — what the housekeeper sees on their phone',
    },
    gast: {
      title: 'What the guest sees',
      subtitle: 'Replica: the guest portal on a phone — cleaning, “not before”, skipping, Do not disturb, services',
    },
    auswertung: {
      title: 'Reports',
      subtitle: 'Work times from the entries, irregularities and when guests want cleaning',
    },
    konto: {
      title: 'Plan & billing',
      subtitle: 'What the account costs, how rooms are counted and where payment method and invoices are',
    },
  },

  steps: {
    'einrichtung.start': {
      title: 'Welcome to RoSe',
      body: 'Over the next few minutes, we’ll set up your property: rooms, the property’s rules, how your guests get into the portal, staff and services. You can stop at any time and continue later — progress comes from what has actually been set up, not from checkmarks.',
      tun: 'Continue with the “Next” button at the bottom right. You can pause at any time — a banner on the overview shows what’s missing and takes you back into setup.',
    },
    'zimmer.anlegen': {
      title: 'Everything starts with the rooms',
      body: 'Without rooms there’s no check-in, no housekeeping board and no room signs. Here you create whole floors at once — no need to type anything one by one.',
    },
    'zimmer.modus': {
      title: 'Two ways to create many rooms',
      body: '“Floors individually” creates the numbers entered on exactly one floor — right when every floor looks different. “Identical floors” repeats the same range of numbers on several floors.',
    },
    'zimmer.nummern': {
      title: 'Numbers as a list or a range',
      body: '“101-110” creates ten rooms, “201, 202, 205” exactly three. Leading zeros are kept — “01-10” becomes 01 to 10, not 1 to 10.',
      tun: 'Type a range: below the field you immediately see which rooms will be created.',
    },
    'zimmer.bestand': {
      title: 'A typo? No problem',
      body: 'Rooms, floors and buildings can be clicked — the dialog offers the same everywhere: edit, take out of service, delete. Editing changes number, floor and building without losing history or work records; “out of service” is the gentle way for renovations. Deleting only happens after a warning with figures.',
    },
    'regeln.zeitzone': {
      title: 'Time zone first',
      body: 'All times on this page apply in this time zone. If the wrong one is set, daily cleaning becomes due at the wrong hour, and the day boundaries of the reports are off too.',
    },
    'regeln.routine': {
      title: 'Cleaning on request only — or daily',
      body: 'By default, daily cleaning is off: rooms are cleaned when the guest asks or after check-out. That saves water, detergent and working time. If you turn it on, occupied rooms appear on the housekeeping board on their own from the day after arrival at the chosen time.',
    },
    'regeln.checkout': {
      title: '“Check-out until” is the earliest time for daily cleaning',
      body: 'As long as RoSe doesn’t know whether the guest leaves today, daily cleaning isn’t due before this time. That way no departure room is cleaned before check-out and then again. If a departure date is entered for the stay, the normal time applies on the days before, and daily cleaning is skipped on the day of departure.',
    },
    'regeln.speichern': {
      title: 'Don’t forget to save',
      body: 'The rules apply to everything from the moment you save. Current stays and requests already set continue unchanged. As soon as you change something, a bar with Save and Discard also appears at the bottom of the screen — you don’t have to scroll all the way down here.',
      tun: 'Save once even if you don’t change anything. Only then does the property record the time zone, and the step counts as checked in setup.',
    },
    'gastzugang.wahl': {
      title: 'Two ways into the guest portal',
      body: 'With the fixed room QR, a code printed once is in the room, and every stay gets its own PIN — two factors. With personal access, every stay gets its own link without a PIN that expires at check-out: more convenient, but anyone who sees the sheet has access.',
    },
    'gastzugang.speichern': {
      title: 'Switching has no effect on current stays',
      body: 'The method is recorded with the stay at check-in, not read again on every access. Access already issued keeps working until check-out; only the next check-in follows the new method. There’s no switch date and no conversion of existing data.',
      tun: 'Confirm your choice with this button — even if you keep the default. Only then does the step count as done in setup.',
    },
    'personal.reinigung': {
      title: 'Housekeepers don’t need an email address',
      body: 'A housekeeper gets a username and a PIN — nothing more. The display name appears on the board and the card; sign-in uses the username: anyone who types the display name when signing in is turned away. Both apply only in this property — the same username may exist again in another property.',
    },
    'personal.liste': {
      title: 'End access instead of deleting',
      body: 'When someone leaves, end their access: sign-in is blocked immediately, an open session ends too, and the work record stays complete. If the person comes back, the access is reactivated — the access card keeps working. Permanent deletion exists too, but for housekeeping it takes the entries with it; the dialog shows beforehand what disappears.',
    },
    'services.anlegen': {
      title: 'A service is a building block',
      body: 'The service is at the top — “Laundry service”, “Maintenance” — with the options the guest chooses below it. Two checkboxes decide the flow: “urgent” makes the bell on the room tile and the number in the navigation flash red. “Maintenance report” is for defects — such requests belong to the room, not the stay, and therefore stay open after check-out.',
      tun: 'Set “Maintenance report” for anything that can break — maintenance is the standard case.',
    },
    'services.liste': {
      title: 'Prices end up on the statement at check-out',
      body: 'Options may carry a price; the guest sees it when requesting. At check-out, the room dialog shows the total of services provided — so it’s worth keeping prices up to date right here. Without a price, a request appears on no statement, and maintenance reports don’t appear there even with a price: they aren’t a service to the guest. RoSe doesn’t book or charge anything, it only adds up.',
      tun: 'Enter a price for an option — from the next request on, it appears on the statement at check-out.',
    },
    'einrichtung.ende': {
      title: 'Done — and here’s what’s next',
      body: 'Your property is set up. Under “Help” you’ll always find all guides again, plus an overview of what’s still missing. Every guide can be started individually, as often as you like.',
    },
    'uebersicht.kpi': {
      title: 'The situation in one line',
      body: 'The figures at the top show the state of the property at a glance — occupied, ready, to clean, “Do not disturb”, in progress. They update on their own as soon as a guest or a housekeeper changes something.',
    },
    'uebersicht.etage': {
      title: 'Sorted by floor',
      body: 'Each floor is a block, top floor first. If a housekeeper is checked in on the floor, their name appears in the header — so you can see where work is happening without asking.',
    },
    'uebersicht.kachel': {
      title: 'The color is the state',
      body: 'The bar above the number says it all: green = ready, blue = occupied, amber = cleaning requested or daily cleaning due, orange = checked out, rose = “Do not disturb”. Purple and a flag mean prioritized, a red flashing ring an urgent service request. The small symbols below give the reason.',
      tun: 'Hover over a tile — the tooltip states the condition in plain words.',
    },
    'uebersicht.dialog': {
      title: 'One click opens the room',
      body: 'The dialog holds check-in and check-out, the guest PIN to read out, the check-in sheet to print, the departure date, the priority and the history of the last 30 days. Check-in is one click; the departure date is optional and can be added at any time.',
      tun: 'Go ahead and click a room — the guide stays open.',
    },
    'uebersicht.checkout': {
      title: 'At check-out, the amount is shown',
      body: 'If the guest ordered paid services, the dialog highlights what’s to be collected before you confirm — with “Details” as a printable statement: room, period, items with times, total. No guest name, no invoice. If nothing paid was ordered, there’s only a note and you check out as usual.',
      tun: 'Check-out closes open requests as “not provided” — check off what was actually provided in the same box beforehand. Later you can get back to the statement via the room’s history: the “Check-out” entry carries the link.',
    },
    'anfragen.zaehler': {
      title: 'Everything guests request',
      body: 'Requests from the guest portal arrive here. The same number appears as a badge on “Requests” in the navigation — it flashes red as soon as at least one request concerns an urgent service, and the room tile concerned gets a bell.',
    },
    'anfragen.liste': {
      title: 'What a request brings along',
      body: 'Room number, service, the chosen options with price, a free note from the guest and the age of the request. New requests appear on their own — the page updates over the same live connection as the boards.',
    },
    'anfragen.erledigt': {
      title: 'The checkmark decides the amount',
      body: 'A request is open or closed; there’s no “in progress” and no assignment. When closing, the difference matters: “Done” means provided — and appears with its amount on the statement at check-out. Anything still open by then is closed by RoSe as “not provided”: marked, but not in the total. Maintenance reports are the exception: a defect stays open until someone checks it off — even after check-out, and the next check-in shows a warning.',
      tun: 'Check off a completed request right away — otherwise it’s missing from the total in the end.',
    },
    'anfragen.verlauf': {
      title: 'Closed requests stay traceable',
      body: 'Closed requests move into the collapsed list below, with time and name; requests not provided are marked there. They also appear in the room’s history — handy when a guest later asks whether their request arrived.',
    },
    'zimmer.bereich': {
      title: 'Building and floor',
      body: 'The building is optional and only meant for properties that really have separate wings. It does affect uniqueness, though: room numbers only need to be unique per building — “101” may exist in the main building and the annex.',
    },
    'zimmer.praefix': {
      title: 'Prefix the floor number',
      body: 'If every floor uses the same range of numbers, you need this checkbox: floor 2 and “05” become “205”. Without it, the numbers collide and only the first floor would be created — the page warns you beforehand.',
    },
    'zimmer.absenden': {
      title: 'Preview first, then click',
      body: 'Above the button you see how many rooms will be created and what they’ll be called. Nothing is written until you click — try as much as you like beforehand.',
    },
    'regeln.logo': {
      title: 'Your logo on the printouts',
      body: 'Room sign and check-in sheet carry your logo at the top left; without one, the property name appears there. PNG, JPG or SVG, 1 MB max. Two pitfalls: an image that’s too small looks blurry at 55 mm, and a light logo meant for dark backgrounds is invisible on white paper — that’s why the preview shows it on white.',
    },
    'regeln.checkin': {
      title: '“Check-in from” drives the departures',
      body: 'Departure rooms should be ready by then. The housekeeping board works with this time: the more departures are still open and the closer check-in gets, the more strongly it draws housekeepers to floors with departures — barely on quiet days, clearly on busy ones. A priority set by the front desk always comes first.',
    },
    'regeln.aufschub': {
      title: '“Not before” — the guest postpones',
      body: 'The guest wants cleaning, but not before a certain time, because they want to sleep in. Until then, the room counts as not open on the board. Choose the limit so that cleaning still falls within the shift afterwards: housekeeping until 15:00 means 13:00.',
    },
    'regeln.personenbezug': {
      title: 'Per housekeeper or team only',
      body: 'If the work of individual housekeepers may not or should not be measured in your property, choose “Team only”: reports then show only the property total, the room history shows “Housekeeping team”, and entries lose their person when the shift ends — when you switch, all existing ones too. You can switch back, but the names of anonymized entries don’t come back. With a single housekeeper on shift, the protection is only formal anyway.',
    },
    'regeln.fenster': {
      title: 'Cleaning requests only at set times',
      body: 'Outside the window, the guest can’t send a request and sees your cleaning hours instead. “Do not disturb” and withdrawing a request always remain possible — otherwise someone would be stuck with a request they can’t get rid of.',
    },
    'regeln.pin': {
      title: 'PIN length and forgotten finishes',
      body: 'The PIN length applies to newly created guest PINs; current stays keep theirs. The second value cleans up forgotten finishes: if a started cleaning isn’t finished, the room reopens on its own after this time — and the history records that the time limit was exceeded.',
    },
    'regeln.adresse': {
      title: 'Your property’s address',
      body: 'Guests and housekeepers sign in at this address. It’s part of both sign-ins because room numbers and usernames are only unique within the property. Printed QR codes stay valid after a change — only typed addresses on older check-in sheets will no longer match.',
    },
    'gastzugang.sprachen': {
      title: 'Property languages',
      body: 'The guest portal shows every guest the language of their phone, if it offers it. If it doesn’t, your fallback language applies. The printed sheets explain the portal with pictures of its buttons — text is in the fallback language and, optionally, a second one. Printing more languages on paper helps less than the space it costs.',
      tun: 'The home language is the one you create content in. The fallback language is also the first language of the printouts and the access email — the second appears only on the printout.',
    },
    'gastzugang.aushang': {
      title: 'The room signs',
      body: 'With the PIN method, every room needs its sign: A4 for frames, stands or folders, or four compact cards per page to cut apart. Printed once, valid permanently. With personal access, the room signs are hidden: they would lead to a PIN entry that nobody can use there.',
    },
    'aushang.karte': {
      title: 'One sign per room',
      body: 'The sign goes in the room — in a stand, a frame or the folder: QR code, room number, property name. The guest scans the QR code and just types their PIN. The code belongs to the room, not the stay — it stays valid for all guests and is printed exactly once.',
    },
    'aushang.knopf': {
      title: 'Create first, then print',
      body: 'Rooms without a code collect here: the button creates the missing ones all at once. Once they all exist, it becomes the print button — one page per room, so each sign can be used separately. Newly created rooms therefore need a second pass.',
    },
    'aushang.erneuern': {
      title: 'Renewing makes the old sign stop working',
      body: 'If a sign goes missing or a code needs to go for another reason, “Renew code” creates a new one — and the old sign stops working from then on. That’s why only the owner and managers can do this, and why it always affects just one room.',
    },
    'aushang.hinweis': {
      title: 'Only with the fixed room QR method',
      body: 'If your property uses personal access per stay, these signs lead to a PIN entry that new guests can’t use at all — then they don’t belong in the rooms. The page points this out at the top.',
    },
    'aushang.blatt': {
      title: 'The check-in sheet is created at check-in',
      body: 'Unlike the room sign, it belongs to exactly one stay. You’ll find it in the room dialog once the guest is checked in: a sheet with PIN, QR code and a short guide that follows your property’s rules — if the property cleans occupied rooms daily, the text says so; otherwise it asks the guest to request cleaning in the portal. The same can be sent by email; the address isn’t stored.',
      tun: 'Click an occupied room — the way to the check-in sheet is in the dialog.',
    },
    'aushang.login': {
      title: 'Access cards for housekeeping',
      body: 'The third printout: one card per housekeeper, which lets them sign in to the board without typing. A newly issued card makes the old one stop working — exactly the way to go if one gets lost. The card survives “End access” and works again after reactivation.',
    },
    'personal.karte': {
      title: 'Access cards with QR',
      body: 'Instead of entering a PIN, housekeepers can sign in with a printed card — scan once, signed in. A newly issued card makes the old one stop working; that’s exactly the way to go if a card goes missing.',
    },
    'personal.rezeption': {
      title: 'Front desk accounts',
      body: 'The front desk handles day-to-day work: check-in and check-out, priorities, requests, printing check-in sheets and cards. Settings, room setup, services and staff management stay closed to them.',
    },
    'personal.manager': {
      title: 'Managers — account owner only',
      body: 'A manager has the same rights as you within the property, but no access to the account and billing. Someone working across several properties is added per property — from the second time on without a new account. Removing always affects only this one property.',
    },
    'services.beispiele': {
      title: 'Start with examples',
      body: 'As long as no service exists yet, you can take over two ready-made ones and adapt them. They’re perfectly normal services — rename, extend or archive them at any time.',
    },
    'reinigung.login': {
      title: 'Sign-in without email',
      body: 'A housekeeper has a username and PIN — or scans their printed access card and is signed in immediately. Both apply only in this property — the same username may exist again elsewhere.',
    },
    'reinigung.schicht': {
      title: 'Start the shift first, then work',
      body: 'No cleaning can be started without a started shift. The start of the shift is also the first entry in the work record — from these entries, the reports later calculate work, break and cleaning times.',
      tun: 'Pull the slider all the way — it only triggers at 97% of the track.',
    },
    'reinigung.etagen': {
      title: 'Floors instead of one long list',
      body: 'After the shift starts, the floor level comes first, in the same fixed order as at the front desk. Each row shows how much is open there, whether a priority is waiting and who is already working there.',
    },
    'reinigung.naechstes': {
      title: '“Up next” is a recommendation, not an assignment',
      body: 'Exactly one floor carries the badge. If a prioritized room is open anywhere, it’s that floor — a front desk decision comes first. Otherwise, the highest open urgency divided by the number of housekeepers there plus one; departures weigh more the closer check-in gets. Where someone is already working, the walk is less worthwhile. Floors without open work drop out, and in a tie the lower floor wins — so the recommendation doesn’t jump back and forth.',
    },
    'reinigung.kacheln': {
      title: 'Choosing a floor means checking in',
      body: 'Whoever checks in now appears visibly on this floor — in the front desk overview and for the whole team. Grayed-out rooms aren’t blocked, they just have no task: vacant, “Do not disturb”, no cleaning wanted today, or a cleaning that applies only later.',
    },
    'reinigung.starten': {
      title: 'Start with a slider, not a button',
      body: 'Tapping the tile opens the room. Cleaning is started with a swipe that has to begin at the handle and cover almost the whole track — a phone in an apron pocket shouldn’t start a cleaning.',
    },
    'reinigung.tuer': {
      title: 'Guest is there and doesn’t want it right now?',
      body: 'Nobody has to start for this: “In 30 min” or “In 1 hr” takes the room off the board until then — for the whole team, nobody knocks again in between; afterwards it’s open again on its own. “Not today” settles it for today. If the guest still wants cleaning, they tap it in the portal. Neither counts as a cleaning, but both appear in the room history.',
      tun: 'Try one of the three buttons — the tile then shows what happened.',
    },
    'reinigung.abschliessen': {
      title: 'Finishing — and what happens if someone forgets',
      body: 'Between start and finish, the room shows as “in progress” for everyone. If finishing is forgotten, the room reopens on its own after the set time, and the history records that the time limit was exceeded — instead of a half-done process staying forever.',
    },
    'reinigung.status': {
      title: 'Break, other cleaning, end of shift',
      body: 'All status changes are on a separate page, not on the board — that way the phone’s back button works. Breaks and other cleaning are periods within the shift and can’t overlap with anything; ending the shift ends both. Below is the housekeeper’s daily summary.',
    },
    'reinigung.verlassen': {
      title: 'Leaving a floor is a deliberate act',
      body: 'The way back is also a slider, from right to left. A mistap shouldn’t throw anyone off the floor — that would make the team’s location display wrong.',
    },
    'gast.zugang': {
      title: 'No account, no app',
      body: 'The guest scans the sign in the room and enters the PIN from the check-in sheet — or opens the personal link received at check-in and is signed in without a PIN. Which of the two applies is decided by the property under “Guest access”.',
    },
    'gast.portal': {
      title: 'One screen, nothing more',
      body: 'After signing in, the guest stays signed in on their device — the PIN isn’t asked for a second time. The portal shows property and room at the top.',
    },
    'gast.reinigen': {
      title: 'One tap is enough',
      body: '“Clean my room” sets the request, and the room immediately appears on the housekeeping board and in the front desk overview. Tapping again withdraws it. None of this is an appointment — housekeeping comes when it fits into the round.',
      tun: 'Go ahead and tap it; the replica responds like the real portal.',
    },
    'gast.aufschub': {
      title: '“Not before” — for late risers',
      body: 'The guest wants cleaning, but not before a certain time. Until then, the room counts as not open on the board, and the tile shows a clock. How far it may be postponed is set by the property — and the portal says that the limit comes from the property.',
    },
    'gast.aktiv': {
      title: 'The guest sees what they triggered',
      body: 'An active request stays visible, including the chosen time, and the status card above tells the guest where things stand — planned, from a certain time, in progress right now, already cleaned today. When exactly someone will come is deliberately not shown: RoSe couldn’t keep that promise without assignment logic.',
    },
    'gast.verzicht': {
      title: '“No cleaning today” — only with daily cleaning',
      body: 'If the property cleans daily, the guest skips today with one tap. That’s not the same as “Do not disturb”: skipping only applies until midnight, services and the front desk remain reachable, and cleaning resumes tomorrow. On the board, the room turns gray with a leaf. If the property cleans on request only, the button is missing — there, not requesting already means skipping.',
    },
    'gast.dnd': {
      title: '“Do not disturb” beats everything',
      body: 'As long as it’s active, nobody knocks — not even for a service —, and daily cleaning is skipped. It applies until the guest switches it off, overnight too. Switching it off is always possible — unlike the cleaning request, “Do not disturb” is never blocked by a time window, otherwise someone would be stuck with it.',
    },
    'gast.services': {
      title: 'Services from the builder',
      body: 'The guest sees exactly the services the property has set up, with prices for information. Ordering takes one tap; the request lands at the front desk under “Requests”. Nothing is charged in RoSe.',
    },
    'gast.bestellt': {
      title: 'And then it’s over',
      body: 'Open requests stay visible to the guest until the front desk completes them. At check-out, PIN, link and sign-in expire immediately — the stay stays anonymous, no name was ever involved.',
    },
    'auswertung.zeitraum': {
      title: 'The period is in the address',
      body: 'From–to as a regular form that writes the period into the address. That way a state can be linked, sent on and printed — and when printing, the form itself disappears.',
    },
    'auswertung.kennzahlen': {
      title: 'Everything calculated, nothing stored',
      body: 'The figures come from the housekeepers’ entries: shift start and end, breaks, other cleaning, start and finish per room. “Net work time” is the shift without breaks; “remaining time” is whatever was neither room nor other cleaning — walking and setup.',
    },
    'auswertung.auffaellig': {
      title: 'Implausible entries don’t count in the totals',
      body: 'A shift over 16 hours is a forgotten end of shift, a break over four hours a forgotten end of break, and a cleaning without a finish doesn’t count as work done. Such cases are counted here instead of included — otherwise an open shift would drag the work time along for days and make the whole report useless.',
    },
    'auswertung.tabelle': {
      title: 'Per housekeeper — including former ones',
      body: 'Anyone whose access has ended stays visible in the reports; the work record survives leaving. Clicking the name opens the daily log with the individual entries.',
    },
    'auswertung.nachfrage': {
      title: 'When the work comes in',
      body: 'The second part answers a planning question: at what hours do guests want cleaning, when do they check out — and how many housekeepers were on shift then? The figure “Requests with nobody on shift” is the real hint. That’s why RoSe doesn’t ask guests for preferred times: the data is already there.',
    },
    'konto.plan': {
      title: 'One price, no packages',
      body: 'Billing is per room and calendar month, with a minimum amount per account — not per property. A chain therefore pays the sum of its rooms, not three times the minimum. All features are included; there’s nothing you’d need to upgrade to later.',
    },
    'konto.laufend': {
      title: 'Counting is generous, but clear',
      body: 'A room counts for the month as soon as it was in service during it, even briefly — taken out of service today still counts, created today does too. The number is therefore only final at the end of the month, and the current month is always a preview.',
    },
    'konto.monate': {
      title: 'Closed months are fixed',
      body: 'Once a month is over, its amount no longer changes — not even if you delete rooms later: before every deletion, the room count of the affected months is recorded.',
    },
    'konto.zahlungsweg': {
      title: 'Payment method and billing details',
      body: 'Card or SEPA direct debit are stored without a charge and collected in the monthly run; if you want to pay by invoice, transfer to the bank details on the invoice. Invoice recipient, address and — within the EU outside Germany — the VAT ID are required, because otherwise the tax can’t be calculated correctly.',
    },
    'konto.rechnungen': {
      title: 'Invoices arrive on the first of the month',
      body: 'For the previous month, electronically, payable within 14 days. Every invoice is available here as a PDF and as a view page. The provider keeps them even after an account is deleted — download the PDFs beforehand; afterwards the page is no longer accessible.',
    },
  },

  setup: {
    zimmer: {
      label: 'Rooms set up',
      todo: 'Set up rooms',
      done: { one: '{count} room in service', other: '{count} rooms in service' },
      open: 'Without rooms, there’s no check-in and no housekeeping board',
    },
    regeln: {
      label: 'Property rules checked',
      todo: 'Check the property rules',
      done: 'Time zone set — daily cleaning, check-out time and reports calculate correctly',
      open: 'Above all the time zone — check it once and save, even without changes',
    },
    gastzugang: {
      label: 'Guest access chosen',
      todo: 'Choose guest access',
      done: 'The method is set — every check-in records it with the stay',
      open: 'Fixed room QR with PIN or personal access per stay — confirm the choice once, even the default',
    },
    personal: {
      label: 'Housekeeper added',
      todo: 'Add a housekeeper',
      done: { one: 'One housekeeping account', other: '{count} housekeeping accounts' },
      open: 'Without an account, nobody gets onto the housekeeping board',
    },
    services: {
      label: 'Services set up',
      todo: 'Set up services',
      done: { one: 'One service in the builder', other: '{count} services in the builder' },
      open: 'Optional — without services, the guest portal shows only cleaning and “Do not disturb”',
    },
    checkin: {
      label: 'First check-in',
      todo: 'Try the first check-in',
      done: 'The flow has been run through once',
      open: 'Click a room, then “Check in” — the PIN appears on screen immediately',
    },
    zahlungsweg: {
      label: 'Payment method added',
      todo: 'Add a payment method',
      done: 'Billing details and payment method are set',
      open: 'The first month is free — you can add the method at any time',
    },
  },
} satisfies Shape<typeof de>
