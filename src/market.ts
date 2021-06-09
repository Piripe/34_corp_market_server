import { ItemApi, ItemDatabase, SellerApi, SellerDatabase, SellerWithItemSelected } from "typings/index";
import mongodb from "mongodb";

export default class Market {

    products: mongodb.Collection<ItemDatabase>;
    sellers: mongodb.Collection<SellerDatabase>;

    constructor(products: mongodb.Collection, sellers: mongodb.Collection) {
        this.products = products;
        this.sellers = sellers;
    }

    async getAllItems() {
        return new Promise<ItemApi[]>((resolve, reject) => {
            this.products.find({}, { projection: { _id: 0 } }).toArray().then(async items => {
                let returnItems: ItemApi[] = [];
                for (const index in items) {
                    const item = items[index];
                    returnItems[index] = {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        thumbnail: item.thumbnail,
                        category: item.category,
                        sellers: await this.getSellersData(item)
                    }
                }
                resolve(returnItems);
            }).catch(reject);
        });
    }

    async getItem(id: string) {
        return new Promise<ItemApi>((resolve, reject) => {
            this.products.findOne({ id: id }, { projection: { _id: 0 } }).then(item => {
                if (item === null) {
                    reject("No item with this id found")
                    return;
                }
                this.getSellersData(item).then(sellers => {
                    resolve({
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        thumbnail: item.thumbnail,
                        category: item.category,
                        sellers: sellers
                    });
                }).catch(reject);
            }).catch(reject);
        });
    }

    private async getSellersData(item: ItemDatabase) {
        return new Promise<SellerWithItemSelected[]>(async (resolve, reject) => {

            this.sellers.find({ id: { $in: item.sellers } }, { projection: { _id: 0 } }).toArray().then(sellers => {
                resolve(sellers.map(seller => this.getSellerData(seller, item)));
            }).catch(reject);

        });
    }

    private getSellerData(seller: SellerDatabase, item: ItemDatabase): SellerWithItemSelected {
        let itemSeller = seller.items.find((i: any) => i.id === item.id);

        if (itemSeller === undefined)
            throw (`Seller ${seller.name} doesn't sell ${item.name}`);


        return {
            id: seller.id,
            name: seller.name,
            price: itemSeller.price,
            stock: itemSeller.stock,
        };
    }

    async getItemSellers(itemId: string) {
        return new Promise<SellerWithItemSelected[]>((resolve, reject) => {
            this.products.findOne({ id: itemId }, { projection: { _id: 0 } }).then(item => {
                if (item === null) {
                    reject("No item with this id found")
                    return;
                }
                this.getSellersData(item).then(resolve).catch(reject);
            });
        });
    }

    async getItemSeller(itemId: string, sellerId: string) {
        return new Promise<SellerWithItemSelected>((resolve, reject) => {
            this.products.findOne({ id: itemId }, { projection: { _id: 0 } }).then(item => {
                this.sellers.findOne({ id: sellerId }, { projection: { _id: 0 } }).then(seller => {
                    if (seller === null) {
                        reject("No seller with this id found")
                        return;
                    }
                    if (item === null) {
                        reject("No item with this id found")
                        return;
                    }
                    try {
                        resolve(this.getSellerData(seller, item));
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
        });
    }
}

