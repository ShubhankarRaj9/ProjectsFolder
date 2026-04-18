const mongoose = require('mongoose');
const dotenv = require("dotenv");
const { logger } = require('../utils/logger');
dotenv.config();

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        logger && logger.info && logger.info('DB connection successful');
    } catch (err) {
        logger && logger.error && logger.error('Connection failed', err);
        process.exit(1);
    }
};

module.exports = dbConnect;
