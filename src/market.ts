import mariadb from "mariadb";

export default class Market {

    db: mariadb.Pool;

    constructor(db: mariadb.Pool) {
        this.db = db;
    }

    async getAllItems() {
        let items = await this.db.query("select name, id, description, thumbnail, category from Item");
        let result_items = [];
        for (const item of items) {
            result_items.push(await this.getItem_sellers(item));
        }
        return result_items;


    }

    private async getItem_sellers(item: any): Promise<any> {
        return new Promise(async (resolve) => {
            let sellers = await this.db.query(`select Seller.name, Seller.description, Seller.id, seller_item.price, seller_item.stock from seller_item inner join Seller on seller_item.seller_id = Seller.id where seller_item.item_id = "${item.id}"`);
            resolve({
                category: item.category,
                description: item.description,
                id: item.id,
                name: item.name,
                thumbnail: item.thumbnail,
                sellers: sellers
            });
        })
    }

    async getItem(id: string) {
        let item = await this.db.query(`select name, id, description, thumbnail, category from Item where id = "${id}"`);

        if (!item[0])
            throw "No item found";

        return await this.getItem_sellers(item[0]);

    }
}

