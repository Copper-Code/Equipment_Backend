
const mysql = require('mysql2/promise');
require("dotenv").config();
const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port:process.env.MYSQLPORT,
    waitForConnections:true,
    connectionLimit:10,
    queueLimit:0
});
    module.exports = db;

    //     host: process.env.DB_HOST,
    // user: process.env.DB_USER,
    // password: process.env.DB_PASSWORD,
    // database: process.env.DB_NAME,
    // port:process.env.DB_PORT,
    // waitForConnections:true,
    // connectionLimit:10,
    // queueLimit:0

