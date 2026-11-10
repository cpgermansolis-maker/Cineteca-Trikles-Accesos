/* Cineteca Trikles · Accesos — funciones compartidas (sitio del cliente y modo staff) */

// URL del Apps Script publicado (Web App). Si se vuelve a publicar con "Nueva implementación", cambia aquí.
const API_URL = 'https://script.google.com/macros/s/AKfycbyZsT2_YsUTcyUj_RO986DtwA4IEdZcdiPxOhwzkQWVjrExJQUvEviAz7oqhJLmW_Bu/exec';
const SEDES = ['Tlaxcala', 'Puebla'];
const TZ = 'America/Mexico_City';

/* ---------- llamadas al servidor ---------- */
let _cargas = 0;
function cargando(on) {
  _cargas += on ? 1 : -1;
  const l = document.getElementById('loader');
  if (l) l.classList.toggle('on', _cargas > 0);
}
async function api(action, datos, opts) {
  opts = opts || {};
  if (!opts.silencio) cargando(true);
  try {
    const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action }, datos || {})) });
    const j = await r.json();
    if (j && j.error === 'SESION' && typeof window.alExpirar === 'function') window.alExpirar(j.msg);
    return j;
  } catch (e) {
    console.error(e);
    return { ok: false, error: 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.' };
  } finally { if (!opts.silencio) cargando(false); }
}

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function toast(msg, ms) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), ms || 2600);
}
function partesMx() {
  const p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false })
    .formatToParts(new Date()).forEach(x => p[x.type] = x.value);
  return { fecha: p.year + '-' + p.month + '-' + p.day, hora: Number(p.hour) % 24 };
}
function edadDe(nac) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nac || '')) return null;
  const hoy = partesMx().fecha;
  let e = Number(hoy.slice(0, 4)) - Number(nac.slice(0, 4));
  if (hoy.slice(5) < nac.slice(5)) e--;
  return e;
}
function fechaBonita(iso) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso || '')) return iso || '';
  const m = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return Number(iso.slice(8, 10)) + ' ' + m[Number(iso.slice(5, 7)) - 1] + ' ' + iso.slice(0, 4) + (iso.length > 10 ? ' · ' + iso.slice(11, 16) : '');
}
function telBonito(t) { t = String(t || ''); return t.length === 10 ? t.slice(0, 3) + ' ' + t.slice(3, 6) + ' ' + t.slice(6) : t; }

