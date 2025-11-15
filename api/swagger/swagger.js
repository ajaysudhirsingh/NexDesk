const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NEXDESK API',
      version: '1.0.0',
      description: 'Enterprise IT Infrastructure Management Platform API',
      contact: {
        name: 'NEXDESK Support',
        email: 'support@nexdesk.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:8001',
        description: 'Development server'
      },
      {
        url: 'https://api.nexdesk.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'role'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier'
            },
            username: {
              type: 'string',
              description: 'Username for login'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'superadmin'],
              description: 'User role'
            },
            client_id: {
              type: 'string',
              description: 'Client organization ID'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            }
          }
        },
        Ticket: {
          type: 'object',
          required: ['title', 'description', 'priority'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique ticket identifier'
            },
            title: {
              type: 'string',
              description: 'Ticket title'
            },
            description: {
              type: 'string',
              description: 'Ticket description'
            },
            status: {
              type: 'string',
              enum: ['open', 'in_progress', 'closed'],
              description: 'Ticket status'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Ticket priority'
            },
            category: {
              type: 'string',
              description: 'Ticket category'
            },
            assigned_to: {
              type: 'string',
              description: 'Assigned user ID'
            },
            created_by: {
              type: 'string',
              description: 'Creator user ID'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            closed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Closure timestamp'
            }
          }
        },
        Asset: {
          type: 'object',
          required: ['name', 'asset_type'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique asset identifier'
            },
            name: {
              type: 'string',
              description: 'Asset name'
            },
            asset_type: {
              type: 'string',
              description: 'Type of asset'
            },
            description: {
              type: 'string',
              description: 'Asset description'
            },
            serial_number: {
              type: 'string',
              description: 'Asset serial number'
            },
            purchase_date: {
              type: 'string',
              format: 'date',
              description: 'Purchase date'
            },
            purchase_cost: {
              type: 'number',
              description: 'Purchase cost'
            },
            assigned_to: {
              type: 'string',
              description: 'Assigned user ID'
            },
            status: {
              type: 'string',
              enum: ['available', 'assigned', 'maintenance', 'retired'],
              description: 'Asset status'
            }
          }
        },
        Client: {
          type: 'object',
          required: ['name', 'code'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique client identifier'
            },
            name: {
              type: 'string',
              description: 'Client organization name'
            },
            code: {
              type: 'string',
              description: 'Unique client code'
            },
            contact_email: {
              type: 'string',
              format: 'email',
              description: 'Contact email'
            },
            contact_phone: {
              type: 'string',
              description: 'Contact phone number'
            },
            address: {
              type: 'string',
              description: 'Client address'
            },
            user_limit: {
              type: 'integer',
              description: 'Maximum number of users'
            },
            asset_limit: {
              type: 'integer',
              description: 'Maximum number of assets'
            },
            is_active: {
              type: 'boolean',
              description: 'Client active status'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            detail: {
              type: 'string',
              description: 'Error message'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password', 'client_code'],
          properties: {
            username: {
              type: 'string',
              description: 'Username'
            },
            password: {
              type: 'string',
              description: 'Password'
            },
            client_code: {
              type: 'string',
              description: 'Client organization code'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              description: 'JWT access token'
            },
            token_type: {
              type: 'string',
              description: 'Token type (Bearer)'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './swagger/paths/*.js']
};

const specs = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  // Serve swagger docs only in development
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'NEXDESK API Documentation'
    }));

    // JSON endpoint for the spec
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });
  }
};

module.exports = { swaggerSetup, specs };