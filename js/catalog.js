/* ------------------------------------------------------------------
   KATALÓG TÉM — čisté dáta, oddelené od stavu.
   Stav (známky, fronta, poznámky) žije v localStorage a páruje sa
   s katalógom podľa `id`. Túto tabuľku môžeš kedykoľvek doplniť:
   nová téma sa pri načítaní vloží na začiatok frontu, existujúci
   postup sa nestratí.

   subject: sjl | obn-pol | obn-eko | bio | anj
   tc:      tematický celok (iba biológia)
   paused:  téma sa pri prvom pridaní založí ako pozastavená
------------------------------------------------------------------ */

const SUBJECTS = [
  { key: 'sjl',     name: 'Slovenský jazyk a literatúra', short: 'SJL' },
  { key: 'obn-pol', name: 'Občianska — politológia a právo', short: 'OBN-POL' },
  { key: 'obn-eko', name: 'Občianska — ekonómia a spoločnosť', short: 'OBN-EKO' },
  { key: 'obn-fil', name: 'Občianska — filozofia a religionistika', short: 'OBN-FIL' },
  { key: 'obn-psy', name: 'Občianska — psychológia', short: 'OBN-PSY' },
  { key: 'obn-soc', name: 'Občianska — sociológia', short: 'OBN-SOC' },
  { key: 'bio',     name: 'Biológia', short: 'BIO' },
  { key: 'anj',     name: 'Angličtina', short: 'ANJ' },
];

const PLACEHOLDER = 'Doplniť';

/* Oblasti naprieč občianskou — maturitné zadanie má 3 úlohy zo šiestich
   oblastí. `share` = podiel z 87 maturitných úloh. Právo a politológia
   sú zatiaľ spolu (15 + 10 úloh), kým nie je dané, ktorá téma kam patrí.
   Inštitúcie nemajú v rozdelení úloh vlastný riadok. */
const AREAS = [
  { name: 'filozofia a religionistika', share: 38 },
  { name: 'ekonómia',                   share: 24 },
  { name: 'právo a politológia',        share: 28 },
  { name: 'psychológia',                share: 6 },
  { name: 'sociológia',                 share: 3 },
  { name: 'inštitúcie',                 share: null },
];

/* --- Slovenský jazyk a literatúra (30) ---------------------------
   [názov, rozsah]. `rozsah` = autori a diela k téme. Na karte pri
   retrievale sa NEZOBRAZUJE, kým ho sám neodkryješ alebo neohodnotíš. */
