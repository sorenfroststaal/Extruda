# UX-beslutninger · 26. oktober 2026

Dette er en kildebaseret gennemgang af Extrudas reference, dummy-app og
projektoversigt. Der er ikke udført interviews, observationer eller en
brugertest af de eksisterende apps. De lokale regler er designbeslutninger,
som skal afprøves på den almindelige opgave med rigtige brugere.

## Det, der gjorde den tidligere standard rodet

- Samme tretrinsforløb blev foreslået til både en lille eksportopgave og en
  installation. Dummyen skjulte blot få felter bag tre trin.
- Trin lignede faner, selvom faner og fremdrift betyder noget forskelligt.
- Referencesiden havde ti vandrette navigationslinks og gentog flere regler.
- Forsidens projektbeskrivelser og centrale links krævede op til to fold-ud.
- Der manglede et konkret eksempel på fejlretning, direkte rettelser fra en
  gennemgang og et overblik over delvist udfyldte afsnit.

## Hvad vi vælger i stedet

1. **Lille eller gentagen opgave:** en side med synlige feltgrupper og én
   afsluttende handling. Forhåndsvisning bruges kun, når resultatet er visuelt.
2. **Sjælden opgave med afhængige valg:** en kort wizard med meningsfulde trin,
   tilbage-navigation, bevarede svar og en gennemgang før afslutning.
3. **Større opgave:** et opgaveoverblik med status og direkte adgang til afsnit.
4. **Mange ens objekter:** liste eller tabel; tilføj relevante filtre efter
   behov, frem for en ny kortflade eller en wizard.

Få hoveddestinationer, én navigation pr. niveau og faste felt- og
handlingsplaceringer er vores udgangspunkt. Der findes ikke et universelt
korrekt antal menupunkter eller felter. Vi har derfor fjernet den hårde regel
om højst fem valg. Farver, mål og typografi er Extrudas egne standardværdier.

## Kilder og hvad de bruges til

- [NN/g: Wizards](https://www.nngroup.com/articles/wizards/): original vejledning
  om styrker og omkostninger ved trinvise forløb. Understøtter, at en sjælden
  opsætning og gentaget dagligt arbejde ikke bør få samme indtastningsmønster.
- [GOV.UK: Navigate a service](https://design-system.service.gov.uk/patterns/navigate-a-service/):
  navigation er til selvstændige destinationer; en menu er ikke et sitemap.
- [GOV.UK: Question pages](https://design-system.service.gov.uk/patterns/question-pages/):
  spørg kun om nødvendige oplysninger, saml dem logisk, og begynd med en enkel
  løsning før ekstra fremdriftsvisning. Eksemplet anvendes til formstruktur,
  ikke som krav om en side til hvert lille felt i alle værktøjer.
- [GOV.UK: Tabs](https://design-system.service.gov.uk/components/tabs/): faner
  skjuler indhold og er uegnede til en nødvendig rækkefølge eller sammenligning.
- [GOV.UK: Accordion](https://design-system.service.gov.uk/components/accordion/):
  reducer først indholdet; undgå at placere fold-ud-komponenter inde i hinanden.
- [W3C WAI: Multi-page forms](https://www.w3.org/WAI/tutorials/forms/multi-page/):
  logiske trin, forståelig fremdrift og mulighed for at gå tilbage med svarene.
- [GOV.UK: Check answers](https://design-system.service.gov.uk/patterns/check-answers/):
  oversigt før afslutning og direkte rettelser, hvor tidligere svar bevares.
- [GOV.UK: Error summary](https://design-system.service.gov.uk/components/error-summary/)
  og [W3C WAI: Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/):
  tydelige fejl ved relevante felter og en samlet, tilgængelig vej til rettelsen.
- [GOV.UK: Complete multiple tasks](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/):
  synlig status for en opgaves afsnit. Åbning af et afsnit er ikke i sig selv
  det samme som, at det er færdigt.
- [W3C APG: Disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/):
  almindelige navigationslinks behøver ikke ARIA-menurollen. Brug en tydelig
  åbn/luk-knap, korrekte tilstande og tastaturbetjening. APG-eksempler er
  vejledning og skal selv testes med relevante hjælpeteknologier.

## Konkret kontrol før publicering

- Den lille standardopgave kan udføres uden at skifte trin eller åbne hjælp.
- En nødvendig wizard kan gennemføres, ændres og annulleres uden tab af valg.
- Browserens Tilbage virker mellem demoens destinationer og trin.
- Et tomt påkrævet felt giver en fejlliste med fokus og et link til feltet.
- Opgavestatus skelner mellem kladde, gemt svar og gennemgået oversigt.
- Sprog og tema ændrer ikke brugerens indtastede indhold.
- Mobilmenuen er lodret og kan lukkes med Escape; fokus bliver forståeligt.
- Eksport matcher forhåndsvisningen, også uden branding og i sort/hvid.
- Mobile bredder, stor tekst og begge temaer kontrolleres i browseren.

Disse kontroller afdækker funktion og layout. De dokumenterer ikke i sig selv,
at brugerne finder standarden enkel. Det kræver efterfølgende brugertest.
