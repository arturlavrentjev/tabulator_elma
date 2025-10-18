import type { IMovement, IProduct } from "./types";

export const products: IProduct[] = [
  {
    key: 1,
    deal_id: "1",
    name: "Труба кругоизогнутая",
    amount: 2,
    contracted: 2
  },
  {
    key: 2,
    deal_id: "1",
    name: "Труба кругоизогнутая",
    amount: 12,
    contracted: 12
  },
  {
    key: 3,
    deal_id: "1",
    name: "Труба кругоизогнутая",
    amount: 2.6,
    contracted: 2.6
  },
  {
    key: 4,
    deal_id: "1",
    name: "Труба кругоизогнутая",
    amount: 200,
    contracted: 200
  }
]


export const movements: IMovement[] = [
  {
    app_id: "2",
    key: "1",
    deal_id: "1",
    amount: 2,
    status: "transfer_shipment"
  },
{
    app_id: "2",
    key: "4",
    deal_id: "1",
    amount: 200,
    status: "transfer_shipment"
  }
];