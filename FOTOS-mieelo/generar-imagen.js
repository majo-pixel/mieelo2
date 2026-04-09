/**
 * GENERADOR DE IMÁGENES — mi eelo
 * Conectado a fal.ai / nano-banana-2
 *
 * USO:
 *   node generar-imagen.js
 *   node generar-imagen.js --guia artesana
 *   node generar-imagen.js --prompt "bolsa de cuero marrón artesanal"
 */

import * as fal from "@fal-ai/serverless-client";
import fs from "fs";
import path from "path";
import readline from "readline";

// ─── Configuración ───────────────────────────────────────────────────────────

// Carga tu FAL_KEY desde .env o variable de entorno
const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error(
    "\n❌  Falta FAL_KEY. Crea el archivo .env con:\n   FAL_KEY=tu_clave_aqui\n   (Obtén tu clave en https://fal.ai/dashboard/keys)\n"
  );
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

// ─── Guías de estilo mi eelo ──────────────────────────────────────────────────

const GUIAS = {
  artesana: {
    nombre: "Artesana en taller",
    base: "Guatemalan woman artisan in a workshop, weaving or sewing leather bags, natural light from a window, warm tones, hands visible, focused expression",
    estilo: "editorial fashion photography, film grain, warm golden hour light, authentic documentary style",
    negativo: "artificial background, white studio, filters, heavy editing, western fashion, jewelry"
  },
  bolsa: {
    nombre: "Producto — Bolsa",
    base: "handcrafted leather bag made in Guatemala, on a natural linen surface, minimal styling, product photography",
    estilo: "clean product photography, warm neutral background, soft shadows, high detail texture, artisan craftsmanship",
    negativo: "plastic, synthetic materials, harsh flash, white seamless background, cluttered"
  },
  proceso: {
    nombre: "Proceso de creación",
    base: "close-up of hands stitching or cutting leather in a Guatemalan artisan workshop, tools visible, natural textures",
    estilo: "documentary photography, macro details, warm workshop lighting, authentic, raw beauty",
    negativo: "studio, artificial light, gloves, fake, stock photo look"
  },
  coleccion: {
    nombre: "Campaña de colección",
    base: "Guatemalan woman wearing or carrying a handcrafted leather bag, outdoor setting in Guatemala City or a colonial street, confident pose",
    estilo: "fashion editorial, warm afternoon light, film photography aesthetic, muted warm palette",
    negativo: "cold tones, heavy makeup, fashion model stereotype, generic"
  },
  textura: {
    nombre: "Textura / Material",
    base: "close-up texture of genuine leather, natural grain visible, warm terracotta or brown tones, artisan quality",
    estilo: "macro photography, extreme detail, warm tones, tactile feeling, craft",
    negativo: "synthetic, plastic, synthetic leather, cold colors"
  },
  impacto: {
    nombre: "Impacto social",
    base: "group of Guatemalan women artisans smiling together in a workshop, community feeling, bags and tools visible",
    estilo: "authentic documentary, warm group portrait, natural light, joy, empowerment",
    negativo: "staged, stock photo, corporate, artificial, poverty photography"
  }
};

// ─── Función principal de generación ─────────────────────────────────────────