const SJL = [
  ['Slohové postupy. Sylabický veršový systém',
   'Samo Chalupka (Mor ho!) · Ján Botto (Smrť Jánošíkova) · Hugolín Gavlovič (Valaská škola mravúv stodola)'],
  ['Štýlotvorné činitele. Krátka epická próza',
   'Martin Kukučín / Matej Bencúr (Neprebudený, Rysavá jalovica, Keď báčik z Chochoľova umrie — Aduš Domanický) · Jozef Gregor Tajovský (Maco Mlieč) · Božena Slančíková-Timrava'],
  ['Jazykové štýly. Sylabicko-tonický veršový systém',
   'Pavol Országh Hviezdoslav · Janko Jesenský · Jozef Miloslav Hurban'],
  ['Slovné druhy. Epická poézia',
   'Janko Kráľ (Zakliata panna vo Váhu a divný Janko) · Andrej Sládkovič (Detvan — Martin, Elena, Matej Korvín)'],
  ['Slovesá. Veľká epická próza — román',
   'Martin Kukučín (Dom v stráni — Šora Anzula, Mate Berac, Katica, Niko Dubčić) · A. S. Puškin (Kapitánova dcéra — Piotr Griňov) · Cervantes (Don Quijote) · Jozef Ignác Bajza (René mládenca príhody a skúsenosti) · Homér (Ilias, Odysea) · Victor Hugo (Chrám Matky Božej v Paríži) · Goethe (Utrpenie mladého Werthera)'],
  ['Prídavné mená, zámená a číslovky. Lyrická poézia — štylizácia',
   'Francesco Petrarca (Sonety Laure) · Ján Botto · Vladimír Roy'],
  ['Viacslovné pomenovania. Dramatická literatúra — všeobecné otázky',
   'William Shakespeare (Hamlet — Claudius) · Jozef Gregor Tajovský (Statky-zmätky — Ďurko Palčík, Zuzka Kamenská, Tomáš Kamenský, Ondrej Palčík) · Cervantes (Don Quijote)'],
  ['Zvukové javy reči. Lyrická a epická poézia — časomerný veršový systém',
   'Ján Hollý (Svätopluk; „slovenský Homér“, Vergílius) · Ján Kollár (Slávy dcera — Friderika Schmidtová)'],
  ['Jednoduchá veta. Vnútorný monológ',
   'Alfonz Bednár (Kolíska — Jašek Kutliak) · Milo Urban · Janko Jesenský · Jozef Gregor Tajovský'],
  ['Slovanské jazyky, vznik a vývin slovenského jazyka. Druhy lyriky',
   'Andrej Sládkovič · Ivan Krasko · Ján Botto · S. A. Jesenin · Jozef Miloslav Hurban · Kralická Biblia'],
  ['Obohacovanie slovnej zásoby. Komédia',
   'Ján Chalupka (Kocúrkovo) · Ján Palárik (Zmierenie — Eržika Hrabovská; Inkognito, Drotár) · Július Barč-Ivan (Mastný hrniec) · N. V. Gogoľ (Revízor) · Plautus'],
  ['Lexikografia — druhy slovníkov. Sociálny román',
   'Milo Urban (Živý bič — Adam Hlavaj, Eva Hlavajová, Ondrej Koreň, notár Okolický) · Martin Kukučín (Dom v stráni)'],
  ['Vetné členy. Psychologický román',
   'Jozef Cíger Hronský (Jozef Mak) · Erich Maria Remarque (Na západe nič nové — Paul Bäumer, Kantorka) · F. M. Dostojevskij · J. D. Salinger (Holden Caulfield)'],
  ['Umelecký a odborný štýl. Voľný verš, reflexívna a duchovná lyrika',
   'Walt Whitman · Rudolf Dilong · Laco Novomeský · Ján Smrek / Ján Čietek · Emil Boleslav Lukáč'],
  ['Spôsoby spracovania textu. Reťazový kompozičný postup',
   'Margita Figuli (Tri gaštanové kone — Peter, Magdaléna, Jano Zápotočný) · Dobroslav Chrobák (Drak sa vracia — Šimon Jariabek) · František Švantner (Nevesta hôľ) · Ľudo Ondrejov (Jerguš Lapin)'],
  ['Charakteristika. Tragédia',
   'Sofokles (Kráľ Oidipus — Kreón, Teiresias) · Ivan Stodola · Ivan Bukovčan · Victor Hugo (Chrám Matky Božej) · Honoré de Balzac (Otec Goriot) · Shakespeare'],
  ['Zvukové jazykové prostriedky. Literárna moderna — symbolizmus, senzualizmus, čistá lyrika',
   'Ivan Krasko · Ján Kostra (Ave Eva) · Paul Verlaine · Samo Bohdan Hroboň · Ján Botto'],
  ['Súvetia. Prúd vedomia a absurdita v próze 20. storočia',
   'James Joyce (Odyseus — Leopold Bloom) · Franz Kafka (Premena — Gregor Samsa; Max Brod) · Ján Johanides (Pisár Gráč — Jozef Gráč, Alojz Greškovič)'],
  ['Slovná zásoba. Lyrická poézia — automatický text, expresionizmus',
   'Rudolf Fábry (Uťaté ruky) · Guillaume Apollinaire (Pásmo) · André Breton · Tristan Tzara · Vítězslav Nezval'],
  ['Formy logického myslenia. Dramatická literatúra — absurdná dráma',
   'Samuel Beckett (Čakanie na Godota) · Václav Havel · Milan Lasica a Július Satinský · Stano Štepka (Radošinské naivné divadlo)'],
  ['Formy národného jazyka. Retrospektívny kompozičný postup',
   'Alfonz Bednár · Ladislav Mňačko (Ako chutí moc) · J. D. Salinger (Kto chytá v žite — Holden Caulfield) · Ján Kačala'],
  ['Komunikácia. Súčasná lyrická poézia',
   'Milan Rúfus (Zvony) · Miroslav Válek (Dotyky, Skaza Titanicu)'],
  ['Výklad a úvaha. Postmoderna v epickej próze',
   'Umberto Eco (Meno ruže — Adso z Melku) · Milan Kundera (Žert — Ludvík Jahn, Pavel Zemánek) · Dominik Tatarka'],
  ['Publicistický štýl. Zobrazenie absurdity totalitného režimu v literatúre',
   'Ladislav Mňačko · Dominik Tatarka (Démon súhlasu) · Milan Kundera (Žert)'],
  ['Administratívny štýl. Literárna moderna a umelecké avantgardy',
   'Charles Baudelaire · Guillaume Apollinaire · André Breton · Laco Novomeský · Janko Kráľ'],
  ['Druhy opisu. Typy literárnych postáv',
   'Remarque (Paul Bäumer) · Kukučín (Aduš Domanický) · Tajovský (Maco Mlieč) · Botto (Smrť Jánošíkova) · Sládkovič (Detvan — Martin) · Salinger (Holden Caulfield)'],
  ['Indoeurópske jazyky. Láska a jej premeny v dielach svetovej a slovenskej literatúry',
   'Jozef Cíger Hronský (Jozef Mak) · A. S. Puškin · Janko Jesenský · Martin Kukučín · Romain Rolland · Margita Figuli · Dobroslav Chrobák · Shakespeare · L. N. Tolstoj (Anna Karenina) · František Švantner (Nevesta hôľ)'],
  ['Hovorový štýl. Konanie mladého človeka v literatúre v závislosti od spoločenských podmienok',
   'J. D. Salinger (Kto chytá v žite — Holden Caulfield) · Shakespeare (Hamlet) · Sofokles (Kreón)'],
  ['Podstatné mená. Antika a jej odkaz v literárnom období humanizmu a renesancie, epos',
   'Homér (Ilias, Odysea — Achilles, Odyseus) · Vergílius (Eneas) · Sapfó · Dante Alighieri · Francesco Petrarca · Giovanni Boccaccio · François Villon · Shakespeare (Rómeo a Júlia, Kráľ Lear) · Cervantes (Don Quijote)'],
  ['Rečnícky štýl. Staroslovienska literatúra',
   'Konštantín a Metod (Proglas, Moravsko-panónske legendy) · Kliment · Hugolín Gavlovič · literatúra Veľkej Moravy'],
];

