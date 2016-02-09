var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: "users",
  initilize: function() {
      this.on('create', function(model, attrs, options) {
        bcrypt.hash(this.get('password'), null, null, function(err, hash) {
          //set hashed password to db
          model.set('password', hash);
        });
        //set username to db
        this.set('username', this.get('username'));
      });
      this.on('signIn', function(model, attrs, options) {
        //verify username and password
        var inputPass = bycrypt.hashSync(this.get('password'));
        var inputUser = [this.get('username')];
        db.run("SELECT 'password' FROM users WHERE 'username' = ?", inputUser, function(query) {
          if (inputPass === query) {
            //send user to web site
          } else {
            //ask customer to signup
          }
        });
      });
    }
});
module.exports = User;
