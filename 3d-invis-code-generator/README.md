# SUBMARK – 3D-Code-Generator

Ein lokaler QR-Code-Generator für bemaßte SVG-Skizzen. Text, URLs, WLAN-Daten und
vCards werden mit Fehlerkorrekturstufe H kodiert. Modulgröße, Ruhezone, Gesamtmaß
und die vorgesehene Präge-Höhe von 0,1 mm werden in der Exportdatei angegeben.

```bash
npm install
npm run dev
```

Für eine Produktionsversion:

```bash
npm run build
npm run preview
```

> **Wichtig:** Eine 0,1-mm-Prägung in halbtransparentem Material ist physikalisch
> nicht unter allen Licht-, Material- und Kamera-Bedingungen zuverlässig lesbar.
> Vor der Serienfertigung sind Probedrucke mit dem endgültigen Material nötig.
> Matte Oberflächen, Streiflicht und eine dunkle Rückseite erhöhen den Kontrast.
