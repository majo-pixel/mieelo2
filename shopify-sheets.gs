// ═══════════════════════════════════════════════════════
//  PEDIDOS MI EELO → GOOGLE SHEETS
//  Pega este código en Extensiones → Apps Script
//  Luego ejecuta: configurarHoja()
// ═══════════════════════════════════════════════════════

// ── Configuración ──────────────────────────────────────
var NOMBRE_HOJA = "Pedidos";
var COLUMNAS = [
  "# Pedido", "Fecha", "Cliente", "Email", "Teléfono",
  "Total (USD)", "Moneda", "Estado pago", "Estado preparación",
  "Dirección", "Ciudad", "Departamento", "País", "Código postal",
  "Artículos", "Productos", "Notas"
];

// Colores mi eelo
var COLOR_ENCABEZADO_BG  = "#C97B5A";  // terracota
var COLOR_ENCABEZADO_TXT = "#FFFFFF";
var COLOR_FILA_PAR       = "#FAF5F2";  // rosado muy suave
var COLOR_FILA_IMPAR     = "#FFFFFF";

// ── 1. Configura la hoja (ejecutar una vez) ────────────
function configurarHoja() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Crea o limpia la hoja "Pedidos"
  var hoja = ss.getSheetByName(NOMBRE_HOJA);
  if (!hoja) {
    hoja = ss.insertSheet(NOMBRE_HOJA);
  } else {
    hoja.clear();
  }

  // Encabezados
  var enc = hoja.getRange(1, 1, 1, COLUMNAS.length);
  enc.setValues([COLUMNAS]);
  enc.setBackground(COLOR_ENCABEZADO_BG);
  enc.setFontColor(COLOR_ENCABEZADO_TXT);
  enc.setFontWeight("bold");
  enc.setFontSize(10);
  enc.setHorizontalAlignment("center");

  // Congela la primera fila
  hoja.setFrozenRows(1);

  // Anchos de columna
  var anchos = [90, 140, 160, 200, 120, 110, 80, 120, 150, 220, 120, 140, 100, 100, 80, 250, 200];
  anchos.forEach(function(a, i) { hoja.setColumnWidth(i + 1, a); });

  // Altura de fila de encabezado
  hoja.setRowHeight(1, 36);

  // Hoja de configuración para el webhook
  var hojaConfig = ss.getSheetByName("Config");
  if (!hojaConfig) hojaConfig = ss.insertSheet("Config");
  hojaConfig.clear();
  hojaConfig.getRange("A1").setValue("URL del Webhook (copiar y pegar en Shopify):");
  hojaConfig.getRange("A1").setFontWeight("bold");
  hojaConfig.getRange("A2").setValue("→ Ejecuta 'obtenerUrlWebhook' para ver tu URL");
  hojaConfig.getRange("A2").setFontColor("#C97B5A");
  hojaConfig.setColumnWidth(1, 500);

  SpreadsheetApp.getUi().alert(
    "✅ Hoja configurada correctamente.\n\n" +
    "Siguiente paso:\n" +
    "1. Haz clic en 'Ejecutar' → 'obtenerUrlWebhook'\n" +
    "2. Copia la URL que aparece\n" +
    "3. Pégala en Shopify → Configuración → Notificaciones → Webhooks"
  );
}

// ── 2. Recibe pedidos de Shopify (webhook) ─────────────
function doPost(e) {
  try {
    var datos = JSON.parse(e.postData.contents);
    agregarPedido(datos);
    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  } catch(err) {
    return ContentService.createTextOutput("Error: " + err).setMimeType(ContentService.MimeType.TEXT);
  }
}

