/* Client scripts module */
import Tabulator from "tabulator.js";
import * as XLSX from "xlsx.full.min.js";
declare const console: any, document: any, window: any, $: any, FileReader: any;
(window as any).XLSX = XLSX;
interface IDealData {
    [id: string]: IBodyDeal
}
function checkboxHeaderFilter(cell: any, onRendered: any, success: any, cancel: any, editorParams: any) {
    const checkbox = document.createElement("input");
    checkbox.classList.add("custom-checkbox");
    checkbox.type = "checkbox";
    checkbox.style.margin = "4px";
    checkbox.addEventListener("change", function () {
        debugger
        if (this.checked) {
            clearFilterPrefillData(false)
        } else {
            clearFilterPrefillData(true);
        }
    });

    return checkbox;
}
function inititalData() {
    const a = [
        { column_name: "Передано в отгрузку", field: "transfer_shipment" },
        { column_name: "Упаковано", field: "packed" },
        { column_name: "Добавлено в ов", field: "way" },
    ]
    const t = Context.fields.column_settings.create()
    for (const b of a) {
        const row = t.insert()
        row.column_name = b.column_name
        row.field = b.field
    }
    Context.data.column_settings = t;
    Context.data.readonly = false;
    Context.data.apply_filter_positions = false;
    Context.data.colum_name_for_edit = "К отгрузке"
    Context.data.prefill_selection_positions_from = [
        new RefItem("logistics_and_warehouse_department", "shipments", "0199b84b-0521-753e-82af-58b741d8921d"),
        new RefItem("logistics_and_warehouse_department", "packaging", "0199b844-f797-753e-95d1-cd7019cc14cd"),
        new RefItem("logistics_and_warehouse_department", "packaging", "0199b843-deb3-753e-974a-dbd2f2689cc0"),
    ]
}
interface IBodyDeal {
    id: string,
    name: string
    key_storage?: string
    delivery_plan: any[];
}
function uuidv4() {
    return 'xxxxxxxx'
        .replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}
const prefill_keys: Record<string, string> = {};
let table: any;
let group_by: any = Context.data.group_by?.map(item => item.code) ?? [];
let global_data: any[] | null = [];
const mov_settings: BaseApplicationItem<Application$logistics_and_warehouse_department$movements_settings$Data, any>[] = [];
// необходим для формирования данных по сделке
let deals_data: IDealData | null = {};

const deals: BaseApplicationItem<Application$logistics_and_warehouse_department$dealings$Data, any>[] = [];
let mov_copy: BaseApplicationItem<Application$logistics_and_warehouse_department$movements$Data, any> | undefined = undefined;
const movements_packaging_data: BaseApplicationItem<Application$logistics_and_warehouse_department$packaging$Data, any>[] = [];
let table_settings: TTable<Table$Context$column_settings$Row, Table$Context$column_settings$Result> | undefined
const movements: BaseApplicationItem<Application$logistics_and_warehouse_department$movements$Data, any>[] = [];
const base_setting = {
    headerVertical: true,
    widthGrow: 0.3,
    resizable: false,
    "hozAlign": "center",
    "vertAlign": "middle"
}
// форматирование ячеек для плана поставки, если есть движения
const formatter = (cell: any) => {
    const value = cell.getValue();
    // const field = cell.getField();
    // const movement = movements.find(item => item.data.tabulator_data_row === field);
    // if (!movement) return value;
    if (!value) return;
    return `<span class="clickable-cell">${value}</span>`;
}
let columns: any[] = []
async function onInit(): Promise<void> {
    debugger
    if (Context.data.table_hidden) return;
    Context.data.id_tab = `tab_${uuidv4()}`;
    // inititalData()
    table_settings = Context.data.column_settings;
    // //TODO: Тут уже можно получить колонки, они заполняются 
    columns = JSON.parse(Context.data.columns ?? "[]");
    columns.unshift({
        "title": "Выбрать", "field": "selected", "widthGrow": 0.3, "maxWidth": 60, "editor": false, "formatter": "tickCross", "headerVertical": true, "headerFilter": checkboxHeaderFilter, "headerFilterFunc": function (headerValue: any, rowValue: any, rowData: any, filterParams: any) {
            if (headerValue === true) {
                return rowValue === true;
            }
            return true;
        }, "hozAlign": "center", "vertAlign": "middle", "visible": false, "resizable": false, "editorParams": { "autocomplete": true, "listOnEmpty": true, "valuesLookup": true, "values": [] }
    }, { "title": "id Сделки", "field": "deal_id", visible: false, download: Context.data.readonly ? false : true })
    if (!Context.data.readonly) {
        columns[0].visible = true;
        columns.push({
            title: Context.data.colum_name_for_edit ?? "", field: "quantity", ...base_setting, editor: true, cellEditing: (cell: any) => {
                const row_data = cell.getData()
                if (Context.data.group_by?.some(item => item.code == Context.fields.group_by.variants.packaging.code) && row_data["packaging"] != "Все позиции") return cell.cancelEdit();
            }, formatter: "number"
        });
    }

    if (Context.data.readonly && Context.data.dealings?.length) {
        const document_basis_column = columns.find(column => column.field === "contractors");
        if (document_basis_column) {
            document.download = false;
            document_basis_column.field = "document_basis";
            document_basis_column.title = "Документ основание";
        }
    } else if (!Context.data.readonly && Context.data.colum_name_for_edit === "В реализацию") {
        const document_basis_column = columns.find(column => column.field === "contractors" || column.field === "document_basis");
        document_basis_column.visible = false;
        document_basis_column.field = "logistic";
        document_basis_column.formatter = (cell: any) => {
            const cell_value = cell.getValue();

            if (!Array.isArray(cell_value)) {
                return "";
            }
            const links = cell_value.map((item) => {
                const { url, title } = item;
                return `<a href="${url}" target="_blank">${title}</a><br/>`;
            });

            return links.join("");
        };
        document_basis_column.title = "Перевозка";
    }
    const m_set = await Context.fields.movements_settings.app.search().where((f, g) => g.and(f.__deletedAt.eq(null))).size(100).all();
    mov_settings.push(...m_set);
    const statuses: any = { title: "Статусы", columns: [] };
    statuses.columns.push(...table_settings?.map(row => ({
        title: row.column_name, field: row.field, ...base_setting, formatter: Context.data.readonly && Context.data.dealings?.length == 1 ? formatter : (cell: any, formatterParams: any, onRenderer: any) => {
            if (typeof cell.getValue() == "object") {
                const { old_value, new_value } = cell.getValue()
                if (old_value == new_value) {
                    return new_value
                }
                return setFormatter(old_value, new_value);
            }
            return cell.getValue()
        }, cellClick: (e: any, cell: any) => {
            // if (!Context.data.readonly && Context.data.dealings?.length !== 1) return;
            const filter_movements = movements.filter(item => item.data.tabulator_data_row === row.field);
            if (!filter_movements.length) return;
            const links = Context.fields.links.create();
            const row_table = cell.getRow();
            const row_data = row_table.getData();
            for (const item of filter_movements) {
                if (item.data.canceled) continue;
                const position = item.data.positions?.find(i => i.key == row_data["key"] && i.deal.id == row_data["deal_id"]);
                if (position) {
                    Context.data.show_window = true;
                    const link = links.insert();
                    link.element_link = item.data.elma_link ?? "";
                    link.amount = position.amount;
                }
            }
            Context.data.links = links;
        }
    })) ?? []);
    columns.push(statuses);

    Context.data.column = columns;
    // await launch()
}

