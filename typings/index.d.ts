import mongodb from "mongodb";

export class Market {
    products: mongodb.Collection<ItemDatabase>;
    sellers: mongodb.Collection<SellerDatabase>;


    constructor(products: mongodb.Collection, sellers: mongodb.Collection);

    getAllItems(): Promise<ItemApi[]>;
    getItem(id: string): Promise<ItemApi>;
    
    getItemSellers(itemId: string): Promise<SellerWithItemSelected[]>;
    getItemSeller(itemId: string, sellerId: string): Promise<SellerWithItemSelected>;
    
    private async getSellersData(item: ItemDatabase): Promise<SellerWithItemSelected[]>;
    private getSellerData(seller: SellerDatabase, item: ItemDatabase): SellerWithItemSelected;
}

export class Sellers {
    sellersCollection: mongodb.Collection<SellerDatabase>;

    constructor(sellersCollection: mongodb.Collection<SellerDatabase>);

    getSellers(): Promise<SellerApi[]>;
    getSeller(id: string): Promise<SellerApi>;

    private sellerDatabaseToSellerApi(sellerDatabase: SellerDatabase): SellerApi;
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

interface UserDatabase {
    username: string,
    password: string,
    token: string
}

interface UserApi {
    username: string
}