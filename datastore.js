"use strict";
//const { check } = require('express-validator/check');
const mongoose = require('mongoose');
var shortid = require('shortid');

var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
                useMongoClient: true,
                replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } };  


var MONGODB_URI = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.DB_PORT+'/'+process.env.DB;


var userSchema = mongoose.Schema({      
  userId: {type: String, required: true, unique: true},
  name: {type: String, required: true, unique: true},
  createdAt: Date
})

const User = mongoose.model('User',userSchema);  

var exerciseSchema = mongoose.Schema({
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  dateCreated: {type: Date, required: true}
})

const Exercise = mongoose.model('Exercise',exerciseSchema);

function connect(){
  return new Promise((resolve,reject) => {
    try{
      mongoose.connect(MONGODB_URI,options);
    }catch(e){
      reject(new DataStoreUnknowException("connect",null,e))
    }
  })
}

function addUser(userName){
  return new Promise((resolve,reject) => {
    try{
          
      let user = new User({userId: shortid.generate(),
                           name: userName,
                           createdAt: Date.now()
                          })
      
      user.save((error, result) => {
        if (error) reject (new DataStoreUnknowException("insert",userName,error))
        resolve(result);
      })
    }catch(e){
      reject(new DataStoreUnknowException("insert",userName,e));
    }
  })
}

function userExists(userName){
  return new Promise((resolve, reject)=>{
    try{      
      User.find({name: userName})
          .exec((error,result) => {
            //if (error) reject(new DataStoreFieldValidationException("not user",userName,error));
             if (error) reject(error);
            resolve(result.length > 0 ? true : false);
      })
    }catch(e){
      reject(new DataStoreFieldValidationException("user",userName,e));
    }
  })
}

function addExercise(request){
  return new Promise((resolve, reject)=>{
    try{
      let exercise = new Exercise({userId     : request.userId,
                                  description : request.description,
                                  duration    : request.duration,
                                  date        : request.date})
      exercise.save((error,result) => {
        if (error) reject(new DataStoreUnknowException("insert",request,error))
        resolve(result);
      })
    }catch(e){
      reject(new DataStoreUnknowException("insert",request,e));
    }
  })
}



// Exception objects

function DataStoreUnknowException (method,args,error) {
  this.type = this.constructor.name;
  this.description = 'Error happening during operation: ' + method;
  this.method = method;
  this.args = args;
  this.error = error;
}

function DataStoreFieldValidationException(field, error) {
  this.type = this.constructor.name;
  this.description = 'Error during proccesing field: ' + field;  
  this.error = error;
}

const syncDatastore = {
  addUser: addUser,
  connect: connect
}

module.exports = {
  connect,
  addUser,
  addExercise,
  userExists
}