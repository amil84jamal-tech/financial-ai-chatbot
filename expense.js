const {Client} = require('pg')
const express = require('express')
const app = express()
const Joi = require('joi')
const session = require('express-session')
const flash = require('express-flash');
const cors = require('cors');
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(session(
    {
        secret:'secret',
        resave:false,
        saveUninitialized:false
    }
))
app.use(cors());
app.use(flash())
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
const schema = Joi.object({
        amount : Joi.number().positive().required(),
        category : Joi.string().required(),
        date:Joi.date().required(),
        description:Joi.string().allow(''),
        is_necessary:Joi.boolean() 
    });

app.set("view engine",'ejs');   

app.get('/setbudget', (req,res)=>{
    res.render("budget");
})


app.get('/happy', (req,res)=>{
    res.render("happy");
})
app.post('/setbudget', (req,res)=>{
     const{month,budget}=req.body;
     console.log(req.body);
     con.query('INSERT INTO monbud (month,amount) VALUES ($1,$2) RETURNING id,month,amount',[month,budget],(err,result)=>{
        if(err)
        {
            throw err;
        }
        else
        {
            console.log(result.rows);
            req.flash('success_msg',"Your entry is succesful");
            res.redirect("/happy");
        }
     })
})

app.post('/create',(req,res)=>{
    
    const{error,value}=schema.validate(req.body);
    if(error)
    {
        return res.status(400).json({error : error.details[0].message})
    }
    const {amount,category,description,date,is_necessary} = value;
    const cqry = "INSERT INTO exp (amount,category,description,date,is_necessary) VALUES ($1,$2,$3,$4,$5)";
    
    con.query(cqry,[amount,category,description,date,is_necessary],(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
            res.send(result.rows);
            console.log("Expense is Created");
            
        }
    })
})

app.get('/getexp',(req,res)=>{
   
    const gqry = "SELECT * FROM exp";
    con.query(gqry,(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
            res.send(result.rows);
            console.log("All expenses are dispalyed");
            
        }
    })
})

app.get('/getweekamount/:date',(req,res)=>{
   
    const d1 = req.params.date;
    const dqry = "SELECT * FROM exp WHERE DATE_TRUNC('week',\"date\" ) = DATE_TRUNC('week', $1::date)" ;
    con.query(dqry,[d1],(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
            res.send(result.rows);
            console.log("All weekly expenses are dispalyed");
            
        }
    })
})

app.get('/getweeklyamount', async (req, res) => {
  try {
    const { rows: ex } = await con.query("SELECT * FROM exp");
    const result = {};
    const sampleDate = new Date(ex[0].date);
    const mname = sampleDate.toLocaleString('default', { month: 'long' });

    ex.forEach(item => {
      const date = new Date(item.date);
      const day = date.getDate();
      const wnum = Math.ceil(day / 7);
      const wkey = `week${wnum}`;

      const am = Number(item.amount) || 0;

      if (!result[wkey]) {
        result[wkey] = 0;
      }

      result[wkey] += am;
    });

   
    const f = {
      month:mname,
      weeks: []
    };

    for (let key in result) {
      f.weeks.push({
        week: `Week ${key.replace('week', '')}`,
        amount: result[key]
      });
    }

    res.json(f);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/getweekly', async (req, res) => {
  try {
       const ex = await con.query('SELECT MIN(date) AS m_date ,CEIL(EXTRACT (DAY FROM date)/7) AS week, category, SUM(amount) AS total FROM exp GROUP BY week,category ORDER BY week');
       const result = {};
        const sam = ex.rows.length ?new Date(ex.rows[0].m_date).toLocaleString('default',{month : 'long'}): null;
       
       for(const row of ex.rows)
       {
        const w = `week${row.week}`;
        if(!result[w])
        {
            result[w]= {};
        }
        result[w][row.category]=Number(row.total);
       
       }
       const weeks = Object.keys(result).map(key =>({
        week : `Week ${key.replace('week','')}`,
        category:result[key]

       }));

       res.json({
        month : sam,
        weeks
       })

      
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/getcategoryamount', async (req, res) => {
  try {
       const ex = await con.query('SELECT category, SUM(amount) AS TOTAL FROM exp GROUP BY category ORDER BY category');
       
       res.json(ex.rows)
      }
      catch (err) {
    res.send(err);
  }
});

app.get('/getmaxcategoryamount', async (req, res) => {
  try {
       const ex = await con.query('SELECT category, SUM(amount) AS TOTAL FROM exp GROUP BY category ORDER BY TOTAL DESC LIMIT 1');
       
       res.json(ex.rows[0])
      }
      catch (err) {
    res.send(err);
  }
});

app.get('/getexp/:id',(req,res)=>{
    const id = req.params.id;
    const gidqry = "SELECT * FROM exp WHERE id=$1";
    con.query(gidqry,[id],(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
            res.send(result.rows);
            console.log("Expense(ID) are dispalyed");
            
        }
    })
})

app.put('/upexp/:id',(req,res)=>{
    const id = req.params.id;
    const uschema = Joi.object({
        amount : Joi.number().positive().required()
    });
    const{error,value}=uschema.validate(req.body);
    const {amount} = value;
    if(error)
    {
        return res.status(400).json({error : error.details[0].message})
    }
    
    
    const uqry = "UPDATE exp SET amount=$2 WHERE id=$1";
    con.query(uqry,[id,amount],(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
            res.send(result.rows);
            console.log("Expense(ID) are dispalyed");
            
        }
    })
})