function setFormatter(old_value: any, new_value: any): string {
    return `<div>
    <div class="product_deleted">${old_value}</div>
    <div class="product_added">${new_value}</div>
    </div>`
}

async function launch(): Promise<void> {
    const deals_ids: string[] = [];
    // поиск мувментов взависимости от типа фильтрации (сделки, приложения, сторейдж)
    switch (Context.data.filter_for_positions?.code) {
        case Context.fields.filter_for_positions.variants.from_deal.code: {
            deals_ids.push(...Context.data.dealings?.map(deal => deal.id) ?? []);
            movements.push(...await Context.fields.movements.app.search().where((f, g) => {
                const filters: Filter[] = [];
                deals_ids.forEach(deal => filters.push(f.deals.has(deal)))
                if (Context.data.show_canceled)
                    filters.push(f.canceled.eq(true));
                if (!Context.data.show_ignore) {
                    return g.and(f.__deletedAt.eq(null), g.or(...filters), g.or(f.ignore.eq(false), f.ignore.eq(null)))
                }
                return g.and(f.__deletedAt.eq(null), g.or(...filters));
            }).size(1000).all())
            break;
        }
        case Context.fields.filter_for_positions.variants.from_application.code: {
            movements.push(...await Context.fields.movements.app.search().where((f, g) => g.and(f.__deletedAt.eq(null), f.linked_app.in(Context.data.application_for_position_filter!))).size(1000).all());
            // @ts-ignore
            deals_ids.push(...new Set(deals_ids.concat(movements.flatMap((mov: any) => mov.data.deals?.map((deal: any) => deal.id) ?? []))));
            break;
        }
        case Context.fields.filter_for_positions.variants.storage.code: {
            if (Context.data.key_storage) {
                const data: any[] = JSON.parse(await System.storage.getItem(Context.data.key_storage) ?? "[]")
                global_data = data.map(item => ({
                    ...item,
                    selected: false,
                    canceled: item.quantity ?? 0
                }))
            }
        }
    }
    deals.push(...await Context.fields.deal.app.search().where(f => f.__id.in(deals_ids)).size(deals_ids.length).all());
    for (const deal of deals) {
        const data: string | null = await System.storage.getItem(deal.data.key_storage ?? "");
        deals_data![deal.id] = { id: deal.id, name: deal.data.__name, key_storage: deal.data.key_storage, delivery_plan: [...JSON.parse(data ?? "[]")] };
    };

    if (Context.data.show_changes) {
        const shipped = Context.data.application_for_position_filter?.find(item => item.code === "shipments")
        if (shipped)
            mov_copy = await Context.fields.movements.app.search().where((f, g) => g.and(f.__deletedAt.eq(null), f.linked_app.in(Context.data.application_for_position_filter!), f.ignore.eq(true), f.canceled.eq(true))).first()
    }

    if (Context.data.prefill_selection_positions_from?.length) {
        for (const prefill_item of Context.data.prefill_selection_positions_from) {
            if (prefill_item.code == "packaging")
                prefill_keys[prefill_item.code] = "packed";
            else if (prefill_item.code == "shipments")
                prefill_keys[prefill_item.code] = "transfer_shipment";
            else {
                prefill_keys[prefill_item.code] = prefill_keys[prefill_item.code]
            }
        }
    }
    if (Context.data.filter_for_positions?.code !== Context.fields.filter_for_positions.variants.storage.code) {
        await iterableMomenents(movements, deals_data!);
    }
}

async function searchPackPlaces(): Promise<BaseApplicationItem<Application$logistics_and_warehouse_department$packaging$Data, any>[]> {
    const movements_packaging_data: BaseApplicationItem<Application$logistics_and_warehouse_department$packaging$Data, any>[] = [];
    if (Context.data.prefill_selection_positions_from?.some(item => item.code == "packaging")) {
        const prefill_ids: string[] = Context.data.prefill_selection_positions_from?.filter(item => item.code === "packaging").map(app => app.id) ?? [];
        const packagings = await Context.fields.packaging.app.search().where(f => f.__id.in(prefill_ids)).size(prefill_ids.length).all();
        movements_packaging_data.push(...packagings);
    } else {
        const ship_movement = movements.find(item => item.data.linked_app?.code == "shipments" && Context.data.prefill_selection_positions_from?.some(i => i.id == item.data.linked_app?.id));
        // @ts-ignore
        const ship_movement_positions = Array.from(new Set(ship_movement!.data.positions!.map(item => item.group?.id))).filter(Boolean);
        const packagings = await Context.fields.packaging.app.search().where(f => f.__id.in(ship_movement_positions)).size(ship_movement_positions.length).all();
        movements_packaging_data.push(...packagings);
    }
    return movements_packaging_data
}

const movements_data: any[] = [];
const prefill_data: any[] = [];

type BasePositionData = {
    key: string;
    id: string;
    deal_id: string;
    unit: string;
    packaging?: string;
    logistic?: string;
};

type PositionData = BasePositionData & Record<string, unknown>;

