const express = require("express");
const app = express();
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const cors = require('cors');
const initializePassport = require("./passportConfig");
initializePassport(passport);
const con = require('./dbconfig');

const bcrypt = require("bcrypt");

const PORT =    process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(session({
    secret : "secret",
    resave : false,
    saveUninitialized : false
})
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req,res,next)=>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
    
}
)
app.set("view engine","ejs")

app.get('/',(req,res)=>{
    res.render("index");
})

app.get('/users/register',(req,res)=>{
    res.render("register");
})


app.get('/users/login',(req,res)=>{
    res.render("login");
})

app.get('/users/logout',(req,res,next)=>{
    req.logOut(function(err){
    if(err)
    {
        return next(err);
    }
    });
    req.flash('success_msg',"You have logged out");
    res.redirect('/users/login');
})
function checkauthenticated(req,res,next)
{
    if(req.isAuthenticated())
    {
        return next();
    }

    res.redirect('/users/login');
}

app.get('/users/dashboard',checkauthenticated, (req,res)=>{
    res.render("dashboard",{user : req.user.name});
})

app.post('/users/register', async(req,res)=>{
    const {name,email,password,password2} = req.body;

    console.log({
        name,
        email,
        password,
        password2
    });

    let errors=[];
    if(!name || !email || !password || !password2)
    {
        errors.push({message : "Please enter the fields"});
    }

    if(password.length <6)
    {
        errors.push({message : "Password should contain atleast 6 charachters"});
    }

    if(password!=password2)
    {
        errors.push({message : "Password do not match"});
    }

    if(errors.length > 0)
    {
        return res.render('register',{ errors });
    }
           const hashedPassword = await bcrypt.hash(password,10);
            console.log(hashedPassword);

            const qry = 'SELECT * FROM users WHERE email=$1';
            
            con.query(qry, [email],(err,result)=>{
                if(err)
                {
                   return res.send(err);
                }
                console.log(result.rows);

                if(result.rows.length > 0)
            {
                errors.push({ message : "User already exists"});
                return res.render('register', { errors })
            }

            else
            {
                const sqry = 'INSERT INTO users(name,email,password) VALUES ($1,$2,$3) RETURNING id';
                con.query(sqry, [name,email,hashedPassword], (err,result)=>{
                    if(err)
                    {
                        res.send(err);
                    }

                    else
                    {
                        console.log(result.rows);
                        req.flash('success_msg', "You have been Registered, Please Login");
                        res.redirect('/users/login');
                    }
                })
            }

    
            })

            
        });


app.post('/users/login', passport.authenticate('local', {
    successRedirect: `/users/dashboard`,
    failureRedirect: `/users/login`,
    failureFlash : true

}
    

))        

app.listen(PORT,()=>{
    console.log(`Listening ..... running on port ${PORT}`);
}) 