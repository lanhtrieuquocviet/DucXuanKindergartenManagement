const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 5000;
const SERVER_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'DucXuan Kindergarten Management API',
    version: '1.0.0',
    description:
      'Tài liệu API cho hệ thống quản lý trường mầm non Đức Xuân. Sử dụng JWT Bearer token cho các endpoint yêu cầu đăng nhập.',
  },
  servers: [
    {
      url: SERVER_URL,
      description: 'Server hiện tại',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./server.js', './src/routes/*.js', './src/controller/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

