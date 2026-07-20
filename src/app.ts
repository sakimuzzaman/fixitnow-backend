import express from 'express';
import cors from 'cors';
import notFound from './middlewares/notFound.js';
import { AuthRoutes } from './modules/auth/auth.route.js';
import globalErrorHandler from './middlewares/globalErrorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('FixItNow API is running...'));

app.use('/api/auth', AuthRoutes);

app.use(globalErrorHandler);
app.use(notFound);

export default app;