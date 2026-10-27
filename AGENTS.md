# Extruda UI/UX

## Brugerens standard for nye opgaver

Når brugeren beder om at få lavet noget, f.eks. en ansøgning, en app, en
hjemmeside, et dokument eller lignende, skal resultatet som udgangspunkt følge
den visuelle identitet på https://extruda.dk/design-system/, medmindre brugeren
specificerer andet. Tilpas principperne til mediet; brugerens konkrete
instruktioner har forrang. Den lokale kilde til identiteten er `design-system/`.

For new or changed user interfaces, read `design-system/index.html` (especially
`#ui-ux`) and `design-system/styles.css` before designing. They are the visual
reference and fixed style. Follow this style rather than inventing a new one per
tool. Existing screens can be migrated as they are changed; do not rewrite
unrelated products merely to apply these rules.

- Choose the pattern before the layout. Default small or repeated tasks to one
  page with visible, logically grouped fields and one final action. Use a wizard
  only for infrequent tasks with dependent choices. Use a task overview for
  larger independent sections; lists/tables for many similar objects. Preserve
  input across all navigation. Do not force Vælg → Tilpas → Hent onto every tool.
- Use a compact product heading. For visual tools, use a 320 px settings column,
  flexible result column (minimum 480 px), 24 px gap, maximum content width
  1200 px including side padding. Below 960 px use one column, settings first.
  Avoid nested scroll areas. Ordinary forms use a readable single column with
  no empty preview. Provide a clear way to reach visual results on mobile.
- Show one filled primary action after the relevant fields. Use
  outlined buttons and text links for secondary actions. Name actions by their
  result (e.g. Hent PDF). Do not automatically download or print.
- Start with useful defaults and show every essential choice. Group by meaning,
  not an arbitrary field count. Use disclosure only for optional settings or
  supporting help. Never nest disclosures or hide required form sections in
  tabs. Keep format, branding and colour mode visible before export.
- Use the existing cream/graphite/petrol/apricot tokens and local Inter/Nunito
  fonts. Use 24 px panel padding (20 px mobile), 24 px between groups, 16 px
  between fields, 8 px from label to field, 8 px control radius and 12 px panel
  radius; small labels 4 px and large feature panels 16 px. Main buttons and
  text fields are at least 48 px high. All interactive targets are at least
  44 × 44 px. Do not add decorative shadows or nested cards.
- Tool titles: Nunito 32 px desktop / 28 px mobile; section headings 24 / 22 px;
  body Inter 16 px; labels 14 px; help 13 px. Reserve large hero type for landing
  pages. Give buttons visible text; use SVG icons from the local library.
- Support Danish and English, light and dark themes, keyboard operation,
  visible focus, narrow screens and enlarged text. Use native controls where
  suitable. Explain empty, working, ready and error states, and preserve input
  on failure. Communicate status with text or icons as well as colour.
- All generated output must allow removing Extruda logo and text, including
  headers, footers and metadata. Offer custom colours and black/white output
  before export. Match the preview to these choices. Output colour preferences
  do not restyle the application controls.
- Always explain the actual safety assessment, data storage/transmission,
  permissions and relevant limitations in a consistent About data and
  requirements area. Explain dependencies, their purpose, installation/network/
  account requirements and missing-dependency behaviour, including when there
  are no external dependencies. Keep the summary concise and expand details.
- Verify the standard task without advanced settings, mobile layout, both
  languages/themes, error recovery and exported output as appropriate to the
  change. Report what was actually verified and any remaining limitations.
- Reference examples must be generic: neutral illustrations, fictional data,
  and names such as Mit værktøj / My tool. Do not borrow examples from existing
  apps. Actual brand assets belong in the identity and asset-library sections.
- Carousels never autoplay. Use a stable 4:3 frame on desktop and a square frame
  on mobile; contain the complete image without distortion. Place arrows,
  thumbnails, count and caption below/around the frame. Open a native modal
  viewer on click, fit the original to screen, offer an explicit 100% view,
  support Escape, keyboard arrows and focus restoration. Provide swipe as an
  enhancement, with buttons as the alternative. Do not wrap silently at ends.
