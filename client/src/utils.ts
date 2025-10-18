import type { IMovement, IProduct } from "./types";
import { GroupVariant } from "./types";
import { products, movements } from "./products";


async function getProducts(): Promise<IProduct[]> {
  return await new Promise(res => setTimeout(() => res(products), 1000))
}

async function getMovements(): Promise<IMovement[]> {
  return await new Promise(res => setTimeout(() => res(movements), 1000))
}


export async function getMovementsAndProducts(variant: GroupVariant = GroupVariant.all_products): Promise<IProduct[]> {
  debugger
  try {
    const [products, movements] = await Promise.all([getProducts(), getMovements()]);
    switch (variant) {
      case GroupVariant.general_products:
        const filter_products_of_movements = products.filter(
          product => movements.some(
            movement => Number(movement.key) == product.key && movement.deal_id === product.deal_id));
        return enrichProductsWithAmounts(filter_products_of_movements, movements);

      default:
        return enrichProductsWithAmounts(products, movements);
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log(e.message)
    }
    return []
  }
}

function enrichProductsWithAmounts(products: IProduct[], movements: IMovement[]): IProduct[] {
  return products.map(product => {
    const movement = movements.find(movement => Number(movement.key) == product.key && movement.deal_id && product.deal_id);
    if (!movement) return product
    return { ...product, [movement.status]: movement.amount }
  })
}