var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: "users",
  initialize: function(){
    this.on('creating', this.hashPassword);
  },

  // hashPassword: function(password) {
  //   var promise = new Promise(function(resolve, reject) {
  //     bcrypt.hash(password, null, null, function(err, hash) {
  //       if (err) {
  //         reject(err);
  //       }
  //       resolve(model.set('password', hash));
  //     });
  //   });
  //   return promise;
  // },
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
