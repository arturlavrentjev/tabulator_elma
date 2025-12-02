export class Widget {
    table: any | null = null
    constructor(table: any) {
        this.table = table;
    }

    render() {
        console.log(this.table)
    }
}