export interface IProduct {
  key: number
  deal_id: string,
  name: string,
  amount: number,
  contracted: number
  transfer_shipent?: number
}

export interface IApplication {
  code: string
  namespace: string
  id: string
}

export interface IMovement {
  id: string
  deal: string
  linked_app: IApplication
  positions: IMovementPositions[]
}

export interface IMovementPositions {
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

export interface IData {
  deal: string
  application: string
  category: GroupVariant
}