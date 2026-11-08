# Publicering fra jobkonfiguratoren

## Direkte publicering

Brugeren åbner Publicér underside, gennemgår adresse og valgt indhold, indsætter
sin egen fine-grained GitHub-token og klikker den endelige Publicér-knap.
Token skal have Contents: Read and write for kun sorenfroststaal/Extruda.
Der bruges ikke en delt nøgle, en proxy eller en nøgle fra udviklingsmiljøet.

`publishing.js` skriver kun `<kode>/index.html` på main via GitHubs Contents API.
Sidekoden skal have 4–12 bogstaver/tal, og root-oversigten kontrolleres for
navnesammenfald uden hensyn til store/små bogstaver. Eksisterende filer eller
mapper overskrives aldrig; create-requesten indeholder ingen SHA til opdatering.
Den valgte HTML og eventuelt billede bliver offentligt i GitHub og på hjemmesiden.

Tokenfeltet ligger uden for kladdeformularen. Nøglen bruges kun i Authorization
mod api.github.com, eksporteres eller lagres aldrig og ryddes ved afslutning og
lukning. Brugeren skal indsætte nøglen igen ved næste publicering. Nøglen giver
skriveadgang til hele det valgte repository og bør have kort udløb.

Efter vellykket commit kontrolleres den offentlige adresse uden adgangsnøgle i
op til cirka 2,5 minutter. Kun en side med den nye publiceringsmarkør rapporteres
som online. Timeout betyder gemt hos GitHub, men endnu ikke bekræftet online.
Fejl bevarer kladden. En afbrudt skriveforbindelse kan have gemt siden; kontrollér
adressen før genforsøg. Genforsøg kan ikke overskrive en eksisterende kode.

Forudsætninger: internet, GitHub-konto og repository-adgang. GitHub kan afvise en
udløbet eller utilstrækkelig nøgle. Ingen installation eller ekstra server er
nødvendig. Publiceringsknappen kan ikke fungere uden `publishing.js` eller
GitHubs API. JSON-kladdeeksporten er fortsat et alternativ.

Kilde: https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents

## Publicering via chatten som alternativ

Hent en JSON-kladde og send den i chatten. Koden er ikke reserveret før den
publiceres. Efter brugerens godkendelse: læs og kontrollér kladden (inklusive
persondata og billede). Kør `node jobwizard/publish-draft.cjs <sti-til-kladde.json>`.
Scriptet skriver kun en ny `<kode>/index.html`, nægter eksisterende koder og
publicerer ikke automatisk. Commit/push kun den godkendte underside. JSON-filen
med redigerbare indstillinger skal ikke lægges offentligt i repositoryet.

## Indhold og QR

Undersiden gemmer valg og ansøgningstekst. Valgte færdighedsniveauer og
oplysninger om eksisterende ansættelser opdateres fra arbejdslivssiden, når siden
åbnes; ved netværksfejl bevares eksportens indhold. Den har noindex/nofollow,
men er ikke adgangsbeskyttet. Ændret tekst eller valg kræver ny publicering.
Fælles styles og logoer hentes fra hjemmesiden. Et tilvalgt eget billede følger
med i kladden og på den publicerede side.

QR: vendored qrcode-generator 1.4.4, Kazuhiko Arase, MIT. Hentet fra
https://unpkg.com/qrcode-generator@1.4.4/qrcode.js. Biblioteket kører lokalt;
ingen QR-tjeneste modtager link, ansøgning eller persondata. Hvis biblioteket
mangler, vises linket fortsat, men ingen QR-kode.

## Redigering af en eksisterende underside

`editor.html?code=0001` åbner den eksisterende offentlige HTML fra GitHub. Tekst kan ændres, afsnit tilføjes, og elementer skjules eller slettes med fortryd. Kladden kan gemmes i browseren, hentes som privat JSON og indlæses igen. Den indeholder ingen adgangsnøgle og må ikke publiceres i repositoryet.

Brugeren gennemser forhåndsvisningen og publicerer udtrykkeligt med sin egen kortlivede GitHub-token. Kun den valgte eksisterende `<kode>/index.html` på main kan opdateres. Den oprindelige blob-SHA skal passe; samtidige ændringer afvises. Adresse og QR bevares, og tidligere udgaver findes i GitHubs historik. Nøglen sendes kun til api.github.com og gemmes aldrig. Ingen delte eller miljøbaserede nøgler bruges.

Redigerede udgaver fastholder det valgte CV-indhold: automatisk opdatering fra arbejdslivssiden fjernes, så brugerens tekstrettelser ikke overskrives ved åbning. Eksisterende PDF og lokale mapper opdateres ikke automatisk. Publicering verificeres med en ny markør, før den kaldes online. Oprettelse af nye sidekoder beholder sin create-only-regel.
