require("dotenv").config()

const {Client} = require("pg")

const con = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

con.connect(()=>{
    console.log("Connected to the Database");
})

module.exports = con;