// Importing Packages
const express = require("express");
const needle = require("needle");

const redis = require("redis");

const PORT = process.env.PORT || 8080
const REDIS_PORT =  6379

// creating redis client
const client = redis.createClient({
    legacyMode: true,
    PORT: REDIS_PORT
  })
  client.connect().catch(console.error)

// initializing express
const app = express();

// function setRepos
function setResponse(username,no_of_repos){
    return `<h2>${username} has ${no_of_repos} github repository</h2`
}

// function to make request to github for data
async function getRepos(req,res,next){
    try {
        // Fetching Data
        console.log('Fetching Data')
        const {username} = req.params;
        const url = `https://api.github.com/users/${username}`
        const response = await needle(url)
        const data = response.body
        
        
        const no_of_repos=data.public_repos;
        
        // set data to redis
        // @Syntax setEx(key,time in seconds,value)
        client.setEx(username,3600,no_of_repos);

        res.send(setResponse(username,no_of_repos));
        // res.status(200).json({"message":"Successfull request",data})

    } catch (err) {
        console.log(err );
        res.status(500);
    }
}

// Cache middleware
function cache(req,res,next){
 const {username}= req.params;
 client.get(username, (err,data)=>{
    if (err) throw err;

    if (data !== null){
        console.log('Retrieved from cache')
        res.send(setResponse(username, data));
    }
    else{
        next();
    }

 })
}

// @route GET /repo/:username
// @desc getting the number of repository. Get data from github
app.get('/repos/:username',cache,getRepos);

// Listening to port 
app.listen(8080, ()=>{
    console.log(`App Listing to ${PORT}` )  
});



