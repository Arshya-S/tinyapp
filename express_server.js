const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080




app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  ccc222: {
    id: "ccc222",
    email: "a@a.com",
    password: "1234",
  },
  aaabbb: {
    id: "aaabbb",
    email: "b@b.com",
    password: "hello",
  },
};

// Function for finding if a user is in the database by email
function userIndentifier(emailInput) {
  let foundUser = null;
  for (const userId in users) {
    const user = users[userId];
    if (user.email === emailInput) {
      foundUser = user;
      return foundUser;
    }
  }

  return foundUser;
}


// Function to generate random 6 digit alpha-numeric code
function generateRandomString() {
  return Math.random().toString(36).substring(2,5);
};


app.get("/", (req, res) => {
  res.render("partials/_header.ejs");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/login", (req, res) => {
  res.redirect("/urls");
});


app.get("/login", (req,res) => {
  const templateVars = {
    user: users[req.cookies['user_id']]
  }
  res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    user: users[req.cookies['user_id']],
    urls: urlDatabase
    };

  res.render('urls_index', templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls/" + shortURL);

});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] }
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {user: users[req.cookies['user_id']]}

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
  if (userIndentifier(userEmail)) {
    return res.status(400).send('The email is already in use.');
  }

  users[randomID] = {
    id: randomID,
    email: userEmail,
    password: userPass
  };

  res.cookie('user_id', randomID); 
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    user: users[req.cookies['user_id']],
    id: req.params.id, 
    longURL: urlDatabase[req.params.id]
  };

  res.render('urls_show', templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls")
});

app.get("/u/:id", (req, res) => {
  // const longURL = ...
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req,res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});