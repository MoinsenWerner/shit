# SUBMARK – 3D-Code-Generator

Ein lokaler QR-Code-Generator für bemaßte Vorschauen und DXF-Skizzen. Text, URLs, WLAN-Daten und
vCards werden mit Fehlerkorrekturstufe H kodiert. Modulgröße, Ruhezone, Gesamtmaß
und die vorgesehene Präge-Höhe von 0,1 mm werden in der Vorschau angegeben. Der
DXF-Download enthält geschlossene, in Millimetern angelegte QR-Konturen auf dem
Layer `QR_MODULES`. Er lässt sich in SolidWorks als 2D-Skizze öffnen oder in eine
bestehende Skizze importieren und anschließend auftragen beziehungsweise ausschneiden.

## Unter Windows starten

1. Den Ordner `3d-invis-code-generator` öffnen.
2. In die Adresszeile des Explorers `cmd` eingeben und Enter drücken.
3. Den Generator starten:

```bash
python app.py
```

Der Generator öffnet sich automatisch im Standardbrowser. Zum Beenden im
Konsolenfenster `Strg+C` drücken. Abgesehen von Python 3 werden zum Starten weder
Node.js noch zusätzliche Python-Pakete benötigt.

Optionale Parameter:

```bash
python app.py --port 9000
python app.py --no-browser
```

Die JavaScript-Werkzeuge werden nur für die Weiterentwicklung und die Tests
benötigt (`npm install`, `npm test`, `npm run lint`, `npm run build`).

> **Wichtig:** Eine 0,1-mm-Prägung in halbtransparentem Material ist physikalisch
> nicht unter allen Licht-, Material- und Kamera-Bedingungen zuverlässig lesbar.
> Vor der Serienfertigung sind Probedrucke mit dem endgültigen Material nötig.
> Matte Oberflächen, Streiflicht und eine dunkle Rückseite erhöhen den Kontrast.
