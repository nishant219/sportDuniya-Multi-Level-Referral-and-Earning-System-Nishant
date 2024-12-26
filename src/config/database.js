import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import logger from './logger.js';

const connect=async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('Database connected');
        console.log('Database connected');
    } catch (error) {
        console.log(error, "error");
        logger.error('Database connection failed');
        process.exit(1);
    }
}

export default connect;