async function iterableMomenents(movements: BaseApplicationItem<Application$logistics_and_warehouse_department$movements$Data, any>[], deals_data: IDealData) {

    if (Context.data.group_by?.some(item => item.code == Context.fields.group_by.variants.logistic.code)) {
        const ship_movement = movements.filter(item =>
            (item.data.linked_app?.code == "shipments" && Context.data.prefill_selection_positions_from?.some(i => i.id == item.data.linked_app?.id)));
        // @ts-ignore
        const pos = ship_movement.flatMap((
            mov: BaseApplicationItem<Application$logistics_and_warehouse_department$movements$Data, any>) =>
            mov.data.positions?.map(position => ({ key: position.key, deal_id: position.deal.id })))
        const logistic_movements = movements.filter(movement =>
            Context.data.prefill_selection_positions_from?.some(item => item.id == movement.data.linked_app?.id) && movement.data.linked_app?.code === "shipment_logistics"
        );
        const result: PositionData[] = [];
        logistic_movements.forEach(movement => {
            movement.data.positions?.forEach(position => {
                result.push({
                    id: movement.data.linked_app!.id,
                    key: position.key,
                    deal_id: position.deal.id,
                    unit: position.unit,
                    logistic: JSON.parse(movement.data.link ?? "{}")?.title ?? "",
                    [movement.data.tabulator_data_row!]: position.amount
                })
            })
        });
        const data = ship_movement.find(movement => !movement.data.canceled)
        let positions: any[] = searchMovementsForDeals(deals_data, true, "logistic", pos);
        positions = positions.map(pos => {
            const transfer_shipment = data?.data.positions!.filter(row => row.key == pos.key && row.deal.id == pos.deal_id)

            return {
                ...pos,
                transfer_shipment: transfer_shipment?.reduce((acc, item) => acc + item.amount, 0) ?? undefined
            }
        })
        const a: any[] = [];
        for (let index = positions.length - 1; index >= 0; index--) {
            const current_position = positions[index];
            const filtered_items = result.filter(item =>
                item.deal_id == current_position.deal_id &&
                item.key == current_position.key
            );

            if (filtered_items.length > 0) {
                // for (const item of filtered_items) {
                a.push({
                    ...current_position,
                    id: filtered_items[0].id,
                    selected: true,
                    quantity: filtered_items[0].way,
                    way: filtered_items[0].way,
                    logistic: filtered_items[0].logistic
                });
                // }
                positions.splice(index, 1);
            }
        }
        positions.unshift(...a)
        let index = 0;
        positions = positions.sort((a, b) => {
            let numA = a.logistic === "Все позиции" ? Infinity : Number(a.logistic?.split(' ')[1]);
            let numB = b.logistic === "Все позиции" ? Infinity : Number(b.logistic?.split(' ')[1]);
            return numA - numB;
        })
        positions = positions.map(position => {
            return {
                ...position,
                row_id: index += 1
            }
        })
        global_data = positions;
        return
    }

    if (Context.data.group_by?.some(item => item.code == Context.fields.group_by.variants.packaging.code)) {
        const packaging = await searchPackPlaces();
        let positions: any[] = [];
        if (Context.data.prefill_selection_positions_from?.some(item => item.code == "packaging" && !Context.data.prefill_selection_positions_from?.some(item => item.code == "shipments"))) {
            const filter_movements = movements.filter(movement => packaging.some(pack => pack.id == movement.data.linked_app?.id)).map(mov => ({ id: mov.data.linked_app?.id, data: mov.data }));
            const result_packaging_data: PositionData[] = [];

            for (const pack of packaging) {
                const related_movement = filter_movements.find(mov => mov.id === pack.id);

                if (!related_movement || !related_movement.data.positions?.length) continue;
                for (const position of related_movement.data.positions) {
                    result_packaging_data.push({
                        key: position.key,
                        deal_id: position.deal.id,
                        unit: position.unit,
                        id: related_movement.data.linked_app!.id,
                        [related_movement.data.tabulator_data_row!]: position.amount,
                        packaging: pack.data.__name
                    });
                }
            };
            positions.push(...searchMovementsForDeals(deals_data, true));
            const a: any[] = [];
            for (let index = positions.length - 1; index >= 0; index--) {
                const current_position = positions[index];
                const filtered_items = result_packaging_data.filter(item =>
                    item.deal_id == current_position.deal_id &&
                    item.key == current_position.key
                );

                if (filtered_items.length > 0) {
                    let all_packed: number = 0;
                    for (const item of filtered_items) {

                        if (item.packed && typeof item.packed == "number") {
                            all_packed = all_packed + item.packed;
                        }
                        a.push({
                            ...current_position,
                            id: item.id,
                            selected: false,
                            packed: item.packed,
                            packaging: item.packaging
                        });
                    }
                    if (current_position.contracted - all_packed == 0)
                        positions.splice(index, 1);
                }
            }
            positions.unshift(...a)
            let index = 0;
            positions = positions.sort((a, b) => {
                let numA = a.packaging === "Все позиции" ? Infinity : Number(a.packaging?.split(' ')[1]);
                let numB = b.packaging === "Все позиции" ? Infinity : Number(b.packaging?.split(' ')[1]);
                return numA - numB;
            }).map(position => {
                return {
                    ...position,
                    row_id: index += 1
                }
            })

        } else if (Context.data.prefill_selection_positions_from?.some(item => item.code == "packaging") && Context.data.prefill_selection_positions_from?.some(item => item.code == "shipments")) {
            const ship_movement = movements.filter(item => item.data.linked_app?.code == "shipments" && Context.data.prefill_selection_positions_from?.some(i => i.id == item.data.linked_app?.id));
            // @ts-ignore
            const ship_movement_positions = ship_movement.flatMap((mov: any) => mov.data.positions?.map((item: any) => ({ id: item.group?.id ?? "", unit: item.unit, key: item.key, deal_id: item.deal.id, field: mov.data.tabulator_data_row!, [mov.data.tabulator_data_row!]: item.amount })));
            const result_packaging_data: PositionData[] = [];
            for (const pack of packaging) {
                let related_movement = ship_movement_positions.filter((mov: any) => mov.id === pack.id);
                if (!related_movement.length) {
                    const filter_movements = movements.filter(movement => packaging.some(pack => pack.id == movement.data.linked_app?.id)).map(mov => ({ id: mov.data.linked_app?.id, field: mov.data.tabulator_data_row!, data: mov.data }));
                    const item = filter_movements.find(mov => mov.id === pack.id) ?? [] as any;
                    for (const position of item.data.positions) {
                        related_movement.push({
                            key: position.key,
                            deal_id: position.deal.id,
                            unit: position.unit,
                            id: item.id,
                            transfer_shipment: position[position.field],
                            field: item.field,
                            [item.field]: position.amount,
                            packaging: pack.data.__name
                        });
                    }
                }
                for (const position of related_movement) {
                    result_packaging_data.push({
                        key: position.key,
                        deal_id: position.deal_id ?? position.deal.id,
                        unit: position.unit,
                        id: position.id,
                        [position.field]: position[position.field],
                        packaging: pack.data.__name
                    });
                }
            };
            result_packaging_data.push(...ship_movement_positions.filter((mov: any) => !mov.id).map((position: any) => ({
                key: position.key,
                deal_id: position.deal_id,
                unit: position.unit,
                transfer_shipment: position.amount,
                id: position.id,
                [position.field]: position[position.field],
                packaging: "Все позиции"
            })))
            positions.push(...searchMovementsForDeals(deals_data, true));
            const a: any[] = [];
            for (let index = positions.length - 1; index >= 0; index--) {
                const current_position = positions[index];
                const f = result_packaging_data.filter(v => v.deal_id == current_position.deal_id && v.key == current_position.key);
                if (!f.length) continue;
                let all_packed: number = 0;
                for (const i of f) {
                    if (i.transfer_shipment && typeof i.transfer_shipment == "number") {
                        all_packed = all_packed + i.transfer_shipment;
                    }
                    a.push({
                        ...current_position,
                        id: i.id,
                        transfer_shipment: i["transfer_shipment"],
                        quantity: i["transfer_shipment"],
                        selected: ((i["transfer_shipment"] && i["packaging"] === "Все позиции") || i["transfer_shipment"]) ? true : false,
                        packed: i.id ? i["transfer_shipment"] : i["packed"],
                        packaging: i["packaging"]
                    })
                }
                if (current_position.contracted - all_packed == 0)
                    positions.splice(index, 1);
            }
            let index = 0;
            positions.unshift(...a)
            positions = positions.sort((a, b) => {
                let numA = a.packaging === "Все позиции" ? Infinity : Number(a.packaging?.split(' ')[1]);
                let numB = b.packaging === "Все позиции" ? Infinity : Number(b.packaging?.split(' ')[1]);
                return numA - numB;
            }).map(position => {
                return {
                    ...position,
                    row_id: index += 1
                }
            })

        } else {
            const ship_movement = movements.filter(item => item.data.linked_app?.code == "shipments" && Context.data.prefill_selection_positions_from?.some(i => i.id == item.data.linked_app?.id));
            // @ts-ignore
            const ship_movement_positions = ship_movement.flatMap((mov: any) => mov.data.positions?.map((item: any) => ({ id: item.group?.id ?? "", unit: item.unit, key: item.key, deal_id: item.deal.id, field: mov.data.tabulator_data_row!, [mov.data.tabulator_data_row!]: item.amount })));
            const result_packaging_data: PositionData[] = [];
            for (const pack of packaging) {
                const related_movement = ship_movement_positions.filter((mov: any) => mov.id === pack.id);
                if (!related_movement.length) continue;

                for (const position of related_movement) {
                    result_packaging_data.push({
                        key: position.key,
                        deal_id: position.deal_id,
                        unit: position.unit,
                        id: position.id,
                        [position.field]: position[position.field],
                        packaging: pack.data.__name
                    });
                }
            };
            result_packaging_data.push(...ship_movement_positions.filter((mov: any) => !mov.id).map((position: any) => ({
                key: position.key,
                deal_id: position.deal_id,
                unit: position.unit,
                transfer_shipment: position.amount,
                id: position.id,
                [position.field]: position[position.field],
                packaging: "Все позиции"
            })))
            positions.push(...searchMovementsForDeals(deals_data, true));
            const a: any[] = [];
            for (let index = positions.length - 1; index >= 0; index--) {
                const current_position = positions[index];
                const filtered_items = result_packaging_data.filter(item =>
                    item.deal_id == current_position.deal_id &&
                    item.key == current_position.key
                );

                if (filtered_items.length > 0) {
                    for (const item of filtered_items) {
                        a.push({
                            ...current_position,
                            id: item.id,
                            selected: true,
                            transfer_shipment: item.transfer_shipment,
                            quantity: item.transfer_shipment,
                            packed: item.transfer_shipment,
                            packaging: item.packaging
                        });
                    }
                    positions.splice(index, 1);
                }
            }
            let index = 0;
            positions.unshift(...a)
            positions = positions.sort((a, b) => {
                let numA = a.packaging === "Все позиции" ? Infinity : Number(a.packaging?.split(' ')[1]);
                let numB = b.packaging === "Все позиции" ? Infinity : Number(b.packaging?.split(' ')[1]);
                return numA - numB;
            }).map(position => {
                return {
                    ...position,
                    row_id: index += 1
                }
            })
        }
        global_data = positions
        console.log(positions)
        return;
    }
    const prefill_ids: string[] = Context.data.prefill_selection_positions_from?.map(item => item.id) ?? [];
    for (const item of Context.data.prefill_selection_positions_from ?? []) {
        prefill_keys[item.code] = item.code;
    }

    searchMovementsForDeals(deals_data)

    if (Context.data.application_for_position_filter?.length) {
        let row_id = 0;
        group_by = ["deal_pack"]
        let is_group: boolean = false
        debugger
        const filter_movements_basic = movements.filter(item => item.data.linked_app?.code == "");
        const intermediate_results = movements.map(movement =>
            movement.data.positions!.map(row => ({
                key: row.key,
                field: movement.data.tabulator_data_row ?? "",
                [movement.data.tabulator_data_row ?? ""]: row.amount,
                copy: (movement.data.canceled && movement.data.ignore) ? true : false,
                unit: row.unit,
                deal: row.deal
            }))
        );
        const index_array = intermediate_results.findIndex(item => item.filter(i => i.field == "transfer_shipment"));
        const positions_test = findCommonGoods(intermediate_results, index_array)
        console.log(positions_test)
        // @ts-ignore
        const positions: any[] = movements.flatMap((item: any) => {
            const logistics: any[] = [];
            if (!Context.data.show_changes && item.data.canceled) return [];
            if (Context.data.add_multiple_items && item.data.linked_app.code === "shipment_logistics") {
                logistics.push(JSON.parse(item.data.link ?? "{}"))
            }
            return item.data.positions?.map((row: any) => {
                if (Context.data.hidden_group && row.group) return null
                return {
                    key: row.key,
                    field: item.data.tabulator_data_row ?? "",
                    [item.data.tabulator_data_row ?? ""]: row.amount,
                    copy: (item.data.canceled && item.data.ignore) ? true : false,
                    unit: row.unit,
                    logistics,
                    deal: row.deal
                }
            }) ?? [];
        }).filter(Boolean)
        // @ts-ignore
        const reduced_positions = Object.values(
            positions.reduce((acc, item) => {
                const uniqueKey = `${item.key}_${item.deal.id}`;

                if (!acc[uniqueKey]) {
                    acc[uniqueKey] = { ...item };
                } else {
                    acc[uniqueKey].logistics = item.logistics;

                    if (Context.data.show_changes) {
                        const numericFields = Object.keys(item)
                            .filter(k => typeof item[k] === 'number');

                        numericFields.forEach(field => {
                            if (!acc[uniqueKey].history) {
                                acc[uniqueKey].history = {};
                            }

                            if (!acc[uniqueKey].history[field]) {
                                acc[uniqueKey].history[field] = {
                                    old_value: item[field],
                                    new_value: acc[uniqueKey][field]
                                };
                            } else {
                                acc[uniqueKey].history[field].new_value += (acc[uniqueKey][field] ?? 0);
                                acc[uniqueKey].history[field].old_value += (item[field] ?? 0);
                            }
                        });
                    } else {
                        Object.keys(item).forEach(key => {
                            if (typeof item[key] === 'number') {
                                acc[uniqueKey][key] = (acc[uniqueKey][key] ?? 0) + (item[key] ?? 0);
                            }
                        });
                    }
                }

                return acc;
            }, {})
        );

        for (const item of reduced_positions) {
            const row_key = Number(item.key);
            const find_product = deals_data[item.deal.id].delivery_plan?.find(product => product.key === row_key);
            const unique_contractors = new Set(find_product?.movements?.map((item: any) => item.contractor).filter(Boolean));

            if (find_product) {
                const field = Context.data.show_changes ? {
                    [item.field]: item.history ? { ...item.history[item.field] } : item[item.field],
                } : item
                movements_data.push({
                    row_id: row_id += 1,
                    selected: Context.data.readonly ? undefined : false,
                    contracted: find_product?.contracted ?? 0,
                    key: row_key,
                    deal_id: find_product?.deal_id ?? item.deal.id,
                    movements: undefined,
                    logistic: item.logistics,
                    contractors: Array.from(unique_contractors ?? []).join(",") ?? "",
                    deal_pack: deals_data[item.deal.id].name,
                    pack: find_product?.pack,
                    nomenclature: find_product?.nomenclature_client,
                    ...item,
                    ...field,
                    unit: item.unit,
                })
            }
            if (find_product?.pack) {
                is_group = true;
            }
        }


        if (is_group) {
            group_by = ["deal_pack", "pack"];
        }

    }
    if (prefill_ids.length) {
        for (const id of prefill_ids) {
            const item = movements.find(row => row.data.linked_app?.id == id);
            if (item) {
                const { tabulator_data_row } = item.data;
                for (const row of item.data.positions ?? []) {
                    const { amount, deal, key } = row;
                    prefill_data.push({ key, [tabulator_data_row ?? ""]: amount, deal_id: deal?.id, link: JSON.parse(item.data.link ?? "{}"), field: tabulator_data_row })
                }
            }
        }
    }

    if (Context.data.dealings?.length! > 0) {
        // @ts-ignore
        global_data = Object.values(deals_data).flatMap((item: IDealData) => (item.delivery_plan ?? []).map((plan: any) => ({
            ...plan,
            selected: false,
            movements: undefined,
            deal_pack: Context.data.readonly ? undefined : item.name,
        })))
        if (Context.data.prefill_selection_positions_from?.length) {
            // @ts-ignore
            const products_data: any[] = Object.values(deals_data).flatMap((item: IDealData) => (item.delivery_plan ?? []).map((plan: any) => ({
                ...plan,
                deal_pack: item.name,
            })))
            if (Context.data.add_multiple_items) {
                const new_positions = products_data.filter(product => prefill_data.some(item => product.deal_id === item.deal_id && product.key == item.key))
                for (const item of prefill_data) {
                    const find_elem = new_positions.find(product => product.deal_id === item.deal_id && product.key == item.key);
                    if (find_elem) {
                        find_elem.selected = false;
                        find_elem[item.field] = item[item.field];
                        // find_elem.quantity = item[item.field];
                    };
                }
                global_data = new_positions;
            } else {
                for (const item of prefill_data) {
                    const find_elem = products_data.find(product => product.deal_id === item.deal_id && product.key == item.key);
                    if (find_elem) {
                        find_elem.selected = true;
                        find_elem["transfer_shipment"] = item["transfer_shipment"];
                        find_elem.quantity = item[item.field];
                    };
                }
                global_data = products_data;
            }
        }
    } else if (Context.data.application_for_position_filter?.length! > 0) {
        global_data = movements_data
        if (Context.data.prefill_selection_positions_from?.length) {
            for (const item of movements_data) {
                const find_elem = prefill_data.find(el => el.key == item.key && el.deal_id === item.deal_id);
                if (find_elem) {
                    item.selected = true
                    item.current_packed = find_elem["packed"];
                    item.quantity = item.current_packed;
                }
            }
            global_data = movements_data
        }
    }
    // if (!Context.data.readonly) {
    //     Context.data.generate_data?.emit(global_data);
    //     allPositionsSelected(global_data)
    // }


    if (Context.data.show_changes) {
        if (!mov_copy) return
        const movement_shipped = movements.find(movement => movement.data.linked_app?.id === Context.data.application_for_position_filter![0].id)?.data.positions
        const movement_shipped_positions = movement_shipped!.map(row => {
            const { __count, __index, ...item } = row
            return item
        })
        const copy_movement = mov_copy!.data.positions!.map(row => {
            const { __count, __index, ...item } = row
            return item
        })
        const a = compareItemsWithAllItems(copy_movement, movement_shipped_positions);
        for (const item of a) {
            const find_item = global_data?.find(i => i.key == item.key && i.deal_id === item.deal.id);
            if (!find_item) continue;
            find_item["status"] = item["status"];
        }


    }
}
function applyFilter(row: Table$Context$conditions_for_excluding_positions$Row) {
    debugger
    const { checked_column: field, comparison_sign, operation, movements_settings_result: agg, } = row;

    const fetched_field = mov_settings.find(item => item.id === field.id);
    const tabulator_data_code = fetched_field?.data.tabulator_data_code || "";
    const mov_ids: string[] = agg.map((item: any) => item.id);
    const mov_set: any[] = [];
    for (const id of mov_ids) {
        const find_mov_set = mov_settings.find(item => item.id === id);
        if (find_mov_set) {
            mov_set.push(find_mov_set)
        }
    }
    const aggregations: string[] = mov_set?.map(item => item.data.tabulator_data_code ?? "");
    const [column_first, column_second] = aggregations;
    let movements_settings_result: number = 0;
    table.setFilter(function (data: any) {
        const column_value = data[tabulator_data_code];

        if (data["packaging"]?.includes("Место") || data["selected"]) return column_value;

        switch (operation.code) {
            case "addition":
                movements_settings_result = Number(data[column_first] ?? 0) + Number(data[column_second] ?? 0);
                break;
        }
        switch (comparison_sign.name.trim()) {
            case '=':
                return column_value == movements_settings_result;
            case '≠':
                return column_value != movements_settings_result;
            case '>':
                return column_value > movements_settings_result;
            case '<':
                return column_value < movements_settings_result;
            case '≥':
                return column_value >= movements_settings_result;
            case '≤':
                return column_value <= movements_settings_result;
            default:
                throw new Error('Неподдерживаемая операция');
        }
    });
}

