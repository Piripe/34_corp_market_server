import mariadb from "mariadb";

export default class Search {
    static db: mariadb.Pool;

    static init(db: mariadb.Pool) {
        this.db = db;

        this.search("patate cuite");
    }

    static async search(query: string) {
        // console.time("search");
        let items: Item[] = await this.db.query("select id, name from Item");

        let all_sorted: ItemTriable[][] = [];

        query.split(" ").forEach(word => {
            let sorted = [...items].sort((a, b) => {
                let result = Infinity;

                a.name.split(" ").forEach(itemANameWord => {
                    b.name.split(" ").forEach(itemBNameWord => {
                        let x = this.Levenshtein(word, itemANameWord) - this.Levenshtein(word, itemBNameWord);
                        result = x < result ? x : result;
                    });
                });
                return result;
            });

            let arr: ItemTriable[] = [];
            sorted.forEach((item, i) => {
                arr.push(new ItemTriable(item, i));
            });

            all_sorted.push(arr);
        });

        let result_array: ItemTriable[] = [];

        all_sorted.forEach(sorted => {
            sorted.forEach(item => {
                let findIndex = result_array.findIndex(i => i.item.name === item.item.name);
                if (findIndex >= 0) result_array[findIndex].weight += item.weight;
                else result_array.push({ ...item });
            });
        });

        // console.timeEnd("search");

        // console.log(all_sorted.map(a => a.map(i => i.item.name + " " + i.weight)));

        return result_array.map(item => item.item.id);
    }

    private static Levenshtein(str1: string, str2: string) {
        // console.time("leven");

        let D: number[][] = [];

        let cost: number;

        for (let i = 0; i <= str1.length; i++) {
            D[i] = [];
            for (let j = 0; j <= str2.length; j++) {
                if (i * j === 0) {
                    D[i][0] = i;
                    D[0][j] = j;
                } else D[i][j] = 0;
            }
        }

        for (let i = 1; i <= str1.length; i++) {
            for (let j = 1; j <= str2.length; j++) {
                if (str1[i - 1] === str2[j - 1]) cost = 0;
                else cost = 1;

                D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + cost);
            }
        }
        // console.timeEnd("leven");
        // console.log(str2);

        return D[str1.length][str2.length];
    }
}

class ItemTriable {
    readonly item: Item;
    weight: number;

    constructor(item: Item, weight: number) {
        this.item = item;
        this.weight = weight;
    }
}
