import express from 'express';
import { Router } from 'express';

// Middlewares
import sessionStore from './middlewares/sessionStore';
import redirect404s from './middlewares/404Redirects';
import passport from './config/passport';

// Routes
import cartRouter from './routes/cartRouter';
import contactRouter from './routes/contactRouter';
import authRouter from './routes/authRouter';
import shippingRouter from './routes/shippingRouter';
import dbRouter from './routes/dbRouter';
import orderRouter from './routes/orderRouter';
import stripeRouter from './routes/stripeRouter';

const app = express();

app.use('/api', stripeRouter);

const api = Router();

app.use('/api', api);

api
    .use(sessionStore())
    .use(passport.initialize())
    .use(passport.session())
    .use(express.json());
    
api.use('/', authRouter);
api.use('/', contactRouter);
api.use('/', cartRouter);
api.use('/', shippingRouter);
api.use('/', dbRouter);
api.use('/', orderRouter);

app.use(redirect404s);

export default app;