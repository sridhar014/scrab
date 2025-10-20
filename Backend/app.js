require('dotenv').config();
import express, { json } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth';
import orderRoutes from './routes/order';
import adminRoutes from './routes/admin';

const app = express();

app.use(cors());
app.use(json());
app.use('/uploads', express.static('uploads'));

connect(process.env.MONGO_URI)
  .then(() => console.log('DB connected'))
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/admin', adminRoutes);

app.listen(5000, () => console.log('Server running on 5000'));
