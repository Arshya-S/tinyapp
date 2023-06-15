const express = require("express");
const cookieParser = require('cookie-parser');
//const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const helperFunction = require("./helper");
const app = express();
const PORT = 8080; 

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1','key2','key3','key4'],
  maxAge: 24 * 60 * 60 * 1000
}))

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "ccc222",
  },
};

const users = {
  ccc222: {
    id: "ccc222",
    email: "a@a.com",
    password: "$2a$10$T7Ijby8UXRihLz3eUx2yEOqWniIYRNw8AfxQJm73Ah04Wgd3UujEC", //1234
  },
  aJ48lW: {
    id: "aJ48lW",
    email: "b@b.com",
    password: "$2a$10$HRKBNJGGN/jAwFidMDywvuQhB7Dikqfzl/D55CFRracqJ7RzZ4kfq", //hello
  },
};

const getUserByEmail = helperFunction.getUserByEmail;

// Function to generate random 6 digit alpha-numeric code
function generateRandomString() {
  return Math.random().toString(36).substring(2,5);
};

function urlsForUser(id) {
  let urlObj = []

  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urlObj.push(url)
    }
  }

  return urlObj;
}


// Home Page
app.get("/", (req, res) => {
  res.redirect("/login");
});


// JSON Data
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// Routing for /login
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPass = req.body.password;
  
  if (!getUserByEmail(userEmail,users)) {
    return res.status(403).send("Email cannot be found");
  } 

  if (!bcrypt.compareSync(userPass,getUserByEmail(userEmail,users).password)) {
    return res.status(403).send("Incorrect password");
  }

  req.session.user_id = getUserByEmail(userEmail,users).id;
  res.redirect("/urls");
});


app.get("/login", (req,res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }

  const templateVars = {user: users[req.session.user_id]}
  res.render("urls_login", templateVars);
});


// Routing for /logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});


// Routing for /urls
app.get("/urls", (req, res) => {

  if(!req.session.user_id) {
    res.send("<h1> Must be logged in to access URLS page. </h1>");
  }

  const templateVars = { 
    user: users[req.session.user_id],
    urlDatabase: urlDatabase,
    urlsOfUser: urlsForUser(req.session.user_id)
    };
  res.render('urls_index', templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("<h2>Must be logged in to shorten URLS</h2>");
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.session.user_id}
  res.redirect("/urls/" + shortURL);
});


// Routing for /register
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }

  const templateVars = {user: users[req.session.user_id]}
  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  const randomID = generateRandomString(); 
  const userEmail = req.body.email;
  const userPass = req.body.password;
  // if user enters no email or no password
  if (!userEmail || !userPass) {
    return res.status(400).send('Please provide a username and password');
  }
  // return null if user not found, other wise user is returned which runs the if statement
  if (getUserByEmail(userEmail,users)) {
    return res.status(400).send('The email is already in use.');
  }

  users[randomID] = {
    id: randomID,
    email: userEmail,
    password: bcrypt.hashSync(userPass, 10)
  };

  console.log(users);

  req.session.user_id =  randomID; 
  res.redirect("/urls");
});


// Routing for /urls/new
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[req.session.user_id]}
  res.render("urls_new", templateVars);
});


// Routing for /urls/:id
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.send("<h2>Log in to access page</h2>")
  }
  if (urlDatabase[req.params.id].userID !== req.session.user_id){
    return res.send("<h2>Access denined. This URL page doesn't belong to you.</h2>")

  }

  const templateVars = { 
    user: users[req.session.user_id],
    id: req.params.id, 
    longURL: urlDatabase[req.params.id].longURL
  };

  res.render('urls_show', templateVars);
});

app.post("/urls/:id", (req, res) => {

  if(!(req.params.id in urlDatabase)){
    return res.send("id does not exist \n")
  }
  if(!req.session.user_id) {
    return res.send("Must be logged in \n");
  }
  if (urlDatabase[req.params.id].userID !== req.session.user_id){
    return res.send("<h2>Cannot edit as this url doesn't belong to you</h2>")
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls")
});


// Routing for /u/:id
app.get("/u/:id", (req, res) => {
  if (!urlDatabase.hasOwnProperty(req.params.id)){
    return res.send("<h2> this shortened url doesn't exist </h2>");
  }

  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// Routing for /urls/:id/delete
app.post("/urls/:id/delete", (req,res) => {
  if(!(req.params.id in urlDatabase)){
    return res.send("id does not exist \n")
  }
  if(!req.session.user_id) {
    return res.send("Must be logged in \n");
  }
  if (urlDatabase[req.params.id].userID !== req.session.user_id){
    return res.send("<h2> you cannot delete this URL as it doesn't belong to you</h2>");
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});