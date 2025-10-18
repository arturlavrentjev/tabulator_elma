import { type ColumnDefinition, type CellComponent } from "tabulator-tables";

export const columns: ColumnDefinition[] = [
  { title: "Ключ", field: "key", editor: "number", width: 300 },
  {
    title: "Номенклатура", field: "nomenclature", width: "500", formatter(cell: CellComponent, formatterParams, onRendered) {
      const cell_data = cell.getValue()
      if (typeof cell_data == "object") {
        return cell_data.name
      }
      return cell_data
    }
  },
  {
    title: "Ед. измерения", field: "unit", formatter(cell: CellComponent, formatterParams, onRendered) {
      const cell_data = cell.getValue()
      if (typeof cell_data == "object") {
        return cell_data.name
      }
      return cell_data
    }, width: "300"
  }
]