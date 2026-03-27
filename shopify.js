import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import 'dotenv/config';

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_products', 'write_products', 'read_orders', 'write_orders'],
  hostName: process.env.SHOPIFY_SHOP_NAME,
  apiVersion: ApiVersion.January24,
  isEmbeddedApp: false,
});

// Cliente REST para la Admin API
export function getClient() {
  const session = {
    shop: process.env.SHOPIFY_SHOP_NAME,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  };

  return new shopify.clients.Rest({ session });
}

export default shopify;
