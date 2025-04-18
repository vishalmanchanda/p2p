require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const path = require('path');

// Import model check utility
const { checkModelOrExit } = require('./utils/modelCheck');

// Import routes
const codeRoutes = require('./routes/code.routes');
const validationRoutes = require('./routes/validation.routes');
const researchRoutes = require('./routes/research.routes');
const summarizeRoutes = require('./routes/summarize.routes');
const insightsRoutes = require('./routes/insights.routes');
const svgRoutes = require('./routes/svg.routes');
const prototypeRoutes = require('./routes/prototype.routes');
const prototypeBuilderRoutes = require('./routes/prototype-builder.routes');
const jdlRoutes = require('./routes/jdl.routes');
const genProjectRoutes = require('./routes/gen-project.routes');
const requirementsRoutes = require('./routes/requirements.routes');




// Import error handler
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
// Force port to 3005 to avoid conflicts
const PORT = 3005;
console.log(`Configured server to use port ${PORT}`);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "localhost:*", "127.0.0.1:*"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "cdn.jsdelivr.net"]
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files from the public directory
app.use('/public', express.static(path.join(process.cwd(), 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Serve wizard UI
app.get('/wizard', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'wizard', 'index.html'));
});

// Serve requirements wizard UI
app.get('/requirements', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'requirements', 'index.html'));
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: ' Express API Documentation',
}));

// Routes
app.use('/api/generate/code', codeRoutes);
app.use('/api/validate/content', validationRoutes);
app.use('/api/research/topic', researchRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/derive/insights', insightsRoutes);
app.use('/api/generate/svg', svgRoutes);
app.use('/api/generate/prototype', prototypeRoutes);
app.use('/api/generate/prototype-builder', prototypeBuilderRoutes);
app.use('/api/generate/jdl', jdlRoutes);
app.use('/api/generate/project', genProjectRoutes);
app.use('/api/generate/requirements', requirementsRoutes);





// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check API health
 *     description: Returns the health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Redirect root to API docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Error handling middleware
app.use(errorHandler);

// Start the server after checking if the model is running
async function startServer() {
  try {
    // Check if the local  model is running
    await checkModelOrExit();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      console.log(`Using  model: ${process.env.DEEPSEEK_MODEL}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // In production, you might want to exit the process
  // process.exit(1);
});

module.exports = app; 