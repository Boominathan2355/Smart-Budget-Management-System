# Implementation Guide: Smart Budget Management System

## Development Environment Setup

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- React Native CLI
- Expo CLI
- PostgreSQL 15.x
- Redis 7.x
- Docker & Docker Compose

### 1. Backend Development Setup

```bash
# Clone and setup backend services
mkdir smart-budget-backend
cd smart-budget-backend

# Initialize microservices
mkdir -p services/{api-gateway,user-service,budget-service,document-service,notification-service,analytics-service}

# Setup package.json for each service
cd services/api-gateway
npm init -y
npm install express cors helmet morgan compression dotenv
npm install -D typescript @types/node @types/express ts-node nodemon

# Create shared utilities
mkdir ../../shared
cd ../../shared
npm init -y
npm install winston joi bcryptjs jsonwebtoken ioredis pg bull
```

### 2. Mobile App Development Setup

```bash
# Initialize React Native app with Expo
npx create-expo-app SmartBudgetApp --template
cd SmartBudgetApp

# Install core dependencies
npm install @reduxjs/toolkit react-redux redux-persist
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install expo-camera expo-document-picker expo-notifications
npm install react-native-paper react-native-vector-icons
npm install react-native-keychain expo-local-authentication
npm install @react-native-async-storage/async-storage
npm install react-native-image-picker react-native-pdf

# Development dependencies
npm install -D @types/react @types/react-native
```

### 3. Database Setup

```sql
-- Create database and user
CREATE DATABASE smart_budget_system;
CREATE USER budget_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE smart_budget_system TO budget_user;

-- Connect to database and run schema
\c smart_budget_system
-- Run all schema files from database documentation
```

## Development Workflow

### 1. Backend Service Development

#### API Gateway Structure
```
api-gateway/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── routes/             # Route definitions
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── budget.ts
│   │   └── health.ts
│   ├── middleware/         # Custom middleware
│   │   ├── auth.ts
│   │   ├── rateLimiting.ts
│   │   ├── logging.ts
│   │   └── errorHandler.ts
│   ├── services/           # External service clients
│   │   ├── userService.ts
│   │   ├── budgetService.ts
│   │   └── documentService.ts
│   └── utils/              # Utility functions
│       ├── logger.ts
│       ├── validation.ts
│       └── constants.ts
├── package.json
├── tsconfig.json
├── Dockerfile
└── docker-compose.yml
```

#### Example Service Implementation
```typescript
// budget-service/src/controllers/BudgetController.ts
import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/BudgetService';
import { ApprovalService } from '../services/ApprovalService';
import { NotificationService } from '../services/NotificationService';
import { ValidationError, NotFoundError } from '../utils/errors';

export class BudgetController {
  constructor(
    private budgetService: BudgetService,
    private approvalService: ApprovalService,
    private notificationService: NotificationService
  ) {}

  async createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Input validation
      const validationResult = await this.validateCreateRequest(req.body);
      if (!validationResult.isValid) {
        throw new ValidationError(validationResult.errors);
      }

      // Business logic validation
      await this.validateBusinessRules(req.body, req.user);

      // Create request
      const request = await this.budgetService.createRequest({
        ...req.body,
        requesterId: req.user.id,
        departmentId: req.user.departmentId
      });

      // Initialize approval workflow
      const workflow = await this.approvalService.initializeWorkflow(request);

      // Send notifications
      await this.notificationService.notifyApprovers(request.id, workflow[0]);

      res.status(201).json({
        success: true,
        data: {
          id: request.id,
          requestNumber: request.requestNumber,
          status: request.status,
          nextApprover: workflow[0].approver
        }
      });
    } catch (error) {
      next(error);
    }
  }

  private async validateBusinessRules(data: any, user: any): Promise<void> {
    // Check budget availability
    const budgetAvailable = await this.budgetService.checkBudgetAvailability(
      user.departmentId,
      data.category,
      data.amount
    );

    if (!budgetAvailable) {
      throw new ValidationError('Insufficient budget allocation for this category');
    }

    // Check for potential duplicates
    const duplicateCheck = await this.budgetService.checkForDuplicates(data);
    if (duplicateCheck.isDuplicate && duplicateCheck.confidence > 0.9) {
      throw new ValidationError(`Potential duplicate of request #${duplicateCheck.similarRequest.requestNumber}`);
    }
  }
}
```

### 2. Mobile App Development

#### Redux Store Configuration
```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authSlice } from './slices/authSlice';
import { budgetSlice } from './slices/budgetSlice';
import { notificationSlice } from './slices/notificationSlice';
import { offlineSlice } from './slices/offlineSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'budget', 'offline'], // Only persist these reducers
  blacklist: ['notification'] // Don't persist notifications
};

