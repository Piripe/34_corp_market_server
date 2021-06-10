import express from "express";
import config from "./config";
import mongodb from "mongodb";
import { createHash, randomBytes } from "crypto";
import fetch from "node-fetch";

import Market from "./market";
import Sellers from "./sellers";
import Bank from "./Bank"

import { UserApi, UserDatabase } from "typings/index";


const app = express();

// @ts-ignore
let mongoCollection: mongodb.Collection<AccountDatabase>;

let market: Market;
let sellers: Sellers;
let bank: Bank;


const authorizationMiddleware = async (req: any, res: any, next: any) => {

    if (!req.headers.authorization) {
        res.status(401).json({ error: "No authorization header" });
        return;
    }

    let authorizationMethod = req.headers.authorization.split(" ")[0];


    if (authorizationMethod.toLowerCase() !== "token") {
        res.status(401).json({ error: "Authorization method not implemented yet" });
        return;
    }

    let token = req.headers.authorization.split(" ")[1];

    if (!token) {
        res.status(401).json({ error: "No token found" });
        return;
    }


    authorize(token).then((user => {
        req.data = {};
        req.data.user = user;
        next();
    })).catch(reason => {
        res.status(401).json({ error: reason.toString() });
    });
};





start();



app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Method", "*");
    res.header("Access-Control-Allow-Headers", "*");

    if (req.method === 'OPTIONS')
        res.status(204).end();
    else
        next();
});

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} from ${req.ip}`);
    next();
});



// api


app.use("/api", express.json());


app.post(/^\/api\/login\/?$/i, (req, res) => {

    if (!req.body) {
        res.status(401).json({ error: "The body is null" });
        return;
    }

    connect(req.body).then(token => res.json({ token: token })).catch(reason => res.json({ errror: reason.toString() }));
});





app.post(/^\/api\/newAccount\/?$/i, (req, res) => {
    if (!req.body.username) {
        res.status(400).json({ error: "Username required" });
        return;
    }

    if (req.body.username.includes(" ")) {
        res.status(400).json({ error: "Username must not contains space" });
        return;
    }

    if (!/^[\x00-\x7F]*$/.test(req.body.username)) {
        res.status(400).json({ error: "Username must contains only ASCII characters" });
        return;
    }

    if (!req.body.password) {
        res.status(400).json({ error: "Password required" });
        return;
    }

    if (req.body.password.includes(" ")) {
        res.status(400).json({ error: "Password must not contains space" });
        return;
    }

    if (!/^[\x00-\x7F]*$/.test(req.body.password)) {
        res.status(400).json({ error: "Password must contains only ASCII characters" });
        return;
    }

    createAccount(req.body.username.toString(), req.body.password.toString()).then(() => {
        res.json({ success: true });
    }).catch(reason => {
        res.json({ error: reason.toString() });
    });
});



app.get(/^\/api\/market\/items\/?$/i, async (req, res) => {
    market.getAllItems().then(items => res.json(items)).catch(reason => {
        res.json({ error: reason.toString() });
    });
});

app.get(/^\/api\/market\/items\/([a-z0-9_]+)\/?$/i, async (req, res) => {
    // @ts-ignore
    let match = req.url.match(/^\/api\/market\/items\/([a-z0-9_]+)\/?$/i);
    if (match) {
        var id = match[1];
        if (!id) {
            res.json({ error: "No item id found" });
            return;
        }
    }
    else {
        res.json({ error: "No item id found" });
        return;
    }


    market.getItem(id).then(item => {
        res.json(item);
    }).catch(reason => {
        res.json({ error: reason.toString() });
    });
});






app.get(/^\/api\/market\/items\/[a-z0-9_]+\/sellers\/?$/i, (req, res) => {
    let match = req.url.match(/^\/api\/market\/items\/([a-z0-9_]+)\/sellers\/?$/i);
    if (match) {
        var id = match[1];
        if (!id) {
            res.json({ error: "No item id found" });
            return;
        }
    }
    else {
        res.json({ error: "No item id found" });
        return;
    }

    market.getItemSellers(id).then(sellers => {
        res.json(sellers);
    }).catch(reason => {
        res.json({ error: reason.toString() });
    });
});

app.get(/^\/api\/market\/items\/([a-z0-9_]+)\/sellers\/([a-z0-9_]+)\/?$/i, (req, res) => {
    let match = req.url.match(/^\/api\/market\/items\/([a-z0-9_]+)\/sellers\/([a-z0-9_]+)\/?$/i);
    if (match) {
        var itemId = match[1];
        if (!itemId) {
            res.json({ error: "No item id found" });
            return;
        }

        var sellerId = match[2];
        if (!sellerId) {
            res.json({ error: "No seller id found" });
            return;
        }
    }
    else {
        res.json({ error: "No item id found" });
        return;
    }

    market.getItemSeller(itemId, sellerId).then(seller => res.json(seller)).catch(reason => res.json({ error: reason.toString() }));
});




app.get(/^\/api\/sellers\/?$/i, async (req, res) => {
    sellers.getSellers().then(sellers => res.json(sellers)).catch(reason => {
        res.json({ error: reason.toString() });
    });
});

app.get(/^\/api\/sellers\/([a-z0-9_]+)\/?$/i, async (req, res) => {
    let match = req.url.match(/^\/api\/sellers\/([a-z0-9_]+)\/?$/i);
    if (match) {
        var id = match[1];
        if (!id) {
            res.json({ error: "No seller id found" });
            return;
        }
    }
    else {
        res.json({ error: "No seller id found" });
        return;
    }


    sellers.getSeller(id).then(seller => {
        res.json(seller);
    }).catch(reason => {
        res.json({ error: reason.toString() });
    });
});



app.get(/^\/api\/users\/@me\/?$/, authorizationMiddleware, (req, res) => {


    if (!(req as any).data.user.id) {
        res.status(500).end("Internal server error");
    }

    res.json(getUserApi((req as any).data.user));
});

app.post(/^\/api\/bank\/transfer\/?$/i, authorizationMiddleware, (req, res) => {

    if (!req.body) {
        res.json({ error: "No body" });
        return;
    }

    if (!req.body.toUserID) {
        res.json({ error: "toUserID is required in the body" });
        return;
    }

    if (!req.body.amount) {
        res.json({ error: "amount is required in the body" });
        return;
    }

    if (!(req as any).data.user.id) {
        res.status(500).end("Internal server error");
    }

    bank.transfertSold((req as any).data.user.id, req.body.toUserID, req.body.amount).then(() => {
        res.json({ succes: true });
    }).catch(reason => {
        res.json({ error: reason.toString() });
    })
});


app.use("/api", (req, res) => {
    //404 api
    res.status(404).contentType("text").end("Not found");
});


// End api



app.use(express.static(config.public, { extensions: ["html"], index: "index.html" }));


app.use((req, res) => {
    //404 file
    res.status(404).contentType("text").end("Not found");
});


async function start() {
    let db = (await mongodb.connect(config.mongoDBUri, { useUnifiedTopology: true })).db("34CorpMarket");
    mongoCollection = db.collection("accounts");
    market = new Market(db.collection("products"), db.collection("sellers"));
    sellers = new Sellers(db.collection("sellers"));
    bank = new Bank(db.collection("accounts"));
    app.listen(config.port, () => console.log(`Server started at port ${config.port}`));
}

async function authorize(token: string) {
    return new Promise<UserDatabase>((resolve, reject) => {
        mongoCollection.find({ token: token }, { projection: { _id: 0 } }).toArray().then(clients => {
            if (clients.length === 1)
                resolve(clients[0]);
            else reject("Wrong token");
        });
    });
}


async function createAccount(username: string, password: string) {
    return new Promise<void>(async (resolve, reject) => {

        let response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);

        if (response.status === 204) {
            reject(`${username} is not a Minecraft username`);
            return;
        }

        let passwordHash = createHash("sha256").update(password).digest("hex");

        mongoCollection.findOne({ username: username }, { projection: { _id: 0 } }).then(result => {
            generateToken().then(token => {
                if (result !== null) {
                    reject("Username already exist");
                    return;
                }

                mongoCollection.insertOne({
                    username: username,
                    password: passwordHash,
                    token: token
                }).then(() => resolve).catch(reject);
            }).catch(reject);
        }).catch(reject);
    });

    async function generateToken() {
        let token = randomBytes(48).toString("base64");
        return token;
    }
}

async function connect(body?: any): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!body) {
            reject("Body required");
            return;
        }


        const { username, password } = body;

        if (!username || !password) {
            reject("Username and password required")
            return;
        }

        let passwordHash = createHash("sha256").update(password).digest("hex");

        mongoCollection.find({ username: username, password: passwordHash }, { projection: { _id: 0 } }).toArray().then(result => {
            if (result.length === 1)
                resolve(result[0].token);
            else reject("Wrong username or password");
        });
    });
}

function getUserApi(user: UserDatabase): UserApi {
    return {
        username: user.username,
        id: user.id
    }
}