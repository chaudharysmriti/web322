/********************************************************************************
* WEB322 – Assignment 06
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: Smriti Chaudhary Student ID: 159469220 Date: 10th Dec, 2024
*
* Published URL: https://vercel.com/smritis-projects-9d66deb4/assignments6
*
********************************************************************************/

const projectData = require("./modules/projects");
const authService = require("./modules/auth-service");
const express = require("express");
const session = require("express-session");
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

// Middleware
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));

// Set EJS as the templating engine
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// Set up session handling
app.use(
  session({
    secret: "web322_assignment_6",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }, // Optional: Session timeout of 1 hour
  })
);

// Middleware to ensure login for restricted routes
function ensureLogin(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Routes
// Home and About routes
app.get("/", (req, res) => {
  res.render("home", { user: req.session.user });
});

app.get("/about", (req, res) => {
  res.render("about", { user: req.session.user });
});

// Authentication Routes
app.get("/register", (req, res) => {
  res.render("register", { message: null });
});

app.post("/register", async (req, res) => {
  try {
    await authService.registerUser(req.body);
    res.redirect("/login");
  } catch (err) {
    res.render("register", { message: err });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { message: null });
});

app.post("/login", async (req, res) => {
  try {
    let user = await authService.checkUser(req.body);

    // Get current date and time of login
    const loginDateTime = new Date().toLocaleString();

    // Get client information
    const clientInfo = {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    };

    // Store user details in the session
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginDateTime: loginDateTime,
      clientInfo: clientInfo,
    };

    res.redirect("/");
  } catch (err) {
    res.render("login", { message: err });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// User History Route
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory", { user: req.session.user });
});

// Projects Routes
app.get("/solutions/projects", async (req, res) => {
  try {
    if (req.query.sector) {
      let projects = await projectData.getProjectsBySector(req.query.sector);
      projects.length > 0
        ? res.render("projects", { projects, user: req.session.user })
        : res
            .status(404)
            .render("404", { message: `No projects found for sector: ${req.query.sector}`, user: req.session.user });
    } else {
      let projects = await projectData.getAllProjects();
      res.render("projects", { projects, user: req.session.user });
    }
  } catch (err) {
    res.status(404).render("404", { message: err, user: req.session.user });
  }
});

// Error Handling
app.use((req, res, next) => {
  res.status(404).render("404", { message: "Page not found", user: req.session.user });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", { message: "Something went wrong!", user: req.session.user });
});

// Initialize and Start the Server
projectData
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Server listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.error(`Unable to start server: ${err}`);
  });