/* --- Občianska — politológia a právo (22) ----------------------- */
const OBN_POL = [
  'Politológia',
  'Znaky štátu',
  'Formy štátov',
  'Politický systém',
  'Legislatíva',
  'Exekutíva',
  'Justícia',
  'Ochrana práva',
  'Voľby',
  'Právo, právna norma',
  'Právne systémy',
  'Odvetvia práva a správne právo',
  'Trestné právo',
  'Občianske právo',
  'Rodinné právo',
  'Obchodné právo',
  'Pracovné právo',
  'Ľudské práva',
  'Práva spotrebiteľa',
  'Liberalizmus',
  'Konzervativizmus',
  'Socializmus',
];

/* --- Občianska — ekonómia a spoločnosť (28) ---------------------
   [názov, oblasť, možná duplicita s vetvou]. Vetva sa volá „ekonómia“,
   ale nie všetko v nej je ekonomické — preto oblasť ako samostatný
   atribút. Duplicity sa zatiaľ nemažú, len označujú. */
const OBN_EKO = [
  ['Dejiny ekonomických teórií', 'ekonómia'],
  ['Klasická, neoklasická a marxistická ekonomická teória', 'ekonómia'],
  ['Moderné ekonomické teórie', 'ekonómia'],
  ['Potreby, statky, trh', 'ekonómia'],
  ['Trhový mechanizmus', 'ekonómia'],
  ['Konkurencia', 'ekonómia'],
  ['Nedokonalosti trhu a elasticita dopytu', 'ekonómia'],
  ['Výrobné faktory', 'ekonómia'],
  ['Trh práce, nezamestnanosť, mzda a produktivita práce', 'ekonómia'],
  ['Podnik, živnosti', 'ekonómia'],
  ['Obchodné spoločnosti', 'ekonómia'],
  ['Vznik a formy peňazí', 'ekonómia'],
  ['Bankový systém', 'ekonómia'],
  ['Inflácia', 'ekonómia'],
  ['Hospodársky cyklus, nezamestnanosť a inflácia', 'ekonómia'],
  ['HDP', 'ekonómia'],
  ['Monetárna politika', 'ekonómia'],
  ['Fiškálna politika', 'ekonómia'],
  ['Medzinárodný obchod a menová sústava', 'ekonómia'],
  ['Medzinárodná a európska integrácia', 'inštitúcie'],
  ['Orgány EÚ', 'inštitúcie'],
  ['Sociologické pojmy', 'sociológia', 'obn-soc'],
  ['Judaizmus a islam', 'filozofia a religionistika', 'obn-fil'],
  ['Kresťanstvo', 'filozofia a religionistika', 'obn-fil'],
  ['Hinduizmus a budhizmus', 'filozofia a religionistika', 'obn-fil'],
  ['Družstvá, združovanie podnikov a výrobné faktory podniku', 'ekonómia'],
  ['OSN a OBSE', 'inštitúcie'],
  ['Ústava a ústavný vývoj', 'právo a politológia'],
];