/* ---------- credencial (se dibuja en un canvas para poder guardarla como imagen) ---------- */
function cargarImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function redondeado(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function espaciado(ctx, px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }
function lineas(ctx, txt, max) {
  const pal = String(txt).split(/\s+/), out = []; let l = '';
  pal.forEach(p => { const prueba = l ? l + ' ' + p : p; if (ctx.measureText(prueba).width > max && l) { out.push(l); l = p; } else l = prueba; });
  if (l) out.push(l);
  return out;
}
/** Regresa un dataURL PNG (900×1400) con la credencial del cliente. c = {id_cliente, nombre, foto, sede_registro} */
async function dibujarCredencial(c) {
  try { await Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 28px Montserrat'), document.fonts.load('400 28px Montserrat')]); } catch (_) { }
  const W = 900, H = 1400, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const ORO = '#c8a24a', HUESO = '#f1ece0';
  // fondo
  x.fillStyle = '#0c0c0e'; x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(W / 2, 0, 50, W / 2, 0, 900); g.addColorStop(0, 'rgba(200,162,74,.22)'); g.addColorStop(1, 'rgba(200,162,74,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = ORO; x.lineWidth = 3; redondeado(x, 26, 26, W - 52, H - 52, 34); x.stroke();
  x.strokeStyle = 'rgba(200,162,74,.35)'; x.lineWidth = 1; redondeado(x, 40, 40, W - 80, H - 80, 26); x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  // marca
  x.fillStyle = ORO; x.font = '84px Anton'; espaciado(x, 6); x.fillText('CINETECA TRIKLES', W / 2, 160);
  x.fillStyle = HUESO; x.font = '400 26px Montserrat'; espaciado(x, 10); x.fillText('LA CASA DEL ARTE', W / 2, 205);
  espaciado(x, 0);
  x.fillStyle = ORO; x.fillRect(W / 2 - 60, 232, 120, 3);
  // foto
  const F = 340, fx = (W - F) / 2, fy = 270;
  x.save(); redondeado(x, fx, fy, F, F, 28); x.clip();
  if (c.foto) {
    try {
      const im = await cargarImg(c.foto), s = Math.max(F / im.width, F / im.height);
      x.drawImage(im, fx + (F - im.width * s) / 2, fy + (F - im.height * s) / 2, im.width * s, im.height * s);
    } catch (_) { c.foto = ''; }
  }
  if (!c.foto) {
    x.fillStyle = '#202026'; x.fillRect(fx, fy, F, F);
    x.fillStyle = ORO; x.font = '150px Anton';
    x.fillText(String(c.nombre || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase(), W / 2, fy + F / 2 + 55);
  }
  x.restore();
  x.strokeStyle = ORO; x.lineWidth = 5; redondeado(x, fx, fy, F, F, 28); x.stroke();
  // nombre
  x.fillStyle = HUESO; let tam = 60; x.font = tam + 'px Anton';
  let ls = lineas(x, String(c.nombre || '').toUpperCase(), W - 160);
  if (ls.length > 2) { tam = 48; x.font = tam + 'px Anton'; ls = lineas(x, String(c.nombre || '').toUpperCase(), W - 160).slice(0, 2); }
  let y = fy + F + 80;
  ls.forEach(l => { x.fillText(l, W / 2, y); y += tam + 8; });
  // número de cliente
  y += 6;
  x.fillStyle = '#9a978f'; x.font = '600 22px Montserrat'; espaciado(x, 6); x.fillText('CLIENTE No.', W / 2, y); espaciado(x, 0);
  x.fillStyle = ORO; x.font = '52px Anton'; espaciado(x, 4); x.fillText(c.id_cliente, W / 2, y + 58); espaciado(x, 0);
  // QR
  const Q = 380, qx = (W - Q) / 2, qy = H - Q - 130;
  x.fillStyle = '#fff'; redondeado(x, qx - 20, qy - 20, Q + 40, Q + 40, 24); x.fill();
  const qr = await cargarImg(await QRCode.toDataURL(c.id_cliente, { width: Q * 2, margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0c0c0e', light: '#ffffff' } }));
  x.imageSmoothingEnabled = false; x.drawImage(qr, qx, qy, Q, Q); x.imageSmoothingEnabled = true;
  // pie
  x.fillStyle = '#9a978f'; x.font = '500 22px Montserrat';
  x.fillText('Presenta este QR en la entrada' + (c.sede_registro ? ' · Registro: ' + c.sede_registro : ''), W / 2, H - 70);
  return cv.toDataURL('image/png');
}
function nombreArchivo(c) { return 'Credencial-Trikles-' + c.id_cliente + '.png'; }
function descargar(dataUrl, nombre) {
  const a = document.createElement('a'); a.href = dataUrl; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
}
/** Comparte la imagen (en celular abre WhatsApp, etc.). Si el navegador no puede, la descarga. */
async function compartirImagen(dataUrl, nombre, texto) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const f = new File([blob], nombre, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: texto }); return true; }
  } catch (e) { if (e && e.name === 'AbortError') return true; }
  descargar(dataUrl, nombre); toast('Se descargó la imagen. Ahora puedes enviarla por WhatsApp.');
  return false;
}
/** Achica una foto (File o dataURL) a máx 640px y la regresa como JPEG dataURL (~60 KB). */
async function achicarFoto(src, max) {
  max = max || 640;
  const url = typeof src === 'string' ? src : await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(src); });
  const im = await cargarImg(url);
  const s = Math.min(1, max / Math.max(im.width, im.height));
  const cv = document.createElement('canvas'); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s);
  cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/jpeg', 0.82);
}
