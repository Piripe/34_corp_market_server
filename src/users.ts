import mariadb from "mariadb";

export default class Users {
    static db: mariadb.Pool;

    static init(db: mariadb.Pool) {
        this.db = db;
    }

    static async getAll() {
        return await this.db.query("select name, id from User");
    }
}