const rootReducer = {
  auth: authSlice.reducer,
  budget: budgetSlice.reducer,
  notification: notificationSlice.reducer,
  offline: offlineSlice.reducer,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat([
      // Custom middleware for offline sync
      offlineSyncMiddleware,
      // API middleware
      apiMiddleware,
    ]),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### Offline Sync Implementation
```typescript
// src/services/OfflineSync.ts
export class OfflineSync {
  private queue: OfflineAction[] = [];
  private isProcessing = false;

  async addAction(action: OfflineAction): Promise<void> {
    this.queue.push({
      ...action,
      id: uuidv4(),
      timestamp: Date.now(),
      retryCount: 0
    });
    
    // Persist queue
    await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
    
    // Try to process immediately if online
    if (await NetInfo.fetch().then(state => state.isConnected)) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      while (this.queue.length > 0) {
        const action = this.queue[0];
        
        try {
          await this.processAction(action);
          this.queue.shift(); // Remove successful action
        } catch (error) {
          action.retryCount++;
          if (action.retryCount >= 3) {
            // Remove failed action after 3 attempts
            this.queue.shift();
            logger.error(`Failed to sync action after 3 attempts:`, action);
          } else {
            // Exponential backoff
            await new Promise(resolve => 
              setTimeout(resolve, Math.pow(2, action.retryCount) * 1000)
            );
          }
        }
      }
      
      // Update persisted queue
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
    } finally {
      this.isProcessing = false;
    }
  }

  private async processAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'CREATE_REQUEST':
        await apiClient.post('/budget/requests', action.payload);
        break;
      case 'UPDATE_REQUEST':
        await apiClient.put(`/budget/requests/${action.payload.id}`, action.payload);
        break;
      case 'UPLOAD_DOCUMENT':
        await apiClient.post('/documents/upload', action.payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
}
```

## Testing Strategy

### 1. Backend Testing
```typescript
// budget-service/tests/BudgetController.test.ts
import request from 'supertest';
import { app } from '../src/app';
import { dbPool } from '../src/database/connection';

describe('Budget Controller', () => {
  beforeAll(async () => {
    // Setup test database
    await dbPool.query('BEGIN');
  });

  afterAll(async () => {
    // Cleanup test database
    await dbPool.query('ROLLBACK');
    await dbPool.end();
  });

  beforeEach(async () => {
    // Reset test data
    await setupTestData();
  });

  describe('POST /api/v1/budget/requests', () => {
    it('should create a new budget request', async () => {
      const requestData = {
        title: 'Test Equipment',
        description: 'Test description',
        amount: 50000,
        category: 'equipment',
        justification: 'Test justification'
      };

      const response = await request(app)
        .post('/api/v1/budget/requests')
        .set('Authorization', `Bearer ${getTestToken()}`)
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.requestNumber).toMatch(/^REQ-\d{2}-\d{6}$/);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/budget/requests')
        .set('Authorization', `Bearer ${getTestToken()}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should check budget availability', async () => {
      const requestData = {
        title: 'Expensive Equipment',
        description: 'Very expensive',
        amount: 10000000, // Exceeds budget
        category: 'equipment',
        justification: 'Test'
      };

      const response = await request(app)
        .post('/api/v1/budget/requests')
        .set('Authorization', `Bearer ${getTestToken()}`)
        .send(requestData)
        .expect(400);

      expect(response.body.error.message).toContain('Insufficient budget');
    });
  });
});
```

### 2. Mobile App Testing
```typescript
// __tests__/components/BudgetRequestForm.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { BudgetRequestForm } from '../src/components/BudgetRequestForm';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('BudgetRequestForm', () => {
  it('should render form fields correctly', () => {
    const { getByPlaceholderText, getByText } = renderWithProvider(
      <BudgetRequestForm onSubmit={jest.fn()} />
    );

    expect(getByPlaceholderText('Enter request title')).toBeTruthy();
    expect(getByPlaceholderText('Enter amount')).toBeTruthy();
    expect(getByText('Submit Request')).toBeTruthy();
  });

  it('should validate required fields', async () => {
    const mockSubmit = jest.fn();
    const { getByText } = renderWithProvider(
      <BudgetRequestForm onSubmit={mockSubmit} />
    );

    fireEvent.press(getByText('Submit Request'));

    await waitFor(() => {
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  it('should handle offline submission', async () => {
    const mockSubmit = jest.fn();
    const { getByPlaceholderText, getByText } = renderWithProvider(
      <BudgetRequestForm onSubmit={mockSubmit} />
    );

    // Mock offline state
    jest.mock('@react-native-community/netinfo', () => ({
      fetch: () => Promise.resolve({ isConnected: false })
    }));

    fireEvent.changeText(getByPlaceholderText('Enter request title'), 'Test Request');
    fireEvent.changeText(getByPlaceholderText('Enter amount'), '50000');
    fireEvent.press(getByText('Submit Request'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Request',
          amount: '50000',
          isOffline: true
        })
      );
    });
  });
});
```

## Deployment Guide

### 1. Production Environment Setup

#### Docker Compose for Local Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: smart_budget_system
      POSTGRES_USER: budget_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  api-gateway:
    build: ./services/api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  user-service:
    build: ./services/user-service
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  budget-service:
    build: ./services/budget-service
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

#### Production Kubernetes Deployment
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: smart-budget-system

---
# k8s/postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: smart-budget-system
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: smart_budget_system
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
```

