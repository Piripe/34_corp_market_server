import { Item, ItemNoSellerData, Seller } from "typings/index";
import mongodb from "mongodb";

export default class Market {

    products: mongodb.Collection;
    sellers: mongodb.Collection

    constructor(products: mongodb.Collection, sellers: mongodb.Collection) {
        this.products = products;
        this.sellers = sellers;
    }

    async getAllItems() {
        return new Promise<Item[]>((resolve, reject) => {
            this.products.find({}, { projection: { _id: 0 } }).toArray().then(async items => {
                for (const index in items) {
                    const item = items[index];
                    items[index].sellers = await this.getSellersData(item);
                }
                resolve(items);
            }).catch(reject);
        });
    }

    async getItem(id: string) {
        return new Promise<Item>((resolve, reject) => {
            this.products.findOne({ id: id }, { projection: { _id: 0 } }).then(item => {
                this.getSellersData(item).then(sellers => { item.sellers = sellers; resolve(item); }).catch(reject);
            });
        });
    }

    async getSellersData(item: ItemNoSellerData) {
        return new Promise<Seller[]>(async (resolve, reject) => {

            this.sellers.find({ id: { $in: item.sellers } }, { projection: { _id: 0 } }).toArray().then(sellers => {
                resolve(transformSellersData(sellers, item.id));
            });


            function transformSellersData(sellers: any[], itemId: string) {

                sellers.forEach((seller, index) => {
                    let itemSeller = seller.items.find((i: any) => i.id === itemId);

                    if (itemSeller === undefined)
                        throw (`Seller ${seller.name} doesn't sell ${item.name}`);


                    sellers[index] = {
                        id: seller.id,
                        name: seller.name,
                        price: itemSeller.price,
                        stock: itemSeller.stock,
                    };
                });

                return sellers;

            }

        });
    }

    async getItemSellers(itemId: string) {
        return new Promise<Seller[]>((resolve, reject) => {
            this.products.findOne({ id: itemId }, { projection: { _id: 0 } }).then(item => {
                this.getSellersData(item).then(resolve).catch(reject);
            });
        });
    }
}

