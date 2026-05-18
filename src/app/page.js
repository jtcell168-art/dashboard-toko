import { getOnlineProducts } from "./actions/store";
import StoreFrontClient from "@/components/store/StoreFrontClient";

// REVALIDATE TO UPDATE STORE
export const revalidate = 0; 

export default async function StoreFront() {
  const products = await getOnlineProducts();

  return <StoreFrontClient products={products} />;
}
