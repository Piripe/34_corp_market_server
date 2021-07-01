import mariadb from "mariadb";
import Market from "./market";

export default class Search {
    static db: mariadb.Pool;

    static async init(db: mariadb.Pool) {
        this.db = db;
    }

    static async search(query?: string) {
        if (!query) throw "Query required";

        query = query.toLowerCase();

        let tags = query.split(" ");

        let items = await Market.getAllItems();

        let triables_items: ItemTriable[] = [];

        items.forEach(item => {
            triables_items.push(new ItemTriable(item));
        });

        let sorted = this.recursiveSearch(tags, triables_items);

        return sorted.map(item => item.item.id);
    }

    private static recursiveSearch(tags: string[], items: ItemTriable[], recursiveCount = 0): ItemTriable[] {
        if (recursiveCount > 5) {
            console.warn("max search recursive count reached");
            return items;
        }

        tags.forEach(tag => {
            items.forEach(item => {
                if (item.item.tags.includes(tag)) item.weight += 1;
            });
        });

        let notFound = items.filter(item => item.weight === 0);
        items = items.filter(item => item.weight > 0);

        if (items.length === 0) return notFound;

        let sorted = items.sort((a, b) => b.weight - a.weight);

        if (notFound.length > 0)
            sorted = sorted.concat(this.recursiveSearch(sorted[0].item.tags, notFound, recursiveCount + 1));

        return sorted;
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
