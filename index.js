const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const app = express();
const pool = dbConnection();
const faker = require("faker");
const fetch = require("node-fetch");
app.set("view engine", "ejs");
app.use(express.static("public"))
app.use(express.urlencoded({extended: true}));

var randomName = faker.name.findName();
var randomAvatar = faker.internet.avatar();


app.use(session({
secret: "top secret!",
resave: true,
saveUninitialized: true
}));


//root route
app.get('/', (req, res) => {
  res.render('Home', {"name":randomName, "avatar":randomAvatar});

});


app.get('/login', (req, res) => {
   res.render('login')
});


app.post('/login', async (req, res) => {
   // res.render('login') 
   let username = req.body.username;

   let userPassword= req.body.password;
   // let password = "$2a$10$D3Aov0.uyUfVtVWqgx/W3e7cJAf9IJxNKfAn5ai8LQ1Dt1D5xtsXa"; // https://www.browserling.com/tools/bcrypt (password is secret!)

   let result = await checkUsername(username);
   console.dir(result);
   let hashedPwd = "";

   if(result.length > 0){
    hashedPwd = result[0].password;
  }

   let passwordMatch = await bcrypt.compare(userPassword, hashedPwd);

   req.session.authenticated = false;

   if (passwordMatch) {
     req.session.authenticated = true;
     res.render("admin");
   } else {
     res.render("login", {"loginError" : true});
   }
});

app.get('/Newsletter', async (req, res) => {
  let rowAffected = false;

   if (req.query.name) {
    //form to add author was submitted
    let sql = "INSERT INTO newsletter_list (name, email) VALUES (?, ?)";
    console.log(sql);
    let params = [req.query.name, req.query.mail];
    let rows = await executeSQL(sql, params);
    console.log(rows);
  
    if (rows.affectedRows == 1) {
      rowAffected = true;
    }
   }

   res.render('Newsletter', {"emailAdded":rowAffected})
});

//admin route
app.get('/admin', isAuthenticated, (req, res) => {
   res.render('admin')
});


app.get('/Mission', (req, res) => {
  res.render('Mission')
});

app.get('/FindPets', async (req, res) => {
  let sql = `SELECT petId, name, species, sex, dob FROM pet GROUP BY petId`;
  
  let rows = await getData(sql);
  
  console.log(rows);
  res.render('FindPets', {"rows":rows});
});

app.get("/search", async (req, res) =>{
  let word = req.query.keyword;
  let sql = `SELECT petId, name, species, sex, dob, photo FROM pet WHERE name LIKE ?`; // No single quotes in the SQL command
  let params = [`%${word}%`]

  if(req.query.species) { //If authorId was selected (if it has any value)
    sql += " AND species = ? ";
    params.push(req.query.species);
  }
  if(req.query.pS) { //If sex was selected (if it has any value)
    sql += " AND sex = ? ";
    params.push(req.query.pS);
  }

  let rows = await getData(sql, params);
  console.log(rows)
  res.render('PetsFound', {"rows":rows});
});

app.get('/AddPet', isAuthenticated, async (req, res) => {
   let rowAffected = false;

   if (req.query.firstName) {
    //form to add author was submitted
    let sql = "INSERT INTO pet (name, species, photo, sex) VALUES (?, ?, ?, ?)";
    console.log(sql);
    let params = [req.query.firstName, req.query.species, req.query.photo, req.query.sex];
    let rows = await executeSQL(sql, params);
    console.log(rows);
    if (rows.affectedRows == 1) {
      rowAffected = true;
    }
   }
  
   res.render('AddPet', {"petAdded":rowAffected})
});

app.get('/DisplayPets', isAuthenticated, async (req, res) => {
   let sql = "SELECT petId, name FROM pet ORDER BY name";
   let rows = await executeSQL(sql);
   res.render('DisplayPets', {"rows":rows})
});

app.get('/UpdatePets', async (req, res) => {
  let rowAffected = false;

  if (req.query.firstName) {
    //form to update author was submitted
    let sql = "UPDATE pet SET name = ?, species = ?, photo = ?, sex = ? WHERE petId = ? ";
    //console.log(sql);
    let params = [req.query.firstName, req.query.species, req.query.photo, req.query.sex, req.query.petId];
    let rows = await executeSQL(sql, params);
    console.log(rows);
    if (rows.affectedRows == 1) {
      rowAffected = true;
    }
   }


  let sql = "SELECT * FROM pet WHERE petId = ?"; 

  let rows = await executeSQL(sql, [req.query.petId] );
  res.render("UpdatePets", {"rows":rows});

});

app.get('/DeletePets', isAuthenticated, async (req, res) => {

  let sql = "DELETE FROM pet WHERE petId = ?";
  let rows = await executeSQL(sql, [req.query.petId] );

  res.redirect("/DisplayPets");

});

app.get('/FunFacts', async (req, res) => {
  let sql = "SELECT photo FROM pet ORDER BY name";
  let rows = await executeSQL(sql);
  res.render('FunFacts', {"rows":rows})
});

app.get('/LearnMore', (req, res) => {
  res.render('LearnMore')
});

app.get('/FAQ', (req, res) => {
  res.render('FAQ')
});

app.get('/Information', (req, res) => {
  res.render('Information')
});

function checkUsername(username){
  let sql = "SELECT * FROM users WHERE username = ?";
  return new Promise(function(resolve, reject){
    let conn = createDBConnection();
    conn.query(sql, [username], function(err, rows, fields){
      if(err) throw err;
      console.log("Rows found: " + rows.length);
      resolve(rows);
    });
  });
}

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

function isAuthenticated(req, res, next) {
  if (!req.session.authenticated) {
    res.render('login')
  } else {
    next();
  }
}


function createDBConnection(){
  var conn = mysql.createPool({

      connectionLimit: 10,
      host: "muowdopceqgxjn2b.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
      user: "aiqnbcvx8c7nxmc8",
      password: "zvx8kks07rolhes8",
      database: "bkxocs5ckvzsa4yk"
    
  });
  return conn;
}


//dbTest route
app.get("/dbTest", async function(req, res){

let sql = "SELECT CURDATE()";
let rows = await getData(sql);
res.send(rows);
});//dbTest

async function executeSQL(sql, params){

return new Promise (function (resolve, reject) {
let conn = dbConnection();

conn.query(sql, params, function (err, rows, fields) {
if (err) throw err;
   resolve(rows);
});
});

}//executeSQL



async function getData(sql, params){

return new Promise (function (resolve, reject) {
let conn = dbConnection();

pool.query(sql, params, function (err, rows, fields) {
if (err) throw err;
   resolve(rows);
});
});

}//getData


//values in red must be updated
function dbConnection(){

   const pool  = mysql.createPool({

      connectionLimit: 10,
      host: "muowdopceqgxjn2b.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
      user: "aiqnbcvx8c7nxmc8",
      password: "zvx8kks07rolhes8",
      database: "bkxocs5ckvzsa4yk"

   }); 

   return pool;

} //dbConnection

app.listen(3000, () => {
  console.log('server started');
});

   