function agregarPedido(pedido) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(NOMBRE_HOJA);
  if (!hoja) configurarHoja();
  hoja = ss.getSheetByName(NOMBRE_HOJA);

  // Extrae datos del pedido
  var numero     = "#" + (pedido.order_number || pedido.name || "—");
  var fecha      = pedido.created_at
                   ? Utilities.formatDate(new Date(pedido.created_at), "America/Guatemala", "dd/MM/yyyy HH:mm")
                   : "—";
  var cliente    = ((pedido.customer || {}).first_name || "") + " " + ((pedido.customer || {}).last_name || "");
  cliente = cliente.trim() || (pedido.billing_address || {}).name || "—";
  var email      = (pedido.customer || {}).email || pedido.email || "—";
  var telefono   = (pedido.customer || {}).phone || (pedido.billing_address || {}).phone || "—";
  var total      = pedido.total_price || "0.00";
  var moneda     = pedido.currency || "USD";
  var estadoPago = traducirEstado(pedido.financial_status);
  var estadoPrep = traducirEstado(pedido.fulfillment_status || "unfulfilled");
  var envio      = pedido.shipping_address || pedido.billing_address || {};
  var direccion  = [envio.address1, envio.address2].filter(Boolean).join(", ") || "—";
  var ciudad     = envio.city || "—";
  var depto      = envio.province || "—";
  var pais       = envio.country || "—";
  var codigoPost = envio.zip || "—";
  var cantArt    = (pedido.line_items || []).length;
  var productos  = (pedido.line_items || []).map(function(item) {
                     return item.quantity + "x " + item.name;
                   }).join(", ");
  var notas      = pedido.note || "—";

  // Agrega fila
  var fila = hoja.getLastRow() + 1;
  hoja.appendRow([numero, fecha, cliente, email, telefono,
                  total, moneda, estadoPago, estadoPrep,
                  direccion, ciudad, depto, pais, codigoPost,
                  cantArt, productos, notas]);

  // Color alterno de filas
  var color = (fila % 2 === 0) ? COLOR_FILA_PAR : COLOR_FILA_IMPAR;
  hoja.getRange(fila, 1, 1, COLUMNAS.length).setBackground(color);
  hoja.setRowHeight(fila, 28);

  // Color especial en Estado pago
  var celdaEstado = hoja.getRange(fila, 8);
  if (estadoPago === "Pagado")    celdaEstado.setBackground("#d4edda").setFontColor("#155724");
  if (estadoPago === "Pendiente") celdaEstado.setBackground("#fff3cd").setFontColor("#856404");
  if (estadoPago === "Fallido")   celdaEstado.setBackground("#f8d7da").setFontColor("#721c24");
}

function traducirEstado(estado) {
  var estados = {
    "paid": "Pagado", "pending": "Pendiente", "refunded": "Reembolsado",
    "voided": "Anulado", "partially_refunded": "Reembolso parcial",
    "authorized": "Autorizado", "fulfilled": "Preparado",
    "unfulfilled": "No preparado", "partial": "Parcial", "null": "No preparado"
  };
  return estados[estado] || estado || "—";
}

// ── 3. Obtén tu URL de webhook ─────────────────────────
function obtenerUrlWebhook() {
  var url = ScriptApp.getService().getUrl();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaConfig = ss.getSheetByName("Config");
  if (hojaConfig) {
    hojaConfig.getRange("A2").setValue(url || "Primero debes publicar el script como aplicación web");
    hojaConfig.getRange("A2").setFontColor(url ? "#155724" : "#C97B5A");
  }
  SpreadsheetApp.getUi().alert(
    url
    ? "✅ Tu URL de Webhook es:\n\n" + url + "\n\nCópiala y pégala en:\nShopify → Configuración → Notificaciones → Webhooks → Crear webhook\nEvento: Creación de pedido\nFormato: JSON"
    : "⚠️ Primero debes publicar el script:\nImplementar → Nueva implementación → Aplicación web → Cualquier usuario"
  );
}

// ── 4. Importa pedidos existentes (opcional) ───────────
function importarPedidosExistentes() {
  var ui = SpreadsheetApp.getUi();
  var respToken = ui.prompt(
    "Importar pedidos existentes",
    "Pega tu Shopify Admin API Token (empieza con shpat_):",
    ui.ButtonSet.OK_CANCEL
  );
  if (respToken.getSelectedButton() !== ui.Button.OK) return;

  var respTienda = ui.prompt(
    "URL de tu tienda",
    "Escribe tu tienda (ej: mi-eelo.myshopify.com):",
    ui.ButtonSet.OK_CANCEL
  );
  if (respTienda.getSelectedButton() !== ui.Button.OK) return;

  var token  = respToken.getResponseText().trim();
  var tienda = respTienda.getResponseText().trim();

  try {
    var url = "https://" + tienda + "/admin/api/2024-01/orders.json?limit=250&status=any";
    var resp = UrlFetchApp.fetch(url, {
      headers: { "X-Shopify-Access-Token": token }
    });
    var data = JSON.parse(resp.getContentText());
    var pedidos = data.orders || [];

    pedidos.forEach(function(p) { agregarPedido(p); });

    ui.alert("✅ Se importaron " + pedidos.length + " pedidos correctamente.");
  } catch(err) {
    ui.alert("❌ Error: " + err.message + "\n\nVerifica que el token y la tienda sean correctos.");
  }
}
