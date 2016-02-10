var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: "users",
  initialize: function(){
    this.on('creating', this.hashPassword);
  },

  hashPassword: function(){
    var cipher = Promise.promisify(bcrypt.hash);
    return cipher(this.get('password'), null, null).bind(this)
      .then(function(hash){
        this.set('password', hash);
      })
  },

  comparePassword: function(password, callback) {
    var hashedPassword = this.get('password');
    bcrypt.compare(password, hashedPassword, function(err, res){
      callback(res);
    });
  }
});

module.exports = User;
