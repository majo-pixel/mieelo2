/**
 * INTERFAZ WEB — Generador de imágenes mi eelo
 * Ejecutar: node app.js
 * Abrir en navegador: http://localhost:3000
 *
 * MODOS:
 *  - Texto → imagen (nano-banana-2): genera desde cero con guías de estilo
 *  - Mi foto → nueva imagen (flux img2img): usa tu foto como base y la transforma
 */

import http from "http";
import fs from "fs";
import path from "path";
import * as fal from "@fal-ai/serverless-client";

// Carga .env si existe
try {
  const envFile = fs.readFileSync(path.join(import.meta.dirname, ".env"), "utf8");
  envFile.split("\n").forEach(line => {
    const [key, ...val] = line.split("=");
    if (key && val.length) process.env[key.trim()] = val.join("=").trim();
  });
} catch {}

const FAL_KEY = process.env.FAL_KEY || "";
if (FAL_KEY) fal.config({ credentials: FAL_KEY });

const GUIAS = {
  artesana: { nombre: "Artesana en taller", prompt: "Guatemalan woman artisan in a workshop, weaving or sewing leather bags, natural light from a window, warm tones, hands visible, focused expression, mi eelo brand, editorial fashion photography, film grain, warm golden hour light, authentic documentary style", negativo: "artificial background, white studio, filters, heavy editing, western fashion" },
  bolsa: { nombre: "Producto — Bolsa", prompt: "handcrafted leather bag made in Guatemala, on a natural linen surface, minimal styling, product photography, clean, warm neutral background, soft shadows, high detail texture, artisan craftsmanship, mi eelo brand", negativo: "plastic, synthetic materials, harsh flash, white seamless background, cluttered" },
  proceso: { nombre: "Proceso de creación", prompt: "close-up of hands stitching or cutting leather in a Guatemalan artisan workshop, tools visible, natural textures, documentary photography, macro details, warm workshop lighting, authentic, raw beauty", negativo: "studio, artificial light, gloves, fake, stock photo look" },
  coleccion: { nombre: "Campaña de colección", prompt: "Guatemalan woman wearing or carrying a handcrafted leather bag, outdoor setting in Guatemala City or a colonial street, confident pose, fashion editorial, warm afternoon light, film photography aesthetic, muted warm palette, mi eelo", negativo: "cold tones, heavy makeup, fashion model stereotype, generic" },
  textura: { nombre: "Textura de cuero", prompt: "close-up texture of genuine leather, natural grain visible, warm terracotta or brown tones, artisan quality, macro photography, extreme detail, warm tones, tactile feeling, craft", negativo: "synthetic, plastic, cold colors" },
  impacto: { nombre: "Comunidad / Impacto", prompt: "group of Guatemalan women artisans smiling together in a workshop, community feeling, bags and tools visible, authentic documentary, warm group portrait, natural light, joy, empowerment", negativo: "staged, stock photo, corporate, artificial" }
};

