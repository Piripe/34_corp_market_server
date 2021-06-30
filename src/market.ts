import mariadb from "mariadb";
import Bank from "./Bank";
import config from "./config";
import Delivery from "./Delivery";
import userHistory from "./user_history";
import { account_event_type } from "./utils";

export default class Market {
    private static db: mariadb.Pool;

    static init(db: mariadb.Pool) {
        this.db = db;
    }

    static async getAllItems(): Promise<ItemWithSellers[]> {
        let items: Item[] = await this.db.query("select name, id, description, thumbnail, stack from Item");

        let result_items: ItemWithSellers[] = [];
        for (const item of items) {
            result_items.push(await this.getItem_sellers(item));
        }
        return result_items;
    }

    private static async getItem_sellers(item: Item) {
        return new Promise<ItemWithSellers>(async resolve => {
            let sellers: item_seller[] = await this.db.query(
                `select Seller.name, Seller.description, Seller.id as seller_id, seller_item.full_description, seller_item.price, seller_item.id as seller_item_id, seller_item.stock from seller_item inner join Seller on seller_item.seller_id = Seller.id where seller_item.item_id = "${item.id}"`
            );
            resolve({
                description: item.description,
                id: item.id,
                name: item.name,
                thumbnail: item.thumbnail,
                sellers: sellers,
                stack: item.stack,
            });
        });
    }

    static async getItem(id: string): Promise<ItemWithSellers> {
        let item = await this.db.query(`select name, id, description, thumbnail, stack from Item where id = "${id}"`);

        if (!item[0]) throw "No item found";

        return await this.getItem_sellers(item[0]);
    }

    static async pay(userId: string, sellerId: string, amount: number) {
        let user = await this.db.query(`select id, sold from User where id = "${userId}"`);
        let seller = await this.db.query(`select id, sold from Seller where id = "${sellerId}"`);

        if (!user[0]) throw "User not found";

        if (!seller[0]) throw "Seller not found";

        amount = parseFloat(amount.toString());

        if (isNaN(amount)) throw "Amount must be a number";

        if (amount < 0) throw "Amount must be positive";

        await Bank.modifySold(userId, -amount);
        await Bank.modifySold(sellerId, await Bank.payTaxe(amount), "Seller");
    }

    static async getSeller_Item(id: string | string[]): Promise<item_seller[]> {
        let ids = Array.isArray(id) ? id.join(", ") : id;

        return await this.db.query(
            `select item.stack, Seller.name, Seller.description, Seller.id as seller_id, seller_item.item_id, seller_item.price, seller_item.stock, seller_item.id as seller_item_id
            from seller_item inner join Seller on seller_item.seller_id = Seller.id 
            inner join item on seller_item.item_id = item.id where
            seller_item.id in (${ids})`
        );
    }

    static async buy(userId: string, is: { id: string; quantity: number }[]) {
        let items: delivery_items[] = [];

        for (const item of is) {
            let i = (await this.getSeller_Item(item.id))[0];
            items.push({
                id: item.id,
                quantity: item.quantity,
                price: i.price,
                seller_id: i.seller_id,
                stack: i.stack,
            });
        }

        let user = await this.db.query(`select id, sold from User where id = "${userId}"`);

        if (!user[0]) throw "User not found";

        user = user[0];

        let items_id = items.map(item => item.id);

        let sellers_items = await this.getSeller_Item(items_id);

        let total_sold = 0;

        items.forEach(item => {
            if (!item.quantity) throw "Each element must have a quantity";

            item.quantity = parseInt(item.quantity.toString());

            if (isNaN(item.quantity)) throw "Quantity is not a number";

            if (items_id.indexOf(item.id) !== items_id.lastIndexOf(item.id)) throw "An id was found 2 times";

            let seller_item = sellers_items.find(seller_item => seller_item.seller_item_id === item.id);

            if (!seller_item) throw "seller_item not found";

            if (seller_item.stock - item.quantity < 0) throw `Item ${item.id} hasn't enough stock`;

            total_sold += seller_item.price * item.quantity;
        });

        let delivery_price = this.calcDeliveryPrice(items);

        total_sold += delivery_price;

        if (total_sold > user.sold) throw "Not enough money";

        for (const item of items) {
            await buyOne(this.db, item);
        }

        await Bank.modifySold(userId, -delivery_price);

        Delivery.createDelivery(userId, items, 0, total_sold);

        userHistory.add(userId, account_event_type.purchase, {
            totalSold: total_sold,
            items: items.map(item => {
                let seller_item = sellers_items.find(seller_item => seller_item.seller_item_id === item.id);

                if (!seller_item) throw "Fatal server error";

                return {
                    quantity: item.quantity,
                    seller_id: seller_item.seller_id,
                    price: seller_item.price,
                    item_id: seller_item.item_id,
                };
            }),
        });

        async function buyOne(db: mariadb.Pool, item: { id: string; quantity: number }) {
            let seller_item = sellers_items.find(seller_item => seller_item.seller_item_id === item.id);

            if (!seller_item) throw "seller_item not found";

            if (item.quantity < 0) throw "Quantity must be positive";

            await db.query(
                `update seller_item set stock = "${seller_item.stock - item.quantity}" where id = "${item.id}"`
            );

            await Market.pay(userId, seller_item.seller_id, seller_item.price * item.quantity);
        }
    }

