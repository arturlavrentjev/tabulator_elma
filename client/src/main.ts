import { RowComponent, TabulatorFull, type ColumnDefinition, type Options } from "tabulator-tables";
import "./style.css"
import { columns } from "./columns";

const options: Options = {
  columns,
  data: [],
  layout: "fitDataFill",
  rowContextMenu: [{ label: "Добавить строку", action: (e: any, row: RowComponent) => row.getTable().addRow() }],
  minHeight: "200",
}

window.addEventListener("DOMContentLoaded", () => {

  const table = new TabulatorFull(".container", options)

  table.on("rowContext", (e: any, row: RowComponent) => {
    e.preventDefault()

  })

  table.on("tableBuilt", async () => {
    table.alert("Загрузка")
    await table.setData(await loadData())
    table.clearAlert()
  })
  const btn_load = document.querySelector(".load_movements")

  btn_load?.addEventListener("click", async (e) => {
    table.alert("Загрузка")
    try {
      const res = await fetch("http://localhost:3001/movements", {
        method: "POST"
      })
      if (res.ok) {
        const result = (await res.json()).result.result // массив данных
        table.getColumn("nomenclature").updateDefinition({
          title: "Номенклатура", editorParams: {
            values: result.map((item: any) => item.__name)
          }
        })
      }
    } catch (e: any) {
      console.error(e.message)
    } finally {
      table.clearAlert()
    }
  })

  const btn_create = document.querySelector(".create_product")

  btn_create?.addEventListener("click", async (e) => {
    try {
      const item = table.getData()
      const res = await fetch("http://localhost:3001/create_nomenclature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: table.getData()[item.length - 1].nomenclature })
      })
      if (!res.ok)
        throw new Error("Произошла ошибка")
    } catch (error) {
      if (error instanceof Error)
        console.error(error.message)
    }
  })

})

async function loadData<T>(): Promise<T[]> {
  try {
    const req = await fetch("http://localhost:3001/goods", {
      method: "POST"
    })
    if (!req.ok)
      throw new Error("Ошибка на стороне сервера")
    const data = await req.json()
    console.log(processData(data))
    return processData(data)
  } catch (error: any) {
    if (error instanceof Error) {
      console.error(error.message)
    }
    return []
  }
}

const scheme = document.querySelector(".scheme")

scheme?.addEventListener("click", async () => {
  const res = await fetch("http://localhost:3001/app", {
    method: "GET"
  })
})

function processData(data: any): any[] {
  debugger
  const new_data: any[] = [];
  if (!data || typeof data !== "object") {
    return []
  }
  const { products, units } = data;
  for (const unit of units) {
    const filter_product_unit = products.filter((pr: any) => pr.unit[0] == unit.__id);
    if (!filter_product_unit.length) {
      new_data.push(...products.map((item: any) => ({
        nomenclature: {
          id: item.__id,
          name: item.__name
        }
      })))
      continue
    }
    new_data.push(...filter_product_unit.map((item: any) => ({
      nomenclature: {
        id: item.__id,
        name: item.__name
      },
      unit: {
        id: unit.__id,
        name: unit.__name
      }
    })))
  }

  return new_data;
}