app.delete('/delexp/:id',(req,res)=>{
    const id = req.params.id;
    const dqry = "DELETE FROM exp WHERE id=$1";
    con.query(dqry,[id],(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
            res.send(result.rows);
            console.log("Expense Deleted");
            
        }
    })
})

function getTot(expenses)
{
    return expenses.reduce((sum,item)=>{
        return sum + Number(item.amount || 0);
    }, 0);
}

function getCB(expenses)
{
    return expenses.reduce((acc,item)=>{
        const cat = item.category || "unknown";
        acc[cat] = (acc[cat]||0) + Number(item.amount || 0);

        return acc;
    },{});
}

function getIns(bk,tot)
{
    for(let cat in bk)
    {
        const p = (bk[cat]/tot)*100;
        if(p>40)
        {
            return `${cat} dominates spending (${p.toFixed(1)}%)`
        }
    }
    return "Spending looks balanced";
}



app.get('/gettot',(req,res)=>{
    const gqry = "SELECT * FROM exp";
    con.query(gqry,(err,result)=>
    {
        if(err)
        {
            res.send(err)
        }
        else
        {
            const tot = getTot(result.rows);
            const bk = getCB(result.rows);
            const iw = getIns(bk,tot);
            console.log("Total Spending : ",tot);
            console.log("Total Breakdown : ",bk);
            console.log("Insights : ",iw);
            
            res.send({
                total : tot,
                breakdown : bk,
                insight : iw
            });
        }
    })
});

function comweek(expenses)
{
    return expenses;
}

function ircweek(expenses)
{
   const a1 = expenses[0];
   const a2 = expenses[1];

   const dif = Number(a1.total)-Number(a2.total);
   const total = Number(a1.total)+Number(a2.total);
   const d = Math.abs(dif)
   const p = ((d/total)*100).toFixed(1);
   if(dif>0)
   {
     return {
        type : "increasing",
        amount : d,
        percentage : p,
        period : "weekly",
        message : `Your spending increased by ${d} compared to last week`
     };
   }

   else if(dif<0)
   {
   return {
        type : "decreasing",
        amount : d,
        percentage : p,
        period : "weekly",
        message : `Your spending decreased by ${d} compared to last week`
     };
    }

   else
   {
   return {
        type : "equal",
        amount : d,
        percentage : p,
        period : "weekly",
        message : `Your spending reamined same compared to last week`
     };
    }

}

app.get('/compweek', (req,res)=>{
    const aqry = "SELECT CEIL(EXTRACT(DAY FROM date)/7.0) AS week, SUM(amount) AS total FROM exp GROUP BY week ORDER BY week";
    con.query(aqry,(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
           const data = ircweek(result.rows);
           
            res.send(data);
              
        }
    })
})

function mcat(expenses)
{
    const m = expenses.total;
    const i = expenses.category;
    return{
        top : i,
        amount : m,
        period : "weekly",
        message : `${i} was your biggest expense`
    };
}

app.get('/maxcat', (req,res)=>{
    const aqry = "SELECT category,SUM(amount) AS total FROM exp GROUP BY category ORDER BY total DESC LIMIT 1";
    con.query(aqry,(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
           const data = mcat(result.rows[0]);
           
            res.send(data);
              
        }
    })
})
function mincat(expenses)
{
    const m = expenses.total;
    const i = expenses.category;
    return{
        mincategory : i,
        amount : m,
        period : "weekly",
        message : `${i} was your lowest expense`
    };
}
app.get('/lcat', (req,res)=>{
    const aqry = "SELECT category,SUM(amount) AS total FROM exp GROUP BY category ORDER BY total LIMIT 1";
    con.query(aqry,(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
           const data = mincat(result.rows[0]);
           
            res.send(data);
              
        }
    })
})