### 2. Mobile App Deployment

#### iOS App Store Deployment
```bash
# Build for iOS production
npx expo build:ios --type archive

# Or with EAS Build (recommended)
npm install -g @expo/cli
npx expo install expo-dev-client
npx eas build --platform ios --profile production

# Submit to App Store
npx eas submit --platform ios
```

#### Android Play Store Deployment
```bash
# Build for Android production
npx expo build:android --type app-bundle

# Or with EAS Build
npx eas build --platform android --profile production

# Submit to Play Store
npx eas submit --platform android
```

#### App Configuration (app.json)
```json
{
  "expo": {
    "name": "Smart Budget Manager",
    "slug": "smart-budget-manager",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2563eb"
    },
    "updates": {
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/your-project-id"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.institution.smartbudget",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses camera to capture receipts and documents",
        "NSPhotoLibraryUsageDescription": "This app accesses photo library to upload documents"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.institution.smartbudget",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-camera",
      "expo-document-picker",
      "expo-notifications",
      "expo-local-authentication"
    ]
  }
}
```

## CI/CD Pipeline Implementation

### 1. GitHub Actions for Backend
```yaml
# .github/workflows/backend-ci-cd.yml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['backend/**']
  pull_request:
    branches: [main]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json

    - name: Install dependencies
      run: |
        cd backend
        npm ci

    - name: Run tests
      run: |
        cd backend
        npm run test:unit
        npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379

    - name: Run security audit
      run: |
        cd backend
        npm audit --audit-level moderate

    - name: Build Docker images
      if: github.ref == 'refs/heads/main'
      run: |
        cd backend
        docker build -t smart-budget/api-gateway:${{ github.sha }} services/api-gateway
        docker build -t smart-budget/user-service:${{ github.sha }} services/user-service
        docker build -t smart-budget/budget-service:${{ github.sha }} services/budget-service

    - name: Push to registry
      if: github.ref == 'refs/heads/main'
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push smart-budget/api-gateway:${{ github.sha }}
        docker push smart-budget/user-service:${{ github.sha }}
        docker push smart-budget/budget-service:${{ github.sha }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to staging
      run: |
        # Deploy to Kubernetes staging environment
        kubectl set image deployment/api-gateway api-gateway=smart-budget/api-gateway:${{ github.sha }}
        kubectl set image deployment/user-service user-service=smart-budget/user-service:${{ github.sha }}
        kubectl set image deployment/budget-service budget-service=smart-budget/budget-service:${{ github.sha }}
```

