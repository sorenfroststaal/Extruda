# Sikkerhedsgennemgang — 19. oktober 2026

Omfang: statisk gennemgang af Cloudflare Worker, browserklient, WebView2-vært,
installer og lokal billedtransport. Ingen penetrationstest, belastningstest eller
uafhængig revision. Ingen ændringer er foretaget i programmet under gennemgangen.

## Prioriterede fund

### 1. Høj prioritet: live webkode er en del af appens tillidsgrænse

`windows/app/main.cpp` navigerer til Workers-adressen ved hver start og giver
kode fra denne origin adgang til den begrænsede native beskedbro og billedbuffer.
Telefonen henter også sin kamerakode derfra. Kompromitteres Cloudflare-kontoen,
deploy-adgangen eller webkoden, kan en angriber ændre kamera- og parringsadfærden.
Dette kræver kompromittering af en betroet komponent; det er ikke i sig selv en
påvist adgang for en vilkårlig internetbruger. Kryptering beskytter ikke mod en
kompromitteret klient, som allerede har adgang til nøgler og videobilleder.

Tiltag: lokal, versionsfast appbrugerflade; gennemgåede releases; begrænset
deployment-token; MFA/passkey på GitHub og Cloudflare. Telefonklientens hosting
vil fortsat være en tillidsgrænse. Bevar præcis origin-kontrol og begrænset bro.

### 2. Høj prioritet: installationen er usigneret

Authenticode-kontrollen viste `NotSigned` for setup, app og kamerabibliotek.
Installeren kræver administratoradgang (`windows/build.cmd`, `windows/setup.cpp`).
En falsk eller erstattet installer kan derfor få betydelig adgang, hvis brugeren
godkender den. HTTPS og en kontrolsum på samme hjemmeside giver ikke en separat
bekræftelse af udgiveren, hvis hele distributionsstedet kompromitteres.

Tiltag: signér og tidsstempl releases, beskyt signeringsnøglen, og byg en
kontrolleret releaseproces. Almindelig brug skal fortsat ske uden administrator.

### 3. Middel: offentlig room-oprettelse mangler samlet misbrugsbegrænsning

`src/worker.js:18` kontrollerer Origin, men en egen HTTP-klient kan selv sætte
den header. `PairingRoom.fetch` accepterer selvvalgte tilfældige room-id'er og
tokens uden rate limit på tværs af rum. De eksisterende grænser for sockets,
beskeder og bytes gælder pr. rum/socket. Derfor kan masseoprettelse ramme kvoter
og gøre nye parringer utilgængelige. Der er ikke udført en belastningstest.
Der er heller ikke kontrolleret, om særskilte kontoregler allerede begrænser det.

Tiltag: samlet rate limit før Durable Object-oprettelse, korte begrænsninger pr.
kilde og passende brugerbeskyttelse ved misbrug. Behandl Origin som browserværn,
ikke som autentifikation. Læs desuden request-body med en faktisk bytegrænse;
`request.text()` læser hele kroppen før den efterfølgende længdekontrol.

### 4. Middel: QR/link er en adgangsnøgle uden enhedssammenligning

`public/app.js` lægger både telefonens token og krypteringsnøglen i fragmentet.
Det er godt, at fragmentet fjernes fra adressen og ikke sendes som normal
HTTP-sti. Et screenshot eller et kopieret link kan dog give en anden person
mulighed for at forsøge at overtage telefonrollen inden udløb. Pc-accepten viser
ikke en kode, der kan sammenlignes på de to enheder. Angrebet kræver adgang til
QR/link og brugerens fejlagtige accept; kameraadgang er ikke ubetinget automatisk.

Tiltag: kort engangskode på begge enheder, eksplicit forbrug af join-token ved
første parring og kortere levetid for ubrugte invitationer.

### 5. Middel: videobilleder findes i en lokal filbaseret buffer

`windows/app/FrameWriter.h` bruger en memory-mapped `.frame`-fil under ProgramData.
Filen slettes ved lukning og har eksplicit ACL til den aktuelle bruger, SYSTEM
og læseadgang til LocalService. Det er væsentligt bedre end en offentligt læsbar
fil, men billeder er ikke kun i en anonym RAM-buffer. Kode under samme bruger,
SYSTEM eller relevante tjenestekonti er ikke udelukket fra at læse dem.
Sletning er heller ikke en garanti for sikker overskrivning af tidligere data.

Tiltag: undersøg pagefile-backed shared memory med mindst mulige rettigheder
og fortsæt nulstilling ved stop. Dokumentér transporten præcist. Dette fund
påviser ikke læseadgang for alle andre Windows-brugere.