/* --- Občianska — filozofia a religionistika (33) ----------------
   Najväčšia oblasť celej občianskej: 38 % maturitných úloh. */
const OBN_FIL = [
  'Filozofické disciplíny',
  'Mýtus a filozofia, filozofia a náboženstvo',
  'Milétska filozofická škola, arché',
  'Herakleitos, Pytagorejci, Atomisti — „Panta Rhei“',
  'Sofisti a Sokrates — „Viem, že nič neviem“',
  'Platónova filozofia',
  'Aristotelova filozofia',
  'Helenizmus — stoici, epikurejci, novoplatonici',
  'Patristika, Augustín Aurélius',
  'Scholastika, Tomáš Akvinský',
  'Renesančná filozofia — Bruno, Kuzánsky, Rotterdamský, Machiavelli',
  'Empirizmus, F. Bacon',
  'J. Locke — „Tabula Rasa“',
  'Racionalizmus, R. Descartes — „metodická skepsa“',
  'Baruch Spinoza — „Causa sui“',
  'Osvietenstvo — Diderot, Voltaire',
  'Immanuel Kant — „kopernikovský obrat“',
  'G. W. F. Hegel — „Čo je rozumové, to je skutočné“',
  'Karl Marx, filozofia dejín',
  'Pozitivizmus',
  'A. Schopenhauer — „Svet ako vôľa a predstava“',
  'Fenomenológia',
  'Martin Heidegger — bytie a existencia',
  'S. Kierkegaard',
  'Existencializmus, J. P. Sartre',
  'Analytická filozofia a postpozitivizmus — Russell, Popper',
  'Ludwig Wittgenstein — „Hranice môjho jazyka sú hranicami môjho sveta“',
  'F. Nietzsche — „nadčlovek“',
  'Periodizácia západnej filozofie',
  // religionistika
  'Monoteistické náboženstvá, judaizmus a kresťanstvo',
  'Východné náboženstvá — hinduizmus, budhizmus',
  'Kresťanstvo — rozdelenie, tri hlavné vetvy, koncily',
  'Teizmus, deizmus, panteizmus, ateizmus, materializmus a idealizmus',
];

