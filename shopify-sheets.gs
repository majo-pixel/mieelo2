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

// ── 4. Importa desde CSV de Shopify ───────────────────
function importarDesdeCSV() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt(
    "Importar desde CSV de Shopify",
    "Sube el CSV a Google Drive, ábrelo como Google Sheet, copia la URL de esa hoja y pégala aquí:",
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  var urlCSV = resp.getResponseText().trim();
  var idMatch = urlCSV.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) { ui.alert("❌ URL inválida. Asegúrate de copiar la URL completa del Google Sheet."); return; }

  try {
    var ss        = SpreadsheetApp.openById(idMatch[1]);
    var hojaCSV   = ss.getSheets()[0];
    var datos     = hojaCSV.getDataRange().getValues();
    var encabezados = datos[0].map(function(h) { return String(h).trim(); });

    // Mapeo de columnas Shopify CSV → nuestras columnas
    function col(nombre) {
      var i = encabezados.indexOf(nombre);
      return i >= 0 ? i : -1;
    }

    var hojaPedidos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA);
    if (!hojaPedidos) { ui.alert("❌ No se encontró la hoja 'Pedidos'. Ejecuta configurarHoja() primero."); return; }

    var importados = 0;
    var pedidosVistos = {};

    for (var i = 1; i < datos.length; i++) {
      var fila = datos[i];
      var numero = String(fila[col("Name")] || "").trim();
      if (!numero || pedidosVistos[numero]) continue; // evita duplicados por líneas de productos múltiples
      pedidosVistos[numero] = true;

      var fecha       = fila[col("Created at")] || "";
      var cliente     = fila[col("Billing Name")] || fila[col("Shipping Name")] || "";
      var email       = fila[col("Email")] || "";
      var telefono    = fila[col("Billing Phone")] || fila[col("Shipping Phone")] || "";
      var total       = fila[col("Total")] || "";
      var moneda      = fila[col("Currency")] || "USD";
      var estadoPago  = traducirEstado(String(fila[col("Financial Status")] || "").toLowerCase());
      var estadoPrep  = traducirEstado(String(fila[col("Fulfillment Status")] || "unfulfilled").toLowerCase());
      var direccion   = [fila[col("Shipping Address1")], fila[col("Shipping Address2")]].filter(Boolean).join(", ") || fila[col("Billing Street")] || "";
      var ciudad      = fila[col("Shipping City")] || fila[col("Billing City")] || "";
      var depto       = fila[col("Shipping Province Name")] || fila[col("Billing Province Name")] || fila[col("Shipping Province")] || "";
      var pais        = fila[col("Shipping Country")] || fila[col("Billing Country")] || "";
      var codigoPost  = fila[col("Shipping Zip")] || fila[col("Billing Zip")] || "";
      var notas       = fila[col("Notes")] || "";

      // Reúne todos los productos de este pedido (pueden estar en varias filas)
      var productos = [];
      for (var j = i; j < datos.length; j++) {
        if (j > i && String(datos[j][col("Name")] || "").trim()) break;
        var qty  = datos[j][col("Lineitem quantity")] || "";
        var name = datos[j][col("Lineitem name")] || "";
        if (qty && name) productos.push(qty + "x " + name);
      }

      var filaNum = hojaPedidos.getLastRow() + 1;
      hojaPedidos.appendRow([
        numero, fecha, cliente, email, telefono,
        total, moneda, estadoPago, estadoPrep,
        direccion, ciudad, depto, pais, codigoPost,
        productos.length, productos.join(", "), notas
      ]);

      var color = (filaNum % 2 === 0) ? COLOR_FILA_PAR : COLOR_FILA_IMPAR;
      hojaPedidos.getRange(filaNum, 1, 1, COLUMNAS.length).setBackground(color);
      if (estadoPago === "Pagado")    hojaPedidos.getRange(filaNum, 8).setBackground("#d4edda").setFontColor("#155724");
      if (estadoPago === "Pendiente") hojaPedidos.getRange(filaNum, 8).setBackground("#fff3cd").setFontColor("#856404");
      if (estadoPago === "Anulado")   hojaPedidos.getRange(filaNum, 8).setBackground("#f8d7da").setFontColor("#721c24");

      importados++;
    }

    ui.alert("✅ Se importaron " + importados + " pedidos desde el CSV.");
  } catch(err) {
    ui.alert("❌ Error: " + err.message);
  }
}