async function generarImagen(promptPersonalizado, guia, opciones = {}) {
  const {
    ancho = 1024,
    alto = 1024,
    cantidad = 1,
    pasos = 28,
    escala = 3.5
  } = opciones;

  let promptFinal;
  let nombreArchivo;

  if (promptPersonalizado) {
    // Prompt libre del usuario, enriquecido con el estilo de mi eelo
    promptFinal = `${promptPersonalizado}, mi eelo brand, Guatemalan artisan brand, warm earthy tones, authentic, handcrafted quality`;
    nombreArchivo = `mieelo_custom_${Date.now()}`;
  } else if (guia && GUIAS[guia]) {
    const g = GUIAS[guia];
    promptFinal = `${g.base}, ${g.estilo}, mi eelo brand identity, earthy warm palette, Guatemala`;
    nombreArchivo = `mieelo_${guia}_${Date.now()}`;
    console.log(`\n📌 Guía: ${g.nombre}`);
  } else {
    // Default: producto + artesana
    promptFinal = "handcrafted leather bag next to a Guatemalan artisan woman's hands, warm workshop light, mi eelo brand, authentic, earthy tones";
    nombreArchivo = `mieelo_default_${Date.now()}`;
  }

  const negativo = guia && GUIAS[guia]
    ? GUIAS[guia].negativo
    : "artificial, stock photo, generic, cold tones";

  console.log(`\n🎨 Generando imagen...`);
  console.log(`   Prompt: ${promptFinal.substring(0, 80)}...`);
  console.log(`   Tamaño: ${ancho}×${alto} · Pasos: ${pasos}\n`);

  try {
    const resultado = await fal.run("fal-ai/nano-banana-2", {
      input: {
        prompt: promptFinal,
        negative_prompt: negativo,
        image_size: { width: ancho, height: alto },
        num_inference_steps: pasos,
        guidance_scale: escala,
        num_images: cantidad,
        enable_safety_checker: true
      }
    });

    if (!resultado?.images?.length) {
      throw new Error("La API no devolvió imágenes.");
    }

    const carpetaOutput = path.join(import.meta.dirname, "output");
    if (!fs.existsSync(carpetaOutput)) fs.mkdirSync(carpetaOutput);

    const imagenes = [];
    for (let i = 0; i < resultado.images.length; i++) {
      const img = resultado.images[i];
      const archivo = path.join(carpetaOutput, `${nombreArchivo}_${i + 1}.png`);

      if (img.url) {
        // Descarga desde URL
        const res = await fetch(img.url);
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(archivo, buffer);
      } else if (img.content) {
        // Base64
        const buffer = Buffer.from(img.content, "base64");
        fs.writeFileSync(archivo, buffer);
      }

      imagenes.push(archivo);
      console.log(`✅ Imagen guardada: ${archivo}`);
    }

    return imagenes;

  } catch (err) {
    console.error("\n❌ Error al generar:", err.message || err);
    throw err;
  }
}

// ─── Modo interactivo ─────────────────────────────────────────────────────────

async function modoInteractivo() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const pregunta = (q) => new Promise((res) => rl.question(q, res));

  console.log("\n╔══════════════════════════════════════╗");
  console.log("║   GENERADOR DE IMÁGENES — mi eelo   ║");
  console.log("╚══════════════════════════════════════╝\n");

  console.log("¿Qué tipo de imagen quieres generar?\n");
  const listaGuias = Object.entries(GUIAS);
  listaGuias.forEach(([key, g], i) => {
    console.log(`  ${i + 1}. ${g.nombre} (--guia ${key})`);
  });
  console.log(`  ${listaGuias.length + 1}. Prompt personalizado`);

  const opcion = await pregunta("\nElige un número: ");
  const num = parseInt(opcion);

  let guiaElegida = null;
  let promptLibre = null;

  if (num >= 1 && num <= listaGuias.length) {
    guiaElegida = listaGuias[num - 1][0];
  } else {
    promptLibre = await pregunta("\nEscribe tu descripción (en inglés o español): ");
  }

  const cantidadStr = await pregunta("\n¿Cuántas imágenes? (1-4, default 1): ");
  const cantidad = Math.min(4, Math.max(1, parseInt(cantidadStr) || 1));

  rl.close();

  await generarImagen(promptLibre, guiaElegida, { cantidad });
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const idxGuia = args.indexOf("--guia");
const idxPrompt = args.indexOf("--prompt");
const idxCantidad = args.indexOf("--cantidad");

if (idxGuia !== -1 || idxPrompt !== -1) {
  const guia = idxGuia !== -1 ? args[idxGuia + 1] : null;
  const prompt = idxPrompt !== -1 ? args[idxPrompt + 1] : null;
  const cantidad = idxCantidad !== -1 ? parseInt(args[idxCantidad + 1]) : 1;

  if (guia && !GUIAS[guia]) {
    console.error(`\n❌ Guía desconocida: "${guia}"`);
    console.log("   Guías disponibles:", Object.keys(GUIAS).join(", "));
    process.exit(1);
  }

  generarImagen(prompt, guia, { cantidad }).catch(() => process.exit(1));
} else {
  modoInteractivo().catch(() => process.exit(1));
}