/* --- Občianska — psychológia (5) --------------------------------- */
const OBN_PSY = [
  'Zmyslové klamy, psychické procesy, vnemy, pocity a emócie, myšlienkové operácie',
  'Psychologické smery — psychoanalýza, behaviorizmus, kognitívny a fenomenologický prístup',
  'Temperament — Eysenck, Hippokrates, Jung; schopnosti ako osobnostné predpoklady',
  'Hodnoty, normy, postoje; Maslowova pyramída; motivácia a konflikt motívov',
  'Predmet psychológie, vznik ako vedy, disciplíny, metódy výskumu',
];

/* --- Občianska — sociológia (3) — zatiaľ bez názvov, pozastavené -- */
const OBN_SOC_COUNT = 3;

/* --- Biológia (61 v 9 tematických celkoch) -----------------------
   Od septembra 2026: nová téma 31 (Etológia), staré 31–60 sú teraz 32–61.
   Hodnotenia sa pri prečíslovaní presúvajú s obsahom (migrácia v app.js). */
const BIO = [
  ['Bunka', 'Význam bunkovej teórie, objavy biológov, štruktúra eukaryotickej bunky'],
  ['Bunka', 'Typy buniek — prokaryotická, eukaryotická, rastlinná, živočíšna'],
  ['Bunka', 'Znaky živých organizmov, chemické zloženie bunky'],
  ['Bunka', 'Metabolizmus bunky, anabolizmus a katabolizmus, enzýmy, prenos látok, osmóza'],
  ['Bunka', 'Fázy bunkového cyklu, rozmnožovanie buniek, priebeh mitózy'],
  ['Bunka', 'Porovnanie mitózy a meiózy, diferenciácia pletív'],
  ['Genetika', 'Znak, gén, alela, lokus, genetický kód, funkčné typy génov'],
  ['Genetika', 'Štruktúra DNA a RNA, replikácia, transkripcia, translácia'],
  ['Genetika', 'Objavy v genetike, stavba chromozómu, chromozómová sada, karyotyp'],
  ['Genetika', 'Mendelove zákony, dihybridizmus'],
  ['Genetika', 'Genetické dôsledky meiózy, určenie pohlavia'],
  ['Genetika', 'Dedičnosť viazaná na pohlavie, daltonizmus'],
  ['Genetika', 'Premenlivosť, typy mutácií, dedičné ochorenia'],
  ['Genetika', 'Metódy genetiky človeka, dedičnosť krvných skupín'],
  ['Nebunkové a prokaryotické organizmy', 'Vírusy — stavba, prejavy, ochorenia'],
  ['Nebunkové a prokaryotické organizmy', 'Baktéria, virión a červenoočko — odlišnosti, výživa baktérií'],
  ['Biológia rastlín', 'Rastlinné pletivá, koreň a stonka, metamorfózy'],
  ['Biológia rastlín', 'Vodný režim rastlín'],
  ['Biológia rastlín', 'Výživa rastlín, list ako orgán fotosyntézy, fotosyntéza'],
  ['Biológia rastlín', 'Aeróbne a anaeróbne dýchanie, fotosyntéza a dýchanie rastlín'],
  ['Biológia rastlín', 'Stavba kvetu, súkvetia a plody'],
  ['Biológia rastlín', 'Vegetatívne a pohlavné rozmnožovanie, opelenie, oplodnenie, semeno a plod'],
  ['Systém a fylogenéza rastlín', 'Riasy'],
  ['Systém a fylogenéza rastlín', 'Výtrusné rastliny, rodozmena'],
  ['Systém a fylogenéza rastlín', 'Borovicorasty a magnóliorasty'],
  ['Systém a fylogenéza rastlín', 'Jednoklíčnolistové a dvojklíčnolistové rastliny, čeľade magnóliorastov'],
  ['Huby a lišajníky', 'Miesto húb a lišajníkov v systéme, vreckaté a bazídiové huby'],
  ['Huby a lišajníky', 'Huby a lišajníky vo vzťahu k iným organizmom, plesne, jedlé a jedovaté huby'],
  ['Ekológia / Etológia', 'Ekológia, populácia, spoločenstvo, ekosystém, ekologická valencia'],
  ['Ekológia / Etológia', 'Kolobeh látok a tok energie, ekologické problémy'],
  ['Ekológia / Etológia', 'Pojmy — etológia, významní predstavitelia, typy správania, etológia v praxi'],
  ['Systém živočíchov', 'Prvoky (Protozoa)'],
  ['Systém živočíchov', 'Dvojlistovce — hubky a pŕhlivce'],
  ['Systém živočíchov', 'Prvoústovce — mäkkýše'],
  ['Systém živočíchov', 'Ploskavce a hlístovce'],
  ['Systém živočíchov', 'Obrúčkavce a článkonožce'],
  ['Systém živočíchov', 'Článkonožce ako najdokonalejšie prvoústovce'],
  ['Systém živočíchov', 'Druhoústovce — ostnatokožce a chordáty'],
  ['Systém živočíchov', 'Anamnia — drsnokožce, ryby, obojživelníky'],
  ['Systém živočíchov', 'Amniota — plazy, vtáky, cicavce'],
  ['Systém živočíchov', 'Vrodené a získané správanie živočíchov'],
  ['Biológia živočíchov a človeka', 'Fylogenéza opory tela, kostné tkanivo, spojenia kostí'],
  ['Biológia živočíchov a človeka', 'Časti kostry človeka, ontogenéza kostry, mužská a ženská kostra'],
  ['Biológia živočíchov a človeka', 'Pohybová sústava živočíchov, kostrový sval, svalová sústava človeka'],
  ['Biológia živočíchov a človeka', 'Typy svalových tkanív, kontrakcia, poruchy opornej a pohybovej sústavy'],
  ['Biológia živočíchov a človeka', 'Fylogenéza tráviacej sústavy, tráviace orgány stavovcov'],
  ['Biológia živočíchov a človeka', 'Trávenie a vstrebávanie, správna výživa'],
  ['Biológia živočíchov a človeka', 'Fylogenéza dýchacej sústavy, pľúca, dýchacia sústava človeka'],
  ['Biológia živočíchov a človeka', 'Mechanizmus dýchania, ochorenia dýchacej sústavy'],
  ['Biológia živočíchov a človeka', 'Fylogenéza obehu telových tekutín, stavba srdca'],
  ['Biológia živočíchov a človeka', 'Tepny, žily, vlásočnice, činnosť srdca, krvný tlak'],
  ['Biológia živočíchov a človeka', 'Typy telových tekutín, zložky krvi'],
  ['Biológia živočíchov a človeka', 'Krv, tkanivový mok a miazga, transfúzia, krvné skupiny, imunita'],
  ['Biológia živočíchov a človeka', 'Fylogenéza vylučovacej sústavy, močová sústava človeka'],
  ['Biológia živočíchov a človeka', 'Tvorba moču v nefróne, analýza moču, koža'],
  ['Biológia živočíchov a človeka', 'Fylogenéza nervovej sústavy, nervová sústava človeka'],
  ['Biológia živočíchov a človeka', 'Hormonálne a nervové riadenie, reflexy'],
  ['Biológia živočíchov a človeka', 'Zmyslové orgány, receptory, adaptácia'],
  ['Biológia živočíchov a človeka', 'Sluch, stavba a funkcia oka, poruchy zraku'],
  ['Biológia živočíchov a človeka', 'Pohlavná sústava muža a ženy, menštruačný cyklus, vývin dieťaťa'],
  ['Biológia živočíchov a človeka', 'Pohlavné a nepohlavné rozmnožovanie, embryonálny vývin'],
];