### 2. Mobile App CI/CD
```yaml
# .github/workflows/mobile-ci-cd.yml
name: Mobile App CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['mobile/**']
  pull_request:
    branches: [main]
    paths: ['mobile/**']

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: mobile/package-lock.json

    - name: Install dependencies
      run: |
        cd mobile
        npm ci

    - name: Run tests
      run: |
        cd mobile
        npm run test -- --coverage --watchAll=false

    - name: Run linting
      run: |
        cd mobile
        npm run lint

    - name: Type checking
      run: |
        cd mobile
        npm run type-check

  build-ios:
    needs: test
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'

    - name: Setup Expo CLI
      run: npm install -g @expo/cli

    - name: Install dependencies
      run: |
        cd mobile
        npm ci

    - name: Build iOS app
      run: |
        cd mobile
        npx eas build --platform ios --profile production --non-interactive
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

  build-android:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'

    - name: Setup Expo CLI
      run: npm install -g @expo/cli

    - name: Install dependencies
      run: |
        cd mobile
        npm ci

    - name: Build Android app
      run: |
        cd mobile
        npx eas build --platform android --profile production --non-interactive
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## Security Implementation

### 1. JWT Token Service
```typescript
// shared/src/services/TokenService.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
  }

  async generateTokens(user: User): Promise<TokenPair> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      permissions: user.permissions
    };

    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'smart-budget-system',
      audience: 'mobile-app',
      algorithm: 'RS256'
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'smart-budget-system',
        audience: 'mobile-app',
        algorithm: 'RS256'
      }
    );

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, this.accessTokenSecret, {
        algorithms: ['RS256'],
        issuer: 'smart-budget-system',
        audience: 'mobile-app'
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token expired');
      }
      throw new UnauthorizedError('Invalid access token');
    }
  }

  async blacklistToken(token: string): Promise<void> {
    const decoded = jwt.decode(token) as JWTPayload;
    if (decoded?.exp) {
      const expiryTime = decoded.exp - Math.floor(Date.now() / 1000);
      await redis.setex(`blacklist:${token}`, expiryTime, 'true');
    }
  }
}
```

### 2. Input Validation Schemas
```typescript
// shared/src/validation/schemas.ts
import Joi from 'joi';

export const createRequestSchema = Joi.object({
  title: Joi.string().min(5).max(300).required(),
  description: Joi.string().min(10).max(2000).required(),
  amount: Joi.number().positive().max(10000000).required(),
  category: Joi.string().valid(
    'equipment', 'supplies', 'services', 'travel', 
    'training', 'maintenance', 'software', 'books', 
    'research', 'infrastructure', 'other'
  ).required(),
  justification: Joi.string().min(20).max(1000),
  expectedDeliveryDate: Joi.date().min('now').max('2025-12-31'),
  vendorDetails: Joi.object({
    name: Joi.string().max(200),
    contact: Joi.string().max(50),
    quotationNumber: Joi.string().max(50)
  }),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal')
});

export const approvalSchema = Joi.object({
  comments: Joi.string().max(1000),
  approvedAmount: Joi.number().positive().max(10000000),
  conditions: Joi.array().items(Joi.string().max(500))
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  deviceId: Joi.string().uuid().required(),
  platform: Joi.string().valid('ios', 'android').required()
});
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Query optimization examples
EXPLAIN ANALYZE 
SELECT br.*, u.first_name, u.last_name, d.name as department_name
FROM budget_requests br
JOIN users u ON br.requester_id = u.id
JOIN departments d ON br.department_id = d.id
WHERE br.status = 'pending'
  AND br.department_id = $1
ORDER BY br.created_at DESC
LIMIT 20;

-- Optimization: Add covering index
CREATE INDEX idx_budget_requests_covering 
ON budget_requests (department_id, status, created_at DESC)
INCLUDE (id, title, amount, category, priority);
```

### 2. Redis Caching Strategy
```typescript
// shared/src/services/CacheService.ts
export class CacheService {
  private readonly defaultTTL = 300; // 5 minutes

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }

  // Cache warming for frequently accessed data
  async warmCache(): Promise<void> {
    const departments = await departmentService.getAllActiveDepartments();
    for (const dept of departments) {
      const cacheKey = `department:${dept.id}:budget_summary`;
      const summary = await budgetService.getDepartmentSummary(dept.id);
      await this.set(cacheKey, summary, 600); // 10 minutes
    }
  }
}
```

## Monitoring and Alerting

### 1. Application Monitoring
```typescript
// shared/src/monitoring/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Custom metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service']
});

