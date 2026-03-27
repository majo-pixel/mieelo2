import { getClient } from './shopify.js';

async function main() {
  const client = getClient();

  try {
    // Obtener productos de la tienda
    const response = await client.get({ path: 'products', query: { limit: 5 } });
    const productos = response.body.products;

    console.log(`✅ Conectado a Shopify exitosamente!`);
    console.log(`📦 Primeros ${productos.length} productos:`);
    productos.forEach(p => {
      console.log(` - ${p.title} (ID: ${p.id})`);
    });

  } catch (error) {
    console.error('❌ Error al conectar con Shopify:', error.message);
  }
}

main();
