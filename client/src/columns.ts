import { type ColumnDefinition, type CellComponent, type AdditionalExportOptions, } from "tabulator-tables";
import axios from "axios"
const a: AdditionalExportOptions = { columnHeaders: true }

export const data: Record<string, string> = {}
export const col: ColumnDefinition[] = [
  { title: "Сделка", field: "deal" },
  { title: "Требования по упаковке", field: "packaging_requirements" },
  { title: "Требования по маркировке", field: "labeling_requirements",},
  { title: "Базис поставки", field: "delivery_basis" },
]
export const columns: ColumnDefinition[] = [
  { title: "#", formatter: "rownum" },
  { title: "Ключ", field: "key", width: 100, visible: false},
  {
    title: "Количество", field: "quantity", editor: true, cellEditing: (cell) => {
      const row_data = cell.getData();
      if (row_data["nomenclature"].name?.includes("Опора")) return cell.cancelEdit();
    }, validator: ["required"]
  },
  { title: "Сумма", validator:["required"], field: "total", formatter: "money", editor: "number", bottomCalc: "sum"},
  {
    title: "Итоговая сумма",
    field: "total_amount",
    formatter: "money",
    editor: true,
    mutatorData: (value, data, type, mutatorParams) => {
      if (data.quantity != null && data.total != null) {
        return data.quantity * data.total;
      }
      return "";
    },
  },
  {
    title: "Номенклатура", field: "nomenclature", width: "500", cellEditing: (cell) => { },
    editor(cell, onRendered, success, cancel, editorParams) {

      var editor = document.createElement("input");

      editor.setAttribute("type", "text");

      editor.style.padding = "3px";
      editor.style.width = "100%";
      editor.style.boxSizing = "border-box";
      const value = cell.getValue()
      if (value) {
        editor.value = value?.name || value
      }
      onRendered(function () {
        editor.focus();
      });
      function successFunc() {
        success(editor.value);
        data.id = value.id
        data.name = editor.value
      }

      editor.addEventListener("change", successFunc);
      editor.addEventListener("blur", successFunc);

      //return the editor element
      return editor;
    },
    formatter(cell: CellComponent, formatterParams, onRendered) {
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
    },
    editor: customAutocompleteEditor,
    // editor: "list",
    // editorParams: cell => ({
    //   // valuesLookup: fetchUnitsWithDebounce,
    //   // filterDelay: 300,
    //   // autocomplete: true
    // }),
    width: "300"
  }
]

// Асинхронная функция для получения данных с сервера
const fetchProducts = async (term: string) => {
  try {
    console.log(term)
    const response = await axios.post(`http://localhost:3001/goods`, { name: term });
    console.log(response.data.products)
    return response.data.products; // Вернуть список товаров
  } catch (err: any) {
    console.error(err.message);
    return [];
  }
};

// Основной редактор Autocomplete с функцией асинхронной загрузки
// @ts-ignore
// function customAutocompleteEditor(cell: CellComponent, onRendered, success, cancel, editorParams) {
//   const input = document.createElement('input');
//   input.type = 'text';
//   input.style.width = "100%";
//   input.placeholder = 'Начните вводить название товара...';

//   // Автозаполнение на старте
//   let timer: any;
//   input.oninput = async (ev: any) => {
//     const value = ev.target.value;
//     clearTimeout(timer);

//     // Ставим небольшую задержку перед отправкой запроса
//     timer = setTimeout(async () => {
//       if (value.length >= 3) { // Начинаем поиск после 3-х символов
//         const products = await fetchProducts(value);
//         const field = cell.getColumn().getDefinition();
//         const table = cell.getTable()
//         await table.updateColumnDefinition(field?.field!, {...field, editorParams: {values: products}})

//       }
//     }, 300); // Задержка 300мс
//   };

//   onRendered(() => {
//     input.focus();
//   });

//   input.onblur = () => {
//     success(input.value); // Завершаем редактирование
//   };

//   return input;
// };
// function customAutocompleteEditor(cell: any, onRendered: Function, success: Function, cancel: Function, editorParams: any) {
//   const input = document.createElement('input');
//   input.classList.add("custom_input")
//   input.type = 'text';
//   input.name = "search";
//   input.placeholder = 'Начните вводить название товара...';

//   // Контейнер для подсказок
//   const dropdownContainer = document.createElement('ul');
//   dropdownContainer.classList.add("custom_list")

//   document.body.append(dropdownContainer)
//   // Установка размеров контейнера для подсказок

