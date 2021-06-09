import mongodb from "mongodb";
import { SellerApi, SellerDatabase } from "typings";

export default class Sellers {
    sellersCollection: mongodb.Collection<SellerDatabase>;

    constructor(sellersCollection: mongodb.Collection<SellerDatabase>) {
        this.sellersCollection = sellersCollection;
    }

    async getSellers() {
        return new Promise<SellerApi[]>((resolve, reject) => {
            this.sellersCollection.find({}, { projection: { _id: 0 } }).toArray().then(sellers => {
                resolve(sellers.map(this.sellerDatabaseToSellerApi));
            }).catch(reject);
        });
    }

    async getSeller(id: string) {
        return new Promise<SellerApi>((resolve, reject) => {
            this.sellersCollection.findOne({ id: id }, { projection: { _id: 0 } }).then(seller => {
                if (seller === null)
                    reject("No seller with this id found");
                else
                    resolve(this.sellerDatabaseToSellerApi(seller));
            })
        });
    }

    private sellerDatabaseToSellerApi(sellerDatabase: SellerDatabase) {
        return {
            name: sellerDatabase.name,
            id: sellerDatabase.id,
            items: sellerDatabase.items
        };
    }
}