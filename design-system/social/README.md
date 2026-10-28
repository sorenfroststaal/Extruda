# extruda.dk · logoer og LinkedIn

Logoerne udvider det eksisterende Manrope 800-ordmærke med `.dk` i samme
størrelse, vægt og grundlinje. De oprindelige syv bogstavers kurver er bevaret
uændret. Filerne er transparente SVG'er med tegnede konturer, uden fontkrav.

Der er 24 versioner: vandret logo, ordmærke og stablet logo, hver i farve,
sort, hvid, creme, grafit, dyb petrol, dæmpet petrol og abrikos.
Lyse versioner kræver en mørk baggrund. Brug fuldfarvelogoet på creme eller
hvidt. Bevar proportioner og fri plads omkring logoet.

`linkedin-banner-light.png` er klar til en personlig LinkedIn-profil:
1584 × 396 px, PNG, under 8 MB. Baggrunden er creme med diskrete detaljer i
petrol og abrikos. Logoet ligger mod højre; nederste venstre område er frit
til profilbilledet. LinkedIn kan beskære forskelligt på forskellige skærme;
kontrollér placeringen i LinkedIns forhåndsvisning før du gemmer.

SVG-filen er den redigerbare vektorkilde. `linkedin-background-light` er
samme baggrund uden logo, tekst eller brandingmetadata. Farverne kan ændres
direkte i SVG-kilderne; sort/hvid-logoer følger med separat.

Kilde til mål og uploadformat:
https://www.linkedin.com/help/linkedin/answer/a568217/

Sikkerhed: PNG-filerne er statiske billeder. SVG-filerne indeholder kun
geometri og tilgængelige navne; ingen scripts eller eksterne referencer.
Intet uploades automatisk. LinkedIn ser først billedet, når du selv uploader.
Ingen konto, installation eller ekstern dependency kræves for at bruge filerne.

Genopbygning kræver FontTools og den oprindelige Manrope-variable font til
logoer samt Node.js og Sharp til PNG-eksport. Disse er kun byggeværktøjer;
skrifttypefilen distribueres ikke. Scripts findes i `../tools/`.
