// require('dotenv').config({path:'./env'})
import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv"
dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log("Server is running"); 
    })
})
.catch((err) =>{
    console.log("Mongo DB connection failed",err);
})































// import express from "express"
// const app = express();

// ;(async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(err)=>{
//             console.log("Error",err)
//             throw err
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log('App is listening to port ')
//         })
//     }catch(err){
//         console.error("ERROR" ,err)
//         throw err
//     }
// })()
