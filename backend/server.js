const app = require("./app")
// const PORT = 4000
//const dotenv = require("dotenv")
const cloudinary = require("cloudinary");
const connectDatabase = require("./config/database")

// Handling Uncaught Exception
process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Uncaught Exception`);
    process.exit(1);
  });

///config
if(process.env.NODE_ENV!="PRODUCTION"){
require("dotenv").config({path:"backend/config/config.env"})
}



//connecting to database

connectDatabase()

cloudinary.config({
  cloud_name:process.env.CLOUDINARY_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
});


const server = app.listen(process.env.PORT,()=>{
    console.log(`Server is working on http://localhost:${process.env.PORT}`)
})

process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Unhandled Promise Rejection`);
  
    server.close(() => {
      process.exit(1);
    });
  });

//  // server.js (Node.js/Express example)

// app.get("/api/v1/stripeapikey", (req, res) => {
//   res.send({ stripeApiKey: pk_test_51N7JpzSGdMLQhQ0pJb7Cu2UTWoumCTE9UyuiHl8RgUrSTW0iSGksFPTR3LV85n4SzuleBFpVk5XldwIOd6mR81pb00H9BG6DhF });
// });
