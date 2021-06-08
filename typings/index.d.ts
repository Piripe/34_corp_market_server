import mongodb from "mongodb";

export class Market {
    products: mongodb.Collection;
    sellers: mongodb.Collection
    constructor(products: mongodb.Collection, sellers: mongodb.Collection);
    getAllItems();
    getItem(id: string);
    getSellersData(item: ItemDatabase);

    getItemSellers(itemId: string);
    getItemSeller(itemId: string, sellerId: string);
}


interface SellerDatabase {
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

interface SellerApi {
    name: string,
    id: string,
    items: SellerItem[]
}

interface SellerWithItemSelected {
    name: string,
    id: string,
    price: number,
    stock: number
}


interface ItemDatabase {
    id: string,
    name: string,
    description: string,
    thumbnail: string,
    category: string,
    sellers: string[]
}

interface ItemApi {
    id: string,
    name: string,
    description: string,
    thumbnail: string,
    category: string,
    sellers: SellerWithItemSelected[]
}