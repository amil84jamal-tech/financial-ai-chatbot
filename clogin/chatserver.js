const express = require("express")
const app = express()
const PORT = process.env.PORT || 4000
const con = require('./dbConfig');
const bcrypt = require('bcrypt')
const session = require('express-session');
const flash = require("express-flash");

app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(session({
    secret : "secret",
    resave : false,
    saveUninitialised: false
}));
app.use(flash());

app.get('/',(req,res)=>{
    res.render("index")
})

app.get('/users/login',(req,res)=>{
    res.render("login")
})

app.get('/users/register',(req,res)=>{
    res.render("register")
})

app.get('/users/dashboard',(req,res)=>{
    res.render("dashboard")
})

app.post('/users/register', async(req,res)=>{

    const {name,email,password, password2} = req.body;
    console.log(name,email,password,password2);

    let errors = [];
    if(!name || !email || !password || !password2)
    {
        errors.push({message: "Enter all entries"});
    }

    if(password.length < 6)
    {
        errors.push({message : "Password should contain atleast 6 charachters"});
    }
    
    if(password != password2)
    {
        errors.push({message : "Password Incorrect"});
    }
    
    if(errors.length > 0)
    {
        res.render("register", { errors });
    }

    else
    {
        const hashedPassword = await bcrypt.hash(password,10);
        console.log(hashedPassword);

        con.query("SELECT * FROM cuser WHERE email=$1 ", [email], (err,result)=>{
            if(err)
            {
                throw err;
            }
            else
            {
                  
            
                con.query("INSERT INTO cuser(name,email,password) VALUES($1,$2,$3) RETURNING id,password",[name,email,hashedPassword], (err,result)=>{
                    if(err)
                    {
                        throw err;
                    }

                    else
                    {
                        req.flash('success_msg',"Account successfully created");
                        res.redirect("/users/login");
                    }
                })
            }
            }    
            
        )
    }
}
)

app.listen(PORT,()=>{
    console.log("Server Connected.....")
})