function averagespending(expense)
{
    const s = expense.sum;
    const d = expense.count;
    const avg = (Number(s)/Number(d)).toFixed(2);
    return {
        NumberOfDays : d,
        TotalAmount : s,
        AverageIncome : avg,
        message : `Your average income is ${avg}`
    };
}

app.get('/avgspending', (req,res)=>{
    const aqry = "SELECT SUM(amount), COUNT(*) FROM exp";
    con.query(aqry,(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
           const data = averagespending(result.rows[0]);
           
            res.send(data);
              
        }
    })
})

function dayendins(expense)
{
    const weekday = expense.weekday;
    const weekend = expense.weekend;
    const dif = Number(weekday)-Number(weekend);
    const d = Math.abs(dif);

    if(dif>0)
    {
        return{
            Highon:"Weekday",
            Amount:weekday,
            Message:`You spend more on weekdays by ${d}`
        }
    }
    

    if(dif<0)
    {
        return{
            Highon:"Weekend",
            Amount:weekend,
            Message:`You spend more on weekend by ${d}`
        }
    }
}
app.get('/dayend', (req,res)=>{
    const aqry = `
    SELECT 
    SUM(CASE WHEN EXTRACT(DOW FROM date) IN (1,2,3,4,5) THEN amount ELSE 0 END) AS weekday,
    SUM(CASE WHEN EXTRACT(DOW FROM date) IN (0,6) THEN amount ELSE 0 END) AS weekend
    FROM exp;`;
con.query(aqry,(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
           const data = dayendins(result.rows[0]);
           
            res.send(data);
              
        }
    })
})

function maxendins(expense)
{
    const d = expense.day_name;
    const a = expense.total;
    return{
        Day : d,
        Amount : a,
        Message : `Your maximum spent is on ${d}`
    }
}

app.get('/maxday',(req,res)=>{
    const pqry = "SELECT SUM(amount) AS total, TRIM (TO_CHAR(date,'Day')) AS day_name FROM exp GROUP BY date ORDER BY date LIMIT 1";
    con.query(pqry,(err,result)=>{
      if(err)
      {
        res.send(err);
      }
      else
      {
        const data = maxendins(result.rows[0]);
        res.send(data);
      }
})
})

function combe(expense)
{
    const bud = Number(expense.a);
    const e = Number(expense.b);

    if(bud>=e)
    {
        return{
            Budget : bud,
            Expense : e,
            Insight : "You are in control"

        }
    }
    else
    {
        return{
            Budget : bud,
            Expense : e,
            Insight : "You are overspending and exceeding the budget"

        }
    }
}

app.get('/compbudexp',(req,res)=>{
    const sqry = "SELECT (SELECT SUM(amount) FROM exp) AS a ,(SELECT SUM(amount) FROM monbud) AS b";
    con.query(sqry,(err,result)=>{
         if(err)
       {
        res.send(err);
       }
      else
       {
        const data = combe(result.rows[0]);
        res.send(data);
       }
    })
})
function mebinsights(expense)
{
  const m = Number(expense.expense);
  const b = Number(expense.budget);
  console.log(m,b);
  const d = Math.abs(m-b);
  if(m > b)
  {
    return{
        MonthlyExpense :m,
        MonthlyBudget :b,
        Message:`You have exceeded the budget by ${d}`
    }
  }
  else
  {
    return{
        MonthlyExpense :m,
        MonthlyBudget :b,
        Message:`You are in control, Congrats`
    }
  }
}
app.get('/monthlyanalysis', (req,res)=>{
    const mqry = "SELECT m.month AS Month, m.total AS Expense ,b.amount AS Budget FROM monexp m LEFT JOIN monbud b ON m.month=b.month";
    con.query(mqry,(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
            console.log(result.rows[0]);
            const data = mebinsights(result.rows[0]);
            res.send(data);
        }
    })
})

app.get('/setgoals', (req,res)=>{
    res.render("goals");
})


app.post('/setgoals', (req,res)=>{
     const{mission,target,savings,deadline}=req.body;
     console.log(req.body);
     con.query('INSERT INTO goal(mission,targetamount,savingsamount,deadline) VALUES ($1,$2,$3,$4)',[mission,target,savings,deadline],(err,result)=>{
        if(err)
        {
            throw err;
        }
        else
        {
            console.log(result.rows);
            req.flash('success_msg',"Your entry is succesful");
            res.redirect("/happy");
        }
     })
})


app.listen(3000,()=>{
    console.log(`Listening at http://localhost.com:3000`)
})