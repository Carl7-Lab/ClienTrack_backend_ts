import express from 'express';
import dotenv from 'dotenv';
import conectarDB from './config/db';
import userRoutes from './routes/user.routes';
import clientRoutes from './routes/client.routes';
import purchaseRoutes from './routes/purchase.routes';
import paymentRoutes from './routes/payment.routes';

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
app.use('/api/clients', clientRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/payments', paymentRoutes);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`Sever running on the port ${PORT}`);
});
