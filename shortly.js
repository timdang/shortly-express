var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'javascript', //verify cookie was created by our site
  resave: false,
  saveUninitialized: true
}));

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.get('/', authentication,
  function(req, res) {
    res.render('index');
  });

app.get('/create',
  function(req, res) {
    res.render('index');
  });

app.get('/logout',
  function(req, res) {
    req.session.destroy();
    res.redirect('/login');
  });

app.get('/links',
  function(req, res) {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  });

app.post('/links',
  function(req, res) {
    var uri = req.body.url;

    if (!util.isValidUrl(uri)) {
      console.log('Not a valid url: ', uri);
      return res.send(404);
    }

    new Link({
      url: uri
    }).fetch().then(function(found) {
      if (found) {
        res.send(200, found.attributes);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.send(404);
          }

          var link = new Link({
            url: uri,
            title: title,
            base_url: req.headers.origin
          });

          link.save().then(function(newLink) {
            Links.add(newLink);
            res.send(200, newLink);
          });
        });
      }
    });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/
function authentication(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

function createSession(req, res, newUser) {
  return req.session.regenerate(function() {
    req.session.user = newUser;
    res.redirect('/');
  });

}

app.post('/login', function(req, res) {

  var username = req.body.username;
  var password = req.body.password;
  var user = new User({
    username: username
  });

  user.fetch().then(function(dbUser) {
    if (!dbUser) {
      console.log('User exists, going to login page.');
      res.redirect('/login');
    } else {
      user.comparePassword(password, function(match) {
        if (match) {
          console.log('password matches, creating session');
          createSession(req, res, user);
        } else {
          console.log('password is incorrect, try again');
          res.redirect('/login');
        }
      });
    }
  });
});

app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var user = new User({
    username: username
  });

  user.fetch().then(function(dbUser) {
    if (!dbUser) {
      var newUser = new User({
        username: username,
        password: password
      });
      newUser.save().then(function(saveUser) {
        createSession(req, res, saveUser);
        //add user to db
      });
    } else {
      console.log('error with signup, sign up again');
      res.redirect('/signup');
    }
  });
});



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({
    code: req.params[0]
  }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
