var express = require('express')
    , http = require('http')
    , path = require('path');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var stream = require('./ws/stream');
var favicon = require('serve-favicon')
const bodyParser = require('body-parser');
var session = require('express-session');
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "elearning"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

global.db = con;
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/JS'));
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render('login.ejs');
});

app.get('/login', function (req, res) {
    res.render('login.ejs');
});

app.post('/auth', function (req, res) {
    var sess = req.session;
    var name = req.body.username;
    var pass = req.body.password;
    var sql = "SELECT id, email, username FROM users WHERE username='" + name + "' and password = '" + pass + "'";
    db.query(sql, function (err, results) {
        if (results.length) {
            req.session.userId = results[0].id;
            req.session.user = results[0];
            console.log(results[0].id);
            res.redirect('/index');
        }
        else {
            message = 'Wrong username/password';
            res.redirect('/login');
        }

    });
});

app.get('/signup', function (req, res) {
    res.render('signup.ejs');
});

app.post('/signup', function (req, res) {
    var name = req.body.username;
    var pass = req.body.password;
    var email = req.body.email;
    var sql = "INSERT INTO users(username,password,email) VALUES ('" + name + "','" + pass + "','" + email + "')";

    var query = db.query(sql, function (err, result) {
        message = "Succesfully! Your account has been created.";
    });
    res.redirect("/login");
});


app.get('/index', (req, res) => {
    var user = req.session.user,
        userId = req.session.userId;
    console.log('ID=' + userId);
    if (userId == null) {
        res.redirect("/login");
        return;
    }

    var sql = "SELECT * FROM users WHERE id='" + userId + "'";

    db.query(sql, function (err, results) {
        res.render('index.ejs', { data: results });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(function (err) {
        res.redirect("/login");
    })
});

app.get('/update', (req, res) => {
    res.render('update.ejs');
});

app.post('/update', function (req, res) {
    var name = req.body.username;
    var pass = req.body.password;
    var newpass = req.body.newpass;
    var sql = "UPDATE users SET password ='" + newpass + "' WHERE username='" + name + "' and password='" + pass + "'";

    var query = db.query(sql, function (err, result) {
        message = "Succesfully! Your password has been update.";
    });
    res.redirect("/index");
});

app.get('/profile', (req, res) => {
    var userId = req.session.userId;
    if (userId == null) {
        res.redirect("/login");
        return;
    }

    var sql = "SELECT * FROM users WHERE id='" + userId + "'";
    db.query(sql, function (err, result) {
        res.render('profile', { data: result });
    });
});

app.get('/createroom', function (req, res) {
    res.render('createroom.ejs');
});

app.post('/createroom', (req, res) => {
    var name = req.body.roomname;
    var adminname= req.body.adminname;
    var link=`room?&id=${name}_${adminname}`;
    var key = req.body.roomkey;
    userId = req.session.userId;
    var sql = "INSERT INTO rooms(name,adminName,link,roomKey,userId) VALUES ('" + name + "','" + adminname + "','" + link + "','" + key + "','" + userId + "')";
    try {
        db.query(sql, function (err, result) {
            if (err) throw err;
            else {
                db.query("SELECT * FROM rooms WHERE name='" + name + "'", function (err, result, fields) {
                    if (err) throw err;
                    var roomId = result[0].id;
                    var sql2 = "INSERT INTO rooms_users(roomID,userId) VALUES ('" + roomId + "','" + userId + "')";
                    db.query(sql2, function (err, result) {
                        if (err) throw err;
                        console.log("rooms_users success==", result);
                        res.redirect("/index");
                    });
                });
            }

        });
    } catch (error) {
        console.log("error==", error);
        res.redirect("/index");
    }
});

app.get('/yourrooms', (req, res) => {
    var userId = req.session.userId;
    if (userId == null) {
        res.redirect("/login");
        return;
    }
    var sql = " SELECT * from rooms inner join rooms_users on rooms_users.roomId=rooms.id inner join users where rooms_users.userId = '" + userId + "' ";
    db.query(sql, function (err, result) {
        console.log(result);
        res.render('yourrooms.ejs', { data: result });
        
    });
});

app.get('/manageroom', (req, res) => {
    var userId = req.session.userId;
    if (userId == null) {
        res.redirect("/login");
        return;
    }
    var obj = {};
    var sql = " SELECT name from rooms where userId = '" + userId + "' ";
    db.query(sql, function (err, result) {
        res.render('manageroom', { data: result });
    });
});

app.get('/joinroom', function (req, res) {
    res.render('joinroom');
});

app.get('/search',function(req,res){
    db.query('SELECT name from rooms where name like "%'+req.query.key+'%"', function(err, rows, fields) {
          if (err) throw err;
        var data=[];
        for(i=0;i<rows.length;i++)
          {
            data.push(rows[i].name);
          }
          res.end(JSON.stringify(data));
        });
    });


app.get('/room', (req, res) => {
    res.render('room.ejs');
});

io.of('/stream').on('connection', stream);

server.listen(3000);