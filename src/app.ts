import express from 'express';
import cors from 'cors';
import notFound from './middlewares/notFound.js';
import globalErrorHandler from './middlewares/globalErrorHandler.js';
import router from './routes/index.js';


const app = express();
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

app.get('/', (req, res) => res.send('FixItNow API is running...'));

app.use('/api', router);

app.use(globalErrorHandler);
app.use(notFound);

export default app;