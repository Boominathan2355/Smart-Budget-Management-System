# Backend Architecture: Smart Budget Management System

## Overview

The backend follows a microservices architecture pattern built with Node.js and Express.js, designed to handle 5000+ concurrent users with 99.9% uptime SLA.

## Service Architecture

### 1. API Gateway
**Port**: 3000  
**Responsibilities**:
- Request routing and load balancing
- Rate limiting and DDoS protection
- Authentication middleware
- Request/response logging
- CORS handling

```typescript
// api-gateway/src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/auth';
import { loggingMiddleware } from './middleware/logging';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(loggingMiddleware);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/budget', authMiddleware, budgetRoutes);
app.use('/api/v1/documents', authMiddleware, documentRoutes);
app.use('/api/v1/analytics', authMiddleware, analyticsRoutes);
app.use('/api/v1/notifications', authMiddleware, notificationRoutes);
```

### 2. User Service
**Port**: 3001  
**Database**: PostgreSQL users table  
**Cache**: Redis for sessions

```typescript
// user-service/src/controllers/AuthController.ts
export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, deviceId, platform } = req.body;
      
      // Validate input
      const validation = loginSchema.validate(req.body);
      if (validation.error) {
        throw new ValidationError(validation.error.details[0].message);
      }

      // Rate limiting check
      const loginAttempts = await redis.get(`login_attempts:${email}`);
      if (loginAttempts && parseInt(loginAttempts) >= 5) {
        throw new TooManyRequestsError('Too many login attempts');
      }

      // Authenticate user
      const user = await userService.authenticate(email, password);
      if (!user) {
        await redis.incr(`login_attempts:${email}`);
        await redis.expire(`login_attempts:${email}`, 900); // 15 minutes
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate tokens
      const { accessToken, refreshToken } = await tokenService.generateTokens(user);
      
      // Create session
      await sessionService.createSession({
        userId: user.id,
        refreshToken,
        deviceId,
        platform,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Clear login attempts
      await redis.del(`login_attempts:${email}`);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            department: user.department,
            permissions: user.permissions
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      // Validate refresh token
      const session = await sessionService.validateRefreshToken(refreshToken);
      if (!session) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Generate new access token
      const newAccessToken = await tokenService.generateAccessToken(session.user);
      
      res.json({
        success: true,
        data: {
          accessToken: newAccessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### 3. Budget Service
**Port**: 3002  
**Database**: PostgreSQL budget_requests, approval_workflow tables  
**Queue**: Bull Queue for async processing

```typescript
// budget-service/src/controllers/BudgetController.ts
export class BudgetController {
  async createRequest(req: Request, res: Response): Promise<void> {
    const transaction = await db.transaction();
    
    try {
      const userId = req.user.id;
      const requestData = req.body;
      
      // Validate budget availability
      const budgetCheck = await budgetService.checkBudgetAvailability(
        requestData.departmentId,
        requestData.category,
        requestData.amount
      );
      
      if (!budgetCheck.available) {
        throw new BadRequestError('Insufficient budget allocation');
      }

      // Create budget request
      const request = await budgetService.createRequest({
        ...requestData,
        requesterId: userId,
        status: 'pending'
      }, transaction);

      // Setup approval workflow
      const approvalWorkflow = await approvalService.initializeWorkflow(
        request,
        transaction
      );

      // AI processing for risk assessment
      await aiService.queueRiskAssessment(request.id);
      
      // Send notifications
      await notificationService.notifyApprovers(request.id, approvalWorkflow[0]);

      await transaction.commit();

      res.status(201).json({
        success: true,
        data: {
          id: request.id,
          requestNumber: request.requestNumber,
          status: request.status,
          nextApprover: approvalWorkflow[0].approver,
          estimatedApprovalTime: approvalWorkflow[0].estimatedTime
        }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async approveRequest(req: Request, res: Response): Promise<void> {
    const transaction = await db.transaction();
    
    try {
      const { id } = req.params;
      const { comments, approvedAmount, conditions } = req.body;
      const approverId = req.user.id;

      // Validate approval authority
      const canApprove = await approvalService.canUserApprove(id, approverId);
      if (!canApprove) {
        throw new ForbiddenError('Insufficient approval authority');
      }

      // Process approval
      const approvalResult = await approvalService.processApproval({
        requestId: id,
        approverId,
        comments,
        approvedAmount,
        conditions
      }, transaction);

      // Update request status
      await budgetService.updateRequestStatus(
        id,
        approvalResult.newStatus,
        transaction
      );

      // Send notifications
      if (approvalResult.nextApprover) {
        await notificationService.notifyNextApprover(id, approvalResult.nextApprover);
      } else {
        await notificationService.notifyRequestor(id, 'approved');
      }

      await transaction.commit();

      res.json({
        success: true,
        data: {
          status: approvalResult.newStatus,
          nextApprover: approvalResult.nextApprover
        }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
```

### 4. Document Service
**Port**: 3003  
**Storage**: AWS S3 with CloudFront CDN  
**AI**: TensorFlow.js for OCR processing

```typescript
// document-service/src/controllers/DocumentController.ts
export class DocumentController {
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      const { requestId, documentType } = req.body;
      const uploaderId = req.user.id;

      // Validate file
      const validation = await fileValidator.validate(file);
      if (!validation.isValid) {
        throw new BadRequestError(validation.errors.join(', '));
      }

      // Virus scan
      const scanResult = await virusScanner.scanFile(file.buffer);
      if (!scanResult.clean) {
        throw new BadRequestError('File contains malicious content');
      }

      // Upload to S3
      const uploadResult = await s3Service.uploadFile({
        buffer: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype,
        folder: `requests/${requestId}`
      });

      // Save to database
      const document = await documentService.createDocument({
        requestId,
        filename: uploadResult.filename,
        originalFilename: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storagePath: uploadResult.path,
        uploadedBy: uploaderId,
        documentType,
        virusScanStatus: 'clean'
      });

      // Queue OCR processing for images/PDFs
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        await ocrQueue.add('process-ocr', {
          documentId: document.id,
          filePath: uploadResult.path
        });
      }

      res.status(201).json({
        success: true,
        data: {
          id: document.id,
          filename: document.filename,
          size: document.fileSize,
          url: uploadResult.publicUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async processOCR(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const document = await documentService.getDocument(id);
      if (!document) {
        throw new NotFoundError('Document not found');
      }

      // Download file from S3
      const fileBuffer = await s3Service.downloadFile(document.storagePath);
      
      // Process with OCR
      const ocrResult = await ocrService.extractText(fileBuffer, document.mimeType);
      
      // Extract structured data
      const structuredData = await aiService.extractStructuredData(ocrResult.text);
      
      // Update document with OCR results
      await documentService.updateOCRResults(id, {
        ocrText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        extractedData: structuredData,
        ocrProcessed: true
      });

      res.json({
        success: true,
        data: {
          extractedText: ocrResult.text,
          structuredData,
          confidence: ocrResult.confidence
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### 5. Notification Service
**Port**: 3004  
**Push Notifications**: Firebase Cloud Messaging  
**Email**: SendGrid for email notifications

```typescript
// notification-service/src/services/NotificationService.ts
export class NotificationService {
  async sendPushNotification(
    userId: string, 
    notification: NotificationPayload
  ): Promise<void> {
    try {
      // Get user's device tokens
      const deviceTokens = await this.getUserDeviceTokens(userId);
      
      if (deviceTokens.length === 0) {
        logger.warn(`No device tokens found for user ${userId}`);
        return;
      }

      // Prepare FCM message
      const message = {
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          type: notification.type,
          requestId: notification.data?.requestId || '',
          amount: notification.data?.amount?.toString() || '',
        },
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'budget_notifications',
            priority: 'high' as const,
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.message,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
        tokens: deviceTokens,
      };

      // Send notification
      const response = await fcm.sendMulticast(message);
      
      // Handle failures
      if (response.failureCount > 0) {
        await this.handleFailedTokens(response.responses, deviceTokens, userId);
      }

      // Update notification status
      await this.updateNotificationStatus(notification.id, 'sent');
      
      logger.info(`Push notification sent to ${response.successCount} devices for user ${userId}`);
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      await this.updateNotificationStatus(notification.id, 'failed');
    }
  }

  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const notification = await notificationRepository.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      priority: data.priority || 'normal',
    });

    // Queue for immediate delivery
    await notificationQueue.add('send-push', {
      notificationId: notification.id,
      userId: data.userId,
    });

    // Queue email if high priority
    if (data.priority === 'urgent' || data.priority === 'high') {
      await emailQueue.add('send-email', {
        notificationId: notification.id,
        userId: data.userId,
      });
    }

    return notification;
  }
}
```

### 6. Analytics Service
**Port**: 3005  
**Database**: PostgreSQL with materialized views  
**Caching**: Redis for frequently accessed reports

```typescript
// analytics-service/src/controllers/AnalyticsController.ts
export class AnalyticsController {
  async getDashboardAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const departmentId = req.user.departmentId;

      // Get cached analytics or compute fresh
      const cacheKey = `dashboard:${userRole}:${departmentId}:${userId}`;
      let analytics = await redis.get(cacheKey);

      if (!analytics) {
        analytics = await analyticsService.computeDashboardAnalytics({
          userId,
          userRole,
          departmentId
        });
        
        // Cache for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(analytics));
      } else {
        analytics = JSON.parse(analytics);
      }

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { reportType, format, startDate, endDate, departments } = req.query;
      const userId = req.user.id;

      // Validate report parameters
      const validation = reportSchema.validate(req.query);
      if (validation.error) {
        throw new ValidationError(validation.error.details[0].message);
      }

      // Check user permissions for report generation
      const canGenerate = await permissionService.canGenerateReport(
        userId, 
        reportType as string, 
        departments as string[]
      );
      
      if (!canGenerate) {
        throw new ForbiddenError('Insufficient permissions for this report');
      }

      // Queue report generation
      const job = await reportQueue.add('generate-report', {
        userId,
        reportType,
        format,
        startDate,
        endDate,
        departments: departments ? (departments as string).split(',') : undefined
      });

      res.json({
        success: true,
        data: {
          jobId: job.id,
          estimatedCompletionTime: '2-5 minutes',
          status: 'queued'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
```

## Background Job Processing

### 1. Queue Configuration
```typescript
// shared/src/queues/index.ts
import Queue from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const ocrQueue = new Queue('OCR Processing', {
  redis: {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const emailQueue = new Queue('Email Notifications', {
  redis: {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
  },
});

export const reportQueue = new Queue('Report Generation', {
  redis: {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
  },
});
```

### 2. OCR Processing Worker
```typescript
// document-service/src/workers/ocrWorker.ts
import { Job } from 'bull';
import Tesseract from 'tesseract.js';
import { ocrQueue } from '../queues';

interface OCRJobData {
  documentId: string;
  filePath: string;
}

ocrQueue.process('process-ocr', 3, async (job: Job<OCRJobData>) => {
  const { documentId, filePath } = job.data;
  
  try {
    job.progress(10);
    
    // Download file from S3
    const fileBuffer = await s3Service.downloadFile(filePath);
    
    job.progress(30);
    
    // Process with Tesseract OCR
    const { data: { text, confidence } } = await Tesseract.recognize(
      fileBuffer,
      'eng+hin', // English and Hindi support
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            job.progress(30 + (m.progress * 0.6));
          }
        }
      }
    );
    
    job.progress(90);
    
    // Extract structured data using AI
    const structuredData = await aiService.extractBudgetData(text);
    
    // Update document with OCR results
    await documentService.updateOCRResults(documentId, {
      ocrText: text,
      ocrConfidence: confidence / 100,
      extractedData: structuredData,
      ocrProcessed: true
    });
    
    job.progress(100);
    
    logger.info(`OCR processing completed for document ${documentId}`);
    
    return {
      documentId,
      extractedText: text,
      confidence: confidence / 100,
      structuredData
    };
  } catch (error) {
    logger.error(`OCR processing failed for document ${documentId}:`, error);
    throw error;
  }
});
```

## AI Services Integration

### 1. Duplicate Detection Service
```typescript
// ai-service/src/services/DuplicateDetectionService.ts
export class DuplicateDetectionService {
  async detectDuplicates(request: BudgetRequest): Promise<DuplicateAnalysis> {
    try {
      // Get recent requests from same department
      const recentRequests = await budgetService.getRecentRequests(
        request.departmentId,
        30 // Last 30 days
      );

      const similarities: SimilarityScore[] = [];

      for (const existingRequest of recentRequests) {
        // Calculate similarity scores
        const titleSimilarity = this.calculateStringSimilarity(
          request.title,
          existingRequest.title
        );
        
        const descriptionSimilarity = this.calculateStringSimilarity(
          request.description,
          existingRequest.description
        );
        
        const amountSimilarity = this.calculateAmountSimilarity(
          request.amount,
          existingRequest.amount
        );

        const overallSimilarity = (
          titleSimilarity * 0.4 +
          descriptionSimilarity * 0.4 +
          amountSimilarity * 0.2
        );

        if (overallSimilarity > 0.8) {
          similarities.push({
            requestId: existingRequest.id,
            similarity: overallSimilarity,
            factors: {
              title: titleSimilarity,
              description: descriptionSimilarity,
              amount: amountSimilarity
            }
          });
        }
      }

      return {
        isDuplicate: similarities.length > 0,
        confidence: Math.max(...similarities.map(s => s.similarity), 0),
        similarRequests: similarities.sort((a, b) => b.similarity - a.similarity)
      };
    } catch (error) {
      logger.error('Duplicate detection failed:', error);
      throw error;
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Implementation using Levenshtein distance or cosine similarity
    // For production, consider using libraries like natural or ml-matrix
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return (maxLength - distance) / maxLength;
  }

  private calculateAmountSimilarity(amount1: number, amount2: number): number {
    const difference = Math.abs(amount1 - amount2);
    const average = (amount1 + amount2) / 2;
    return Math.max(0, 1 - (difference / average));
  }
}
```

### 2. Budget Prediction Service
```typescript
// ai-service/src/services/BudgetPredictionService.ts
export class BudgetPredictionService {
  async predictBudgetUtilization(
    departmentId: string, 
    category: string, 
    months: number = 6
  ): Promise<PredictionResult> {
    try {
      // Get historical data
      const historicalData = await analyticsService.getHistoricalSpending(
        departmentId,
        category,
        24 // Last 24 months
      );

      // Prepare data for ML model
      const features = this.prepareFeatures(historicalData);
      
      // Load or train model
      const model = await this.loadPredictionModel(category);
      
      // Make predictions
      const predictions = await model.predict(features, months);
      
      // Calculate confidence intervals
      const confidence = this.calculateConfidenceIntervals(predictions, historicalData);
      
      return {
        predictions,
        confidence,
        recommendations: this.generateRecommendations(predictions, historicalData),
        factors: this.identifyKeyFactors(features, predictions)
      };
    } catch (error) {
      logger.error('Budget prediction failed:', error);
      throw error;
    }
  }

  private async loadPredictionModel(category: string): Promise<any> {
    // Load pre-trained TensorFlow.js model
    // Models are trained offline and loaded here
    const modelPath = `models/budget-prediction-${category}.json`;
    return await tf.loadLayersModel(modelPath);
  }
}
```

## Middleware Implementation

### 1. Authentication Middleware
```typescript
// shared/src/middleware/auth.ts
export const authMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer: 'smart-budget-system',
      audience: 'mobile-app'
    }) as JWTPayload;

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // Get user details
    const user = await userService.getUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account is inactive');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      permissions: user.permissions
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token'
        }
      });
    }
    next(error);
  }
};
```

### 2. Permission Middleware
```typescript
// shared/src/middleware/permissions.ts
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Permission '${permission}' required`
        }
      });
    }

    next();
  };
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: `Role must be one of: ${roles.join(', ')}`
        }
      });
    }

    next();
  };
};
```

## Database Connection and Optimization

### 1. Connection Pool Configuration
```typescript
// shared/src/database/connection.ts
import { Pool } from 'pg';

export const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Connection pool settings
  min: 5,
  max: 20,
  acquireTimeoutMillis: 60000,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  
  // Performance settings
  statement_timeout: 30000,
  query_timeout: 30000,
  
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Connection monitoring
dbPool.on('connect', () => {
  logger.info('Database connection established');
});

dbPool.on('error', (err) => {
  logger.error('Database connection error:', err);
  process.exit(1);
});

// Health check endpoint
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const client = await dbPool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};
```

### 2. Query Optimization
```typescript
// shared/src/database/queries.ts
export class OptimizedQueries {
  // Paginated query with efficient counting
  static async getPaginatedRequests(
    filters: RequestFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<BudgetRequest>> {
    const conditions = this.buildWhereConditions(filters);
    const countQuery = `SELECT COUNT(*) FROM budget_requests WHERE ${conditions.where}`;
    const dataQuery = `
      SELECT br.*, u.first_name, u.last_name, d.name as department_name
      FROM budget_requests br
      JOIN users u ON br.requester_id = u.id
      JOIN departments d ON br.department_id = d.id
      WHERE ${conditions.where}
      ORDER BY ${this.buildOrderBy(pagination.sortBy, pagination.sortOrder)}
      LIMIT $${conditions.params.length + 1} OFFSET $${conditions.params.length + 2}
    `;

    const [countResult, dataResult] = await Promise.all([
      dbPool.query(countQuery, conditions.params),
      dbPool.query(dataQuery, [...conditions.params, pagination.limit, pagination.offset])
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: pagination.page,
      limit: pagination.limit,
      pages: Math.ceil(parseInt(countResult.rows[0].count) / pagination.limit)
    };
  }

  // Bulk update optimization
  static async updateMultipleRequestStatuses(
    updates: { id: string; status: string; updatedBy: string }[]
  ): Promise<void> {
    const values = updates.map((update, index) => 
      `('${update.id}', '${update.status}', '${update.updatedBy}')`
    ).join(',');

    const query = `
      UPDATE budget_requests 
      SET status = v.status::request_status,
          updated_at = NOW(),
          updated_by = v.updated_by::UUID
      FROM (VALUES ${values}) AS v(id, status, updated_by)
      WHERE budget_requests.id = v.id::UUID
    `;

    await dbPool.query(query);
  }
}
```

## Error Handling and Logging

### 1. Global Error Handler
```typescript
// shared/src/middleware/errorHandler.ts
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Send error response
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
      }
    });
  } else {
    // Don't expose internal errors in production
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : err.message,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
      }
    });
  }
};
```

### 2. Structured Logging
```typescript
// shared/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'unknown',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});
```

## Deployment Configuration

### 1. Docker Configuration
```dockerfile
# Dockerfile for microservices
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Kubernetes Deployment
```yaml
# k8s/budget-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: budget-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: budget-service
  template:
    metadata:
      labels:
        app: budget-service
    spec:
      containers:
      - name: budget-service
        image: smart-budget/budget-service:latest
        ports:
        - containerPort: 3002
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: host
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
```

This backend architecture provides a robust, scalable foundation for the Smart Budget Management System with proper separation of concerns, comprehensive error handling, and production-ready features.