import mongodb from "mongodb";
import { UserDatabase } from "typings";

export default class Market {

    usersDb: mongodb.Collection<UserDatabase>;

    constructor(usersDb: mongodb.Collection<UserDatabase>) {
        this.usersDb = usersDb;
    }

    async modifySold(userId: string, amount: number) {
        return new Promise<UserDatabase>((resolve, reject) => {
            this.usersDb.findOneAndUpdate({ id: userId }, { $inc: { sold: parseFloat(amount.toString()) } }).then((result) => {
                this.usersDb.findOne({ id: userId }).then(result => {
                    if (result)
                        resolve(result)
                    else
                        throw new Error("User is null");
                }).catch(reject);
            }).catch(reject);
        });
    }

    async transfertSold(fromUserId: string, toUserID: string, amount: number) {
        return new Promise<void>((resolve, reject) => {
            Promise.all([
                this.modifySold(fromUserId, -amount),
                this.modifySold(toUserID, amount)
            ]).then(([fromUserResult, toUserResult]) => {
                resolve();
            }).catch(reject);
        });
    }

}