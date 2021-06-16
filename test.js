const mariadb = require("mariadb");

(async () => {
    let pool = mariadb.createPool({
        host: "192.168.1.48",
        user: "admin",
        password: "piripe5497!",
        database: "3_4_corp"
    });

    let result = await pool.query("create table Item(id int not null auto_increment, name varchar(100) not null, description varchar(255) not null, thumbnail varchar(255) not null, category int not null, primary key(id))");
    console.log(result[0]);
    
})()