let btn_show_all_container: any | null;
let btn_show_all: any | null;
let btn_select_all_container: any | null;
let btn_select_all: any | null;
let btn_select_all_container_two: any | null;
let btn_select_all_two: any | null;

async function onLoad(): Promise<void> {
    debugger
    if (Context.data.table_hidden) return;
    $(document).ready(async () => {
        let text_content = "";
        btn_show_all_container = document.querySelector(".show-all");
        btn_show_all = btn_show_all_container.querySelector("button");
        btn_select_all_container = document.querySelector(".selected-all");
        btn_select_all = btn_select_all_container.querySelector("button");
        btn_select_all_container_two = document.querySelector(".selected-all-two");
        btn_select_all_two = btn_select_all_container_two.querySelector("button");
        Context.data.apply_filter_positions ? text_content = "Показать все" : "Скрыть все";
        if (btn_select_all_two) {
            Context.data.show_all_products ? btn_select_all_two.textContent = "Снять все" : btn_select_all_two.textContent = "Выбрать все";
        }
        if (btn_show_all)
            btn_show_all.textContent = text_content;
        table = new Tabulator(`#${Context.data.id_tab}`, {
            dependencies: {
                XLSX: XLSX,
            },
            // maxHeight: "700px",
            index: "row_id",
            layout: "fitColumns",
            columns: Context.data.column,
            data: [],
            initialFilter: [
                ...(Context.data.show_all_products ? [{ field: "selected", type: "=", value: true }] : []),
                ...(Context.data.check_for_empty_value ? [{ field: "packed", type: "!=", value: undefined }] : [])
            ],
            rowContextMenu: [
                {
                    label: "Удалить",
                    action: function (e: any, row: any) {
                        if (Context.data.readonly || !Context.data.show_changes) return;
                        if (JSON.stringify(row.getData()) == "{}") return;
                        if (window.confirm("Удалить позицию?")) {
                            // row.delete();
                            row.update({ ...row.getData(), deleted: true })
                            row.getElement().classList.add("strikethrough");
                            document.querySelectorAll(".validation-message").forEach((elem: any) => elem.remove())
                        }
                    }
                }
            ],
            dataTree: true,
            rowFormatter(row: any) {
                if (!Context.data.show_changes) return;
                const row_data = row.getData()
                if (row_data.status == "deleted") return row.getElement().classList.add("product_deleted");
                if (row_data.status == "added") return row.getElement().classList.add("product_added");
            },
            groupHeader(value: any, count: any, data: any, group: any) {
                const element = group.getElement();
                element.style.display = "flex";
                const rows = returnRows(group);
                const is_selected = rows.some((row: any) => row.getData().selected == true)
                let html = `<div>${value ?? ""} <span style="color: red;">(${count} item)</span></div>`
                if (value !== "Все позиции" && (group.getField() == "packaging" || group.getField() == "logistic")) {
                    if (!Context.data.readonly) {
                        return html = `<div style="display: flex; gap: 10px;"><input type="checkbox" ${is_selected ? "checked='checked'" : ""}><div style="display: flex;">${value ?? ""} <span style="color: red;">(${count} item)</span></div></div>`
                    }
                    return html = `<div style="display: flex; gap: 10px;"><div style="display: flex;">${value ?? ""} <span style="color: red;">(${count} item)</span></div></div>`
                }
                return html
            },
            reactiveData: true,
            pagination: true,
            paginationSize: 25,
            paginationSizeSelector: [10, 25, 50, 100, true],
            downloadConfig: {
                columnHeaders: true,
                columnGroups: false,
                rowHeaders: false,
                rowGroups: false,
                columnCalcs: false,
                dataTree: false,
            }
        });

        table.on("tableBuilt", async () => {
            table.alert("Загрузка");
            const checkbox = document.querySelector(".custom-checkbox");
            if (checkbox) {
                Context.data.show_all_products ? checkbox.checked = true : checkbox.checked = false;
            }
            await launch()
            await table.setData(global_data);
            if (Context.data.conditions_for_excluding_positions?.length && Context.data.apply_filter_positions) {
                for (const row of Context.data.conditions_for_excluding_positions) {
                    applyFilter(row);
                }
            }
            table.setGroupBy(grouped(global_data!));
            table.clearAlert();
        })
        table.on("groupClick", function (e: any, group: any) {
            if (e.target.tagName !== "INPUT") return;
            const rows = returnRows(group)
            const updatedPositions = rows.map(function (row: any) {
                const selected = !e.target.checked;
                let quantity: number = 0;
                if (group.getField() == Context.fields.group_by.variants.logistic.code)
                    quantity = row.getData().way
                if (group.getField() == Context.fields.group_by.variants.packaging.code)
                    quantity = row.getData().packed;
                return Object.assign({}, row.getData(), {
                    selected: !selected,
                    quantity: !selected ? quantity : undefined
                });
            });

            table.updateData(updatedPositions);
        });
        Context.data.generate_data?.emit(global_data)
        cellClick();
        handleEditForShipped();
    })

}

