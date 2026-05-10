const { Client } = require('pg');

const con = new Client({
    host : "localhost",
    user : "amilaminjamal",
    port : 5432,
    password : "123456",
    database : "expense"
});

con.connect()
  .then(() => console.log("✅ DB CONNECTED"))
  .catch(err => console.log("❌ DB CONNECTION ERROR:", err));


module.exports = con;