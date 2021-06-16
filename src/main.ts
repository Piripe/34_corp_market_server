import express from "express";
import config from "./config";
import { createHash, randomBytes } from "crypto";
import fetch from "node-fetch";
import mariadb from "mariadb";

import Market from "./market";
import Bank from "./Bank"



const app = express();

let db: mariadb.Pool;

let market: Market;
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


app.post(/^\/api\/login\/?$/i, (req, res, next) => {


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

    if (!req.body.toUser) {
        res.json({ error: "toUser is required in the body" });
        return;
    }

    if (!req.body.amount) {
        res.json({ error: "amount is required in the body" });
        return;
    }

    if (!(req as any).data.user.id) {
        res.status(500).end("Internal server error");
    }

    bank.transfertSold((req as any).data.user.id, req.body.toUser, req.body.amount).then(() => {
        res.json({ success: true });
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
    db = mariadb.createPool({
        host: config.db.host,
        user: config.db.username,
        password: config.db.password,
        database: config.db.dbName
    });
    market = new Market(db);
    bank = new Bank(db);
    app.listen(config.port, () => console.log(`Server started at port ${config.port}`));
}

async function authorize(token: string) {
    let user = await db.query(`select name, sold, id from User where token = "${token}"`);
    if (user[0])
        return user[0];
    throw "Wrong token";


}


async function createAccount(username: string, password: string) {

    let response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);

    if (response.status === 204) {
        throw `${username} is not a Minecraft username`;
    }


    if ((await db.query(`select id from User where name = "${username}"`))[0]) {
        throw "Username already exist";
    }

    let passwordHash = createHash("sha256").update(password).digest("hex");

    let generatedToken = generateToken();


    await db.query(`insert into User (name, password, token) values("${username}", "${passwordHash}", "${generatedToken}")`);


    function generateToken() {
        let token = randomBytes(48).toString("base64");
        return token;
    }
}

async function connect(body?: any) {
    if (!body) {
        throw "Body required";
    }


    const { username, password } = body;

    if (!username || !password) {
        throw "Username and password required";
    }

    let passwordHash = createHash("sha256").update(password).digest("hex");


    let result = await db.query(`select token from User where name = "${username}" and password = "${passwordHash}"`);

    if (result[0])
        return result[0].token
    throw "Wrong username or password";
}

function getUserApi(user: any) {
    return {
        username: user.name,
        id: user.id,
        sold: user.sold
    }
}