function cellClick() {
    table.on("cellClick", function (e: any, cell: any) {
        debugger
        const cell_name = cell.getField();

        /* разворачивание дерева */
        if (cell_name === "nomenclature" || cell_name === "key" || cell_name === "contractor") cell.getRow().treeToggle();
        if (cell_name === "selected") {
            const row = cell.getRow();
            const row_data = row.getData();
            if (Context.data.group_by?.some(item => item.code == Context.fields.group_by.variants.packaging.code) && row_data["packaging"] != "Все позиции") return
            let transfer_shipment = 0;
            let packed = 0;
            if (Context.data.prefill_selection_positions_from?.length && movements_data.length > 0) {
                const find_elem = movements_data.find(item => item.key === row_data["key"] && item.deal_id === row_data["deal_id"]);
                if (find_elem) {
                    transfer_shipment = find_elem["transfer_shipment"];
                    packed = find_elem["packed"]
                }
            }
            let quantity = transfer_shipment || valueValidation(row_data);
            if (Context.data.additional_validation && row_data[Context.data.column_additional_validation ?? ""]) {
                quantity = valueValidation(row_data);
            }
            if (!quantity) {
                row.update({ selected: false, quantity: undefined })
                return;
            }
            !cell.getValue() ? row.update({ selected: true, quantity }) : row.update({ selected: false, quantity: undefined });
            const data = table.getData();
            global_data = data;
            // if (Context.data.validation_needed) {
            //     allPositionsSelected(table.getData());
            // }
            // Context.data.generate_data?.emit(global_data)

            return;
        }
    })
}

