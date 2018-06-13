const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')
const { check } = require('express-validator/check');


app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// setup our datastore
var datastore = require("./datastore");
datastore.connect();

/*
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})
*/




app.post("/api/exercise/new-user", (req,res) => {  
  try{
    datastore.addUser(req.body.username)
    .then((result) => {
      res.json(result);
    },error => {
      handleError(error, res);      
    });
  }catch(e){
    handleError(e, res);
  }  
})

app.post("/api/exercise/add",
         [
          check('userId').
            trim().
            custom(value => {
              return datastore.userExists(value).then(exists => {
                if (!exists) throw new Error(`User $(value) doesn't exist`);
              })
            }),
          check('description').
            isLength({min: 5,max:1000}),          
          check('duration').
            isInt(),
          check('date').
            isDate()
          ]
         ,(req,res) => {  
  try{
    datastore.addExercise(req.body)
    .then((result) => {
      res.json(result);
    },error => {
      handleError(error, res);      
    });
  }catch(e){
    handleError(e, res);
  }  
})



// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
  datastore.userExists('javierx')
    .then(result => {
      console.log(result)
    },error => {
      console.error(error)
    })
})

function handleError(err, response) {  
  response.status(500);
  if (err.error.code){
    switch (err.error.code){
      case 11000:
        response.send("username already taken");
        break;
    }
  }
  response.send(
    "<html><head><title>Internal Server Error!</title></head><body><pre>"
    + JSON.stringify(err, null, 2) + "</pre></body></pre>"
  );
}
