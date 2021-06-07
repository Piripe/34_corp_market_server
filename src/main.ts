import express from "express";
import config from "./config";
import mongodb, { ReplSet } from "mongodb";
import { createHash } from "crypto";
import fetch from "node-fetch";

import Market from "./market";


const app = express();

// @ts-ignore
let mongoCollection: mongodb.Collection;

let market: Market;

start();



app.use((req, res, next) => {
    console.log(`Request at ${req.url} from ${req.ip}`);
    next();
});




// api

app.use("/api", async (req, res, next) => {
    isAuthorized(req.headers.authorization).then(next).catch(reason => {
        res.status(401).json({ error: reason });
    });
});

app.use("/api", express.json());


app.get(/^\/api\/market\/items\/([a-z1-9_]+)$/i, async (req, res) => {
    // @ts-ignore
    let match = req.url.match(/^\/api\/market\/items\/([a-z1-9_]+)$/i);
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
        res.json({ error: reason });
    });
});

app.get("/api/market/items", async (req, res) => {
    market.getAllItems().then(items => res.json(items)).catch(reason => {
        res.json({ error: reason });
    });
});




app.get(/^\/api\/market\/items\/[a-z1-9_]+\/sellers$/i, (req, res) => {
    let match = req.url.match(/^\/api\/market\/items\/([a-z1-9_]+)\/sellers$/i);
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
        res.json({ error: reason });
    });
});

app.get(/^\/api\/market\/items\/[a-z1-9_]+\/sellers\/[a-z1-9]+$/i, (req, res) => {

});


app.use("/api", (req, res) => {
    //404 api
    res.status(404).contentType("text").end("Not found");
});

// End api





// Api no authorization

app.use("/unauthorizedapi/", express.json());
app.post("/unauthorizedapi/newAccount", (req, res) => {
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
        res.json({ error: reason });
    });
});



// End api no authorization




app.use(express.static(config.public, { extensions: ["html"], index: "index.html" }));


app.use((req, res) => {
    //404 file
    res.status(404).contentType("text").end("Not found");
});


async function start() {
    let db = (await mongodb.connect(config.mongoDBUri, { useUnifiedTopology: true })).db("34CorpMarket");
    mongoCollection = db.collection("accounts");
    market = new Market(db.collection("products"), db.collection("sellers"));
    app.listen(config.port, () => console.log(`Server started at port ${config.port}`));
}

async function isAuthorized(authorization?: string) {

    return new Promise<void>((resolve, reject) => {
        if (!authorization) {
            reject("Authorization header required");
            return;
        }


        let username = authorization.split(" ")[0];
        let password = authorization.split(" ")[1];

        if (!username || !password) {
            reject("Username and password required")
            return;
        }

        let passwordHash = createHash("sha256").update(password).digest("hex");

        mongoCollection.find({ username: username, password: passwordHash }, { projection: { _id: 0 } }).toArray().then(result => {
            if (result.length === 1)
                resolve();
            else reject("Wrong username or password");
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
            if (result !== null) {
                reject("Username already exist");
                return;
            }

            mongoCollection.insertOne({
                username: username,
                password: passwordHash
            }).then(() => resolve()).catch(reject);

        })
    });
}