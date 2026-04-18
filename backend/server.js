const express = require('express');
const path = require("path");
const app = express();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 8000;
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const promClient = require('prom-client');
const { logger, expressLogger } = require('./utils/logger');

const connection = require('./config/database');
connection();


const authRoute = require('./routes/authRoute');
const complaintRoute = require('./routes/complaintRoute');
const userRoute = require('./routes/userRoute');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

app.use(express.json());
app.use(cookieParser());
app.use(expressLogger);

// Security middlewares
// Configure Helmet CSP to allow required CDN sources (bootstrap map requests in dev).
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      // Allow inline event handlers in non-production for easier development.
      // Inline event handlers (onclick etc.) are controlled by the
      // `script-src-attr` directive; Helmet defaults it to 'none'.
      // We enable 'unsafe-inline' during development to avoid CSP blocks.
      ...(NODE_ENV !== 'production' ? { "script-src-attr": ["'unsafe-inline'"] } : {}),
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
}));
// express-mongo-sanitize attempts to reassign `req.query` which can be
// a getter-only property in newer Node versions. Sanitize in-place only
// for mutable request containers to avoid "Cannot set property query" errors.
app.use((req, res, next) => {
  try {
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.params) mongoSanitize.sanitize(req.params);
    // skip sanitizing req.query and req.headers to avoid mutating getter-only props
  } catch (err) {
    logger && logger.warn('Safe mongoSanitize failed', err);
  }
  next();
});
// Basic XSS protection: sanitize strings in-place for mutable containers only.
function escapeString(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function sanitizeStrings(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    if (typeof v === 'string') obj[k] = escapeString(v);
    else if (Array.isArray(v)) obj[k] = v.map((i) => (typeof i === 'string' ? escapeString(i) : i));
    else if (typeof v === 'object' && v !== null) sanitizeStrings(v);
  });
}

app.use((req, res, next) => {
  try {
    if (req.body) sanitizeStrings(req.body);
    if (req.params) sanitizeStrings(req.params);
    // intentionally skip req.query and req.headers to avoid getter-only mutations
  } catch (err) {
    logger && logger.warn('Safe XSS sanitize failed', err);
  }
  next();
});

// Rate limiting: general
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', apiLimiter);

// Rate limiting: stricter on auth endpoints to mitigate brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later.'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS configuration: in production set CORS_ORIGIN to a comma-separated list
const corsOptions = {
  origin: NODE_ENV === 'production' && process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};
app.use(cors(corsOptions));
// app.options handled by `app.use(cors(...))` above — avoid using a '*' pattern
// that triggers path-to-regexp errors in this environment.

app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/', (req, res, next) => {
  const filePath = path.join(__dirname, '../frontend/logInPage/login.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      logger && logger.error('sendFile error serving /', err);
      return next(err);
    }
  });
});
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/auth', authRoute);
app.use('/api/complaints', complaintRoute);
app.use('/api/users', userRoute);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend connection successful', timestamp: new Date().toISOString() });
});

// Prometheus default metrics
try {
  promClient.collectDefaultMetrics();
} catch (err) {
  logger && logger.warn('Prom-client metrics collection failed', err);
}

// Health and readiness endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (err) {
    logger && logger.error('Metrics endpoint error', err);
    res.status(500).end();
  }
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
});

app.use(notFound);
app.use(errorHandler);
