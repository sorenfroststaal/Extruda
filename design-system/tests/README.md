# Browserkontrol

`browser.cjs` bruger Playwright og en installeret Chrome. Det er testværktøjer,
ikke dependencies for hjemmesiden. Installér dem i dit testmiljø, eller angiv
en eksisterende Playwright-installation med `EXTRUDA_PLAYWRIGHT_PATH`.

Kør fra repositoryets rod:

```text
node design-system/tests/browser.cjs
node design-system/tests/header.cjs
node design-system/tests/contrast.cjs
```

Valgfrie miljøvariabler:

- `EXTRUDA_BROWSER_CHANNEL`: en anden installeret browserkanal.
- `EXTRUDA_TEST_DOWNLOAD=1`: kontrollér også en faktisk SVG-download. Miljøet
  skal tillade lokale downloads.
- `EXTRUDA_SCREENSHOT_DIR`: eksisterende mappe til skærmbilleder.
- `EXTRUDA_BOOTSTRAP_FILE`: lokal kopi af forsidenes eksisterende
  Bootstrap 5.2.3-JavaScript til netværksfri kontrol af mobilmenu og detaljer.

Testen kontrollerer formularfejl, kladder, rettelser fra gennemgang,
browserhistorik, wizard, mobilmenu, sprog/tema og reflow. Den er en teknisk
regressionstest og erstatter ikke brugertest eller test med skærmlæser.

`header.cjs` kontrollerer de tre fælles topknapper på alle ti HTML-sider:
sprog, tema, systemtema, genindlæsning, tastatur, dialog og mobilbredder.
Den kontrollerer også, at arbejdsark bevarer sprog og papirfarve ved skift af
appens indstillinger. Siderne indlæses fra lokale projektfiler via browserens
testrouting; der bruges ingen ekstern oversættelsestjeneste.

`contrast.cjs` starter en midlertidig lokal server og scanner synlig tekst,
links, knapper, labels og overskrifter på alle sider i både lyst og mørkt
tema. Siderne findes automatisk, så nye sider kommer med uden ændringer i
testen; de nummererede ansøgningssider springes over, fordi de henter deres
stilark fra extruda.dk. Testen kontrollerer også, at arbejdsgiverlogoer står på
en lys plade, og at hver pille i slogan-SVG'erne har mindst 4,5:1 mellem fyld
og tekst. `EXTRUDA_ROUTES=/,/arbejdsliv/` begrænser kørslen til udvalgte sider.
Testen kører automatisk på GitHub ved hvert push og hver pull request
(`.github/workflows/contrast.yml`) sammen med `header.cjs` og `browser.cjs`.
`browser.cjs` kontrollerer også, at forsiden og Projekter ikke henter noget
udefra, at projektnavnene er rigtige, og at fold-ud og billedskift virker. Almindelig tekst kræver mindst 4,5:1; stor tekst mindst 3:1. Testen
åbner alle fold-ud-afsnit og forstår også CSS `color(srgb ...)` fra
`color-mix()`. Kør den efter enhver
ændring af farvetokens, temaer, knapper, links, ikoner eller flader.

Efter ændringer i fælles topknapper, tema-CSS eller UI-oversættelser køres:

```text
node design-system/tools/bundle-header.cjs
```

Det indlejrer de fælles kilder i Learning Books' fire selvstændige HTML-filer,
så download stadig virker uden tilstødende filer. Andre sider bruger kilderne
direkte fra `js/` og `css/`.
