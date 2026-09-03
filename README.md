# Maturita 2027

Denný retrieval naprieč 170 maturitnými témami. Statická stránka, bez backendu,
bez prihlasovania, bez externých volaní. Stav v `localStorage`.

## Obrazovky

- **Dnes** — jedna karta, jedna téma. `1` = Viem · `2` = Čiastočne · `3` = Neviem · `medzerník` = časovač
- **Prehľad** — rozdelenie po predmetoch a bio celkoch, tempo, odhad dĺžky kola, graf V-tém
- **Témy** — všetkých 170, filter podľa predmetu a známky, ručné hodnotenie, pozastavenie, poznámka, premenovanie
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

## Katalóg

`js/catalog.js` sú čisté dáta, oddelené od stavu. Novú tému stačí dopísať do
tabuľky — pri načítaní sa spáruje podľa `id` a vloží na začiatok frontu,
existujúci postup zostane. Témy `Doplniť` (OBN 11+, ANJ 1–30) sú založené ako
pozastavené; premenovať ich vieš aj priamo v appke (Témy → klik na tému).

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
