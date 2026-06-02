const express = require("express")
const app = express()
const PORT = process.env.PORT || 4000
const con = require('./dbConfig');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');



function authenticateToken(req,res,next)
{
    const token = req.cookies.token;
    if(token == null)
    {
        return res.redirect('/users/login');
    }
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err)
        {
            return res.redirect('/users/login');
        }
        req.user=user;
        console.log(req.user);
        next();
    })
    
}
app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser());
app.get('/',(req,res)=>{
    res.render("index")
})

app.get('/users/login',(req,res)=>{
    res.render("login",{messages : {
        success_msg : "You are sucesfully logged"
    }})
})

app.get('/users/register',(req,res)=>{
    res.render("register")
})

app.get('/users/dashboard',authenticateToken,(req,res)=>{
    res.render("dashboard",{
        user : req.user
    })
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

app.post('/users/login',async(req,res)=>{
 const {email,password} = req.body;
 con.query('SELECT * FROM cuser WHERE email =$1',[email],async(err,result)=>{
    if(result.rows.length==0)
    {
        return res.send("User does not exist");
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password,user.password);
    if(!match)
    {
        return res.send("Invalid Password");
    }
    const accesstoken = jwt.sign({id:user.id, email : user.email},process.env.ACCESS_TOKEN_SECRET)
    res.cookie('token',accesstoken,{
        httpOnly:true
    })
    res.redirect('/users/dashboard');
})    
})


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