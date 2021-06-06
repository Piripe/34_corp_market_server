import express from "express";
import config from "./config";
import mongodb from "mongodb";
import { createHash } from "crypto";
import fetch from "node-fetch";


const app = express();

// @ts-ignore
let mongoCollection: mongodb.Collection;


start();



app.use((req, res, next) => {
    console.log(`Request at ${req.url} from ${req.ip}`);
    next();
});




// api

app.use("/api", async (req, res, next) => {
    isAuthorized(req.headers.authorization).then(result => {
        if (result)
            next();
        else
            res.status(401).contentType("text").end("Unauthorized");
    });
});

app.use("/api", express.json());


app.get("/api/market/items", async (req, res) => {
    res.json()
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

    if (req.body.username.includes(" ")){
        res.status(400).json({ error: "Username must not contains space" });
        return;
    }

    if (!req.body.password) {
        res.status(400).json({ error: "Password required" });
        return;
    }

    if (req.body.password.includes(" ")){
        res.status(400).json({ error: "Password must not contains space" });
        return;
    }

    createAccount(req.body.username.toString(), req.body.password.toString()).then(success => {
        res.json({ success: success });
    });
});



// End api no authorization




app.use(express.static(config.public, { extensions: ["html"], index: "index.html" }));


app.use((req, res) => {
    //404 file
    res.status(404).contentType("text").end("Not found");
});


async function start() {
    mongoCollection = (await mongodb.connect(config.mongoDBUri, { useUnifiedTopology: true })).db("34CorpMarket").collection("accounts");
    app.listen(config.port, () => console.log(`Server started at port ${config.port}`));
}

async function isAuthorized(authorization?: string): Promise<boolean> {

    return new Promise((resolve) => {
        if (!authorization) {
            resolve(false);
            return;
        }


        let username = authorization.split(" ")[0];
        let password = authorization.split(" ")[1];

        if (!username || !password) {
            resolve(false);
            return;
        }

        let passwordHash = createHash("sha256").update(password).digest("hex");

        mongoCollection.find({ username: username, password: passwordHash }, { projection: { _id: 0 } }).toArray().then(result => {
            if (result.length === 1)
                resolve(true);
            else resolve(false);
        });
    });
}


async function createAccount(username: string, password: string): Promise<boolean> {
    return new Promise(async resolve => {

        let response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);

        if (response.status === 204) {
            resolve(false);
            return;
        }

        let passwordHash = createHash("sha256").update(password).digest("hex");

        mongoCollection.findOne({ username: username }, { projection: { _id: 0 } }).then(result => {
            if (result !== null) {
                resolve(false);
                return;
            }

            mongoCollection.insertOne({
                username: username,
                password: passwordHash
            }).then(() => resolve(true));

        })
    });
}