/* Обработка редактирования ячейки */
const handleEditForShipped = (): void => {
    table.on("cellEdited", function (cell: any) {
        const row = cell.getRow();
        const row_data = row.getData();
        const cell_name = cell.getField();
        let quantity_cell: number | undefined = cell.getValue();

        if (cell_name === "quantity") {
            const column_name = Context.data.column_additional_validation ?? "";

            if (Context.data.validation_needed && !Context.data.additional_validation) {
                const quantity_limit = valueValidation(row_data);
                if (typeof quantity_cell === "number" && quantity_cell > quantity_limit) {
                    quantity_cell = quantity_limit;
                }
            }

            if (Context.data.additional_validation && row_data[column_name] !== undefined) {
                const additional_limit = valueValidation(row_data);
                let a = row_data[column_name]; //значение из колонки например (Упаковано в текущем месте)
                if (typeof quantity_cell === "number" && quantity_cell > additional_limit) {
                    quantity_cell = additional_limit;
                }
            }

            if (typeof quantity_cell === "number" && quantity_cell < 0) {
                quantity_cell = 0;
            }

            row.update({
                selected: !!quantity_cell,
                quantity: quantity_cell || undefined,
            });
        }

        const data = table.getData();
        global_data = data;

        // if (Context.data.validation_needed) {
        //     allPositionsSelected(table.getData());
        // }

        // Context.data.generate_data?.emit(global_data);
    });
};

function searchMovementsForDeals(deals_data: IDealData, all_position = false, field = "packaging", filter_positions?: any[],): any[] {
    let row_id = 0;

    const positions: any[] = [];

    if (Context.data.dealings && Context.data.dealings.length) {
        if (Context.data.dealings.length == 1 && Context.data.readonly) {
            group_by = ["pack"]
        }

        const updates_by_deal: Record<string, Record<number, Record<string, number>>> = {};

        for (const deal of Context.data.dealings) {
            const mov_deal = movements?.filter(mov => mov.data.deals?.some(i => i.id === deal.id));

            if (!mov_deal.length) {
                deals_data[deal.id].delivery_plan = deals_data[deal.id].delivery_plan.map(item => ({
                    ...item,
                    selected: false,
                    movements: undefined,
                    contractors: Array.from(new Set(item.movements?.map((item: any) => item.contractor)?.filter(Boolean)))?.join(",") ?? "",
                    row_id: ++row_id,
                    deal_pack: deals_data[deal.id].name
                }));
                continue;
            }

            for (const movement of mov_deal) {
                if (movement.data.canceled || movement.data.ignore) continue;

                const tab_key = movement.data.tabulator_data_row;
                if (!tab_key) continue;

                for (const row of movement.data.positions ?? []) {
                    const deal_id = row.deal?.id;
                    const key = Number(row.key);
                    if (!deal_id || !deals_data.hasOwnProperty(deal_id)) continue;
                    if (deal_id == deal.id) {
                        updates_by_deal[deal_id] ??= {};
                        updates_by_deal[deal_id][key] ??= {};
                        updates_by_deal[deal_id][key][tab_key] =
                            (updates_by_deal[deal_id][key][tab_key] ?? 0) + row.amount;
                    }
                }
            }
        }

        // @ts-ignore
        for (const [dealId, itemsMap] of Object.entries(updates_by_deal)) {
            deals_data[dealId].delivery_plan = deals_data[dealId].delivery_plan.map(item => {
                const itemUpdates = itemsMap[item.key] ?? {};
                // @ts-ignore
                const updatedFields = Object.entries(itemUpdates).reduce((acc: any, [tabKey, delta]) => {
                    if (item[tabKey]) {
                        acc[tabKey] = Number(item[tabKey] ?? 0);
                    } else {
                        acc[tabKey] = Number(item[tabKey] ?? 0) + delta
                    }
                    return acc;
                }, {} as Record<string, number>);
                return {
                    ...item,
                    ...updatedFields,
                    selected: Context.data.readonly ? undefined : false,
                    row_id: ++row_id,
                    [field]: all_position ? "Все позиции" : "",
                    contractors: Array.from(new Set(item.movements?.map((m: any) => m.contractor)?.filter(Boolean))).join(",") ?? "",
                    movements: undefined,
                    deal_pack: deals_data[dealId].name,
                };
            });
        }
    }

    // @ts-ignore
    positions.push(...Object.values(deals_data).flatMap((item: IDealData) => (item.delivery_plan ?? []).map((plan: any) => ({
        ...plan,
        selected: false,
        movements: undefined,
        deal_pack: Context.data.readonly ? undefined : item.name,
    }))))
    if (filter_positions?.length) {
        const filter_pos: any[] = positions.filter(item => filter_positions.some((i: any) => i.key == item.key && i.deal_id == item.deal_id))
        console.log(filter_pos)
        return filter_pos
    }
    return positions;
}