    static calcDeliveryPrice(items: delivery_items[]): number {
        let price = 0;

        items.forEach(item => {
            price += Math.ceil(item.quantity / item.stack) * config.slotPrice;
        });

        return price;
    }

    static async newItem(sellerId: string | null, options: ItemCreationOptions) {
        let returnObject: any = {};

        if (!sellerId) throw "You must work";

        let item = await this.db.query(`select id from item where name = "${options.name}"`);

        let itemId: number | null = null;
        if (item[0]) {
            itemId = item[0].id;
            returnObject.warn =
                "Item already exist: it was not recreate so your description and thumbnail have not been taken into account";
        } else itemId = await this.createItem(options);

        if (!itemId) throw "Fatal server error";

        await this.createSeller_Item(
            itemId.toString(),
            sellerId,
            options.stock,
            options.price,
            options.full_description
        );

        returnObject.success = true;
        return returnObject;
    }

    private static async createItem(options: ItemCreationOptions): Promise<number> {
        await this.db.query(
            `insert into item (name, description, thumbnail, stack) values ("${options.name}", "${options.description}", "${options.thumbnail}", "${options.stack}")`
        );
        let id = await this.db.query(`SELECT id from item where name = "${options.name}"`);
        if (id[0]) return id[0].id;
        throw "Fatal server error";
    }

    private static async createSeller_Item(
        item_id: string,
        seller_id: string,
        stock: number,
        price: number,
        full_description: string
    ) {
        let isExist = (
            await this.db.query(
                `select id from seller_item where item_id = "${item_id}" and seller_id = "${seller_id}" limit 1`
            )
        )[0];

        if (isExist) throw "You already sell this item";

        await this.db.query(
            `insert into seller_item (item_id, seller_id, stock, price, full_description) values ("${item_id}", "${seller_id}", "${stock}", "${price}", "${full_description}")`
        );
    }

    static async editSellerItemStock(seller_item_id: string, seller_id: string, newStock: number) {
        newStock = parseInt(newStock.toString());

        if (isNaN(newStock)) throw "stock must be a number";

        let r = await this.db.query(
            `update seller_item set stock = "${newStock}" where id = "${seller_item_id}" and seller_id = "${seller_id}"`
        );

        return Boolean(r.affectedRows);
    }

    static async editSellerItemPrice(seller_item_id: string, seller_id: string, newPrice: number) {
        newPrice = parseFloat(newPrice.toString());

        if (isNaN(newPrice)) throw "sold must be a number";

        let r = await this.db.query(
            `update seller_item set price = "${newPrice}" where id = "${seller_item_id}" and seller_id = "${seller_id}"`
        );

        return Boolean(r.affectedRows);
    }

    static async editSellerItemFullDescription(seller_item_id: string, seller_id: string, fullDescription: string) {
        let r = await this.db.query(
            `update seller_item set full_description = "${fullDescription}" where id = "${seller_item_id}" and seller_id = "${seller_id}"`
        );

        return Boolean(r.affectedRows);
    }

    static async deleteSellerItem(seller_item_id: string, seller_id: string) {
        let seller_item = await this.db.query(
            `select id, seller_id, item_id from seller_item where id = "${seller_item_id}"`
        );

        if (!seller_item[0]) throw "Item does not exist";

        seller_item = seller_item[0];

        if (seller_item.seller_id != seller_id) throw "You are not authorized to delete this";

        let r = await this.db.query(
            `delete from seller_item where id = "${seller_item_id}" and seller_id = "${seller_id}"`
        );

        (async () => {
            let sellers_items: any[] = await this.db.query(
                `select id from seller_item where item_id = "${seller_item.item_id}"`
            );

            if (sellers_items.length === 0) await this.db.query(`delete from item where id = "${seller_item.item_id}"`);
        })();

        return Boolean(r.affectedRows);
    }
}
