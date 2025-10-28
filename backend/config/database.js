const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("DB connection successful");
    } catch (err) {
        console.error("Connection failed");
        console.error(err);
        process.exit(1);
    }
};

module.exports = dbConnect;
