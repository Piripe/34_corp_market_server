import mariadb from "mariadb";

export default class Market {

    db: mariadb.Pool;

    constructor(db: mariadb.Pool) {
        this.db = db;
    }

    async modifySold(userId: string, amount: number) {
        let user = await this.db.query(`select id, sold from User where id = "${userId}"`);

        if (!user[0])
            throw "User not found";

        user = user[0];

        await this.db.query(`update User set sold = ${calcNewSold(user.sold, amount)} where id = ${user.id}`);


        function calcNewSold(previousSold: number, transfertAmout: number) {

            if (isNaN(previousSold))
                throw "Previous sold must be a number";

            if (isNaN(transfertAmout))
                throw "Transfert amount must be a number";


            let result = previousSold + transfertAmout;

            if (result < 0)
                throw "Not enought money";

            return result;
        }
    }

    async transfertSold(fromUserId: string, toUserID: string, amount: number) {

        amount = parseFloat(amount.toString());

        if (isNaN(amount))
            throw "Amount must be a number";

        if (amount < 0)
            throw "Amount must be positive";

        await this.modifySold(fromUserId, -amount);
        await this.modifySold(toUserID, amount);

    }
}