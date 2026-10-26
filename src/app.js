const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const { generalLimiter } = require('./middlewares/rateLimiter.middleware');
const ApiError = require('./utils/apiError');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false // Allows swagger-ui CDN scripts to render smoothly
  })
);

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// HTTP request logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Request rate limiting
app.use('/api', generalLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger OpenAPI Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Openfolio API Docs',
  customCss: '.swagger-ui .topbar { display: none }'
}));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Openfolio API',
    description: 'A multi-author publication platform backend',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/v1/health',
      articles: '/api/v1/articles',
      featured: '/api/v1/articles/featured',
      trending: '/api/v1/articles/trending',
      personalizedFeed: '/api/v1/feed/personalized',
      adminDashboard: '/api/v1/admin/dashboard'
    }
  });
});

// Mount V1 API Routes
app.use('/api/v1', routes);

// Handle unknown route 404
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find ${req.method} ${req.originalUrl} on this server`));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
