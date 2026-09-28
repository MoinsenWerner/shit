import QRCode from 'qrcode';
import { createDrawingSvg, formatMm, getGeometry } from './geometry.js';
import './style.css';

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#"><span class="brand-mark"><i></i><i></i><i></i><i></i></span><span>SUBMARK</span></a>
    <div class="status"><span></span> Lokal verarbeitet</div>
    <a class="help" href="#hinweise">Druckhinweise <b>↗</b></a>
  </header>
  <main>
    <section class="intro">
      <div class="eyebrow">3D / QR PRÄGUNG</div>
      <h1>Codes, die unter<br>der <em>Oberfläche</em> leben.</h1>
      <p>Erzeuge eine präzise, bemaßte QR-Skizze für unauffällige 0,1-mm-Prägungen im 3D-Druck.</p>
    </section>

    <section class="workspace">
      <div class="panel input-panel">
        <div class="panel-heading"><span>01</span><div><h2>Inhalt & Parameter</h2><p>Was soll dein Code enthalten?</p></div></div>
        <label for="content">TEXT ODER URL <output id="charCount">25 / 1200</output></label>
        <textarea id="content" maxlength="1200" rows="5" spellcheck="false">https://example.com/produkt</textarea>
        <div class="quick"><span>SCHNELLWAHL</span><button data-value="https://">URL</button><button data-value="WIFI:S:Netzwerk;T:WPA;P:Passwort;;">WLAN</button><button data-value="BEGIN:VCARD\nVERSION:3.0\nFN:Name\nTEL:+49\nEND:VCARD">VCARD</button><button data-value="mailto:">E-MAIL</button></div>
        <hr>
        <div class="field-row">
          <div><label for="moduleSize">MODULGRÖSSE <span class="tip">i</span></label><p>Breite eines QR-Pixels</p></div>
          <div class="number"><input id="moduleSize" type="number" value="0.8" min="0.4" max="2" step="0.1"><span>mm</span></div>
        </div>
        <input id="moduleRange" class="range" type="range" value="0.8" min="0.4" max="2" step="0.1">
        <div class="range-labels"><span>0,4 mm</span><span>2,0 mm</span></div>
        <div class="field-row height-row"><div><label>PRÄGEHÖHE</label><p>Fest eingestellt</p></div><strong>0,10 <small>mm</small></strong></div>
        <div class="note"><span>◐</span><p><b>Kontrast-Hinweis</b>Bei halbtransparentem Material ist seitliches Licht oder dunkles Hinterlegen entscheidend. Eine reine 0,1-mm-Prägung ist nicht unter allen Bedingungen scanbar.</p></div>
      </div>

      <div class="panel preview-panel">
        <div class="panel-heading"><span>02</span><div><h2>Technische Skizze</h2><p>Live-Vorschau · Maßstab 1:1</p></div><div class="zoom"><button id="zoomOut">−</button><output id="zoomValue">100%</output><button id="zoomIn">＋</button></div></div>
        <div class="canvas-wrap"><div id="drawing" class="drawing" aria-live="polite"></div></div>
        <div class="metrics">
          <div><span>GESAMTMASS</span><strong id="totalSize">—</strong></div>
          <div><span>RASTER</span><strong id="gridSize">—</strong></div>
          <div><span>RUHEZONE</span><strong id="quietSize">—</strong></div>
          <div><span>PRÄGUNG</span><strong>0,10 mm</strong></div>
        </div>
        <button id="download" class="download"><span>↓</span><div><b>SVG-SKIZZE HERUNTERLADEN</b><small>Vektor · Maße in Millimeter · CAD-kompatibel</small></div><i>↗</i></button>
      </div>
    </section>

    <section id="hinweise" class="guide">
      <div><span>03</span><h2>Damit der Code<br><em>lesbar</em> bleibt.</h2></div>
      <ol><li><b>01</b><div><strong>Flache Lage</strong><p>Code nicht über Rundungen legen und die Ruhezone freihalten.</p></div></li><li><b>02</b><div><strong>Kontrast erzeugen</strong><p>Matte Oberfläche, Streiflicht oder dunkle Rückseite helfen der Kamera.</p></div></li><li><b>03</b><div><strong>Probedruck scannen</strong><p>Mit mehreren Handys und realem Licht testen, bevor du in Serie gehst.</p></div></li></ol>
    </section>
  </main>
  <footer><span>SUBMARK / 3D CODE TOOL</span><span>QR · EC LEVEL H · ISO/IEC 18004</span></footer>
`;

const content = document.querySelector('#content');
const moduleInput = document.querySelector('#moduleSize');
const moduleRange = document.querySelector('#moduleRange');
const drawing = document.querySelector('#drawing');
let currentSvg = '';
let zoom = 1;

async function render() {
  const text = content.value || ' ';
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const matrix = Array.from({ length: qr.modules.size }, (_, y) =>
    Array.from({ length: qr.modules.size }, (_, x) => qr.modules.get(x, y))
  );
  const size = Number(moduleInput.value);
  const geometry = getGeometry(qr.modules.size, size);
  currentSvg = createDrawingSvg(matrix, size);
  drawing.innerHTML = currentSvg;
  drawing.style.transform = `scale(${zoom})`;
  document.querySelector('#charCount').value = `${content.value.length} / 1200`;
  document.querySelector('#totalSize').textContent = `${formatMm(geometry.totalSize)} × ${formatMm(geometry.totalSize)}`;
  document.querySelector('#gridSize').textContent = `${qr.modules.size} × ${qr.modules.size}`;
  document.querySelector('#quietSize').textContent = formatMm(geometry.quietZone);
}

function setSize(value) {
  const safe = Math.min(2, Math.max(0.4, Number(value) || 0.8));
  moduleInput.value = safe.toFixed(1);
  moduleRange.value = safe;
  render();
}

content.addEventListener('input', render);
moduleInput.addEventListener('change', (event) => setSize(event.target.value));
moduleRange.addEventListener('input', (event) => setSize(event.target.value));
document.querySelectorAll('.quick button').forEach((button) => button.addEventListener('click', () => {
  content.value = button.dataset.value;
  content.focus();
  render();
}));
document.querySelector('#zoomOut').addEventListener('click', () => { zoom = Math.max(0.6, zoom - 0.1); updateZoom(); });
document.querySelector('#zoomIn').addEventListener('click', () => { zoom = Math.min(1.5, zoom + 0.1); updateZoom(); });
function updateZoom() {
  drawing.style.transform = `scale(${zoom})`;
  document.querySelector('#zoomValue').value = `${Math.round(zoom * 100)}%`;
}
document.querySelector('#download').addEventListener('click', () => {
  const blob = new Blob([currentSvg], { type: 'image/svg+xml' });
  const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'submark-qr-skizze.svg' });
  link.click();
  URL.revokeObjectURL(link.href);
});

render();
