import type { IApplication, IMovement, IMovementPositions, IProduct } from "./types";

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

const application: IApplication = {
  id: "application_1",
  code: "shipments",
  namespace: "logistics_and_warehouses"
}

const application_2: IApplication =  {
  id: "application_2",
  code: "shipments",
  namespace: "logistics_and_warehouses"
}

export const movements_positions: IMovementPositions[] = [
  {
    key: "1",
    deal_id: "1",
    amount: 2,
    status: "transfer_shipment"
  },
  {
    key: "4",
    deal_id: "1",
    amount: 200,
    status: "transfer_shipment"
  }
];

export const movements: IMovement[] = [
  {
    id: "movement_1",
    deal: "deal_1",
    linked_app: application,
    positions: movements_positions
  },
  {
    id: "movement_2",
    deal: "deal_2",
    linked_app: application_2,
    positions: [{
      key: "1",
      deal_id: "deal_2",
      amount: 2,
      status: "shipped"
    }]
  }
]


