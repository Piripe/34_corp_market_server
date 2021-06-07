import mongodb from "mongodb";

export class Market {
    products: mongodb.Collection;
    sellers: mongodb.Collection
    constructor(products: mongodb.Collection, sellers: mongodb.Collection);
    getAllItems();
    getItem(id: string);
    getSellersData(item: ItemNoSellerData);

    getItemSellers(itemId: string);
    getItemSeller(itemId: string, sellerId: string);
}


interface Seller {
    name: string,
    sold: number,
    id: string,
    items: SellerItem[]
}

interface SellerItem {
    id: string,
    price: number,
    stock: number
}

interface ItemNoSellerData {
    id: string,
    name: string,
    description: string,
    thumbnail: string,
    category: string,
    sellers: string[]
}

interface Item {
    id: string,
    name: string,
    description: string,
    thumbnail: string,
    category: string,
    sellers: Seller[]
}