### 6. Lavere prioritet: kontrolkanal mangler eksplicit kø-/størrelsesgrænse

`public/app.js:49` parser data og tilføjer arbejde til en Promise-kø uden en
applikationsgrænse for antal beskeder eller samlet størrelse. En allerede parret,
ondsindet peer kan belaste modparten eller sende mange opløsningsskift.
WebRTC/browserens egne grænser erstatter ikke applikationsgrænser.

Tiltag: maksimum beskedstørrelse, frekvensbegrænsning, kun seneste udestående
opløsningsønske og lukning ved ugyldigt skema eller gentaget misbrug.

## Eksisterende beskyttelser

- Tilfældige lange room-id'er/tokens og separate roller.
- Hash af tokens på serveren, AES-GCM til signalering og krypteret WebRTC.
- Pc-accept før telefonens automatiske kamerastart.
- Ingen mikrofon; desktop-WebView afviser kameratilladelser.
- CSP, ingen tredjepartsscripts i Camera-klienten, præcis origin-kontrol i native vært.
- Whitelist over billedstørrelser, fast maksimal buffer og sort billede ved stale data.
- Lokal fil-ACL, midlertidig fil og nulstilling af billedbuffer.

## Begrænsninger og anbefalet rækkefølge

Prioritér beskyttelse af distributionskæden og hostingen, samlet rate limiting
og forbedret identitetsbekræftelse ved parring før bred offentlig distribution.
Bevar tydelig stopfunktion og browserens kameratilladelse.

Kendt-sårbarhedsopslag for npm-afhængigheder blev ikke kørt, fordi den automatiske
godkendelseskontrol ramte en forbrugsgrænse. Det er ikke en ren sikkerhedsscanning.
Native kode er ikke fuzz-testet, og konti/deployment-rettigheder er ikke revideret.

Referencer:
- https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/security
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/durable-objects/platform/limits/


## Opfølgning: sikkerhedsrevision 0.4.0

Gennemførte ændringer:
- Windows-brugerfladen pakkes lokalt under Program Files og indlæses gennem en
  isoleret WebView2 virtual host. Betroet native origin er kun den lokale origin.
- CORS til API'et tillader præcist den lokale app-origin; ingen wildcard eller cookies.
- En global Durable Object begrænser trafik samlet og pr. kilde på tværs af rum.
  Den lagrer hashes af IP-adresser, ikke rå IP-adresser, i en kortlivet tæller.
- Request-body læses med faktisk bytegrænse, uanset Content-Length.
- Begge rolletokens forbruges ved første godkendte login til rummet. Dette er
  protokol-autentifikation med tilfældige nøgler, ikke en brugerkonto.
- Engangsnonce for telefonen bindes til pc-accepten. Seks cifre skal sammenlignes
  på de to enheder, før brugeren accepterer. Forkert nonce starter ikke kameraet.
- WebRTC-kontrolbeskeder begrænses i størrelse, frekvens og kølængde, og gamle
  forbindelsers beskeder kan ikke anvendes på en ny forbindelse.
- Stop sendes også via den direkte WebRTC-kanal efter signaleringens udløb.
- Den native beskedbro begrænser beskedlængde og gentagen bufferallokering.
- Den aktive framefil tillader ikke andre samtidige skriveåbninger.

Resterende forhold:
- Telefonklienten leveres fortsat af Cloudflare. Beskyt konti og deployments.
- Rate limiting inde i en Worker stopper ikke alle angreb mod selve Worker-kvoten;
  de indkommende forespørgsler når stadig platformen. Edge-regler kan supplere.
- Bufferen er fortsat en midlertidig, adgangsbeskyttet fil. Global shared memory
  på tværs af brugersession og Windows-kameratjeneste kræver en særskilt sikker
  rettigheds-/brokerløsning. Der er ikke givet nye systemprivilegier som genvej.
- Digital signering er udtrykkeligt uden for denne opgave.
- npm audit blev nu gennemført: ingen kendte advarsler blandt de 120 scannede
  afhængigheder på tidspunktet for kontrollen. Native komponenter er ikke dækket
  af dette npm-opslag. Resultatet er ikke en garanti for fravær af sårbarheder.

Supplerende validering: udløbne room-id'er kan ikke genoprettes efter oprydning;
invitationens tidspunkt kontrolleres på serveren. De 17 tests består både lokalt
og mod den udgivne tjeneste. Den installerede lokale app og alle ti native
kameraformater er kontrolleret; 4K gennem Windows Frame Server består.
