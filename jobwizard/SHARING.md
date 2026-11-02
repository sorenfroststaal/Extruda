# Publiceringskladder

Jobkonfiguratoren er en statisk side. Den offentliggør aldrig fra browseren og
indeholder ingen GitHub-nøgle. Brugeren vælger indhold, kontrollerer den separate
forhåndsvisning og henter en JSON-kladde. Koden genereres lokalt og er ikke
reserveret, før siden publiceres. Link og QR virker først efter publicering.

Efter brugerens godkendelse: læs og kontrollér kladden (inklusive persondata og
billede). Kør `node jobwizard/publish-draft.cjs <sti-til-kladde.json>`. Scriptet
skriver kun en ny `<kode>/index.html`, nægter eksisterende koder og publicerer
ikke automatisk. Commit/push kun den godkendte underside. JSON-filen med de
redigerbare indstillinger skal ikke lægges offentligt i repositoryet.

Undersiden gemmer de valgte afsnit og ansøgningsteksten. Valgte færdighedsniveauer og eksisterende ansættelsers oplysninger opdateres fra arbejdslivssiden, når den åbnes; ved netværksfejl bevares eksportens indhold.
Den har noindex/nofollow, men er ikke adgangsbeskyttet. Ændrede valg eller ansøgningstekst kræver en ny publicering. Fælles styles og logoer hentes fra hjemmesiden. Publicerings-
kladden indeholder billedet, hvis brugeren har valgt sit eget billede.

QR: vendored qrcode-generator 1.4.4, Kazuhiko Arase, MIT. Hentet fra
https://unpkg.com/qrcode-generator@1.4.4/qrcode.js. Biblioteket kører lokalt;
ingen QR-tjeneste modtager link, ansøgning eller persondata. Hvis biblioteket
mangler, vises linket fortsat, men ingen QR-kode.
