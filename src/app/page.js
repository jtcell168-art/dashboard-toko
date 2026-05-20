import { getOnlineProducts } from "./actions/store";
import StoreFrontClient from "@/components/store/StoreFrontClient";
import { initPremiumAssets } from "@/lib/initAssets";

// REVALIDATE TO UPDATE STORE
export const revalidate = 0; 

export default async function StoreFront() {
  const products = await getOnlineProducts();

  // Dynamically copy user uploaded media assets to public folder on server run
  initPremiumAssets();

  return <StoreFrontClient products={products} />;
}
