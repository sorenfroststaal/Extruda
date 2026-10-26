# Browserkontrol

`browser.cjs` bruger Playwright og en installeret Chrome. Det er testværktøjer,
ikke dependencies for hjemmesiden. Installér dem i dit testmiljø, eller angiv
en eksisterende Playwright-installation med `EXTRUDA_PLAYWRIGHT_PATH`.

Kør fra repositoryets rod:

```text
node design-system/tests/browser.cjs
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
