import mariadb from "mariadb";
import config from "./config";
import userHistory from "./user_history";
import { account_event_type } from "./utils";

export default class Bank {
    static db: mariadb.Pool;

    static init(db: mariadb.Pool) {
        this.db = db;
    }

    static async modifySold(userId: string, amount: number, tableName: "User" | "Seller" = "User", force = false) {
        let user = await this.db.query(`select id, sold from ${tableName} where id = "${userId}"`);

        if (!user[0]) throw "User not found";

        user = user[0];

        await this.db.query(`update ${tableName} set sold = ${calcNewSold(user.sold, amount)} where id = ${user.id}`);

        function calcNewSold(previousSold: number, transfertAmout: number) {
            previousSold = parseFloat(previousSold.toString());
            transfertAmout = parseFloat(transfertAmout.toString());

            if (isNaN(previousSold)) throw "Previous sold must be a number";

            if (isNaN(transfertAmout)) throw "Transfert amount must be a number";

            let result = previousSold + transfertAmout;

            if (!force) if (result < 0) throw "Not enought money";

            return result;
        }
    }

    static async transfertSold(fromUserId: string, toUserID: string, amount: number) {
        amount = parseFloat(amount.toString());

        if (isNaN(amount)) throw "Amount must be a number";

        if (amount < 0) throw "Amount must be positive";

        await this.modifySold(fromUserId, -amount);
        await this.modifySold(toUserID, await this.payTaxe(amount));

        userHistory.add(fromUserId, account_event_type.debit, { amount: amount, to: toUserID });
        userHistory.add(toUserID, account_event_type.credit, { amount: amount, from: fromUserId });
    }

    static calcTaxe(amount: number): number {
        amount = parseFloat(amount.toString());

        if (isNaN(amount)) throw "Amount is not a number";

        return amount * (5 / 100);
    }

    static async payTaxe(amount: number) {
        let taxe = this.calcTaxe(amount);

        await this.modifySold(config.fiscId, taxe, "Seller");

        return amount - taxe;
    }
}
