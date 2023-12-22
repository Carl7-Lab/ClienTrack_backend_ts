import express from 'express';
import dotenv from 'dotenv';
import conectarDB from './config/db';
import userRoutes from './routes/user.routes';

const app = express();
app.use(express.json());

dotenv.config();

conectarDB()
  .then(() => {
    console.log('The database connection was successful.');
  })
  .catch((error) => {
    console.error(`Error connecting to the database: ${error.message}.`);
  });

// Routing
app.use('/api/users', userRoutes);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`Sever running on the port ${PORT}`);
});
