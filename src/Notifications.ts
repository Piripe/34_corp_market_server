import mariadb from "mariadb";

export default class Notifications {
    private static db: mariadb.Pool;

    static init(db: mariadb.Pool) {
        this.db = db;
    }

    static async getAll(userId: string): Promise<notification> {
        let notifs = await this.db.query(
            `select id, title, content, link, received, readed from notification where user_id = "${userId}"`
        );

        return notifs.map((notif: any) => {
            if (!notif.received) this.makeAsReceived(notif.id);
            this.makeAsRead(userId, notif.id);
            return this.parse(notif);
        });
    }

    static async getNew(userId: string): Promise<notification> {
        let notifs = await this.db.query(
            `select id, title, content, link, received, readed from notification where user_id = "${userId}" and received = 0`
        );

        return notifs.map((notif: any) => {
            this.makeAsReceived(notif.id);
            return this.parse(notif);
        });
    }

    static async makeAsRead(userId: string, notifId: string) {
        this.makeAsReceived(notifId);
        await this.db.query(`update notification set readed = "1" where id = "${notifId}" and user_id = "${userId}"`);
    }

    private static parse(notif: notification): notification {
        return {
            id: notif.id,
            title: notif.title,
            content: notif.content,
            link: notif.link,
            received: Boolean(notif.received),
            readed: Boolean(notif.readed),
        };
    }

    private static async makeAsReceived(notifId: string) {
        await this.db.query(`update notification set received = "1" where id = "${notifId}"`);
    }

    static async add(title: string, content: string, link: string, user_id: string) {

        await this.db.query(`insert into notification (title, content, link, user_id) values ("${title}", "${content}", "${link}", "${user_id}")`);
    }
}
