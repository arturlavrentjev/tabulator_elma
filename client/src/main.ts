import { type RowComponent, TabulatorFull, type RowLookup, type Options, Tabulator, CellComponent } from "tabulator-tables";
// import { col, columns, data } from "./columns";
import { getMovementsAndProducts } from "./utils";
import { GroupVariant,} from "./types";
import "./style.css"
const btn_create = document.querySelector(".create_product") as HTMLButtonElement

// const options: Options = {
//   columns,
//   data: [],
//   // reactiveData: true,
//   layout: "fitColumns",
//   history: true,

//   rowContextMenu: window.innerWidth > 720 ? [{
//     label: "Добавить строку", action: async (e: any, row: RowComponent) => {
//       const new_row = await row.getTable().addRow();
//       const table = row.getTable();
//       table.updateColumnDefinition("key", {
//         editor: true, formatter: function (cell: any, formatterParams: any, onRendered: any) {
//           const value = cell.getValue()
//           if (typeof value == "object") {
//             return value.name
//           }
//           return value
//         }, title: "Ключ"
//       })
//       table.scrollToRow(new_row)
//       const row_element = new_row.getElement()
//       const row_nomenclature = row_element.querySelector("[tabulator-field='nomenclature']") as HTMLInputElement
//       row_nomenclature.focus()
//       btn_create.style.display = "inline-block";
//     }
//   }] : undefined,
//   // minHeight: "200",
//   height: 700
// }
// window.addEventListener("DOMContentLoaded", () => {

//   const table = new TabulatorFull(".container", options)
//   table.on("rowContext", (e: any, row: RowComponent) => {
//     e.preventDefault()

//   })

//   table.on("tableBuilt", async () => {
//     table.alert("Загрузка")
//     await table.setData(await loadData())
//     table.clearAlert()
//     if (!table.getData().length) 
//         table.alert("Нет данных")
//     // console.log(table.getHtml("active", true, {columnHeaders: true, rowHeaders: true}))
//   })
//   const btn_load = document.querySelector(".load_movements")
//   const delete_btn = document.querySelector(".delete")
//   delete_btn?.addEventListener("click", () => {
//     table.deleteColumn("key")
//     table.getColumn("key").getDefinition().validator

//   })

//   table.on("cellEdited", editRowAndAddRow)
//   function editRowAndAddRow(cell: any) {
//     if (cell.getField() !== "unit") return;
//     const row = cell.getRow();
//     const rows = table.getRows();

//     const last_row = rows.at(-1);
//     const is_last_row = (row === last_row);

//     const cells: any[] = row.getCells();
//     const container = document.getElementById("app");
//     let has_errors = false;

//     document.querySelectorAll(".validation-message").forEach((el: any) => el.remove());

//     for (const cell of cells) {
//       const field = cell.getField();
//       if (!field || !cell.getColumn().isVisible()) continue;
//       // @ts-ignore
//       const colDef = cell.getColumn().getDefinition();
//       const validators = Array.isArray(colDef.validator) ? colDef.validator : [colDef.validator];
//       const has_required = validators.includes("required");

//       if (has_required) {
//         const valid = cell.validate();
//         if (Array.isArray(valid) && valid.length) {
//           has_errors = true;
//           const msg = document.createElement("div");
//           msg.className = "validation-message";
//           msg.textContent = `Поле "${colDef.title.replace(/ ?\*/g, "")}" обязательно для заполнения`;
//           msg.style.color = "red";
//           msg.style.margin = "4px 0";

//           container?.after(msg);
//         } else {
//           cell.getElement().style.border = "";
//         }
//       }
//     }

//     if (is_last_row) {
//       table.addRow({}).then((new_row) => table.scrollToRow(new_row))
//     }
//   }
//   btn_load?.addEventListener("click", async (e) => {
//     table.alert("Загрузка")
//     console.log(e)
//     try {
//       const res = await fetch("http://localhost:3001/movements", {
//         method: "POST"
//       })
//       if (res.ok) {
//         const result = (await res.json()).result.result // массив данных
//         table.getColumn("nomenclature").updateDefinition({
//           title: "Номенклатура", editorParams: {
//             values: result.map((item: any) => item.__name)
//           }
//         })
//       }
//     } catch (e: any) {
//       console.error(e.message)
//     } finally {
//       table.clearAlert()
//     }
//   })

//   btn_create!.style.display = "none";