// ─── HTML ─────────────────────────────────────────────────────────────────────

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Generador de Imágenes — mi eelo</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; background: #1a1714; color: #f0ebe5; min-height: 100vh; padding: 2rem 1rem; }
  .container { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 1.8rem; font-weight: 400; letter-spacing: 0.05em; margin-bottom: 0.3rem; }
  h1 em { color: #C97B5A; font-style: italic; }
  .subtitle { color: #999; font-size: 0.85rem; margin-bottom: 2rem; letter-spacing: 0.1em; text-transform: uppercase; }

  /* Tabs modo */
  .modos { display: flex; gap: 0; margin-bottom: 1.5rem; border: 1px solid #3a3632; border-radius: 6px; overflow: hidden; }
  .modo-btn { flex: 1; padding: 0.85rem; background: #252220; border: none; color: #aaa; cursor: pointer; font-family: inherit; font-size: 0.85rem; letter-spacing: 0.08em; text-transform: uppercase; transition: all 0.2s; }
  .modo-btn.activo { background: #C97B5A; color: white; }
  .modo-btn:not(:last-child) { border-right: 1px solid #3a3632; }

  .panel { background: #252220; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; }
  .panel h2 { font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: #777; margin-bottom: 1.2rem; }

  /* Key */
  .key-bar { display: flex; gap: 0.5rem; align-items: center; background: #252220; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1rem; }
  .key-bar label { font-size: 0.75rem; letter-spacing: 0.08em; color: #aaa; text-transform: uppercase; white-space: nowrap; }
  .key-bar input { flex: 1; background: #1a1714; border: 1px solid #3a3632; border-radius: 4px; color: #f0ebe5; padding: 0.5rem 0.75rem; font-family: inherit; font-size: 0.85rem; }
  .key-bar input:focus { outline: none; border-color: #C97B5A; }
  .btn-sm { padding: 0.5rem 1rem; background: #3a3632; border: 1px solid #555; border-radius: 4px; color: #ccc; cursor: pointer; white-space: nowrap; font-family: inherit; font-size: 0.8rem; }
  .btn-sm:hover { border-color: #C97B5A; color: #C97B5A; }
  .key-ok { color: #7ab87a; font-size: 0.8rem; }

  /* Guías */
  .guias { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.6rem; margin-bottom: 1.2rem; }
  .guia-btn { padding: 0.65rem 1rem; background: #1a1714; border: 1px solid #3a3632; border-radius: 6px; color: #ccc; cursor: pointer; text-align: left; font-family: inherit; font-size: 0.85rem; transition: all 0.2s; }
  .guia-btn:hover, .guia-btn.activo { border-color: #C97B5A; color: #C97B5A; background: #2a1f15; }
  .guia-btn .icon { font-size: 1.1rem; margin-right: 0.4rem; }

  label { display: block; font-size: 0.75rem; letter-spacing: 0.08em; color: #aaa; margin-bottom: 0.4rem; text-transform: uppercase; }
  textarea, input[type=text], select { width: 100%; background: #1a1714; border: 1px solid #3a3632; border-radius: 4px; color: #f0ebe5; padding: 0.7rem; font-family: inherit; font-size: 0.9rem; margin-bottom: 1rem; }
  textarea:focus, input[type=text]:focus, select:focus { outline: none; border-color: #C97B5A; }
  textarea { resize: vertical; min-height: 70px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media (max-width: 600px) { .row { grid-template-columns: 1fr; } }

  /* Upload zona */
  .upload-zona { border: 2px dashed #3a3632; border-radius: 8px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 1rem; background: #1a1714; }
  .upload-zona:hover, .upload-zona.drag-over { border-color: #C97B5A; background: #2a1f15; }
  .upload-zona p { color: #777; font-size: 0.875rem; margin-top: 0.5rem; }
  .upload-zona .icono { font-size: 2.5rem; }
  .preview-wrap { position: relative; display: inline-block; margin-top: 1rem; }
  .preview-wrap img { max-width: 100%; max-height: 220px; border-radius: 6px; display: block; }
  .preview-wrap .btn-quitar { position: absolute; top: 0.4rem; right: 0.4rem; background: rgba(0,0,0,0.7); border: none; color: white; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
  #foto-input { display: none; }

  /* Fuerza slider */
  .slider-wrap { margin-bottom: 1rem; }
  .slider-wrap input[type=range] { width: 100%; accent-color: #C97B5A; }
  .slider-labels { display: flex; justify-content: space-between; font-size: 0.7rem; color: #777; margin-top: 0.25rem; }
  .slider-val { color: #C97B5A; font-size: 0.85rem; font-weight: bold; }

  /* Tips */
  .tip { background: #1e2a1e; border-left: 3px solid #7ab87a; border-radius: 0 6px 6px 0; padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.8rem; color: #a8d4a8; line-height: 1.6; }
  .tip strong { color: #7ab87a; }

  /* Botón generar */
  .btn-generar { width: 100%; padding: 1rem; background: #C97B5A; color: white; border: none; border-radius: 6px; font-family: inherit; font-size: 1rem; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s; margin-bottom: 1rem; }
  .btn-generar:hover { opacity: 0.85; }
  .btn-generar:disabled { opacity: 0.4; cursor: not-allowed; }

  .estado { text-align: center; padding: 1rem; color: #C97B5A; font-size: 0.9rem; display: none; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .error { background: #3a1a1a; border: 1px solid #c97b5a80; border-radius: 6px; padding: 1rem; color: #e8a8a8; margin-bottom: 1rem; font-size: 0.875rem; display: none; }

  /* Galería */
  .galeria { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
  .img-wrap { position: relative; border-radius: 8px; overflow: hidden; background: #252220; }
  .img-wrap img { width: 100%; display: block; }
  .img-acciones { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 1.5rem 0.75rem 0.75rem; display: flex; gap: 0.5rem; justify-content: flex-end; }
  .img-acciones a { background: rgba(255,255,255,0.15); color: white; padding: 0.35rem 0.75rem; border-radius: 4px; font-size: 0.75rem; text-decoration: none; backdrop-filter: blur(4px); }
  .img-acciones a:hover { background: rgba(201,123,90,0.8); }
  .img-label { padding: 0.5rem 0.75rem; font-size: 0.7rem; color: #777; letter-spacing: 0.05em; }

  .seccion-oculta { display: none; }
</style>
</head>
<body>
<div class="container">

  <h1>mi <em>eelo</em></h1>
  <p class="subtitle">Generador de imágenes · fal.ai</p>

  <!-- Clave API -->
  <div class="key-bar">
    <label>FAL_KEY</label>
    <input type="password" id="fal-key" placeholder="fal_sk_..." oninput="verificarKey()">
    <button class="btn-sm" onclick="guardarKey()">Guardar</button>
    <span class="key-ok" id="key-ok" style="display:none">✓ Lista</span>
  </div>

  <!-- Selector de modo -->
  <div class="modos">
    <button class="modo-btn activo" id="tab-crear" onclick="cambiarModo('crear')">
      ✨ Crear desde cero
    </button>
    <button class="modo-btn" id="tab-foto" onclick="cambiarModo('foto')">
      📷 Usar mis fotos
    </button>
  </div>

  <!-- MODO 1: Crear desde cero -->
  <div id="modo-crear">
    <div class="panel">
      <h2>Guía de estilo mi eelo</h2>
      <div class="guias">
        <button class="guia-btn" onclick="elegirGuia('artesana', this)"><span class="icon">👐</span>Artesana en taller</button>
        <button class="guia-btn" onclick="elegirGuia('bolsa', this)"><span class="icon">👜</span>Producto — Bolsa</button>
        <button class="guia-btn" onclick="elegirGuia('proceso', this)"><span class="icon">✂️</span>Proceso de creación</button>
        <button class="guia-btn" onclick="elegirGuia('coleccion', this)"><span class="icon">📸</span>Campaña colección</button>
        <button class="guia-btn" onclick="elegirGuia('textura', this)"><span class="icon">🟫</span>Textura de cuero</button>
        <button class="guia-btn" onclick="elegirGuia('impacto', this)"><span class="icon">🤝</span>Comunidad / Impacto</button>
      </div>
      <label>O escribe lo que quieres ver</label>
      <textarea id="prompt-custom" placeholder="Ej: bolsa de cuero marrón sobre mesa de madera, luz de tarde, fondo neutro..."></textarea>
      <label>Qué evitar (negativo)</label>
      <textarea id="prompt-negativo" rows="2" placeholder="Ej: fondo blanco, artificial, plástico..."></textarea>
    </div>
    <div class="panel">
      <h2>Opciones</h2>
      <div class="row">
        <div>
          <label>Formato</label>
          <select id="formato-crear">
            <option value="1024x1024">Cuadrado 1:1</option>
            <option value="768x1024">Vertical 3:4 (Stories)</option>
            <option value="1024x768">Horizontal 4:3</option>
          </select>
        </div>
        <div>
          <label>Cantidad</label>
          <select id="cantidad-crear">
            <option value="1">1 imagen</option>
            <option value="2">2 imágenes</option>
            <option value="4">4 imágenes</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- MODO 2: Usar mis fotos -->
  <div id="modo-foto" class="seccion-oculta">

    <div class="tip">
      <strong>¿Cómo funciona?</strong><br>
      Subes tu foto (de una bolsa, artesana, taller...) y le dices al AI cómo transformarla.
      Puedes mejorar el fondo, cambiar el estilo, agregar iluminación profesional, o crear una versión editorial de tu foto original.
    </div>

    <div class="panel">
      <h2>Tus fotos de referencia</h2>
      <div class="upload-zona" id="upload-zona" onclick="document.getElementById('foto-input').click()" ondragover="dragOver(event)" ondragleave="dragLeave(event)" ondrop="dropFoto(event)">
        <div class="icono">📂</div>
        <strong>Agrega todas las fotos que quieras</strong>
        <p style="margin-top:0.6rem; line-height:2; color:#aaa; font-size:0.875rem;">
          📁 <b style="color:#f0ebe5">Haz clic</b> para buscar (puedes seleccionar varias a la vez)<br>
          🖱️ <b style="color:#f0ebe5">Arrastra</b> desde tu carpeta (varias a la vez)<br>
          📋 <b style="color:#f0ebe5">Ctrl+V</b> para pegar desde el portapapeles
        </p>
        <p style="margin-top:0.4rem; font-size:0.72rem; color:#555;">JPG, PNG, WEBP · Máx 10MB por foto</p>
      </div>
      <input type="file" id="foto-input" accept="image/*" multiple onchange="agregarFotos(this.files)">

      <!-- Grid de miniaturas -->
      <div id="fotos-grid" style="display:none; margin-top:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
          <p style="font-size:0.75rem; color:#aaa; letter-spacing:0.08em; text-transform:uppercase;">Haz clic en una foto para seleccionarla como referencia</p>
          <button class="btn-sm" onclick="limpiarFotos()">✕ Quitar todas</button>
        </div>
        <div id="miniaturas" style="display:flex; flex-wrap:wrap; gap:0.6rem;"></div>
      </div>
    </div>

    <div class="panel">
      <h2>Qué hacer con la foto</h2>

      <label>¿Qué tipo de transformación quieres?</label>
      <div class="guias" style="margin-bottom:1.2rem">
        <button class="guia-btn" onclick="elegirTransf('mejorar', this)"><span class="icon">✨</span>Mejorar calidad</button>
        <button class="guia-btn" onclick="elegirTransf('fondo', this)"><span class="icon">🖼️</span>Cambiar fondo</button>
        <button class="guia-btn" onclick="elegirTransf('editorial', this)"><span class="icon">📰</span>Estilo editorial</button>
        <button class="guia-btn" onclick="elegirTransf('producto', this)"><span class="icon">🛍️</span>Foto de producto</button>
        <button class="guia-btn" onclick="elegirTransf('artesanal', this)"><span class="icon">🏺</span>Estilo artesanal</button>
        <button class="guia-btn" onclick="elegirTransf('custom', this)"><span class="icon">✏️</span>Personalizado</button>
      </div>

      <label>Descripción del resultado que quieres</label>
      <textarea id="prompt-foto" placeholder="Ej: misma bolsa pero con fondo de tela de lino natural, luz suave desde la izquierda, estilo editorial..."></textarea>

      <div class="slider-wrap">
        <label>Fuerza de transformación — <span class="slider-val" id="fuerza-val">70%</span></label>
        <input type="range" id="fuerza" min="20" max="95" value="70" oninput="document.getElementById('fuerza-val').textContent=this.value+'%'">
        <div class="slider-labels">
          <span>Conserva más tu foto</span>
          <span>Transforma más</span>
        </div>
      </div>

      <div class="row">
        <div>
          <label>Formato de salida</label>
          <select id="formato-foto">
            <option value="1024x1024">Cuadrado 1:1</option>
            <option value="768x1024">Vertical (Stories)</option>
            <option value="1024x768">Horizontal</option>
          </select>
        </div>
        <div>
          <label>Cantidad</label>
          <select id="cantidad-foto">
            <option value="1">1 imagen</option>
            <option value="2">2 imágenes</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- Botón y estado -->
  <button class="btn-generar" id="btn-generar" onclick="generar()">Generar imágenes →</button>
  <div class="estado" id="estado">⏳ Generando… puede tardar 20-40 segundos</div>
  <div class="error" id="error"></div>

  <!-- Galería de resultados -->
  <div class="galeria" id="galeria"></div>

</div>

<script>
  const GUIAS = ${JSON.stringify(GUIAS)};
  const TRANSFORMACIONES = {
    mejorar: "same composition, professional photography, improved lighting, sharp focus, high quality, editorial style, mi eelo brand aesthetic, warm earthy tones",
    fondo: "same subject, natural linen or wood surface background, minimal clean background, soft studio lighting, product photography, mi eelo brand",
    editorial: "editorial fashion photography style, warm afternoon light, film photography aesthetic, muted warm palette, authentic, mi eelo brand Guatemala",
    producto: "professional product photography, clean neutral background, soft shadows, high detail, commercial quality, handcrafted aesthetic",
    artesanal: "artisan workshop setting, natural textures, warm wood and leather tones, handmade quality visible, documentary style, Guatemala"
  };

  let modoActual = 'crear';
  let guiaActual = null;
  let transfActual = null;
  let fotos = [];           // Array de { nombre, base64 }
  let fotoSeleccionada = null; // base64 de la activa

  window.onload = () => {
    const k = sessionStorage.getItem('fal_key');
    if (k) { document.getElementById('fal-key').value = k; verificarKey(); }
  };

  function verificarKey() {
    const k = document.getElementById('fal-key').value.trim() || sessionStorage.getItem('fal_key') || '';
    document.getElementById('key-ok').style.display = k ? 'inline' : 'none';
  }

  function guardarKey() {
    const k = document.getElementById('fal-key').value.trim();
    if (k) { sessionStorage.setItem('fal_key', k); verificarKey(); }
  }

  function cambiarModo(modo) {
    modoActual = modo;
    document.getElementById('modo-crear').classList.toggle('seccion-oculta', modo !== 'crear');
    document.getElementById('modo-foto').classList.toggle('seccion-oculta', modo !== 'foto');
    document.getElementById('tab-crear').classList.toggle('activo', modo === 'crear');
    document.getElementById('tab-foto').classList.toggle('activo', modo === 'foto');
  }

  function elegirGuia(id, btn) {
    guiaActual = id;
    document.querySelectorAll('#modo-crear .guia-btn').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    document.getElementById('prompt-custom').value = '';
    document.getElementById('prompt-negativo').value = GUIAS[id].negativo;
  }

  function elegirTransf(id, btn) {
    transfActual = id;
    document.querySelectorAll('#modo-foto .guia-btn').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    if (id !== 'custom' && TRANSFORMACIONES[id]) {
      document.getElementById('prompt-foto').value = '';
      document.getElementById('prompt-foto').placeholder = TRANSFORMACIONES[id].substring(0,80) + '...';
    } else {
      document.getElementById('prompt-foto').placeholder = 'Describe el resultado que quieres...';
    }
  }

  // ─── Gestión de múltiples fotos ───────────────────────────────────────────

  function agregarFotos(fileList) {
    Array.from(fileList).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { alert(file.name + ' es muy grande (máx 10MB)'); return; }
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        fotos.push({ nombre: file.name, base64: e.target.result });
        renderMiniaturas();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderMiniaturas() {
    const grid = document.getElementById('fotos-grid');
    const cont = document.getElementById('miniaturas');
    if (!fotos.length) { grid.style.display = 'none'; fotoSeleccionada = null; return; }
    grid.style.display = 'block';
    cont.innerHTML = '';
    fotos.forEach((f, i) => {
      const wrap = document.createElement('div');
      const esActiva = fotoSeleccionada === f.base64;
      wrap.style.cssText = 'position:relative; cursor:pointer; border-radius:6px; overflow:hidden; border:3px solid ' + (esActiva ? '#C97B5A' : 'transparent') + '; transition:border 0.15s;';
      wrap.innerHTML =
        '<img src="' + f.base64 + '" style="width:110px; height:110px; object-fit:cover; display:block;">' +
        '<div style="position:absolute;top:0;right:0;background:rgba(0,0,0,0.6);padding:0.2rem 0.4rem;font-size:0.7rem;color:white;cursor:pointer;" onclick="quitarFoto(event,' + i + ')">✕</div>' +
        (esActiva ? '<div style="position:absolute;bottom:0;left:0;right:0;background:#C97B5A;text-align:center;font-size:0.65rem;padding:0.2rem;color:white;letter-spacing:0.05em;">SELECCIONADA</div>' : '');
      wrap.onclick = (e) => { if (e.target.textContent === '✕') return; seleccionarFoto(f.base64); };
      cont.appendChild(wrap);
    });
    // Auto-selecciona la primera si no hay ninguna seleccionada
    if (!fotoSeleccionada && fotos.length) seleccionarFoto(fotos[0].base64);
  }

  function seleccionarFoto(base64) {
    fotoSeleccionada = base64;
    renderMiniaturas();
  }

  function quitarFoto(e, idx) {
    e.stopPropagation();
    const eraActiva = fotos[idx]?.base64 === fotoSeleccionada;
    fotos.splice(idx, 1);
    if (eraActiva) fotoSeleccionada = fotos[0]?.base64 || null;
    document.getElementById('foto-input').value = '';
    renderMiniaturas();
  }

  function limpiarFotos() {
    fotos = []; fotoSeleccionada = null;
    document.getElementById('foto-input').value = '';
    renderMiniaturas();
  }

  function dragOver(e) { e.preventDefault(); document.getElementById('upload-zona').classList.add('drag-over'); }
  function dragLeave() { document.getElementById('upload-zona').classList.remove('drag-over'); }
  function dropFoto(e) {
    e.preventDefault(); dragLeave();
    if (e.dataTransfer.files.length) agregarFotos(e.dataTransfer.files);
  }

  // Pegar con Ctrl+V
  document.addEventListener('paste', function(e) {
    if (modoActual !== 'foto') return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = (ev) => {
          fotos.push({ nombre: 'pegada.png', base64: ev.target.result });
          renderMiniaturas();
          const zona = document.getElementById('upload-zona');
          zona.style.borderColor = '#7ab87a';
          setTimeout(() => zona.style.borderColor = '', 1500);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  });

  // ─── Generar ───────────────────────────────────────────────────────────────

  async function generar() {
    const key = document.getElementById('fal-key').value.trim() || sessionStorage.getItem('fal_key') || '';
    if (!key) { alert('Ingresa tu FAL_KEY primero'); return; }

    const btn = document.getElementById('btn-generar');
    const estado = document.getElementById('estado');
    const errorDiv = document.getElementById('error');
    btn.disabled = true;
    estado.style.display = 'block';
    errorDiv.style.display = 'none';

    let payload;

    try {
      if (modoActual === 'crear') {
        // Modo texto → imagen
        const promptCustom = document.getElementById('prompt-custom').value.trim();
        const negativo = document.getElementById('prompt-negativo').value.trim();
        const [ancho, alto] = document.getElementById('formato-crear').value.split('x').map(Number);
        const cantidad = parseInt(document.getElementById('cantidad-crear').value);

        let prompt;
        if (promptCustom) {
          prompt = promptCustom + ', mi eelo brand, Guatemalan artisan brand, warm earthy tones, authentic, handcrafted quality';
        } else if (guiaActual) {
          prompt = GUIAS[guiaActual].prompt;
        } else {
          alert('Elige una guía de estilo o escribe tu descripción'); btn.disabled = false; estado.style.display = 'none'; return;
        }
        payload = { modo: 'crear', prompt, negativo, ancho, alto, cantidad, key };

      } else {
        // Modo foto → imagen
        if (!fotoSeleccionada) { alert('Sube al menos una foto y selecciónala'); btn.disabled = false; estado.style.display = 'none'; return; }
        const promptFoto = document.getElementById('prompt-foto').value.trim();
        const fuerza = parseInt(document.getElementById('fuerza').value) / 100;
        const [ancho, alto] = document.getElementById('formato-foto').value.split('x').map(Number);
        const cantidad = parseInt(document.getElementById('cantidad-foto').value);

        let prompt;
        if (promptFoto) {
          prompt = promptFoto + ', mi eelo brand, warm earthy tones, high quality, authentic';
        } else if (transfActual && TRANSFORMACIONES[transfActual]) {
          prompt = TRANSFORMACIONES[transfActual];
        } else {
          alert('Elige un tipo de transformación o escribe tu descripción'); btn.disabled = false; estado.style.display = 'none'; return;
        }
        payload = { modo: 'foto', prompt, fotoBase64: fotoSeleccionada, fuerza, ancho, alto, cantidad, key };
      }

      const res = await fetch('/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error desconocido');

      const galeria = document.getElementById('galeria');
      galeria.innerHTML = '';
      data.imagenes.forEach((url, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'img-wrap';
        wrap.innerHTML =
          '<a href="' + url + '" target="_blank"><img src="' + url + '" alt="Imagen ' + (i+1) + '"></a>' +
          '<div class="img-acciones"><a href="' + url + '" download="mieelo_' + Date.now() + '_' + (i+1) + '.png">⬇ Descargar</a><a href="' + url + '" target="_blank">🔍 Ver</a></div>';
        galeria.appendChild(wrap);
      });

    } catch (err) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = '❌ ' + err.message;
    } finally {
      btn.disabled = false;
      estado.style.display = 'none';
    }
  }
</script>
</body>
</html>`;

// ─── Servidor HTTP ─────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML);
    return;
  }

  if (req.method === "POST" && req.url === "/generar") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const { modo, prompt, key, ancho, alto, cantidad } = data;

        if (!key) throw new Error("Falta la FAL_KEY");

        fal.config({ credentials: key });

        let resultado;

        if (modo === "crear") {
          // Texto → imagen con nano-banana-2
          console.log(`\n✨ [texto→imagen] ${prompt.substring(0, 70)}...`);
          resultado = await fal.run("fal-ai/nano-banana-2", {
            input: {
              prompt,
              negative_prompt: data.negativo || "",
              image_size: { width: ancho || 1024, height: alto || 1024 },
              num_inference_steps: 28,
              guidance_scale: 3.5,
              num_images: cantidad || 1,
              enable_safety_checker: true
            }
          });

        } else {
          // Foto → imagen con FLUX img2img
          console.log(`\n📷 [foto→imagen] fuerza=${data.fuerza} · ${prompt.substring(0, 70)}...`);

          // Sube la imagen a fal.ai storage primero
          const base64Data = data.fotoBase64.replace(/^data:image\/\w+;base64,/, "");
          const imgBuffer = Buffer.from(base64Data, "base64");
          const mimeType = data.fotoBase64.match(/data:(image\/\w+);/)?.[1] || "image/jpeg";

          // Subir imagen como archivo temporal
          const uploadResult = await fal.storage.upload(
            new Blob([imgBuffer], { type: mimeType }),
            { filename: "referencia.jpg" }
          );
          const imageUrl = uploadResult;

          resultado = await fal.run("fal-ai/flux/dev/image-to-image", {
            input: {
              prompt,
              image_url: imageUrl,
              strength: data.fuerza || 0.7,
              image_size: { width: ancho || 1024, height: alto || 1024 },
              num_inference_steps: 28,
              guidance_scale: 3.5,
              num_images: cantidad || 1,
              enable_safety_checker: true
            }
          });
        }

        const urls = (resultado?.images || []).map(img => img.url).filter(Boolean);
        if (!urls.length) throw new Error("No se generaron imágenes. Intenta con un prompt diferente.");

        console.log(`✅ ${urls.length} imagen(es) generadas`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ imagenes: urls }));

      } catch (err) {
        console.error("❌", err.message || err);
        const msg = err.message || "";
        let errorAmigable = msg;
        if (msg.includes("Forbidden") || msg.includes("403") || msg.includes("unauthorized") || msg.includes("Unauthorized")) {
          errorAmigable = "Clave API inválida o sin permisos. Ve a fal.ai/dashboard/keys, crea una clave nueva y pégala en el campo FAL_KEY de la app.";
        } else if (msg.includes("quota") || msg.includes("credit") || msg.includes("402")) {
          errorAmigable = "Sin créditos disponibles en fal.ai. Recarga tu cuenta en fal.ai/dashboard/billing.";
        } else if (msg.includes("timeout") || msg.includes("ETIMEDOUT")) {
          errorAmigable = "La generación tardó demasiado. Intenta con menos pasos o una imagen más pequeña.";
        }
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: errorAmigable }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║   GENERADOR DE IMÁGENES — mi eelo   ║`);
  console.log(`╚══════════════════════════════════════╝`);
  console.log(`\n✅ Abre en tu navegador: http://localhost:${PORT}\n`);
});
