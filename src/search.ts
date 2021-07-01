import mariadb from "mariadb";
import Market from "./market";

export default class Search {
	static db: mariadb.Pool;

	static async init(db: mariadb.Pool) {
		this.db = db;

		console.log(await this.search("sharpnes"));
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

		let sorted = this.recursiveTagsSearch(tags, triables_items, true);

        console.log(sorted.map(item => item.item.name));
        

		return sorted.map(item => item.item.id);
	}

	private static recursiveTagsSearch(tags: string[], items: ItemTriable[], strict = false, recursiveCount = 0): ItemTriable[] {
		if (recursiveCount > 2) {
			console.warn("max search recursive count reached");
			return items;
		}

		tags.forEach(tag => {
			items.forEach(item => {
				item.item.tags.forEach(item_tag => {
					let leven = this.levenshtein(tag, item_tag);
					if (leven < (strict ? 1 : 4)) item.weight += 1 / leven + 1;
				});
			});
		});

		let notFound = items.filter(item => item.weight === 0);
		items = items.filter(item => item.weight > 0);

		if (items.length === 0) return notFound;

		let sorted = items.sort((a, b) => b.weight - a.weight);

		if (notFound.length > 0) sorted = sorted.concat(this.recursiveTagsSearch(sorted[0].item.tags, notFound, true, recursiveCount + 1));

		return sorted;
	}

	private static levenshtein(str1: string, str2: string) {
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

	constructor(item: Item, weight: number = 0) {
		this.item = item;
		this.weight = weight;
	}
}
