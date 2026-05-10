const {Client} = require('pg')
const express = require('express')
const app = express()
const con = new Client({
    host : "localhost",
    user : "amilaminjamal",
    port : 5432,
    password : "123456",
    database : "expense"
})

con.connect().then(()=>{
console.log("Connected")
})