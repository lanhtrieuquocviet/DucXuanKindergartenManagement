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
      url: '/',
      description: 'Server hiện tại (Mặc định)',
    },
    {
      url: SERVER_URL,
      description: 'Server cấu hình (BACKEND_URL)',
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
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          username: { type: 'string' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { type: 'string' },
          avatar: { type: 'string' },
          roles: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Student: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          fullName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['male', 'female', 'other'] },
          phone: { type: 'string' },
          parentPhone: { type: 'string' },
          address: { type: 'string' },
          classId: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          parentId: { type: 'string' },
          avatar: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string' },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
      Blog: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          code: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          images: { type: 'array', items: { type: 'string' } },
          attachmentUrl: { type: 'string' },
          attachmentType: { type: 'string', enum: ['pdf', 'word'] },
          status: { type: 'string', enum: ['draft', 'published', 'inactive'] },
          author: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      BlogCategory: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
      Classes: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          className: { type: 'string' },
          capacity: { type: 'number' },
          gradeId: { type: 'string' },
          academicYearId: { type: 'string' },
          teacherIds: { type: 'array', items: { type: 'string' } },
          maxStudents: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Contact: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          fullName: { type: 'string' },
          address: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
          content: { type: 'string' },
          reply: { type: 'string' },
          repliedAt: { type: 'string', format: 'date-time' },
          repliedBy: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'replied'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DailyMenu: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          menuId: { type: 'string' },
          weekType: { type: 'string', enum: ['odd', 'even'] },
          dayOfWeek: { type: 'string', enum: ['mon', 'tue', 'wed', 'thu', 'fri'] },
          lunchFoods: { type: 'array', items: { type: 'string' } },
          afternoonFoods: { type: 'array', items: { type: 'string' } },
          totalCalories: { type: 'number' },
          totalProtein: { type: 'number' },
          totalFat: { type: 'number' },
          totalCarb: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Document: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          author: { type: 'string' },
          images: { type: 'array', items: { type: 'string' } },
          pdfUrl: { type: 'string' },
          attachmentUrl: { type: 'string' },
          attachmentType: { type: 'string', enum: ['pdf', 'word'] },
          category: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Food: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          calories: { type: 'number' },
          protein: { type: 'number' },
          fat: { type: 'number' },
          carb: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Grade: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          gradeName: { type: 'string' },
          description: { type: 'string' },
          classList: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      MealPhoto: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          date: { type: 'string', format: 'date' },
          meals: { type: 'array', items: { type: 'object' } },
          sampleEntries: { type: 'array', items: { type: 'object' } },
          uploadedBy: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Menu: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          month: { type: 'number' },
          year: { type: 'number' },
          createdBy: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'pending', 'approved', 'active', 'completed', 'rejected'] },
          rejectReason: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PickupRequest: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          student: { type: 'string' },
          parent: { type: 'string' },
          fullName: { type: 'string' },
          relation: { type: 'string' },
          phone: { type: 'string' },
          imageUrl: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          processedBy: { type: 'string' },
          processedAt: { type: 'string', format: 'date-time' },
          rejectedReason: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PublicInfo: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          attachmentUrl: { type: 'string' },
          attachmentType: { type: 'string', enum: ['pdf', 'word'] },
          status: { type: 'string', enum: ['draft', 'published', 'inactive'] },
          author: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Question: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { type: 'string' },
          idNumber: { type: 'string' },
          category: { type: 'string' },
          content: { type: 'string' },
          answers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                authorName: { type: 'string' },
                content: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AcademicYear: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          yearName: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          termCount: { type: 'number' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CurriculumTopic: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          academicYear: { type: 'string' },
          monthQuarter: { type: 'string' },
          topicName: { type: 'string' },
          mainField: { type: 'string' },
          mainObjectives: { type: 'string' },
          featuredActivities: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Timetable: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          academicYear: { type: 'string' },
          gradeId: { type: 'string' },
          sang: { type: 'array', items: { type: 'string' }, minItems: 6, maxItems: 6 },
          chieu: { type: 'array', items: { type: 'string' }, minItems: 6, maxItems: 6 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Role: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          roleName: { type: 'string' },
          description: { type: 'string' },
          permissions: { type: 'array', items: { type: 'string' } },
        },
      },
      Permission: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          code: { type: 'string' },
          description: { type: 'string' },
        },
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

