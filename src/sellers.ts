import mariadb from "mariadb";
import Bank from "./Bank";
import userHistory from "./user_history";
import { account_event_type } from "./utils";

export default class Sellers {
    static db: mariadb.Pool;

    static init(db: mariadb.Pool) {
        this.db = db;
    }

    static async getFromId(id: string): Promise<Seller> {
        let seller = await this.db.query(`select id, name, description, sold from seller where id = "${id}"`);

        if (seller[0]) return seller[0];

        throw "Seller not found";
    }

    static async getAll(): Promise<SellerNoSold[]> {
        return await this.db.query("select id, description, name from seller");
    }

    static parseDataForNoPrivateAccess(seller: Seller): SellerNoSold {
        return {
            description: seller.description,
            id: seller.id,
            name: seller.name,
        };
    }

    static async payUser(userId: string, sellerId: string, amount: number) {
        amount = parseFloat(amount.toString());

        if (isNaN(amount)) throw "Amount must be a number";

        await Bank.modifySold(sellerId, -amount, "Seller");
        await Bank.modifySold(userId, amount);

        await userHistory.add(userId, account_event_type.creditFromSeller, { amount: amount, from: sellerId });
    }
}
