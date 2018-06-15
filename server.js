const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')
const { check, validationResult } = require('express-validator/check');


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

app.post("/api/exercise/new-user",(req,res) => {  
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
              return datastore.userIdExists(value).then(exists => {                
                if (!exists) throw new Error(`User doesn't exist`);
              })
            }),
          check('description').
            isLength({min: 5,max:1000}),          
          check('duration').
            isInt(),
          check('date').
            custom(value => {
              return (checkDate(value)).then(isValid => {
                if (!isValid) throw new Error(`Date is not correct`)
              }) ;
            })
          ]
         ,(req,res) => {  
            const errors = validationResult(req);
            if (!errors.isEmpty()){
              return res.status(422).json({ errors: errors.mapped() });
            }
            try{
              datastore.addExercise(req.body)
              .then((result) => {
                let exerciseJson = {
                  "userId"      : result.userId,
                  "description" : result.description,
                  "duration"    : result.duration,
                  "date"        : result.dateCreated                  
                };
                res.json(exerciseJson);
              },error => {
                handleError(error, res);      
              });
            }catch(e){
              handleError(e, res);
            }  
          }
)



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

app.get("/api/exercise/log",(req,res) => {  
  try{
    datastore.getUserExercises(req).then(docs => {
      res.json(docs);
    },error => {
      handleError(error, res);
    })        
  }catch(e){
    handleError(e, res);
  }      
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

function handleError(err, response) {  
  response.status(500);  
  response.send(
    "<html><head><title>Internal Server Error!</title></head><body><pre>"
    + JSON.stringify(err, null, 2) + "</pre></body></pre>"
  );
}

function checkDate(date){
  return new Promise((resolve,reject) => {
    try{
      resolve(Date.parse(date).isNaN ? false : true);      
    }catch(e){
      reject(false);
    }
  })
}
