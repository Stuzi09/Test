# Nevio

STUWax, ein Skiwachs-Rechner mit Infos zu Flüssigwachs, Base, Race Wax und Fishscale. Schneetemperatur oder Wetter eingeben, du bekommst die passende Wachsfarbe mit Fluor-Hinweis.

## Starten

Keine Abhängigkeiten. `index.html` im Browser öffnen, oder die Dateien auf einen statischen Server legen (z. B. GitHub Pages).

## Tests

    node --test wax.test.js

## Dateien

- `wax.js` – Logik: Temperaturgrenzen, Wetter-Schätzung, Nassschnee-Regel
- `app.js` – Formular und Anzeige
- `index.html`, `styles.css` – Oberfläche
- `wax.test.js` – Tests für die Logik

## Annahmen

- Farbgrenzen sind Richtwerte (Gelb ab -2 °C, Rot -2 bis -5, Violett -5 bis -10, Blau -10 bis -20, Grün unter -20). Sie stehen in `CLASSES` in `wax.js` und lassen sich dort anpassen.
- Ohne Schneetemperatur wird sie aus der Lufttemperatur geschätzt: sonnig +0 °C, bewölkt -1 °C, klarer Himmel/Nacht -3 °C.
- Nass wird manuell angekreuzt oder automatisch erkannt (Luftfeuchte ab 90 % bei Lufttemperatur ab -3 °C). Dann ein Wachs eine Stufe wärmer und Fluor.
