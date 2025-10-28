const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const morgan = require('morgan');
const cors = require('cors');

const connection = require('./config/database');
connection();


const authRoute = require('./routes/authRoute');
const complaintRoute = require('./routes/complaintRoute');
const userRoute = require('./routes/userRoute');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

app.use(express.json());
// Allow cross-origin requests from development origins dynamically.
// Using origin: true will reflect the request origin, which is convenient for local dev
// while keeping credentials allowed. In production, replace with a fixed origin list.
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

app.use(express.static('../'));
app.get('/', (req, res) => {
    res.redirect('/login.html');
});
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/auth', authRoute);
app.use('/api/complaints', complaintRoute);
app.use('/api/users', userRoute);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend connection successful', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

app.use(notFound);
app.use(errorHandler);
