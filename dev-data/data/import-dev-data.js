const fs = require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Tour = require('../../modules/tourModel')
const Review = require('../../modules/reviewModel');
const User = require('../../modules/userModel')

dotenv.config({path:'./.env'})


const DB=process.env.DATABASE_URL.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
mongoose.connect(DB,{
}).then(console.log('db connected successfully'));

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// import data into DB

const importData = async()=>{
    try {
        await Tour.create(tours);
        await User.create(users,{ validateBeforeSave: false });
        await Review.create(reviews);
        console.log("data successfully loaded")
       
    } catch (error) {
        console.log(error)
    } 
    process.exit();
}


//delete all data from collection DB

const deleteData = async() =>{
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log("data successfully deleted")
        process.exit();
    } catch (error) {
        console.log(error)
    }
    
}



if(process.argv[2]==='--import') {
    importData()
}else if (process.argv[2]==='--delete'){
    deleteData()
}
  
// console.log(process.argv)

//COMMAND FOR IMPORT OR DELETE DATA=> node dev-data/data/import-dev-data.js --import