import mariadb from "mariadb";
import Market from "./market";

export default class Search {
    static db: mariadb.Pool;

    static async init(db: mariadb.Pool) {
        this.db = db;

        console.log(await this.search("livre sharpness V"));
    }

    static async search(query: string) {
        query = query.toLowerCase();

        let tags = query.split(" ");

        let items = await Market.getAllItems();

        let triables_items: ItemTriable[] = [];

        items.forEach(item => {
            triables_items.push(new ItemTriable(item));
        });

        tags.forEach(tag => {
            triables_items.forEach(item => {
                if (item.item.tags.includes(tag)) item.weight += 1;
            });
        });

        let sorted = triables_items.sort((a, b) => b.weight - a.weight);

        console.log(sorted);
        

        return sorted.map(item => item.item.id);
    }
}

class ItemTriable {
    readonly item: Item;
    weight: number;

    constructor(item: Item, weight: number = 0) {
        this.item = item;
        this.weight = weight;
    }
}
