const LocalStrategy = require('passport-local').Strategy;
const {Client} = require('pg');
const bcrypt = require('bcrypt');
const { authenticate } = require('passport');
const con = require('./dbconfig');


function initialize(passport)
{
    const authenticateUser = (email,password,done)=>{
        con.query('SELECT * FROM users WHERE email=$1',[email],(err,result)=>{
            if(err)
            {
                return done(err);
            }
            console.log(result.rows)
            if(result.rows.length>0)
                {
                    const user = result.rows[0];

                    bcrypt.compare(password,user.password,(err,isMatch)=>{
                        console.log("Entered Password:", password);
                        console.log("Stored Password:", user.password);
                        console.log("isMatch:", isMatch);

                        if(err)
                        {
                            return done(err);
                        }
                        if(isMatch)
                        {
                            return done(null,user);
                        }
                        else
                        {
                            return done(null,false,{message : "Password Incorrect"});
                        }    
                    })
                }
            else
                {
                    return done(null,false,{message : "E-mail not Registered "})
                }     
        })
    }
    passport.use(new LocalStrategy({
        usernameField: "email",
        passwordField:"password"
    }, authenticateUser)
);

passport.serializeUser((user,done)=>done(null,user.id));
passport.deserializeUser((id,done)=>{
    con.query('SELECT * FROM users WHERE id =$1',[id], (err,result)=>{
        if(err)
        {
            return done(err);
        }
        else
        {
            return done(null,result.rows[0]);
        }
    })
});

} 


module.exports = initialize;
