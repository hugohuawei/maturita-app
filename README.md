# Maturita 2027

Denný retrieval naprieč 170 maturitnými témami. Statická stránka, bez backendu,
bez prihlasovania, bez externých volaní. Stav v `localStorage`.

## Obrazovky

- **Dnes** — jedna karta, jedna téma. `1` = Viem · `2` = Čiastočne · `3` = Neviem · `medzerník` = časovač · `r` = ukázať rozsah
- **Prehľad** — rozdelenie po predmetoch a bio celkoch, tempo, odhad dĺžky kola, graf V-tém
- **Témy** — všetkých 170, filter podľa predmetu a známky, ručné hodnotenie, pozastavenie, poznámka, premenovanie, rozsah témy
- **N** — pracovný zoznam na štvrtok, zoradený podľa toho, ako dlho je téma v N
- **Systém** — rozvrh, protokoly, šablóna, fázy roka + nastavenia a export/import

## Radenie

Jeden front. Po ohodnotení sa téma vráti do frontu:

| Známka | Pozícia |
|---|---|
| V | úplný koniec |
| Č | ≈ 1/3 dĺžky frontu |
| N | 5. od začiatku |

Nehodnotené témy stoja na začiatku. Pozastavené sa v kole preskakujú, ale
z frontu nevypadnú.

### Mapovacie kolo

Prepínač v Systéme → Kolo. Keď je zapnutý, známky sa ukladajú, ale téma sa
**nepreraďuje** — front ostáva nedotknutý a témy idú striktne v poradí podľa
čísla, kolo za kolom. Slúži na prvé zmapovanie, čo vieš. Na obrazovke Dnes to
označuje štítok `mapovanie`. Po vypnutí platí normálny algoritmus.

## Rozsah témy

SJL témy nesú pole `rozsah` — autorov a diela. Na karte pri retrievale sa
**nezobrazuje**, aby si si nedával nápovedu. Uvidíš ho:

- po ohodnotení V/Č/N (karta sa zastaví a ukáže ho, potom „Ďalej")
- keď sám klikneš na nenápadné **„Ukázať rozsah"** pod kartou (klávesa `r`)
- vždy v detaile témy na obrazovke Témy

Ak si rozsah odkryl sám, karta sa po hodnotení nezastavuje.

## Katalóg

`js/catalog.js` sú čisté dáta, oddelené od stavu. Novú tému stačí dopísať do
tabuľky — pri načítaní sa spáruje podľa `id` a vloží na začiatok frontu,
existujúci postup zostane. Témy `Doplniť` (OBN 11+, ANJ 1–30) sú založené ako
pozastavené; premenovať ich vieš aj priamo v appke (Témy → klik na tému).

## Verzia a aktualizácia

Systém → dole je riadok `Verzia vN · dátum`. To je verzia kódu, ktorý práve
beží — ak sedí s poslednou nasadenou, máš aktuálnu appku.

Vedľa je **Skontrolovať aktualizáciu**: zmaže cache service workera a načíta
appku odznova. Postup v `localStorage` sa nedotýka.

Pri každom nasadení zvýš **obe** miesta naraz: `BUILD` v `js/app.js`
a `V` v `sw.js`. Bez toho si prehliadač nechá starú verziu v cache.

## Prenos medzi zariadeniami

Systém → Dáta → **Exportovať JSON** / **Importovať JSON**, prípadne cez schránku.
Žiadna synchronizačná služba.

## Lokálne spustenie

```
node .claude/serve.mjs
```

Potom `http://localhost:8321`.

## Nasadenie

Nahraj obsah priečinka na ľubovoľný statický hosting (GitHub Pages, Netlify).
Musí bežať cez `https://` (alebo `localhost`), inak sa nezaregistruje service
worker a appka nebude fungovať offline.

Na iPhone: otvor URL v Safari → Zdieľať → **Pridať na plochu**.
