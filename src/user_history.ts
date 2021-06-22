import mariadb from "mariadb";
import { account_event_type } from "./utils";


export default class userHistory {
    static db: mariadb.Pool;

    static init(db: mariadb.Pool) {
        this.db = db;
    }

    static async add(userId: string, type: account_event_type, data: Object) {
        await this.db.query(
            `insert into account_event (user_id, type, data) values("${userId}", "${type}", '${JSON.stringify(data)}')`
        );
    }

    static async getAll(userId: string) {
        let events = await this.db.query(
            `select id, date, type, data from account_event where user_id = "${userId}" order by date desc`
        );

        return events;
    }
}
