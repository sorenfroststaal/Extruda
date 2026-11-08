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

Rediger-linket åbner den faktiske Jobwizard som `/jobwizard/?edit=0001`. Den tidligere `editor.html?code=0001` viderestiller hertil. Det er samme formular, rendering og A4-kontrol som ved oprettelse: Ronaldo/intro, foto, alle færdigheder, ansættelser, spor, personafsnit, fem tekstafsnit, fri tekst, farver, delingsboks og sidefod. Ronaldo-tilvalg aktiverer introfeltet, så illustrationen vises.

De eksisterende synlige valg og tekster genskabes ud fra den offentlige HTML og profilen. Der publiceres ingen JSON med redigerbare indstillinger. Skjult tidligere tekst kan ikke genskabes fra en offentlig side; indlæs den private extruda-job-page-v1-JSON i formularen for at genoptage alle oprindelige indstillinger. Hent også en privat JSON-fil efter redigering. Lokale kladder gemmes separat pr. kode. Hvis siden er ændret siden en lokal kladde, bevares den gamle kladde og kan åbnes udtrykkeligt; den nye offentlige udgave indlæses først.

Brugeren gennemser de to A4-sider og vælger Opdater underside. Egen kortlivede GitHub-token bruges kun til api.github.com og lagres eller eksporteres aldrig. Kun den samme eksisterende ansøgningsside kan opdateres: kode låses, den oprindelige blob-SHA skal passe, og den aktuelle HTML valideres som en ansøgningsside. Samtidige ændringer afvises. Adresse og QR bevares, og tidligere udgaver findes i GitHubs historik. Onlinekontrol kræver en ny publiceringsmarkør.

Færdighedsniveauer og ansættelser fra profilen følger fortsat det normale public-refresh-forløb. Ansøgningstekst og udvalget fastholdes. Eksisterende PDF og mapper på computeren opdateres ikke automatisk. Oprettelse af nye sidekoder beholder sin create-only-regel. Ingen miljønøgler bruges i browseren.