function valueValidation(row_data: any): number {
    debugger
    let quantity = 0;
    for (const row of Context.data.column_validation_condition ?? []) {
        const main_column = mov_settings.find(item => item.id === row.main_column.id)?.data.tabulator_data_code || "";
        if (!row_data[main_column ?? ""]) continue;
        const columns_validations_ids: string[] = row.additional_columns?.map(item => item.id) ?? [];
        const columns: any[] = [];
        for (const col of columns_validations_ids) {
            const item = mov_settings.find(i => i.id === col);
            if (item) columns.push(item)
        }
        const columns_fields = columns.map(column => column.data.tabulator_data_code);
        const [first_column, second_column] = columns_fields;
        if (row_data[first_column ?? ""]) {
            quantity = row_data[main_column] - row_data[first_column ?? ""] ?? 0;
        } else if (row_data[second_column ?? ""]) {
            quantity = row_data[main_column] - row_data[second_column ?? ""] ?? 0;
        } else {
            quantity = row_data[main_column];
        }
        if (Context.data.additional_validation && row_data[Context.data.column_additional_validation ?? ""]) {
            quantity = ((row_data[main_column] - row_data[first_column]) + row_data[Context.data.column_additional_validation ?? ""]);
            // let current_quantity = row_data[first_column] - row_data[Context.data.column_additional_validation ?? ""];
            // if (current_quantity == 0) {
            //     quantity = row_data[main_column] - (row_data[first_column] ?? 0);
            // } else {
            //     quantity = row_data[main_column] - current_quantity;
            // }
        }
        if (quantity < 0) quantity = 0;
        break
    }
    return Number(quantity.toFixed(3));
}

// проверка все ли позиции выбраны
async function allPositionsSelected(data: any) {
    debugger
    const columns_validations_ids: string[] = (Context.data.column_validation_condition && Context.data.column_validation_condition[0]?.additional_columns?.map(item => item.id)) ?? [];
    const main_column = mov_settings.find(item => item.id === Context.data.column_validation_condition![0]?.main_column.id)?.data.tabulator_data_code || "";
    const columns: any[] = [];
    for (const col of columns_validations_ids) {
        const item = mov_settings.find(i => i.id === col);
        if (item) columns.push(item)
    }
    const columns_fields = columns.map(column => column.data.tabulator_data_code);
    const [first_column, second_column] = columns_fields;
    let all_rows_selected: boolean = false;
    if (!Context.data.additional_validation) {
        all_rows_selected = data.every((row: any) =>
        /*row.selected === true && */
        ((row["quantity"] !== undefined && row["quantity"] === row[main_column]) ||
            row[main_column] === row[first_column ?? ""] ||
            ((row["quantity"] ?? 0) + (row[first_column ?? ""] ?? 0) === row[main_column]))
        );
    } else {
        all_rows_selected = data.every((row: any) => {
            let result: number = 0;
            if (row[Context.data.column_additional_validation ?? ""] || row["quantity"]) {
                result = (row[first_column ?? ""] - row[Context.data.column_additional_validation ?? ""]) + row["quantity"];
            } else {
                result = row[first_column ?? ""]
            }
            return row[main_column ?? ""] == result;
        })
    }
    Context.data.all_positions_selected = all_rows_selected;
}

let is_filter = Context.data.apply_filter_positions
async function clearFilter(): Promise<void> {
    debugger
    if (is_filter) {
        table.clearFilter()
        btn_show_all.textContent = "Скрыть все"
    } else {
        for (const row of Context.data.conditions_for_excluding_positions!) {
            applyFilter(row);
            btn_show_all.textContent = "Показать все"
        }
    }
    is_filter = !is_filter
}

let is_all_selected = Context.data.show_all_products;

async function selectedAll(): Promise<void> {
    debugger
    const visible_data: any[] = table.getData("active");
    global_data = global_data!.map(item => {
        let quantity = valueValidation(item);
        const match = visible_data.find(v => v.key === item.key && v.deal_id === item.deal_id);
        if (match) {
            return {
                ...item,
                selected: is_all_selected || !quantity ? false : true,
                quantity: is_all_selected || !quantity ? undefined : quantity
            };
        }
        return item;
    });

    is_all_selected = !is_all_selected
    if (!is_all_selected) {
        btn_select_all.textContent = "Выбрать все"
    } else {
        btn_select_all.textContent = "Снять все"
    }
    table.updateData(global_data);
    // Context.data.data = JSON.stringify(global_data);
    // const active_data = global_data.filter(item => item.selected);
    // Context.data.generate_data?.emit(global_data);
    // allPositionsSelected(global_data);
}
async function selectAllPosition(): Promise<void> {
    debugger
    const visible_data: any[] = table.getData("active");
    global_data = global_data!.map(item => {
        const data = Context.data.prefill_selection_positions_from?.length ? prefill_data : movements_data
        const match_movements_data = data.find(i => i.key == item.key && i.deal_id === item.deal_id)
        const match = visible_data.find(v => v.key === item.key && v.deal_id === item.deal_id);
        let quantity = 0;
        if (match_movements_data) quantity = Context.data.prefill_selection_positions_from?.length ? match_movements_data.transfer_shipment ?? match_movements_data.packed : valueValidation(item)
        else quantity = valueValidation(item)
        if (match) {
            return {
                ...item,
                selected: Context.data.show_all_products || !quantity ? false : true,
                quantity: Context.data.show_all_products || !quantity ? undefined : quantity
            };
        }
        return item;
    });

    Context.data.show_all_products = !Context.data.show_all_products;
    if (!Context.data.show_all_products) {
        btn_select_all_two.textContent = "Выбрать все"
    } else {
        btn_select_all_two.textContent = "Снять все"
    }
    table.updateData(global_data);

    // Context.data.generate_data?.emit(global_data);
    // allPositionsSelected(global_data)
}

let filter_for_positions = Context.data.show_all_products;

function clearFilterPrefillData(check: boolean): void {
    check ? table.clearFilter() : table.setFilter("selected", "=", true);
    filter_for_positions = !filter_for_positions;
}

async function destroy(): Promise<void> {
    table = null;
    deals_data = null;
    btn_show_all_container = null;
    btn_show_all = null;
    btn_select_all_container = null;
    btn_select_all = null;
    btn_select_all_container_two = null;
    btn_select_all_two = null;
    global_data = null;
    Context.data.show_all_products = undefined;
    Context.data.data = undefined;
    Context.data.id_tab = undefined;
    Context.data.column = undefined;
    Context.data.conditions_for_excluding_positions = undefined;
    Context.data.column_settings = undefined;
    window.XLSX = undefined;
    window.Tabulator = undefined;
}