//   const btn_save = document.querySelector(".save") as HTMLButtonElement
//   btn_save.style.display = "none";
//   btn_create?.addEventListener("click", async (e) => {
//     btn_save.style.display = "inline-block";
//     const data = table.getData()
//     const res = await fetch("http://localhost:3001/create_nomenclature", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({ name: data[data.length - 1].nomenclature })
//     })
//     if (!res.ok) throw new Error("Ошибка");
//   })
//   table.on("cellClick", (e, cell) => {
//     if (cell.getField() == "nomenclature") {
//       // console.log(cell.getValue())
//       // const data = cell.getValue();
//       // product = {...data}
//       if (!data.id || !data.name) return;
//       btn_save.style.display = "inline-block";
//     }
//   })

//   // сохранить

//   btn_save?.addEventListener("click", async (e) => {
//     try {
//       if (!data.id || !data.name) return;
//       const res = await fetch("http://localhost:3001/update_goods", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify(data)
//       })
//       if (!res.ok)
//         throw new Error("Произошла ошибка")
//     } catch (error) {
//       if (error instanceof Error)
//         console.error(error.message)
//     } finally {
//       btn_save.style.display = "none"
//     }
//   })
// })


// export async function loadData<T>(): Promise<T[]> {
//   try {
//     // console.log(import.meta.env.VITE_MODE_NODE)
//     const req = await fetch("http://192.168.1.38:3001/goods", {
//       method: "POST"
//     })
//     if (!req.ok)
//       throw new Error("Ошибка на стороне сервера")
//     const data = await req.json()
//     return processData(data)
//   } catch (error: any) {
//     if (error instanceof Error) {
//       console.error(error.message)
//     }
//     return []
//   }
// }

// function processData(data: any): any[] {
//   const new_data: any[] = [];
//   if (!data || typeof data !== "object") {
//     return []
//   }
//   const { products, units } = data;
//   for (const unit of units) {
//     const filter_product_unit = products.filter((pr: any) => pr.unit[0] == unit.__id);
//     if (!filter_product_unit.length) {
//       new_data.push(...products.map((item: any) => ({
//         nomenclature: {
//           id: item.__id,
//           name: item.__name
//         }
//       })))
//       continue
//     }
//     new_data.push(...filter_product_unit.map((item: any) => ({
//       nomenclature: {
//         id: item.__id,
//         name: item.__name
//       },
//       unit: {
//         id: unit.__id,
//         name: unit.__name
//       }
//     })))
//   }

//   return products.map((product: any) => ({ nomenclature: { id: product.__id, name: product.__name } }));
// }

// const btn_load = document.querySelector(".products")

// btn_load?.addEventListener("click", async () => {
//   await getMovementsAndProducts()
// })

// const obj: IData = {
//   deal: "",
//   application: "",
//   category: GroupVariant.all_products
// }
// const form_app = document.querySelector(".form_app");
// if (form_app instanceof HTMLFormElement) {
//   form_app?.addEventListener("submit", async (e: SubmitEvent) => {
//     e.preventDefault();
//     const deal = form_app.querySelector("#deal") as HTMLInputElement;
//     const app = form_app.querySelector("#application") as HTMLInputElement;
//     const option = form_app.querySelector("#selected_products") as HTMLSelectElement;
//     obj.deal = deal.value;
//     obj.application = app.value;
//     obj.category = option.value as GroupVariant;
//     const data = await getMovementsAndProducts(obj.application, obj.category)
//     console.log(data)
//   })
// }