//   // Автозаполнение на старте
//   let timer: any;
//   input.oninput = async (ev: Event) => {
//     const value = (ev.target as HTMLInputElement).value;
//     clearTimeout(timer);

//     // Удаляем предыдущие подсказки
//     //dropdownContainer.innerHTML = '';

//     // Поставим небольшую задержку перед отправкой запроса
//     timer = setTimeout(async () => {
//       if (value.length >= 3) { // Начинаем поиск после 3-х символов
//         const products = await fetchProducts(value);

//         // Наполняем список подсказок
//         if (products.length > 0) {
//           products.forEach((product: any) => {
//             const option = document.createElement('li');
//             option.textContent = product.__name;
//             option.style.cursor = 'pointer';
//             option.onclick = () => {
//               input.value = product;
//               dropdownContainer.style.display = 'none';
//               success(input.value); // Подтверждение завершения редактирования
//             };
//             dropdownContainer.append(option);
//           });
//           // Покажем список подсказок
//           dropdownContainer.style.display = 'block';
//           console.log(dropdownContainer)
//         } else {
//           dropdownContainer.style.display = 'none';
//         }
//       }
//     }, 300); // Задержка 300мс
//   };

//   onRendered(() => {
//     input.focus();
//   });

//   // input.onblur = () => {
//   //   success(input.value); // Завершаем редактирование
//   //   // dropdownContainer.style.display = 'none';
//   // };

//   return input;
// }

function customAutocompleteEditor(cell: any, onRendered: Function, success: Function, cancel: Function, editorParams: any) {
  const input = document.createElement('input');
  const cell_value = cell.getValue()
  input.classList.add("custom_input");
  input.type = 'text';
  input.name = "search";
  input.placeholder = 'Начните вводить название товара...';
  input.value = cell_value ?? ""
  // Контейнер для подсказок
  const dropdownContainer = document.createElement('div');
  dropdownContainer.classList.add("custom_list");
  dropdownContainer.style.position = 'absolute';
  dropdownContainer.style.zIndex = '1000';
  dropdownContainer.style.width = `450px`;
  dropdownContainer.style.border = '1px solid #aaa';
  dropdownContainer.style.backgroundColor = '#fff';
  dropdownContainer.style.padding = '5px';
  dropdownContainer.style.maxHeight = '200px';
  dropdownContainer.style.overflowY = 'auto';
  dropdownContainer.style.display = 'none';
  const container = document.createElement("ul")
  container.style.listStyle = "none"
  container.style.padding = "0"
  const cont = document.createElement("div");
  cont.style.display = "flex";
  cont.style.justifyContent = "right"
  const button = document.createElement("button");
  button.textContent = "+ Создать";
  button.style.backgroundColor = "transparent";
  button.style.border = "none";
  button.style.cursor = "pointer";
  cont.append(button)
  // Установка контейнера в документ
  document.body.append(dropdownContainer);

  // Автозаполнение на старте
  let timer: any;
  input.oninput = async (ev: Event) => {
    const value = (ev.target as HTMLInputElement).value;
    clearTimeout(timer);

    dropdownContainer.prepend(cont)
    dropdownContainer.append(container)
    // Удаляем предыдущие подсказки
    container.innerHTML = '';

    // Посчитаем координаты и размеры поля ввода
    const rect = input.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const topPosition = rect.top + input.offsetHeight + scrollTop;
    const leftPosition = rect.left;

    // Расположим контейнер внизу поля ввода
    dropdownContainer.style.top = `${topPosition}px`;
    dropdownContainer.style.left = `${leftPosition}px`;

    // Поставим небольшую задержку перед отправкой запроса
    timer = setTimeout(async () => {
      if (value.length >= 3) { // Начинаем поиск после 3-х символов
        const products = await fetchProducts(value);

        // Наполняем список подсказок
        if (products.length > 0) {
          products.forEach((product: any) => {
            const option = document.createElement('li');
            option.classList.add("option")
            option.textContent = product.__name;
            option.style.cursor = 'pointer';
            option.onclick = () => {
              input.value = product.__name;
              dropdownContainer.style.display = 'none';
              success(input.value); // Подтверждение завершения редактирования
            };
            container.append(option);
          });
          // Покажем список подсказок
          dropdownContainer.style.display = 'block';
        } else {
          const option = document.createElement('li');
          option.textContent = "Список пуст"
          dropdownContainer.append(option);
          dropdownContainer.style.display = 'block';

          // dropdownContainer.style.display = 'none';
        }
      } else {
        dropdownContainer.style.display = 'none';
      }
    }, 300); // Задержка 300мс
  };

  onRendered(() => {
    input.focus();
  });

  return input;
}




