import mariadb from "mariadb";

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
}