interface IData {
    key: number,
    nomenclature: string
    unit?: string
    contracted?: number
    purchased: number
    movements?: IData[],
    data?: IData[]
}
const data: IData[] = [
    { key: 1, 
        movements: [
            {key: 1.3, nomenclature: "Гайка", purchased: 15}
        ], 
    nomenclature: "Бобышка", contracted: 10, purchased: 2 }, 
    { key: 2, nomenclature: "Номенклатура", purchased: 10, data: [{
        key: 2.1, nomenclature: "Закупка", purchased: 5
    }] }
]
// //define table
const table = new TabulatorFull("#app", {
    // height: "311px",
    height: "100%",
    layout: "fitColumns",
    data,
    dataTree: true,
    dataTreeChildField: "movements",
    columns: [
        { title: "Ключ", width: 60, field: "key", headerVertical: true, cellClick: function(e, cell) {
            const row = cell.getRow();
            const sub_table_container = row.getElement().querySelector(".sub-table-container") as HTMLDivElement;
            
            if (sub_table_container) {
                sub_table_container.style.display = 
                    sub_table_container.style.display === "none" ? "block" : "none";
            }
        } },
        { title: "Номенклатура", field: "nomenclature"},
        {title: "Ед. измерения", field: "unit", width: 60, headerVertical: true},
        {
            title: "Статусы", field: "statuses", columns: [
                { title: "Законтрактовано", field: "contracted", width: 60, headerVertical: true },
                { title: "Закуплено", field: "purchased", width: 60, headerVertical: true, },
            ]
        },
    ],
    rowFormatter: function(row) {
    if (!row.getData().data) return;
    const holderEl = document.createElement("div");
    holderEl.className = "sub-table-container";
    holderEl.style.display = "none"; // изначально скрыто
    const subTableEl = document.createElement("div");
    holderEl.appendChild(subTableEl);
    row.getElement().appendChild(holderEl);
    table.scrollToRow(row)
    new TabulatorFull(subTableEl, { 
        layout: "fitColumns",
        headerVisible: false,
        columns: [
            {title: "Ключ", field: "key", width: row.getTable().getColumn("key").getDefinition().width},
            {title: "Номенклатура", field: "nomenclature", width: row.getTable().getColumn("nomenclature").getDefinition().width},
            {title: "Ед. измерения", field: "unit", width: 60},
            {title: "Закуплено", field: "contracted", width: row.getTable().getColumn("contracted").getDefinition().width, visible: false },
            {title: "Закуплено", field: "purchased", width: row.getTable().getColumn("purchased").getDefinition().width}
    ],
        data: row.getData().data
    });
}
    // rowFormatter: function (row) {
    //     //create and style holder elements
    //     var holderEl = document.createElement("div");
    //     var tableEl = document.createElement("div");

    //     holderEl.style.boxSizing = "border-box";
    //     //    holderEl.style.padding = "10px 30px 10px 10px";
    //     holderEl.style.borderTop = "1px solid #333";
    //     //    holderEl.style.borderBotom = "1px solid #333";


    //     tableEl.style.border = "1px solid #333";

    //     holderEl.appendChild(tableEl);

    //     row.getElement().appendChild(holderEl);

    //     var subTable = new Tabulator(tableEl, {
    //         layout: "fitColumns",
    //         data: row.getData().serviceHistory,
    //         columns: [
    //             { title: "Ключ", field: "key", sorter: "date" },
    //             { title: "Номенклатура", field: "   " },
    //             { title: "Action", field: "actions" },
    //         ]
    //     })
    // },
});

// table.on("rowClick", (e: any, row: RowComponent) => {
//     const is_subtable = row.getElement().querySelector(".sub-table")

//     if (is_subtable) return;
//     //create and style holder elements
//     const holderEl = document.createElement("div");
//     const tableEl = document.createElement("div");
//     tableEl.classList.add("sub-table")

//     holderEl.style.boxSizing = "border-box";
//        holderEl.style.padding = "10px 0";
//     holderEl.style.borderTop = "1px solid #333";
//     //    holderEl.style.borderBotom = "1px solid #333";


//     tableEl.style.border = "1px solid #333";

//     holderEl.appendChild(tableEl);

//     row.getElement().appendChild(holderEl);

//     const subTable = new Tabulator(tableEl, {
//         layout: "fitColumns",
//         data: row.getData().movements,
//         columns: [
//         { title: "Ключ", field: "key" },
//         { title: "Номенклатура", field: "nomenclature"},
//         { title: "Закуплено", field: "purchased" },
//         { title: "Принято складом", field: "accept_warehouse" },
//     ]
//     })
//     table.recalc()
// })

// table.on("rowClick", function(e, row) {
//     const data = row.getData();
    
//     // Создаём модальное окно
//     const modal = document.createElement("div");
//     modal.style.position = "fixed";
//     modal.style.top = "50%";
//     modal.style.left = "50%";
//     modal.style.transform = "translate(-50%, -50%)";
//     modal.style.background = "white";
//     modal.style.padding = "20px";
//     modal.style.borderRadius = "8px";
//     modal.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
    
//     // Заголовок
//     const title = document.createElement("h3");
//     title.textContent = `Детали для ${data.name}`;
//     modal.appendChild(title);
    
//     // Контейнер для таблицы
//     const tableContainer = document.createElement("div");
//     tableContainer.style.marginTop = "10px";
//     modal.appendChild(tableContainer);
    
//     // Создаём вложенную таблицу
//     new Tabulator(tableContainer, {
//         data: data.details,
//         layout: "fitColumns",
//         columns: [
//             { title: "Поле", field: "field" },
//             { title: "Данные", field: "data" },
//         ],
//         height: "300px"
//     });
    
//     document.body.appendChild(modal);
// });



