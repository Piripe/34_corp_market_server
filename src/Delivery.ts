import maridb from "mariadb";
import Notifications from "./Notifications";
import Bank from "./Bank";
import config from "./config";

export default class Delivery {
    static db: maridb.Pool;

    static init(db: maridb.Pool) {
        this.db = db;
    }

    static async createDelivery(userId: string, items: delivery_items[], priority: number, totalSold: number) {
        await this.db.query(
            `insert into delivery(client_id, items, priority, total) values ("${userId}",  '${JSON.stringify(
                items
            )}', "${priority}", "${totalSold}")`
        );
    }

    static async getAll(userId: string): Promise<delivery[]> {
        return await this.db.query(
            `select id, client_id, items, command_date, status, priority, deliveryman_id, total from delivery where client_id = "${userId}"`
        );
    }

    static async getForDelivery(): Promise<delivery[]> {
        return await this.db.query(
            `select id, client_id, items, command_date, status, priority, deliveryman_id, total from delivery where status = "0"`
        );
    }

    static async getAllForDeliveryMan(deliveryman_id: string): Promise<delivery[]> {
        return await this.db.query(
            `select id, client_id, items, command_date, status, priority, deliveryman_id, total from delivery where deliveryman_id = "${deliveryman_id}"`
        );
    }

    static async checkIsDeliveryMan(userId: string) {
        let user = await this.db.query(`select isdeliveryman from user where id = "${userId}"`);

        if (user[0]) return Boolean(user[0].isdeliveryman);
        throw "User not found";
    }

    static async getFromId(id: string): Promise<delivery> {
        let r = await this.db.query(
            `select id, client_id, items, command_date, status, priority, deliveryman_id, total from delivery where id = "${id}"`
        );

        if (!r[0]) throw "Not found";

        return r[0];
    }

    static async start(deliveryMan_id: string, id: string) {
        let delivery = await this.getFromId(id);

        if (delivery.status !== 0) throw "Delivery already started";

        if (delivery.deliveryman_id !== null) throw "Delivery already has a deliveryman_id";

        await this.db.query(
            `update delivery set deliveryman_id = "${deliveryMan_id}", status = "1" where id = "${id}"`
        );

        Notifications.add(
            "Livraison en cours",
            `Votre livraison de de la commande ${id} a ${delivery.total} diamants est en cours`,
            `/delivery/${id}`,
            delivery.client_id
        );
    }

    static async setReceived(deliveryMan_id: string, id: string) {
        let delivery = await this.getFromId(id);

        if (delivery.status !== 1) {
            if (delivery.status === 0) throw "Delivery not started yet";
            if (delivery.status === 2) throw "Delivery already received";
            throw "Unkown delivery status";
        }

        if (delivery.deliveryman_id !== deliveryMan_id) throw "Delivery does not belong to you";

        await this.db.query(`update delivery set status = "2" where id = "${id}"`);

        Notifications.add(
            "Livraison effectué",
            `Votre livraison de de la commande ${id} a ${delivery.total} diamants a été effectué`,
            "/delivery",
            delivery.client_id
        );
    }

    static async cancel(id: string, userId: string) {
        let delivery = await this.getFromId(id);

        if (delivery.client_id !== userId) throw "Not authorized";

        await this.repayDelivery(delivery);

        let r = await this.db.query(
            `delete from delivery where id = "${id}" and client_id = "${userId}" and status = 0`
        );
        return Boolean(r.affectedRows);
    }

    static async repayDelivery(delivery: delivery) {
        let taxe = Bank.calcTaxe(delivery.total);

        await Bank.modifySold(delivery.client_id, delivery.total);

        for (const item of delivery.items) {
            await Bank.modifySold(item.seller_id, -(item.price * item.quantity - taxe), "Seller", true);
        }

        await Bank.modifySold(config.fiscId, -taxe, "Seller", true);
    }
}