export const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Number of currently active users',
  labelNames: ['service']
});

export const budgetRequestsTotal = new Counter({
  name: 'budget_requests_total',
  help: 'Total number of budget requests',
  labelNames: ['department', 'category', 'status']
});

// Middleware to collect metrics
export const metricsMiddleware = (serviceName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      
      httpRequestDuration
        .labels(req.method, req.route?.path || req.path, res.statusCode.toString(), serviceName)
        .observe(duration);
      
      httpRequestTotal
        .labels(req.method, req.route?.path || req.path, res.statusCode.toString(), serviceName)
        .inc();
    });
    
    next();
  };
};
```

### 2. Health Check Implementation
```typescript
// shared/src/health/healthCheck.ts
export class HealthCheck {
  async checkDatabase(): Promise<HealthStatus> {
    try {
      const start = Date.now();
      const result = await dbPool.query('SELECT 1');
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime,
        details: 'Database connection successful'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: -1,
        details: error.message
      };
    }
  }

  async checkRedis(): Promise<HealthStatus> {
    try {
      const start = Date.now();
      await redis.ping();
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime,
        details: 'Redis connection successful'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: -1,
        details: error.message
      };
    }
  }

  async getOverallHealth(): Promise<SystemHealth> {
    const [database, redis, queue] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueue()
    ]);

    const isHealthy = [database, redis, queue].every(
      check => check.status === 'healthy'
    );

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: { database, redis, queue },
      version: process.env.APP_VERSION || '1.0.0'
    };
  }
}
```

## Performance Load Testing

### 1. Artillery Load Test Configuration
```yaml
# load-tests/api-performance.yml
config:
  target: 'https://api.smartbudget.edu'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Load test"
    - duration: 120
      arrivalRate: 100
      name: "Spike test"
  
  processor: "./auth-processor.js"
  
scenarios:
  - name: "Budget request workflow"
    weight: 60
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "{{ $randomEmail }}"
            password: "testPassword123"
            deviceId: "{{ $uuid }}"
            platform: "android"
          capture:
            - json: "$.data.accessToken"
              as: "token"
      
      - get:
          url: "/api/v1/budget/requests"
          headers:
            Authorization: "Bearer {{ token }}"
      
      - post:
          url: "/api/v1/budget/requests"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            title: "Load test request {{ $uuid }}"
            description: "Automated load test request"
            amount: "{{ $randomInt(1000, 100000) }}"
            category: "equipment"
            justification: "Performance testing"

  - name: "Dashboard analytics"
    weight: 40
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "{{ $randomEmail }}"
            password: "testPassword123"
            deviceId: "{{ $uuid }}"
            platform: "ios"
          capture:
            - json: "$.data.accessToken"
              as: "token"
      
      - get:
          url: "/api/v1/analytics/dashboard"
          headers:
            Authorization: "Bearer {{ token }}"
```

### 2. Mobile App Performance Testing
```typescript
// mobile/__tests__/performance/AppPerformance.test.tsx
import { measurePerformance } from '@testing-library/react-native';
import { render } from '@testing-library/react-native';
import { App } from '../src/App';

describe('App Performance Tests', () => {
  it('should render within performance budget', async () => {
    const { perf } = measurePerformance(<App />);
    
    // App should render within 2 seconds
    expect(perf.renders[0].duration).toBeLessThan(2000);
  });

  it('should handle large lists efficiently', async () => {
    const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
      id: i.toString(),
      title: `Request ${i}`,
      amount: Math.random() * 100000
    }));

    const startTime = performance.now();
    render(<RequestList data={largeDataSet} />);
    const renderTime = performance.now() - startTime;

    // Should render 1000 items within 500ms
    expect(renderTime).toBeLessThan(500);
  });
});
```

This implementation guide provides the foundation for building a production-ready Smart Budget Management System with proper architecture, testing, deployment, and monitoring capabilities.