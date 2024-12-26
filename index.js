import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import connect from './src/config/database.js';
import logger from './src/config/logger.js';

import routes from './src/routes/index.js';

const app = express();

app.use(cors());
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });

app.use(limiter);

app.use('/api', routes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      status: 'error',
      message: err.message || 'Something went wrong!'
    });
});

  app.all('*', (req, res, next) => {
    res.status(404).json({
      status: 'error',
      message: `Can't find ${req.originalUrl} on this server!`
    });
});  

// import userRoutes from './src/routes/userRoutes.js';
// import authRoutes from './src/routes/authRoutes.js';
// app.use('/api/v1/users', userRoutes);


const startServer= async()=>{
    try{
        await connect();
        const PORT=process.env.PORT || 3000;
        app.listen(PORT,()=>{
            logger.info(`Server is running on port ${PORT}💥 `);
        });
        console.log(`Server is running on port ${PORT}💥 `);
    }catch(error){
        logger.error(`Error in startServer:`, error?.message);
        process.exit(1);
    }
}  

startServer();

export default app;