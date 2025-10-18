export interface IProduct {
  key: number
  deal_id: string,
  name: string,
  amount: number,
  contracted: number
  transfer_shipent?: number
}

export interface IMovement {
  app_id: string,
  key: string,
  deal_id: string,
  amount: number,
  status: string
}

export enum GroupVariant {
  "all_products" = "all",
  "general_products" = "general_products",
  "group" = "group"
}