/* --- Angličtina (30) --------------------------------------------
   Pri angličtine sa nevybavujú fakty — karta ukáže jednu náhodnú otázku
   a hovorí sa nahlas 90 sekúnd. Otázky sa dajú dopĺňať priamo v appke
   (Témy → klik na tému). Čísla bez názvu sú zatiaľ `Doplniť`, pozastavené. */
const ANJ_COUNT = 30;
const ANJ = {
  15: ['Family', [
    'Describe your family.',
    'What are the advantages of a large family?',
    'Are family values changing in Slovakia? Why?',
    'Should grandparents live with their children?',
  ]],
  16: ['Culture and Art', []],
  17: ['Sport and Games', []],
  18: ['Housing', []],
  19: ['Food and Drinks', []],
  20: ['Shopping and Services', []],
  21: ['Banking and Finances', []],
  22: ['Health Care', []],
  24: ['Jobs', []],
  25: ['Human Relationships', []],
  28: ['Communication', []],
  29: ['Learning Languages', []],
};

/* --- Zostavenie katalógu ----------------------------------------- */
const pad = (n) => String(n).padStart(2, '0');

const TOPICS = [
  ...SJL.map(([title, rozsah], i) => ({ id: `sjl-${pad(i + 1)}`, subject: 'sjl', num: i + 1, title, rozsah })),

  ...OBN_POL.map((title, i) => ({
    id: `obn-pol-${pad(i + 1)}`, subject: 'obn-pol', num: i + 1,
    title, oblast: 'právo a politológia',
  })),

  ...OBN_EKO.map(([title, oblast, dup], i) => ({
    id: `obn-eko-${pad(i + 1)}`, subject: 'obn-eko', num: i + 1, title, oblast,
    ...(dup && { dup }),
  })),

  ...OBN_FIL.map((title, i) => ({
    id: `obn-fil-${pad(i + 1)}`, subject: 'obn-fil', num: i + 1, title,
    oblast: 'filozofia a religionistika', tc: i < 29 ? 'Filozofia' : 'Religionistika',
  })),

  ...OBN_PSY.map((title, i) => ({
    id: `obn-psy-${pad(i + 1)}`, subject: 'obn-psy', num: i + 1, title, oblast: 'psychológia',
  })),

  ...Array.from({ length: OBN_SOC_COUNT }, (_, i) => ({
    id: `obn-soc-${pad(i + 1)}`, subject: 'obn-soc', num: i + 1,
    title: PLACEHOLDER, oblast: 'sociológia', paused: true,
  })),

  /* vetva: seminár 29–31 a 42–61, štvorhodinovka 1–28 a 32–41.
     Téma 41 je sporná — zatiaľ štvorhodinovka, treba overiť. */
  ...BIO.map(([tc, title], i) => {
    const num = i + 1;
    const seminar = (num >= 29 && num <= 31) || num >= 42;
    return { id: `bio-${pad(num)}`, subject: 'bio', num, title, tc,
             vetva: seminar ? 'seminár' : 'štvorhodinovka', ...(num === 41 && { sporna: true }) };
  }),

  ...Array.from({ length: ANJ_COUNT }, (_, i) => {
    const num = i + 1;
    const [title, otazky] = ANJ[num] || [PLACEHOLDER, []];
    return { id: `anj-${pad(num)}`, subject: 'anj', num, title, otazky, ...(!ANJ[num] && { paused: true }) };
  }),
];

const BIO_TC = [...new Set(BIO.map(([tc]) => tc))];
