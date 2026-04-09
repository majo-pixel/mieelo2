/**
 * INTERFAZ WEB — Generador de imágenes mi eelo
 * Ejecutar: node app.js
 * Abrir en navegador: http://localhost:3000
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

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Generador de Imágenes — mi eelo</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; background: #1a1714; color: #f0ebe5; min-height: 100vh; padding: 2rem 1rem; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 1.8rem; font-weight: 400; letter-spacing: 0.05em; margin-bottom: 0.3rem; }
  h1 em { color: #C97B5A; font-style: italic; }
  .subtitle { color: #999; font-size: 0.9rem; margin-bottom: 2.5rem; letter-spacing: 0.08em; }
  .key-warning { background: #3a2a1a; border: 1px solid #C97B5A; border-radius: 6px; padding: 1rem 1.25rem; margin-bottom: 2rem; color: #e8c4a8; font-size: 0.875rem; line-height: 1.6; }
  .key-warning a { color: #C97B5A; }
  .panel { background: #252220; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
  .panel h2 { font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; color: #999; margin-bottom: 1.2rem; }
  .guias { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1.2rem; }
  .guia-btn { padding: 0.7rem 1rem; background: #1a1714; border: 1px solid #3a3632; border-radius: 6px; color: #ccc; cursor: pointer; text-align: left; font-family: inherit; font-size: 0.875rem; transition: all 0.2s; }
  .guia-btn:hover, .guia-btn.activo { border-color: #C97B5A; color: #C97B5A; background: #2a1f15; }
  .guia-btn .icon { display: block; font-size: 1.2rem; margin-bottom: 0.3rem; }
  label { display: block; font-size: 0.8rem; letter-spacing: 0.08em; color: #aaa; margin-bottom: 0.5rem; text-transform: uppercase; }
  textarea, input[type=text], input[type=password], select { width: 100%; background: #1a1714; border: 1px solid #3a3632; border-radius: 4px; color: #f0ebe5; padding: 0.75rem; font-family: inherit; font-size: 0.9rem; margin-bottom: 1rem; }
  textarea:focus, input:focus, select:focus { outline: none; border-color: #C97B5A; }
  textarea { resize: vertical; min-height: 80px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .btn-generar { width: 100%; padding: 1rem; background: #C97B5A; color: white; border: none; border-radius: 6px; font-family: inherit; font-size: 1rem; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s; }
  .btn-generar:hover { opacity: 0.85; }
  .btn-generar:disabled { opacity: 0.5; cursor: not-allowed; }
  .estado { text-align: center; padding: 1rem; color: #C97B5A; font-size: 0.9rem; display: none; }
  .galeria { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
  .galeria img { width: 100%; border-radius: 6px; display: block; }
  .img-wrap { position: relative; }
  .img-wrap a { display: block; }
  .img-wrap .descargar { position: absolute; bottom: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.7); color: white; padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.75rem; text-decoration: none; letter-spacing: 0.05em; }
  .error { background: #3a1a1a; border: 1px solid #c97b5a80; border-radius: 6px; padding: 1rem; color: #e8a8a8; margin-top: 1rem; font-size: 0.875rem; display: none; }
  .key-input-wrap { display: flex; gap: 0.5rem; }
  .key-input-wrap input { margin: 0; flex: 1; }
  .btn-save-key { padding: 0.75rem 1rem; background: #3a3632; border: 1px solid #555; border-radius: 4px; color: #ccc; cursor: pointer; white-space: nowrap; font-family: inherit; font-size: 0.85rem; }
  .btn-save-key:hover { border-color: #C97B5A; color: #C97B5A; }
</style>
</head>
<body>
<div class="container">
  <h1>mi <em>eelo</em></h1>
  <p class="subtitle">GENERADOR DE IMÁGENES · fal.ai / nano-banana-2</p>

  <div id="key-warning" class="key-warning" style="display:none">
    ⚠️ Falta tu clave de fal.ai. Obtén una gratis en <a href="https://fal.ai/dashboard/keys" target="_blank">fal.ai/dashboard/keys</a> e ingrésala abajo.
  </div>

  <div class="panel">
    <h2>Clave API fal.ai</h2>
    <label>FAL_KEY (se guarda solo en esta sesión)</label>
    <div class="key-input-wrap">
      <input type="password" id="fal-key" placeholder="fal_sk_..." />
      <button class="btn-save-key" onclick="guardarKey()">Guardar</button>
    </div>
  </div>

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
    <label>O escribe tu descripción personalizada</label>
    <textarea id="prompt-custom" placeholder="Ej: mujer guatemalteca con bolsa artesanal en mercado colonial, luz de tarde, colores tierra..."></textarea>
    <label>Negativo (qué evitar)</label>
    <textarea id="prompt-negativo" placeholder="Ej: fondo blanco, artificial, stock photo..." rows="2"></textarea>
  </div>

  <div class="panel">
    <h2>Opciones</h2>
    <div class="row">
      <div>
        <label>Formato</label>
        <select id="formato">
          <option value="1024x1024">Cuadrado 1024×1024</option>
          <option value="768x1024">Vertical 768×1024 (Stories)</option>
          <option value="1024x768">Horizontal 1024×768</option>
          <option value="512x512">Pequeño 512×512</option>
        </select>
      </div>
      <div>
        <label>Cantidad de imágenes</label>
        <select id="cantidad">
          <option value="1">1 imagen</option>
          <option value="2">2 imágenes</option>
          <option value="4">4 imágenes</option>
        </select>
      </div>
    </div>
  </div>

  <button class="btn-generar" id="btn-generar" onclick="generar()">Generar imágenes →</button>
  <div class="estado" id="estado">⏳ Generando... puede tardar 15-30 segundos</div>
  <div class="error" id="error"></div>
  <div class="galeria" id="galeria"></div>
</div>

<script>
  let guiaActual = null;
  const GUIAS = ${JSON.stringify(GUIAS)};

  // Carga key guardada en sessionStorage
  window.onload = function() {
    const k = sessionStorage.getItem('fal_key');
    if (k) document.getElementById('fal-key').value = k;
    verificarKey();
  };

  function verificarKey() {
    const k = document.getElementById('fal-key').value.trim() || sessionStorage.getItem('fal_key') || '';
    document.getElementById('key-warning').style.display = k ? 'none' : 'block';
  }

  function guardarKey() {
    const k = document.getElementById('fal-key').value.trim();
    if (k) { sessionStorage.setItem('fal_key', k); verificarKey(); alert('✅ Clave guardada para esta sesión'); }
  }

  function elegirGuia(id, btn) {
    guiaActual = id;
    document.querySelectorAll('.guia-btn').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    document.getElementById('prompt-custom').value = '';
    document.getElementById('prompt-negativo').value = GUIAS[id].negativo;
  }

  async function generar() {
    const key = document.getElementById('fal-key').value.trim() || sessionStorage.getItem('fal_key') || '';
    if (!key) { alert('Por favor ingresa tu FAL_KEY primero'); return; }

    const promptCustom = document.getElementById('prompt-custom').value.trim();
    const negativo = document.getElementById('prompt-negativo').value.trim();
    const formato = document.getElementById('formato').value;
    const cantidad = parseInt(document.getElementById('cantidad').value);
    const [ancho, alto] = formato.split('x').map(Number);

    let prompt;
    if (promptCustom) {
      prompt = promptCustom + ', mi eelo brand, Guatemalan artisan brand, warm earthy tones, authentic, handcrafted quality';
    } else if (guiaActual) {
      prompt = GUIAS[guiaActual].prompt;
    } else {
      alert('Elige una guía o escribe un prompt personalizado');
      return;
    }

    const btn = document.getElementById('btn-generar');
    const estado = document.getElementById('estado');
    const errorDiv = document.getElementById('error');
    btn.disabled = true;
    estado.style.display = 'block';
    errorDiv.style.display = 'none';

    try {
      const res = await fetch('/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, negativo, ancho, alto, cantidad, key })
      });
      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error || 'Error desconocido');

      const galeria = document.getElementById('galeria');
      galeria.innerHTML = '';
      data.imagenes.forEach((url, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'img-wrap';
        wrap.innerHTML = \`<a href="\${url}" target="_blank"><img src="\${url}" alt="Imagen generada \${i+1}"></a><a class="descargar" href="\${url}" download="mieelo_\${Date.now()}_\${i+1}.png">⬇ Descargar</a>\`;
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
        const { prompt, negativo, ancho, alto, cantidad, key } = JSON.parse(body);

        if (!key) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Falta la FAL_KEY" }));
          return;
        }

        fal.config({ credentials: key });

        console.log(`\n🎨 Generando ${cantidad} imagen(es)...`);
        console.log(`   ${prompt.substring(0, 80)}...`);

        const resultado = await fal.run("fal-ai/nano-banana-2", {
          input: {
            prompt,
            negative_prompt: negativo || "",
            image_size: { width: ancho || 1024, height: alto || 1024 },
            num_inference_steps: 28,
            guidance_scale: 3.5,
            num_images: cantidad || 1,
            enable_safety_checker: true
          }
        });

        const urls = (resultado?.images || []).map(img => img.url).filter(Boolean);

        if (!urls.length) throw new Error("No se generaron imágenes");

        console.log(`✅ ${urls.length} imagen(es) generadas`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ imagenes: urls }));

      } catch (err) {
        console.error("❌", err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message || "Error al generar" }));
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
