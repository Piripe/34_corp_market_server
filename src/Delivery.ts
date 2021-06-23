import maridb from "mariadb";

export default class Delivery {
    static db: maridb.Pool;

    static init(db: maridb.Pool) {
        this.db = db;
    }

    static async createDelivery(userId: string, items: { id: string; quantity: number }[], priority: number) {
        await this.db.query(
            `insert into delivery(client_id, items, priority) values ("${userId}",  '${JSON.stringify(
                items
            )}', "${priority}")`
        );
    }

    static async getAll(userId: string) {
        return await this.db.query(`select id, items, command_date, status from delivery where client_id = "${userId}"`);
    }
}
