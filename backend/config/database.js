const mongoose = require("mongoose")
const dotenv = require("dotenv")

dotenv.config({path:"backend/config/config.env"})
// const DB_URI="mongodb://127.0.0.1:27017/Ecommerce"

const connectDatabase = () => {
    mongoose.connect(process.env.DB_URI,{useNewUrlParser:true,useUnifiedTopology:true}).then(
        (data)=>{
            console.log(`Mongodb connected with server ${data.connection.host}`)
        });
}

module.exports = connectDatabase
