import mariadb from "mariadb";
import Bank from "./Bank";
import Delivery from "./Delivery";

export default class Market {

    private static db: mariadb.Pool;

    static init(db: mariadb.Pool) {
        this.db = db;
    }

    static async getAllItems() {
        let items = await this.db.query("select name, id, description, thumbnail, category, full_description from Item");

        let result_items = [];
        for (const item of items) {
            result_items.push(await this.getItem_sellers(item));
        }
        return result_items;


    }

    private static async getItem_sellers(item: any): Promise<any> {
        return new Promise(async (resolve) => {
            let sellers = await this.db.query(`select Seller.name, Seller.description, Seller.id as seller_id, seller_item.price, seller_item.id as seller_item_id, seller_item.stock from seller_item inner join Seller on seller_item.seller_id = Seller.id where seller_item.item_id = "${item.id}"`);
            resolve({
                category: item.category,
                description: item.description,
                id: item.id,
                name: item.name,
                thumbnail: item.thumbnail,
                sellers: sellers,
                full_description: item.full_description
            });
        })
    }

    static async getItem(id: string) {
        let item = await this.db.query(`select name, id, description, thumbnail, category from Item where id = "${id}"`);

        if (!item[0])
            throw "No item found";

        return await this.getItem_sellers(item[0]);
    }

    static async pay(userId: string, sellerId: string, amount: number) {
        let user = await this.db.query(`select id, sold from User where id = "${userId}"`);
        let seller = await this.db.query(`select id, sold from Seller where id = "${sellerId}"`);

        if (!user[0])
            throw "User not found";

        if (!seller[0])
            throw "Seller not found";

        amount = parseFloat(amount.toString());

        if (isNaN(amount))
            throw "Amount must be a number";

        if (amount < 0)
            throw "Amount must be positive";

        await Bank.modifySold(userId, -amount);
        await Bank.modifySold(sellerId, await Bank.calcTaxe(amount), "Seller");
    }

    static async buy(userId: string, items: { id: string, quantity: number }[]) {
        let user = await this.db.query(`select id, sold from User where id = "${userId}"`);

        if (!user[0])
            throw "User not found";

        user = user[0];

        let items_id = items.map(item => item.id);


        let sellers_items: any[] = await this.db.query(`select Seller.name, Seller.description, Seller.id as seller_id, seller_item.price, seller_item.stock, seller_item.id from seller_item inner join Seller on seller_item.seller_id = Seller.id where seller_item.id in (${items_id.join(", ")})`);

        let total_sold = 0;


        items.forEach(item => {
            if (items_id.indexOf(item.id) !== items_id.lastIndexOf(item.id))
                throw "An id was found 2 times";

            let seller_item = sellers_items.find((seller_item) => seller_item.id === item.id);

            if (!seller_item)
                throw "seller_item not found";

            if (seller_item.stock - item.quantity < 0)
                throw `Item ${item.id} hasn't enough stock`;

            total_sold += seller_item.price * item.quantity;
        });

        if (total_sold > user.sold)
            throw "Not enough money";




        for (const item of items) {
            await buyOne(this.db, item);
        }

        Delivery.createDelivery();

        async function buyOne(db: mariadb.Pool, item: { id: string, quantity: number}) {
            
            let seller_item = sellers_items.find((seller_item) => seller_item.id === item.id);

            if (!seller_item)
                throw "seller_item not found";

            if (item.quantity < 0)
                throw "Quantity must be positive";

            await db.query(`update seller_item set stock = "${seller_item.stock - item.quantity}" where id = "${item.id}"`);

            await Market.pay(userId, seller_item.seller_id, seller_item.price * item.quantity)

           
        }
    }
}

