import type { HilfeThemaText } from '@/lib/hilfe'

/**
 * Context help — topic texts (the “?” on every page). American English.
 * Structure, legend symbols and link targets mirror `de/help/topics.ts`
 * exactly; only the texts are translated.
 */
export const topics = {
  uebersicht: {
    title: 'The room overview',
    subtitle: 'Colors and symbols on the tiles, check-in and check-out, priority, history',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'The overview is the front desk screen. It shows all rooms grouped by floor, with each room’s status at a glance. Clicking a room opens a dialog with check-in, check-out, PIN, check-in sheet, departure date, priority, and history.',
          'It updates on its own as soon as a guest taps, a housekeeper starts, or someone changes something on a second screen. You never need to reload.',
        ],
      },
      {
        art: 'legende',
        titel: 'The bar above the number',
        hinweis: 'If more than one state applies, the one listed higher wins.',
        eintraege: [
          { zeichen: { art: 'balken', id: 'priority' } },
          { zeichen: { art: 'balken', id: 'checkout' } },
          { zeichen: { art: 'balken', id: 'wanted' } },
          { zeichen: { art: 'balken', id: 'dnd' } },
          { zeichen: { art: 'balken', id: 'occupied' } },
          { zeichen: { art: 'balken', id: 'ready' } },
          { zeichen: { art: 'balken', id: 'deactivated' } },
        ],
      },
      {
        art: 'legende',
        titel: 'The symbols on the tile',
        hinweis: 'Several symbols at once are normal — occupied, cleaning requested, and an open request, for example. The tile’s tooltip states everything in plain words.',
        eintraege: [
          { zeichen: { art: 'symbol', id: 'occupied' } },
          { zeichen: { art: 'symbol', id: 'departure' } },
          { zeichen: { art: 'symbol', id: 'dnd' } },
          { zeichen: { art: 'symbol', id: 'clean' } },
          { zeichen: { art: 'symbol', id: 'deferred' } },
          { zeichen: { art: 'symbol', id: 'declined' } },
          { zeichen: { art: 'symbol', id: 'routine' } },
          { zeichen: { art: 'symbol', id: 'checkout' } },
          { zeichen: { art: 'symbol', id: 'priority' } },
          { zeichen: { art: 'symbol', id: 'cleaning' } },
          { zeichen: { art: 'symbol', id: 'orders' } },
          { zeichen: { art: 'symbol', id: 'urgent' } },
          { zeichen: { art: 'symbol', id: 'deactivated' } },
        ],
      },
      {
        art: 'legende',
        titel: 'Border and floor header',
        eintraege: [
          { zeichen: { art: 'ring', id: 'urgent' } },
          { zeichen: { art: 'ring', id: 'priority' } },
          {
            zeichen: { art: 'icon', id: 'users', ton: 'neutral' },
            label: 'Name in the floor header',
            text: 'A housekeeper has checked in on this floor. You can see where work is happening without asking.',
          },
          {
            zeichen: { art: 'pille', text: '3', ton: 'attention' },
            label: 'Number on “Requests” in the navigation',
            text: 'That many requests are open. It flashes red as soon as one of them concerns an urgent service.',
          },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Why is a room orange after check-out instead of turning green right away?',
            antwort: 'RoSe only shows what has actually been reported: check-out says “cleaning open,” and only a housekeeper finishing — or your “Mark cleaning as done” in the dialog — says “ready.” RoSe doesn’t guess whether someone has been there in the meantime.',
          },
          {
            frage: 'I need to check a guest in, but the room isn’t ready. Is that possible?',
            antwort: 'Yes. The dialog warns you and still lets you check in. The same warning appears if a maintenance report is open (such as a reported defect) — at least you know before the guest is standing in the room.',
          },
          {
            frage: 'Where is the PIN, and what do I tell the guest?',
            antwort: 'After check-in, the PIN appears in large type in the dialog — reading it out is enough, together with the check-in sheet to print or send by email. If your property uses personal access per stay, there’s no PIN: the guest gets their own QR code or link, which expires at check-out.',
          },
          {
            frage: 'Do I have to enter a departure date at check-in?',
            antwort: 'No — the default is “open,” so check-in stays one click. If you enter it, daily cleaning is skipped on the day of departure and the tile shows the suitcase. You can add or extend it at any time in the dialog. An outdated date (yesterday) counts as unknown, so a forgotten update doesn’t switch off daily cleaning permanently.',
          },
          {
            frage: 'When do I set a priority?',
            antwort: 'For complaints and special cases, set a priority manually; it is never set automatically. The room moves up on the housekeeping board, and the floor is marked with a purple warning light. The priority clears automatically when cleaning is completed.',
          },
          {
            frage: 'What exactly happens at check-out?',
            antwort: 'PIN, link, and the guest’s session stop working immediately, and the room goes to “cleaning open.” Open service requests of this stay are closed as “not provided” — check off what was actually provided in the same box beforehand. Maintenance reports (defects) stay open. If the guest ordered something paid, the total appears in the dialog before you confirm.',
          },
          {
            frage: 'Where can I find the statement later?',
            antwort: 'In the room’s history, the “Check-out” entry links to the statement. This is not an invoice: it contains no guest name, invoice number, or tax breakdown. It shows the amount to be collected.',
          },
          {
            frage: 'What’s in the history?',
            antwort: 'The room’s last 30 days: guest taps (always just “Guest,” never an identity), cleanings with names, check-in and check-out with the person at the desk, service requests. “Cleaning not finished (time limit)” appears there too — the history is the work record and the tool for complaints.',
          },
          {
            frage: 'Why does the tile show “Cleaning from 11:00” and not appear on the board?',
            antwort: 'Cleaning becomes available at that time. Either the guest selected “not before” in the portal or asked the housekeeper at the door to come back later. The room’s history shows which. Until then, the room isn’t available for cleaning on either board; it opens automatically at the specified time. How long guests may postpone in the portal is set under Property & rules.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Requests',
            hinweis: 'What’s behind the bell and the number',
            ziel: { art: 'thema', id: 'anfragen' },
          },
          {
            label: 'Room signs & check-in sheets',
            hinweis: 'The check-in sheet at check-in',
            ziel: { art: 'thema', id: 'aushang' },
          },
          {
            label: 'What the guest sees',
            hinweis: 'The guest portal replica',
            ziel: { art: 'thema', id: 'gast' },
          },
        ],
      },
    ],
  },
  anfragen: {
    title: 'Requests',
    subtitle: 'The front desk board: open, done, not provided — and what that means for the statement',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Requests from the guest portal arrive here, oldest first. A request is open or closed — there’s no “in progress” and no assignment to a person; the board is the same for everyone at the desk.',
          'New requests appear on their own, without reloading.',
        ],
      },
      {
        art: 'legende',
        titel: 'Symbols on the board',
        eintraege: [
          {
            zeichen: { art: 'pille', text: 'urgent', ton: 'critical', icon: 'siren' },
            label: 'Urgent',
            text: 'The service is marked “urgent” in the builder. The request has a red flashing border, the room tile a flashing bell, and the number in the navigation flashes.',
          },
          {
            zeichen: { art: 'pille', text: 'not provided', ton: 'outline' },
            label: 'Not provided',
            text: 'The request was still open at check-out and was closed without anyone completing it. It stays visible and appears without an amount on the statement — otherwise something the guest may still bring up would disappear.',
          },
          {
            zeichen: { art: 'pille', text: 'Done', ton: 'positive', icon: 'check' },
            label: 'Done',
            text: 'The service was provided. If the request carries a price, it appears on the statement at check-out. The time and your name are recorded.',
          },
          {
            zeichen: { art: 'symbol', id: 'orders' },
            text: 'This is what an open request looks like on the room tile in the overview.',
          },
          { zeichen: { art: 'symbol', id: 'urgent' } },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'I pressed “Done” by mistake. Can I undo it?',
            antwort: 'No — there’s deliberately no way back; the checkmark is an event with a time and a name. The request then appears with its amount on the statement; clear up the item with the guest at check-out.',
          },
          {
            frage: 'Why is a request gone after check-out?',
            antwort: 'It isn’t gone, but closed as “not provided” and listed under “Recently closed.” Requests belong to the stay, not the room — otherwise tomorrow the board would show a request for an empty room.',
          },
          {
            frage: 'What’s a “maintenance report,” and why does it stay open?',
            antwort: 'A flag on the service in the builder, meant for defects: such requests belong to the room, not the stay. They survive check-out, appear on no statement (not even with a price), and the next check-in warns about them — a broken faucet doesn’t stop existing because the guest leaves.',
          },
          {
            frage: 'Can I assign a request to someone on the team?',
            antwort: 'No, deliberately not. RoSe has no staff scheduling; whoever is at the desk sees the same board. Whoever completes something checks it off — a front desk board doesn’t need more coordination than that.',
          },
          {
            frage: 'How long do closed requests stay visible?',
            antwort: 'The 20 most recent requests appear collapsed below the open requests. Beyond that, every request remains available in the room’s history for 30 days and, if it carried a price, on the stay statement.',
          },
          {
            frage: 'The guest says they ordered, but nothing is here.',
            antwort: 'Check the room’s history to see whether a request arrived. The most common causes: the guest canceled before sending, or used a tile under “Useful links,” such as a food delivery service — that leads to an outside site and doesn’t create a request.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Service builder',
            hinweis: 'The builder: prices, “urgent,” “maintenance report”',
            ziel: { art: 'thema', id: 'services' },
          },
          {
            label: 'Room overview',
            hinweis: 'Checking off in the room dialog too',
            ziel: { art: 'thema', id: 'uebersicht' },
          },
        ],
      },
    ],
  },
  zimmer: {
    title: 'Rooms & floors',
    subtitle: 'Create, correct, take out of service, delete — and what goes with it each time',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Rooms are created floor by floor: numbers as a list (“201, 202, 205”) or as a range (“101-110”), optionally with the floor number as a prefix. Below the form you see beforehand what will be created — nothing is written until you click.',
          'Rooms, floors, and buildings open the same dialog with the same three options: edit, take out of service, delete.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'What is the building for?',
            antwort: 'Only for properties with really separate wings. It affects uniqueness: room numbers must be unique per building, so “101” may exist in the main building and the annex. Without wings, leave it empty.',
          },
          {
            frage: 'When to use “Prefix the floor number”?',
            antwort: 'When every floor uses the same range of numbers: floor 2 and “05” become “205”. Without the checkbox, the numbers collide from the second floor on — the page warns you beforehand.',
          },
          {
            frage: 'A number is wrong. Delete and create again?',
            antwort: 'No — edit it. Number, floor, and building can be changed without losing history, stays, or work records; everything belongs to the room, not its number. Deleting is for rooms created by mistake without history.',
          },
          {
            frage: 'Out of service or delete?',
            antwort: 'For renovations or temporary closures, we recommend marking the room “Out of service”: it can’t be checked into, doesn’t appear on the housekeeping board or room signs, and all its history is retained. One click restores it to service, and the room number remains reserved. Deleting a room is permanent and frees the room number.',
          },
          {
            frage: 'What goes with it when deleting?',
            antwort: 'The dialog shows the figures beforehand: stays, service requests with their total, history entries, and the room’s signs stop working. Housekeeping entries survive and only lose the room reference — the reports stay complete. An occupied room can’t be deleted; a section with history requires typing its name.',
          },
          {
            frage: 'Does a room out of service count for billing?',
            antwort: 'For the current month yes, if it was in service during it, even briefly; from the next full month out of service, no longer. Before every deletion, the room counts of closed months are recorded — so a deleted room is never missing retroactively from any bill.',
          },
          {
            frage: 'New rooms, but no room sign?',
            antwort: 'Only with the fixed QR code per room: the sign is created per room. After creating rooms, go to the room signs once (at the bottom of the Guest access page) — the button there creates the missing codes in one go.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Room signs & check-in sheets',
            hinweis: 'Create codes for new rooms',
            ziel: { art: 'thema', id: 'aushang' },
          },
          {
            label: 'Plan & billing',
            hinweis: 'How rooms are counted',
            ziel: { art: 'thema', id: 'konto' },
          },
        ],
      },
    ],
  },
  regeln: {
    title: 'Property & rules',
    subtitle: 'Time zone, daily cleaning, check-out time, postponing, time window, PIN, time limit, address, logo, review, currency',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'The rules apply to everything from the moment you save. Current stays, requests already set, and PINs already issued continue unchanged — nothing is converted retroactively.',
          'Nothing is saved automatically. As soon as something has changed, a bar “Unsaved changes” with Save and Discard appears at the bottom of the screen — if you leave the page before saving, you’ll be asked.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Why is the time zone so important?',
            antwort: 'All times on this page apply in it. With the wrong time zone, daily cleaning becomes due at the wrong hour, the time window is off, “cleaned today” resets at the wrong hour at night, and the day boundaries of the reports are wrong.',
          },
          {
            frage: 'Clean occupied rooms daily — yes or no?',
            antwort: 'Off by default: rooms are cleaned at the guest’s request and after check-out. That saves water, detergent, and working time and is part of the sustainability promise. When it’s on, occupied rooms appear on the board on their own from the day after arrival at the chosen time — except with “Do not disturb,” “No cleaning today,” on the day of departure, and if the room has already been cleaned today. If the guest has set a request themselves, their request applies.',
          },
          {
            frage: 'What does “Check-out until” do?',
            antwort: 'As long as RoSe doesn’t know whether the guest leaves today, daily cleaning isn’t due before this time. That way no departure room is cleaned before check-out and then again. If a departure date is entered for the stay, the normal time applies on the days before, and daily cleaning is skipped on the day of departure. The check-in sheet states the time that applies without a departure date.',
          },
          {
            frage: 'What is “Check-in from” for?',
            antwort: 'Departure rooms should be ready by then. The housekeeping board compares the work in open departures with the time until check-in and the housekeepers on shift. The tighter it gets, the more strongly it recommends floors with departures and even suggests switching in the middle of a floor. A priority set by the front desk always comes first.',
          },
          {
            frage: '“Not before” — how do I choose the limit?',
            antwort: 'The guest wants cleaning, but not before a certain time. They can choose full hours between now and your limit. Set it so that cleaning still falls within the shift afterwards: housekeeping until 15:00 means a limit of 13:00. You can also switch it off — then the portal offers no time and the request applies immediately.',
          },
          {
            frage: 'Why a time window for cleaning requests?',
            antwort: 'Outside the window, the guest can’t send a request and sees your cleaning hours. It only affects the request: “Do not disturb” and withdrawing remain possible at any time, and requests already set continue. A window across midnight (22:00–06:00) is understood correctly.',
          },
          {
            frage: 'What happens with a forgotten cleaning?',
            antwort: 'If a started cleaning isn’t finished, the room reopens on its own after the time limit, and the history shows “Cleaning not finished (time limit, name).” The limit should be well above the longest real cleaning — default 90 minutes.',
          },
          {
            frage: 'Changing the PIN length — what happens to current stays?',
            antwort: 'Nothing. The length only applies to newly created PINs; every current stay keeps its own. The default is six digits; shorter is more convenient, longer more secure — plus the lock after five failed attempts.',
          },
          {
            frage: 'Our property doesn’t charge in euros — is that possible?',
            antwort: 'Yes. Under “Currency of service prices” you choose the currency in which you enter prices in the service builder; guests, the front desk, and the check-out statement then show it that way. Every request remembers its currency, so old requests stay as they were. Existing prices aren’t converted when you switch. You can only switch while no guest is checked in.',
          },
          {
            frage: 'Where do guests see the review link?',
            antwort: 'In two places: from the second day of the stay as a quiet line at the very bottom of the guest portal, and after check-out on a thank-you page that appears for a week if the guest opens the portal again. The button names the platform if it can be derived from the link (Google, Tripadvisor, Booking.com, HolidayCheck). RoSe deliberately doesn’t ask about satisfaction first: sending only satisfied guests to review is prohibited by Google.',
          },
          {
            frage: 'Can I change the property’s address?',
            antwort: 'Yes, the short name in the address can be changed. Printed QR codes stay valid because they carry their own key. Only those who typed the address or have an older check-in sheet with the written-out address won’t get through — the sign-in pages for guests and housekeeping are under the new name.',
          },
          {
            frage: 'What does “Housekeeping activities: team only” change?',
            antwort: 'Reports then show only the property total (sum over the shifts), no “per housekeeper” table and no daily log; the room history shows “Housekeeping team” instead of a name. Entries lose their person when the shift ends, after 24 hours at the latest — when you switch, all existing ones too. The setting can be switched back, but the names of anonymized entries can’t be restored. What remains: when each room was cleaned, how many shifts ran, and the live displays for coordination (who is on which floor right now). If only one housekeeper is on shift, the attribution is obvious anyway — no setting can change that.',
          },
          {
            frage: 'What are the requirements for the logo?',
            antwort: 'PNG, JPG, or SVG up to 1 MB. It appears on room sign and check-in sheet at 55 × 16 mm max.; below about 400 px width it looks blurry there. The preview is on a white background — otherwise a light logo meant for dark backgrounds would be invisible on paper. Without a logo, the sheets show the property name.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Guest access',
            hinweis: 'PIN or personal link, languages of the sheets',
            ziel: { art: 'thema', id: 'gastzugang' },
          },
          {
            label: 'What the guest sees',
            hinweis: 'How postponing and time window work in the portal',
            ziel: { art: 'thema', id: 'gast' },
          },
        ],
      },
    ],
  },
  gastzugang: {
    title: 'Guest access',
    subtitle: 'Fixed room QR with PIN or personal access per stay, languages of the sheets, room signs',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'There are two ways to access the guest portal, chosen for each property. With a fixed room QR code, a code is printed once and placed in the room, and each stay gets its own PIN. With personal access, each stay gets its own code or link, with no PIN; it expires at check-out.',
          'Method and languages only take effect when saved. If something has changed, a bar “Unsaved changes” at the bottom of the screen saves or discards both sections together. Only confirming the default is done with the button below the two cards.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Which method suits us?',
            antwort: 'Choose fixed QR code + PIN if you can display a sign in each room and want two-factor access (the code in the room and the PIN from the front desk). Choose personal access if signs aren’t practical or desired. It’s more convenient for guests, but anyone who sees the sheet can access the portal for that stay. The page compares both in detail.',
          },
          {
            frage: 'What happens to current stays if I switch?',
            antwort: 'Nothing. The method is recorded with the stay at check-in. PINs and links already issued keep working until check-out; only the next check-in follows the new method. There’s no switch date and nothing to convert.',
          },
          {
            frage: 'Why is there no PIN as a fallback with personal access?',
            antwort: 'A PIN that nobody learns would be a second way in without any benefit — and one more point of attack. The stay has exactly the access the guest holds in their hand.',
          },
          {
            frage: 'The guest would like the access by email.',
            antwort: 'In the room dialog, the check-in sheet can be sent by email. The address isn’t stored; the stay stays anonymous. The email contains the link, not a QR image — many email programs don’t display embedded images. Below the button you see whether the email was delivered or rejected — and why.',
          },
          {
            frage: 'Why only one or two languages on paper?',
            antwort: 'The sheets explain the portal with pictures of its buttons; text is in a main language and optionally a second one. More languages help little: for every one on the sheet, many others are missing — and the sheet turns into a form. Those who read neither get into the portal via pictures and QR code — there they see their language if the portal offers it, otherwise they translate with their phone. The first language is the property’s fallback language — every guest whose phone language the portal doesn’t offer sees it in the guest portal too — and also the language of the access email.',
          },
          {
            frage: 'Where did the room signs go?',
            antwort: 'They’re at the bottom of this page — only with the PIN method. With personal access, they would lead to a PIN entry that new guests can’t use at all; with the PIN method, the front desk reaches them via its tile in the settings hub.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Room signs & check-in sheets',
            hinweis: 'Formats, validity, printing',
            ziel: { art: 'thema', id: 'aushang' },
          },
          {
            label: 'What the guest sees',
            hinweis: 'The portal replica',
            ziel: { art: 'thema', id: 'gast' },
          },
        ],
      },
    ],
  },
  aushang: {
    title: 'Room signs & check-in sheets',
    subtitle: 'Room sign, check-in sheet, access card: where they come from, how long they’re valid, what invalidates them',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Three types of printouts are created in different places: a room sign for each room (under Guest access or “Room signs”), a check-in sheet for each stay (in the room dialog after check-in), and an access card for each housekeeper (under Staff).',
          'Room sign and check-in sheet are the same sheet in two formats — A4 or four compact cards per page — and differ only in the access block: fixed code with “You receive your PIN at check-in” versus the access for this stay.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'A4 or compact?',
            antwort: 'A4 for frames, stands, and folders; compact (92 × 130 mm, four per page to cut apart) for door signs and the desk. The choice depends on the occasion and isn’t saved. The QR code is sized for reading distance: 55 mm on A4, 42 mm compact.',
          },
          {
            frage: 'Why is there no cleaning time on the room sign?',
            antwort: 'The room sign stays up permanently. A printed rule silently goes out of date as soon as the property changes its cleaning rules — then 200 signs are wrong. Rule and times appear only on the check-in sheet, which is created fresh at every check-in.',
          },
          {
            frage: 'The printout comes out without colors.',
            antwort: 'Browsers don’t print background colors by default. The sheets are designed so that color appears only in lines and light shading with dark text, so they remain legible in grayscale. To print in color, enable “Background graphics” in the print dialog.',
          },
          {
            frage: 'A room sign has gone missing.',
            antwort: '“Renew code” creates a new code for that room, invalidating the old room sign. Only the owner and managers can do this, and it affects just one room. Print the new sign afterward.',
          },
          {
            frage: 'The access email ends up in the guest’s spam folder.',
            antwort: 'New senders end up in spam more often at first with some email providers — that’s not the property’s fault. Ask the guest to look there. If an address is rejected, the reason appears below the button; a typo in the address is the most common one. Printing is always the way out.',
          },
          {
            frage: 'An access card is lost.',
            antwort: 'Issue a new one under Staff: new PIN and new code in one step, and the old card stops working. The card survives “End access” and works again after reactivation.',
          },
          {
            frage: 'Why can’t I find the room signs?',
            antwort: 'Your property uses personal access per stay. Then there’s no fixed room code, and the guest receives their sheet at check-in from the room dialog.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Guest access',
            hinweis: 'Method and languages of the sheets',
            ziel: { art: 'thema', id: 'gastzugang' },
          },
          {
            label: 'Staff',
            hinweis: 'Issue access cards',
            ziel: { art: 'thema', id: 'personal' },
          },
        ],
      },
    ],
  },
  personal: {
    title: 'Staff',
    subtitle: 'Housekeeping, front desk, managers — accounts, invitations, access cards, ending, and deleting',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Three kinds of staff in one place. Housekeepers get a username and PIN (no email) and an access card; front desk and managers are invited by email and set their own password. All three follow the same pattern: end access (reversible) or delete permanently (with the consequences shown in figures).',
        ],
      },
      {
        art: 'legende',
        titel: 'Buttons on the row',
        eintraege: [
          {
            zeichen: { art: 'icon', id: 'printer', ton: 'neutral' },
            label: 'Print card',
            text: 'The housekeeper’s access card with QR code and credentials — scan once, signed in.',
          },
          {
            zeichen: { art: 'icon', id: 'idcard', ton: 'neutral' },
            label: 'New card',
            text: 'New PIN and new QR code in one step; the old card stops working immediately. The way to go if it’s lost or the PIN is forgotten.',
          },
          {
            zeichen: { art: 'icon', id: 'pencil', ton: 'neutral' },
            label: 'Edit',
            text: 'Display name; for housekeeping also the username.',
          },
          {
            zeichen: { art: 'icon', id: 'userminus', ton: 'caution' },
            label: 'End access',
            text: 'Sign-in blocked immediately, an open session ends too. Nothing is lost; “Reactivate” undoes it.',
          },
          {
            zeichen: { art: 'icon', id: 'trash', ton: 'critical' },
            label: 'Delete permanently',
            text: 'The dialog shows beforehand what goes with it. For housekeepers with history, the username has to be typed.',
          },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'The housekeeper is turned away with the correct PIN.',
            antwort: 'Almost always, the display name is in the “Username” field. Sign-in uses the short username shown on the access card under “Credentials.” Second cause: the access was ended — then the sign-in page says so.',
          },
          {
            frage: 'Forgot the PIN?',
            antwort: 'Issue a new access card: this creates a new PIN and a new QR code in one step; the old card stops working. There’s no way to “look up” a PIN.',
          },
          {
            frage: 'The invitation didn’t arrive.',
            antwort: 'Below the send button you see the delivery status: handed over, delivered, or rejected — with the receiving server’s reason. Usually it’s a typo in the address. After a rejection, the address can be unblocked and the email resent; and there’s “Show invitation link” to hand over the link via messenger or on paper. There’s a one-minute wait between two emails to the same person.',
          },
          {
            frage: 'End access or delete?',
            antwort: 'End, almost always. The work record stays complete, the reports keep showing the person, and coming back is one click. For housekeepers, deleting takes the entries with it — hence the typed username as a safeguard. For front desk and managers, the sign-in account remains as soon as records are attached to it; the dialog says so beforehand.',
          },
          {
            frage: 'What can the front desk do, and what can a manager do?',
            antwort: 'Front desk: check-in and check-out, priorities, requests, printing check-in sheets, cards, and room signs, own password. Not: settings, rooms, services, staff, “Renew code.” Manager: the same rights as the owner within the property, but no access to the account and billing. Only the owner appoints managers.',
          },
          {
            frage: 'One person should look after several properties.',
            antwort: 'Add them per property. From the second time on, you choose them from the account’s existing managers, without a new account. “End access” only affects the property in question.',
          },
          {
            frage: 'Why don’t housekeepers need an email address?',
            antwort: 'They sign in with username and PIN or with their card; an inbox would be a hurdle without benefit. The username is only unique in this property — the same one may exist again in another property.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'The housekeeping board',
            hinweis: 'What the housekeeper sees after signing in',
            ziel: { art: 'thema', id: 'reinigung' },
          },
          {
            label: 'Reports',
            hinweis: 'Work times from the entries',
            ziel: { art: 'thema', id: 'auswertung' },
          },
        ],
      },
    ],
  },
  services: {
    title: 'Service builder',
    subtitle: 'The service builder: services, options, prices, “urgent,” “maintenance report”',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'A service takes only a few details: it consists of a name (“Laundry service”) and the options the guest chooses from, each optionally with a price. Two flags control the flow, nothing else — no categories, no responsibilities.',
        ],
      },
      {
        art: 'legende',
        titel: 'The two flags',
        eintraege: [
          {
            zeichen: { art: 'pille', text: 'urgent', ton: 'critical', icon: 'siren' },
            label: 'Urgent — how loud',
            text: 'Requests for it flash red: on the room tile, on the “Requests” page and as a number in the navigation. For anything that can’t wait.',
          },
          {
            zeichen: { art: 'pille', text: 'Maintenance report', ton: 'neutral' },
            label: 'Maintenance report — who it belongs to',
            text: 'The request belongs to the room, not the stay: it stays open after check-out, appears on no statement, and the next check-in warns about it. For defects — maintenance is the standard case.',
          },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'What does a price do?',
            antwort: 'The guest sees it when requesting, and at check-out the service provided appears with it on the statement. Without a price, an option appears on no statement — what costs nothing doesn’t need checking. RoSe doesn’t book or charge anything; it adds up.',
          },
          {
            frage: 'How do guests get the services in their language?',
            antwort: 'You create each service in your home language. Below the service, language chips show which guest portal languages it’s already translated into — tapping a language opens the fields for name, description, and options, with the source text below each. Feel free to translate with a tool of your choice. If a translation is missing, the guest sees the source text, never an empty field. The front desk always sees requests in the home language. The example services are already translated.',
          },
          {
            frage: 'I rename a service. Does that change old requests?',
            antwort: 'No. Name, options, and prices are frozen at the time of the request; old requests and statements stay as they were. The “maintenance report” flag, on the other hand, also affects open requests immediately — it decides behavior, not the content of a record.',
          },
          {
            frage: 'Archive or delete?',
            antwort: 'Archive. The service disappears from the portal, and old requests are kept in full. The example services are perfectly normal services and can be archived the same way.',
          },
          {
            frage: 'Can a service allow several options at once?',
            antwort: 'Yes — the guest chooses as many options as they like and can add a note. A request is one service with the chosen options.',
          },
          {
            frage: 'Does the guest also see services without options?',
            antwort: 'Yes, then they choose the service as a whole — ordering it or reporting, for example with maintenance, which needs no options.',
          },
          {
            frage: 'What’s a “link”?',
            antwort: 'A tile in the guest portal that links to an external website, such as a tipping app for the housekeeping team, a food delivery service, or a taxi service. A link doesn’t create a request, so nothing appears on the Requests page or the stay statement. Templates prefill the form; adjust the address to your account or city. The portal only links to the external service; the provider is responsible for its content.',
          },
          {
            frage: 'Can the guest tip the housekeeper personally?',
            antwort: 'Not through RoSe. The guest portal shows no names, and a link applies to the whole property — the tipping apps distribute within the team. Whether tips via an app remain tax-free depends on the app’s payment method, not on RoSe.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Requests',
            hinweis: 'What happens to the requests',
            ziel: { art: 'thema', id: 'anfragen' },
          },
          {
            label: 'What the guest sees',
            hinweis: 'The request from the guest’s point of view',
            ziel: { art: 'thema', id: 'gast' },
          },
        ],
      },
    ],
  },
  reinigung: {
    title: 'The housekeeping board',
    subtitle: 'Colors, states, sliders, floors — what the housekeeper sees on their phone and why',
    bloecke: [
      {
        art: 'legende',
        titel: 'The bar above the number',
        hinweis: 'There’s no green “ready” on the housekeeping board — green means “in progress” there.',
        eintraege: [
          { zeichen: { art: 'balken', id: 'priority' } },
          { zeichen: { art: 'balken', id: 'working' } },
          { zeichen: { art: 'balken', id: 'checkout' } },
          { zeichen: { art: 'balken', id: 'wanted' } },
          { zeichen: { art: 'balken', id: 'neutral' } },
        ],
      },
      {
        art: 'legende',
        titel: 'The symbols on the tile',
        eintraege: [
          { zeichen: { art: 'symbol', id: 'occupied' } },
          { zeichen: { art: 'symbol', id: 'departure' } },
          { zeichen: { art: 'symbol', id: 'dnd' } },
          { zeichen: { art: 'symbol', id: 'clean' } },
          { zeichen: { art: 'symbol', id: 'deferred' } },
          { zeichen: { art: 'symbol', id: 'declined' } },
          { zeichen: { art: 'symbol', id: 'routine' } },
          { zeichen: { art: 'symbol', id: 'checkout' } },
          { zeichen: { art: 'symbol', id: 'priority' } },
          { zeichen: { art: 'symbol', id: 'cleaning' } },
        ],
      },
      {
        art: 'legende',
        titel: 'Status bar and floors',
        eintraege: [
          {
            zeichen: { art: 'pille', text: 'On shift since 07:02', ton: 'positive' },
            label: 'On shift',
            text: 'The shift is running; cleanings can be started.',
          },
          {
            zeichen: { art: 'pille', text: 'Break', ton: 'caution' },
            label: 'Break',
            text: 'A period within the shift; cleanings aren’t possible meanwhile. Ending the break continues the shift.',
          },
          {
            zeichen: { art: 'pille', text: 'Other cleaning', ton: 'attention' },
            label: 'Other cleaning',
            text: 'Hallways, lobby, breakfast room — work without a room, as a period. Starting a room cleaning ends it on its own.',
          },
          {
            zeichen: { art: 'pille', text: 'Not on shift', ton: 'neutral' },
            label: 'Not on shift',
            text: 'Before the shift starts and after it ends. The board shows nothing to do.',
          },
          {
            zeichen: { art: 'pille', text: 'Up next', ton: 'action', icon: 'target', blink: true },
            label: 'Up next',
            text: 'A recommendation, not an assignment: first choose a floor with an open priority; otherwise, choose the floor with the highest open urgency divided by the number of housekeepers there plus one. Departures carry more weight as check-in approaches. If there’s a tie, the lower floor is suggested to avoid the recommendation jumping back and forth.',
          },
          {
            zeichen: { art: 'pille', text: 'Prio', ton: 'accent', icon: 'flag' },
            label: 'Prio on the floor',
            text: 'A prioritized cleaning is waiting on the floor; the row flashes purple.',
          },
          {
            zeichen: { art: 'pille', text: 'Priority open', ton: 'accent', icon: 'siren', blink: true },
            label: 'Warning light in the status bar',
            text: 'A priority is open on another floor. Display only, not a button — you switch floors with the slider.',
          },
          {
            zeichen: { art: 'icon', id: 'users', ton: 'neutral' },
            label: 'Names on the floor',
            text: 'Who from the team is checked in there. The name also appears in the front desk overview.',
          },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'The slider doesn’t trigger.',
            antwort: 'The swipe has to start at the handle and cover almost the whole track (97%). A tap anywhere on the track or a short jerk does nothing — on purpose: a phone in an apron pocket shouldn’t start a cleaning. “Leave floor” goes from right to left.',
          },
          {
            frage: 'Why is a room grayed out?',
            antwort: 'It isn’t blocked, it just has no task: vacant, occupied without a request, “Do not disturb,” no cleaning wanted today (leaf), or a cleaning that applies only later (“from 11:00”). It stays visible so the floor is complete. At the set time, a postponed request switches to open on its own.',
          },
          {
            frage: 'The guest is in the room and doesn’t want cleaning right now — what does the housekeeper do?',
            antwort: 'Tap the room without starting: “In 30 min,” “In 1 hr” or “Not today.” “In 30 min” and “In 1 hr” take the room off the board until that time — for the whole team, nobody knocks again in between —, afterwards it’s open again on its own. “Not today” settles the room for today without counting as a cleaning. If the guest still wants cleaning, they tap it in the portal; then it’s open again.',
          },
          {
            frage: 'Finishing was forgotten.',
            antwort: 'After the time limit set by the property (default 90 minutes), the room reopens on its own; the history shows “Cleaning not finished (time limit, name).” The cleaning then doesn’t count as done in the reports — so the finish slider is always worth it.',
          },
          {
            frage: 'What does “Do not disturb” lifted 9:40 mean?',
            antwort: 'The guest switched off “Do not disturb” today at 9:40, and the room hasn’t been cleaned since. Usually that means: they just left. The board therefore counts the room like a cleaning request — the window may close again if the guest comes back and hangs the sign up again, for example after lunch.',
          },
          {
            frage: 'The board suggests switching floors — why?',
            antwort: 'After each room, the board recalculates. It suggests switching floors if a room with an open priority is elsewhere, or if another floor’s workload is clearly higher than the current floor’s — usually because departures are waiting there and check-in is approaching. This is rare on quiet days. The housekeeper decides whether to switch; the switch control is a slider, and anyone who stays on the current floor can simply continue working.',
          },
          {
            frage: 'Why choose a floor first?',
            antwort: 'Choosing a floor means checking in: the team and front desk see who is working where, and the “Up next” recommendation takes it into account. A mistap shouldn’t throw anyone off the floor, which is why the way back is a slider.',
          },
          {
            frage: 'Can a break and other cleaning run at the same time?',
            antwort: 'No — both are periods within the shift and can’t overlap with anything. Starting a break ends ongoing other cleaning, and ending the shift ends both. All changes are on the “Status” page, not on the board.',
          },
          {
            frage: 'Sign-in rejected although the PIN is correct.',
            antwort: 'The field contains the display name instead of the short username — that’s on the access card under “Credentials.” Or the access was ended; then the page says so. Scanning the card is the way without typing.',
          },
          {
            frage: 'How does the front desk know what work was done?',
            antwort: 'From the entries: shift start and end, breaks, other cleaning, start and finish per room. From these, the reports calculate work and cleaning times; the room history shows every cleaning with a name — in team mode as “Housekeeping team.”',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Staff',
            hinweis: 'Accounts, access cards, PIN',
            ziel: { art: 'thema', id: 'personal' },
          },
          {
            label: 'Reports',
            hinweis: 'What becomes of the entries',
            ziel: { art: 'thema', id: 'auswertung' },
          },
          {
            label: 'Property & rules',
            hinweis: 'Daily cleaning, postponing limit, time limit',
            ziel: { art: 'thema', id: 'regeln' },
          },
        ],
      },
    ],
  },
  gast: {
    title: 'What the guest sees',
    subtitle: 'Access, PIN lock, cleaning and “not before,” Do not disturb, requests, check-out',
    bloecke: [
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'How does the guest get into the portal?',
            antwort: 'With the PIN method, in two equivalent ways: scan the room QR and enter the PIN, or open the property’s address and enter room number plus PIN (both are on the check-in sheet). With personal access, they open their QR code or link and are signed in without a PIN. After that, they stay signed in on their device.',
          },
          {
            frage: 'The guest has locked themselves out.',
            antwort: 'After five wrong PINs, the stay is locked for 15 minutes — even for the correct PIN. This applies only to this room, not to the property. After that it works again; the correct PIN is in the room dialog. Checking out and in again isn’t a good way out: check-out closes open requests and sets the room to “cleaning open.”',
          },
          {
            frage: 'What does “Clean my room” do?',
            antwort: 'The room immediately appears as open on the housekeeping board and in your overview. There’s no appointment; housekeeping will get to it as part of their rounds. Tapping again withdraws the request. With “not before,” the guest selects a full hour, and the room won’t be available for cleaning until then.',
          },
          {
            frage: 'What does the status card above the buttons say?',
            antwort: 'Where the guest stands with cleaning, from the same data as your boards: “planned” (request, priority, or daily cleaning due), “from HH:MM” (guest postponed or daily cleaning not yet due), “being cleaned right now,” “cleaned today at HH:MM” or “nothing planned today” — with the reason (day of arrival, day of departure, property cleans on request only). “Cleaned” only counts from this guest’s check-in; a housekeeper’s name never appears. The card updates every 15 seconds.',
          },
          {
            frage: 'Why can’t the guest request cleaning right now?',
            antwort: 'The property has set a time window; outside it, the guest sees the cleaning hours instead of the button. “Do not disturb” and withdrawing always remain possible.',
          },
          {
            frage: 'What does “Do not disturb” do?',
            antwort: 'Nobody knocks, daily cleaning is skipped, and the room is grayed out on the board — until the guest switches it off. Only the guest can do that; the front desk sees it but doesn’t override it.',
          },
          {
            frage: 'Does the guest pay in the portal?',
            antwort: 'No. They see prices for information and order with one tap; the request lands with you under “Requests.” At check-out, RoSe shows the total of what was provided — payment is collected at the desk as before.',
          },
          {
            frage: 'What language is the portal in?',
            antwort: 'In the language of the guest’s phone, if the portal offers it — currently German and English; the guest can switch at the top right. If their language is missing, the property’s fallback language applies (Guest access → Languages). The portal shows the services in the translation you maintained in the service builder, otherwise in the source text. For all other languages, the printed sheets explain the buttons with pictures, and the guest can translate the screen with their phone.',
          },
          {
            frage: 'What does RoSe know about the guest?',
            antwort: 'Nothing. A stay is a room, a period, a PIN, or a link — no name, no address. An address entered for the access email isn’t stored. At check-out, PIN, link, and sign-in expire.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Guest access',
            hinweis: 'PIN or personal link',
            ziel: { art: 'thema', id: 'gastzugang' },
          },
          {
            label: 'Property & rules',
            hinweis: 'Time window, postponing limit, PIN length',
            ziel: { art: 'thema', id: 'regeln' },
          },
        ],
      },
    ],
  },
  auswertung: {
    title: 'Reports',
    subtitle: 'Work, break, and cleaning times from the entries, irregularities, demand by hour',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Everything here is calculated, not stored. It’s based on housekeepers’ entries (shift start and end, breaks, other cleaning, and start and finish times for each room), plus guest taps and check-outs. The selected period appears in the web address, so you can share or print a snapshot.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'What do net work time and remaining time mean?',
            antwort: 'Net work time = shift time minus breaks. Remaining time = net work time minus room cleaning and other cleaning — in other words, time spent walking, setting up, or waiting. A high remaining-time figure usually points to long walks or idle time between requests.',
          },
          {
            frage: 'What counts as “flagged”?',
            antwort: 'Shifts over 16 hours (forgotten end of shift), breaks over four hours, cleanings without a finish or longer than the property’s time limit. They’re counted but not included — otherwise an open shift would drag the work time along for days.',
          },
          {
            frage: 'Why do former housekeepers still appear in the table?',
            antwort: 'Because work records remain after someone leaves. Anyone whose access has ended remains visible for the period they worked. Only permanent deletion removes their entries, which is why deletion requires typing the name.',
          },
          {
            frage: 'Does the front desk’s “Mark cleaning as done” count?',
            antwort: 'It creates a cleaning record so the daily cleaning counts as completed. However, the “Per housekeeper” table includes only housekeepers. If front desk staff regularly mark cleanings as complete, those cleanings won’t be attributed to any housekeeper in the reports.',
          },
          {
            frage: 'Why is the “per housekeeper” table missing?',
            antwort: 'Under Property & rules, the property has selected “Housekeeping activities: team only.” Reports then show only the property-wide total across shifts, and entries are no longer linked to an individual after the shift ends. Switching back applies only going forward; anonymized entries stay anonymous.',
          },
          {
            frage: 'What is the “Demand” section for?',
            antwort: 'It shows per hour and weekday when guests want cleaning and when they check out — and how many housekeepers were on shift then. “Requests with nobody on shift” is the planning hint. That’s why RoSe doesn’t ask guests for preferred times: the data is already there.',
          },
          {
            frage: 'In which time are the hours calculated?',
            antwort: 'In the property’s time zone (Property & rules). If it’s wrong, day boundaries and hours shift by the time difference.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'The housekeeping board',
            hinweis: 'Where the entries come from',
            ziel: { art: 'thema', id: 'reinigung' },
          },
          {
            label: 'Staff',
            hinweis: 'End access instead of deleting',
            ziel: { art: 'thema', id: 'personal' },
          },
        ],
      },
    ],
  },
  zugang: {
    title: 'My account',
    subtitle: 'Sign-in address, display name, and password of the signed-in person',
    bloecke: [
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Where does the display name appear?',
            antwort: 'It appears in the portal header, the room history at check-in and check-out, completed requests, and the staff list. The change takes effect everywhere at once.',
          },
          {
            frage: 'Why does changing the password require the current one?',
            antwort: 'Because otherwise an unattended open session at the front desk would be enough to lock someone out.',
          },
          {
            frage: 'Forgot your password?',
            antwort: 'Sign out and choose “Forgot password” on the sign-in page. The link arrives by email and can be opened on any device. If no email arrives, the owner or a manager can resend the password link under Staff; if delivery failed, the link can also be shown and passed on directly.',
          },
          {
            frage: 'Can I change my email address?',
            antwort: 'Yes, here under “Change sign-in address” — for owners, managers, and front desk. You enter your current password and the new address; a confirmation link goes to the new address, and only clicking it makes the switch. Until then, you keep signing in with the old address. After the switch, the old address receives a notice.',
          },
          {
            frage: 'What stays the same with a new sign-in address?',
            antwort: 'Everything except the email address stays the same: password, roles across all properties, display name, and history. For the owner, invoices will go to the new address; billing details, payment method, and plan remain unchanged.',
          },
          {
            frage: 'I received a notice about a changed address, but it wasn’t me.',
            antwort: 'Then someone used your password. Contact the owner of your property immediately — for front desk and managers, they can end the access under Staff. If the owner account itself is affected, contact us — the contact address is in the legal notice.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Forgot password',
            ziel: { art: 'url', href: '/passwort-vergessen' },
          },
          {
            label: 'Staff',
            hinweis: 'Create and end accounts',
            ziel: { art: 'thema', id: 'personal' },
          },
        ],
      },
    ],
  },
  haeuser: {
    title: 'Properties & account',
    subtitle: 'The properties page: status per property, adding a property, account box, deleting data',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'The properties page is the entry point for owners and managers: all accessible properties with their status (open cleanings, requests), and below, for the owner, the account box and “Add property.” The front desk never sees this page — it knows exactly one property.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'I only have one property. Why this page?',
            antwort: 'Because the account lives here: billing, payment method, a second property, data deletion. The “Properties” link in the property’s header always leads here — even with a single property.',
          },
          {
            frage: 'What does a manager see here?',
            antwort: 'Only the properties they’ve been added to. Account box, “Add property” and “Delete data” don’t exist for them.',
          },
          {
            frage: 'What does “Delete data” mean?',
            antwort: 'Completely removing a property or the whole account — with a preview in figures and the name typed to confirm; it can’t be undone. Unlike day-to-day work, where records deliberately survive, it clears everything: history, sign-in accounts, and logo too. Only the invoice records remain, because they have to be kept. Deleting the account is also the cancellation at the end of the month: for the current month, a final invoice is created on deletion, and the dialog shows the amount beforehand (nothing in the free month).',
          },
          {
            frage: 'What happens when I add another property?',
            antwort: 'It’s created with its own address, rooms, staff, and rules. Billing is per room across all properties of the account; the minimum amount applies per account, not per property.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Plan & billing',
            hinweis: 'Prices, counting, payment method, invoices',
            ziel: { art: 'thema', id: 'konto' },
          },
          {
            label: 'Terms and conditions',
            ziel: { art: 'url', href: '/agb' },
          },
        ],
      },
    ],
  },
  konto: {
    title: 'Plan & billing',
    subtitle: 'Price per room, free month, counting, minimum amount, payment method, invoices',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'One price, no packages: per room and calendar month, with a minimum amount per account. All features are included. Display and invoice follow the same rule.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Which month is free?',
            antwort: 'The calendar month of registration and, if you didn’t register on the first of the month, the following one too — so always at least one full month.',
          },
          {
            frage: 'How is a room counted?',
            antwort: 'It counts for the month as soon as it was in service during it, even briefly — taken out of service today still counts, created today does too. The current month is therefore always a preview; closed months are fixed, even if you delete rooms later.',
          },
          {
            frage: 'Why a minimum amount per account and not per property?',
            antwort: 'A chain pays the sum of its rooms, not three times the minimum. An account without a single billable room pays nothing.',
          },
          {
            frage: 'Which payment methods are there?',
            antwort: 'Card or SEPA direct debit, stored without a charge and collected in the monthly run — or bank transfer by invoice to the bank details on the invoice, payable within 14 days. Invoice recipient and address are required because otherwise the tax can’t be calculated; within the EU outside Germany, also the VAT ID.',
          },
          {
            frage: 'When does the invoice arrive, and where do I find it?',
            antwort: 'On the first of the month for the previous month, as a PDF and view page in the “Invoices” card. At €0, no invoice is created. The provider keeps the records even after an account is deleted — download the PDFs beforehand; afterwards you can’t reach the page anymore.',
          },
          {
            frage: 'What does “Test mode — nothing is charged” mean?',
            antwort: 'Payment processing still runs in the payment provider’s test mode. Invoices are created, but no money moves. The note disappears with the switch to live operation.',
          },
          {
            frage: 'How do I cancel?',
            antwort: 'At the end of a calendar month — by deleting the account under “Delete data” on the properties page or in text form, for example by email to the provider. The current month is still billed: deleting immediately creates a final invoice, collected via the stored payment method; if it’s still open afterwards (bank transfer), the dialog shows the payment page at the end. If it can’t be created — for example because billing details are missing —, the account isn’t deleted. Deleting itself takes effect immediately: the data is gone afterwards. Taking a property out of service isn’t enough — rooms out of service still count in the current month.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Properties & account',
            hinweis: 'Add property, delete data',
            ziel: { art: 'thema', id: 'haeuser' },
          },
          {
            label: 'Terms and conditions',
            ziel: { art: 'url', href: '/agb' },
          },
        ],
      },
    ],
  },
} satisfies Record<string, HilfeThemaText>