- Charts need clear titles, units, periods, source, visible values and accessible
  data tables. Short line-chart values sit inside the point circles; place long
  or crowded values beside points without overlap. Bar charts start at zero.
  Use line charts for ordered data and pie charts only for a few positive shares
  of a whole. Use one chart per row on
  mobile, at most two on desktop. Distinguish missing data, zero and loading.
- Offer three output colour controls by default: primary, accent and paper /
  background. Derive readable black/white text automatically. Also offer shared
  colours and black/white mode; use labels/outlines/patterns to distinguish
  series. Keep the application theme tokens fixed. Dark UI does not change
  exported paper to a dark colour.
- Voice: simple, neutral, concrete Danish/English, with an occasional short
  playful phrase in an intro or completion message. Use everyday words and
  precise action labels. Avoid corporate/sales language. No humour in errors,
  safety, permissions, pricing or destructive actions.
- Header controls use the camera-app pattern everywhere, including websites:
  exactly three buttons in this order: globe + current DA/EN, current sun/moon,
  info. Language opens Dansk/English; appearance opens Light/Dark/Follow system
  (default system); info opens a native About data and requirements dialog.
  Use 48 px buttons, 24 px local SVG icons, 8 px gaps and 8 px radius, 1 px
  borders, white/graphite theme surfaces and no shadow. Icons have descriptive
  accessible names, tooltips and visible focus. Escape dismisses and restores
  focus. Keep the group at the header right, below the name on mobile. Persist
  explicit language/theme choices locally, explain blocked storage, preserve
  form input and keep UI language/theme independent from generated output.
  Read #header-controls; local implementation is js/extruda-ui.js and
  css/extruda-ui.css. Do not replace these controls with dropdown fields or
  separate language/theme button groups.
- The generic interactive reference is `design-system/dummy/`. Keep language
  and theme controls at the top right of the app header throughout setup and
  use (below the app name on mobile). Default theme: follow system. Retain
  language/theme choices from setup to the app. Suggested client-area defaults:
  setup 720 × 640 logical px; app 1200 × 800 logical px. Allow smaller screens,
  larger text and resizing. OS title bars and outer radii are system-controlled.
- Setup offers a Start menu shortcut (default on) and an optional desktop
  shortcut (default off). Do not confuse these with pinning or autostart. Do
  not promise or perform taskbar pinning in an installer. After launch, offer
  manual guidance or a user-initiated, supported Windows approval request.
  Launch with Windows stays off unless separately and deliberately enabled.
- Keep the reference and dummy runnable both on the website and directly from
  local files. Use deferred classic scripts without module imports for these
  pages. Do not claim that a browser prototype installs anything on the OS.

## Navigation and forms (reference 2.0)

- Read `design-system/UX-RESEARCH.md` for rationale and primary sources. These
  are design recommendations, not results of an Extruda user study.
- Menus contain destinations, not commands or form steps. Use ordinary links
  and `aria-current`. Start with few top-level destinations; a one-screen tool
  may need no menu. Do not add an ARIA menu role to ordinary site navigation.
- On mobile, use a labelled Menu disclosure and the same links in a vertical
  in-flow list. Do not require horizontal scrolling or hover. Escape closes
  and restores focus. Never obscure the form with a second navigation layer.
- Tabs are only for alternate views of related information, never required
  sequential questions or things users need to compare simultaneously.
- Use labels, helpful examples/units, appropriate native controls and explicit
  optional labels. Validate on the final action; preserve input on failure.
  Focus a linked error summary and put the same error by the relevant field.
- Wizards show a meaningful current step and total, a back link before content,
  completed-step links where safe, and a review with direct Change links.
  Browser Back works. Do not label arbitrary step buttons as tabs or require
  users to repeat answered questions after making a correction.
- Task overview statuses distinguish Not started, In progress and Ready.
  Opening a section does not complete it; distinguish draft edits from saved
  answers and explain whether anything survives reloading the page.
