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
  { key: 'obn-eko', name: 'Občianska — ekonómia', short: 'OBN-EKO' },
  { key: 'bio',     name: 'Biológia', short: 'BIO' },
  { key: 'anj',     name: 'Angličtina', short: 'ANJ' },
];

const PLACEHOLDER = 'Doplniť';

/* --- Slovenský jazyk a literatúra (30) --------------------------- */
const SJL = [
  'Slohové postupy · Sylabický veršový systém',
  'Štýlotvorné činitele · Poviedka',
  'Jazykové štýly · Sylabicko-tonický veršový systém',
  'Slovné druhy · Epická poézia',
  'Slovesá · Román',
  'Prídavné mená · Sonet, lyrika',
  'Viacslovné pomenovania · Dramatická literatúra',
  'Zvukové javy reči · Časomerný veršový systém',
  'Jednoduchá veta · Vnútorný monológ, novela',
  'Slovanské jazyky, vznik slovenčiny · Druhy lyriky',
  'Obohacovanie slovnej zásoby · Komédia',
  'Lexikografia · Sociálny román',
  'Vetné členy · Psychologický román',
  'Umelecký a odborný štýl · Voľný verš',
  'Spôsoby spracovania textu · Próza naturizmu',
  'Charakteristika · Tragédia',
  'Zvuková rovina jazyka · Literárna moderna',
  'Súvetia · Experiment v próze, literatúra absurdity',
  'Slovná zásoba · Avantgarda, automatický text, expresionizmus v próze',
  'Formy logického myslenia · Absurdná dráma',
  'Formy národného jazyka · Retrospektívny kompozičný postup',
  'Komunikácia · Súčasná lyrická poézia',
  'Výklad a úvaha · Postmoderna v epickej próze',
  'Publicistický štýl · Totalitný režim v literatúre',
  'Administratívny štýl · Literárna moderna a avantgardy',
  'Druhy opisu · Typy literárnych postáv',
  'Indoeurópske jazyky · Láska v literatúre',
  'Hovorový štýl · Konanie mladého človeka',
  'Podstatné mená · Antika, humanizmus, renesancia, epos',
  'Rečnícky štýl · Staroslovienska literatúra',
];

/* --- Občianska — politológia a právo (28) ------------------------ */
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
];

/* --- Občianska — ekonómia (22) ----------------------------------- */
const OBN_EKO = [
  'Dejiny ekonomických teórií',
  'Klasická, neoklasická a marxistická ekonomická teória',
  'Moderné ekonomické teórie',
  'Potreby, statky, trh',
  'Trhový mechanizmus',
  'Konkurencia',
  'Nedokonalosti trhu a elasticita dopytu',
  'Výrobné faktory',
  'Trh práce, nezamestnanosť, mzda a produktivita práce',
  'Podnik, živnosti',
];

/* --- Biológia (60 v 9 tematických celkoch) ----------------------- */
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
  ['Ekológia', 'Ekológia, populácia, spoločenstvo, ekosystém, ekologická valencia'],
  ['Ekológia', 'Kolobeh látok a tok energie, ekologické problémy'],
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

/* --- Zostavenie katalógu ----------------------------------------- */
const pad = (n) => String(n).padStart(2, '0');

const TOPICS = [
  ...SJL.map((title, i) => ({ id: `sjl-${pad(i + 1)}`, subject: 'sjl', num: i + 1, title })),

  ...Array.from({ length: 28 }, (_, i) => ({
    id: `obn-pol-${pad(i + 1)}`, subject: 'obn-pol', num: i + 1,
    title: OBN_POL[i] || PLACEHOLDER,
    paused: i >= OBN_POL.length,
  })),

  ...Array.from({ length: 22 }, (_, i) => ({
    id: `obn-eko-${pad(i + 1)}`, subject: 'obn-eko', num: i + 1,
    title: OBN_EKO[i] || PLACEHOLDER,
    paused: i >= OBN_EKO.length,
  })),

  ...BIO.map(([tc, title], i) => ({ id: `bio-${pad(i + 1)}`, subject: 'bio', num: i + 1, title, tc })),

  ...Array.from({ length: 30 }, (_, i) => ({
    id: `anj-${pad(i + 1)}`, subject: 'anj', num: i + 1,
    title: PLACEHOLDER, paused: true,
  })),
];

const BIO_TC = [...new Set(BIO.map(([tc]) => tc))];
