const express = require("express")
const app = express()
const PORT = process.env.PORT || 4000
const con = require('./dbConfig');
const bcrypt = require('bcrypt')
const session = require('express-session');
const flash = require("express-flash");
const passport = require('passport')
const initialize = require('./passportConfig')
const jwt = require('jsonwebtoken')
initialize(passport)

function checkauthenticated(req,res,next)
{
    if (req.isAuthenticated())
    {
        return res.redirect('/users/dashboard');
    }
    next();
}

function notauthenticated(req,res,next)
{
    if (req.isAuthenticated())
    {
        return next();
    }
   res.redirect('/users/login');
}

function authenticateToken(req,res,next)
{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    if(token == null)
    {
        res.sendStatus(401);
    }
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err)
        {
            throw err;
        }
        req.user=user;
        console.log(req.user);
        next();
    })
    
}
app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(session({
    secret : "secret",
    resave : false,
    saveUninitialised: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.get('/',(req,res)=>{
    res.render("index")
})

app.get('/users/login',checkauthenticated,(req,res)=>{
    res.render("login")
})

app.get('/users/register',checkauthenticated,(req,res)=>{
    res.render("register")
})

app.get('/users/dashboard',authenticateToken,(req,res)=>{
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

app.post('/users/login',(req,res,next)=>{
    const {email,password} = req.body;
    const user = { email : email, password : password};
    const accesstoken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET);
    console.log({accesstoken : accesstoken});
    next();
  },
  passport.authenticate('local',{
    successRedirect : '/users/dashboard',
    failureRedirect : '/users/login',
    failureFlash:true
})
);


app.get('/users/logout', (req,res)=>{
    req.logOut((err)=>{
        if(err)
        {
            return next(err);
        }
    
    req.flash('success_msg',"You have logged out successfully");
    res.redirect('/users/login');
    });
})


app.listen(PORT,()=>{
    console.log("Server Connected.....")
})