async function downloadData(): Promise<void> {
    let file_name: string = "Отгрузки";
    if (Context.data.prefill_selection_positions_from && Context.data.prefill_selection_positions_from.length) {
        file_name = (await Context.data.prefill_selection_positions_from[0].fetch()).data.__name;
    } else if (Context.data.application_for_position_filter && Context.data.application_for_position_filter.length) {
        file_name = (await Context.data.application_for_position_filter[0].fetch()).data.__name;
    }
    table.download("xlsx", `${file_name}.xlsx`, {
        sheetName: "Лист1",
        rowGroups: true
    });
}

function changeFile(e: any) {
    const file = e.target.files[0];
    if (file) {
        const file_name = file.name;
        const extension = file_name.split('.').pop().toLowerCase();
        // @ts-ignore
        if (["xlsx", "xls"].includes(extension)) {
            const reader = new FileReader();

            reader.onload = function (event: any) {
                const binaryStr = event.target.result;
                const data = new Uint8Array(binaryStr)
                const workbook = XLSX.read(data, { type: "array" });

                const first_sheet_name = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[first_sheet_name];

                const json_data = XLSX.utils.sheet_to_json(worksheet);

                const columns = Context.data.column as any[];
                const transformed: any[] = json_data.map((row: any) => {
                    const new_row: any = {};
                    columns.forEach(col => {
                        new_row[col.field?.trim()] = row[col.title?.trim()];
                        if (col.title.trim() == "Статусы") {
                            col.columns.forEach((i: any) => {
                                new_row[i.field?.trim()] = row[i.title?.trim()]
                            })
                        }
                    });
                    return { ...new_row, row_id: row.__rowNum__ };
                });
                const new_data = transformed.map(item => {
                    let quantity: number | undefined = undefined;

                    let selected: boolean = false;
                    if (item.selected && item.quantity) {
                        quantity = item.quantity
                        selected = true
                    } else if (item.selected && !item.quanity) {
                        selected = true;
                        quantity = valueValidation(item)
                        item.contracted = quantity
                    } else if (!item.selected && item.quantity) {
                        selected = true
                        quantity = item.quantity;
                    }
                    else {
                        selected = false;
                        quantity = undefined;
                    }
                    return {
                        ...item,
                        selected,
                        quantity
                    };
                });
                global_data = global_data!.map(item => {
                    const find_elem = new_data.find(v => v.key == item.key && v.deal_id === item.deal_id);
                    // const find_elem = new_data.find(v => v.key == item.key ??);
                    if (find_elem) {
                        return {
                            ...item,
                            selected: find_elem.selected,
                            quantity: find_elem.quantity
                        }
                    }
                    return item;
                })
                table.setData(global_data);
                Context.data.generate_data?.emit(global_data)
                allPositionsSelected(global_data)
            };

            reader.readAsArrayBuffer(file);
        } else {
            // Обработать если не тот формат
        }
    }
}

async function importData(): Promise<void> {
    document.getElementById("excel-input").click();
}

async function canRender(): Promise<boolean> {
    if (Context.data.table_hidden) return false;
    return true
}

async function onValid(): Promise<ValidationResult> {
    debugger
    const result = new ValidationResult();
    if (window?.event?.target?.textContent.trim().includes("Отменить")) return result
    if (Context.data.readonly || !Context.data.key_storage) return result;
    const data = table.getData();
    if (!data.some((item: any) => item.selected) || !data.length) {
        result.addMessage(`Не выбраны позиции`);
        return result;
    }
    await allPositionsSelected(data);
    if (Context.data.group) {
        const selected_data = data.filter((item: any) => item.selected)
        // @ts-ignore
        const result_data = Object.values(selected_data.reduce((acc: any, item: any) => {
            const unique_key = `${item.key}_${item.deal_id}`;
            if (!acc[unique_key]) {
                acc[unique_key] = { ...item };
            } else {
                acc[unique_key].quantity += item.quantity;
            }
            return acc;
        }, {})
        )
        await System.storage.setItem(Context.data.key_storage ?? "", JSON.stringify(result_data))
        return result
    }
    await System.storage.setItem(Context.data.key_storage!, JSON.stringify(data))

    return result;
}

function getDataOfBasicFilterApplication(): any[] {
    const basic_movement = movements.find(movement => movement.data.linked_app?.id === Context.data.basic_filter_application?.id);
    if (!basic_movement) return [];
    if (!deals_data) return [];
    const movement_positions = Array.from(new Set(basic_movement.data.positions?.map(row => ({ key: row.key, deal_id: row.deal.id })))) ?? [];
    const filter_positons: any[] = [];
    for (const position of movement_positions) {
        filter_positons.push(...deals_data[position.deal_id].delivery_plan?.filter(item => item.key == position.key))
    }
    const result: any[] = filter_positons.map(item => item)
    return filter_positons
}

function generateKey(item: any): string {
    return `${item.key}_${item.deal.id}`
}

const compareItemsWithAllItems = (original_items: any[], new_items: any[]): any[] => {
    const original_ids_map = new Map(
        original_items.map(item => [
            generateKey(item),
            { ...item, amountOriginal: item.amount }
        ])
    );

    const new_ids_map = new Map(
        new_items.map(item => [
            generateKey(item),
            { ...item, amountNew: item.amount }
        ])
    );

    let result: any[] = [];

    for (let key of original_ids_map.keys()) {
        const origItem = original_ids_map.get(key)!;

        if (new_ids_map.has(key)) {
            const newItem = new_ids_map.get(key)!;

            if (origItem.amountOriginal !== newItem.amountNew) {
                result.push({ ...newItem, status: 'updated' });
            } else {
                result.push(origItem);
            }
        } else {
            result.push({ ...origItem, status: 'deleted' });
        }
    }
    for (let key of new_ids_map.keys()) {
        if (!original_ids_map.has(key)) {
            result.push({ ...new_ids_map.get(key)!, status: 'added' });
        }
    }

    return result;
};
// рекурсивный перебор групп
function returnRows(group: any): any[] {
    if (!group.getSubGroups().length) {
        return group.getRows();
    } else {
        return group.getSubGroups()
            .map((sub_group: any) => returnRows(sub_group))
            .flat();
    }
}
function findCommonGoodsWithBase(baseArray: any[], otherArrays: any[][], generateKey: (item: any) => string): any[] {
    const baseKeys = new Set(baseArray.map(generateKey));

    for (const array of otherArrays) {
        const currentSet = new Set(array.map(generateKey));

        baseKeys.forEach(key => !currentSet.has(key) && baseKeys.delete(key));
    }
    return baseArray.filter(item => baseKeys.has(generateKey(item)));
}

function grouped(positions: any[]): string[] {
    debugger
    const group: Record<string, string> = {};
    Context.data.group_by?.forEach((item) => group[item.code] = item.code)
    const required_fields = Object.keys(group);

    const found_fields: string[] = [];

    required_fields.forEach(field => {
        if (positions.some(position => field in position && position[field])) {
            found_fields.push(field);
        }
    });

    return found_fields;
}
// поиск пересечений товаров
function findCommonGoods(arrays: any[][], index: number): any[] {
    let resultIntersection = new Set<string>();

    if (arrays.length > 0) {
        resultIntersection = new Set(arrays[0].map(generateKey));
    }
    for (let i = 1; i < arrays.length; i++) {
        const currentSet = new Set(arrays[i].map(generateKey));
        resultIntersection = new Set([...resultIntersection].filter(key => currentSet.has(key)));
    }
    return arrays[index].filter(deal => resultIntersection.has(generateKey(deal)));
}
