const LocalStrategy = require('passport-local').Strategy
const { authenticate } = require('passport')
const con = require('./dbConfig')
const bcrypt = require('bcrypt')
const passport = require('passport')

const authenticateUser = (email,password,done )=>{
     con.query('SELECT * FROM cuser WHERE email=$1',[email],(err,result)=>{
        if(err)
        {
            throw err;
        }

        if(result.rows.length>0)
        {
            const user = result.rows[0];
            bcrypt.compare(password,user.password,(err,isMatch)=>{
                if(err)
                {
                    throw err
                }

                if(isMatch)
                {
                    return done(null,user);
                }

                else
                {
                    return done(null,false,{message : "Password Incorect"});
                }
            })
        }
        else{
            return done(null,false,{message : "User does not exist"});
        }
     })
};


function initialize(passport){
    passport.use(new LocalStrategy({
        usernameField:"email",
        passwordField:"password"
    },authenticateUser))
};

passport.serializeUser((user,done)=>
{
    return done(null,user.id)
})

passport.deserializeUser((id,done)=>
{
    con.query('SELECT * FROM cuser WHERE id=$1',[id],(err,result)=>{
        if(err)
        {
            throw err;
        }

        return done(null,result.rows[0])
    })
})


module.exports=initialize