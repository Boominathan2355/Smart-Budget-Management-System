# Technical Specification: Smart Budget Management System

## 1. System Architecture Overview

### 1.1 High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   React Native  │    │   Web Dashboard │
│   iOS App       │    │   Android App   │    │   (Optional)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
          ┌─────────────────────────────────────────────┐
          │           API Gateway (Express.js)          │
          └─────────────────────┬───────────────────────┘
                                │
    ┌───────────┬─────────────┬─┴─────────┬─────────────┬───────────┐
    │           │             │           │             │           │
┌───▼────┐ ┌───▼────┐ ┌──────▼──┐ ┌─────▼────┐ ┌──────▼──┐ ┌────▼───┐
│  User  │ │ Budget │ │Document │ │Analytics │ │ Notify  │ │ Audit  │
│Service │ │Service │ │Service  │ │ Service  │ │ Service │ │Service │
└────────┘ └────────┘ └─────────┘ └──────────┘ └─────────┘ └────────┘
    │           │           │           │           │           │
    └───────────┼───────────┼───────────┼───────────┼───────────┘
                │           │           │           │
        ┌───────▼───────────▼───────────▼───────────▼──────┐
        │              PostgreSQL Database                │
        └─────────────────────────────────────────────────┘
                                │
        ┌─────────────────────────────────────────────────┐
        │                Redis Cache                      │
        └─────────────────────────────────────────────────┘
```

### 1.2 Technology Stack Justification

#### Database Choice: PostgreSQL
**Rationale:**
- **ACID Compliance**: Critical for financial transactions
- **JSON Support**: Flexible document storage for receipts and approvals
- **Scalability**: Handles 100,000+ transactions with proper indexing
- **Audit Features**: Built-in transaction logging and point-in-time recovery
- **Cost-Effective**: Open source with excellent tooling ecosystem

#### Supporting Technologies:
- **Redis**: Session storage, caching, and message queue
- **Socket.io**: Real-time notifications and status updates
- **TensorFlow.js**: OCR processing and AI features
- **AWS S3**: Document and receipt storage
- **SendGrid**: Email notifications and reporting

## 2. Mobile Application Architecture

### 2.1 React Native App Structure
```
src/
├── components/           # Reusable UI components
│   ├── forms/           # Form components with validation
│   ├── navigation/      # Navigation components
│   └── ui/              # Base UI components
├── screens/             # Screen components by feature
│   ├── auth/           # Authentication screens
│   ├── budget/         # Budget request screens
│   ├── approval/       # Approval workflow screens
│   └── reports/        # Reporting and analytics
├── services/           # API and business logic
│   ├── api/           # API client and endpoints
│   ├── storage/       # Local storage and offline sync
│   └── camera/        # Camera and OCR services
├── store/             # Redux store configuration
│   ├── slices/        # Redux slices by feature
│   └── middleware/    # Custom middleware
├── utils/             # Utility functions
├── constants/         # App constants and configuration
└── types/            # TypeScript type definitions
```

### 2.2 State Management Strategy
- **Redux Toolkit**: Centralized state management
- **RTK Query**: API caching and synchronization
- **Redux Persist**: Offline data persistence
- **Async Storage**: Secure local storage for sensitive data

### 2.3 Offline-First Architecture
```typescript
// Offline sync strategy
interface OfflineAction {
  id: string;
  type: 'CREATE_REQUEST' | 'UPDATE_REQUEST' | 'UPLOAD_DOCUMENT';
  payload: any;
  timestamp: number;
  retry_count: number;
}

// Queue management for offline actions
class OfflineQueue {
  async addAction(action: OfflineAction): Promise<void>
  async processQueue(): Promise<void>
  async retryFailedActions(): Promise<void>
}
```

## 3. Backend Microservices Architecture

### 3.1 Service Breakdown

#### User Service
```typescript
// Routes and responsibilities
POST   /api/v1/users/login
POST   /api/v1/users/register  
POST   /api/v1/users/refresh-token
PUT    /api/v1/users/profile
GET    /api/v1/users/permissions
POST   /api/v1/users/change-password
POST   /api/v1/users/reset-password
```

#### Budget Service
```typescript
// Core budget management endpoints
POST   /api/v1/budget/requests
GET    /api/v1/budget/requests/:id
PUT    /api/v1/budget/requests/:id/approve
PUT    /api/v1/budget/requests/:id/reject
GET    /api/v1/budget/requests/pending
GET    /api/v1/budget/department/:deptId/summary
POST   /api/v1/budget/allocations
```

#### Document Service
```typescript
// File and document management
POST   /api/v1/documents/upload
GET    /api/v1/documents/:id
POST   /api/v1/documents/:id/ocr
DELETE /api/v1/documents/:id
GET    /api/v1/documents/request/:requestId
```

### 3.2 API Design Patterns

#### Standard Response Format
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    pagination?: PaginationInfo;
    timestamp: string;
    version: string;
  };
}
```

#### Error Handling Strategy
```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}

// Centralized error handling middleware
const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  const { statusCode = 500, message, errorCode } = err;
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      timestamp: new Date().toISOString()
    }
  });
};
```

## 4. Database Schema Design

### 4.1 Core Entities

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    department_id UUID REFERENCES departments(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM (
    'staff', 'hod', 'vice_principal', 'principal', 'admin'
);
```

#### Budget Requests Table
```sql
CREATE TABLE budget_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(20) UNIQUE NOT NULL,
    requester_id UUID NOT NULL REFERENCES users(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    category budget_category NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    justification TEXT,
    expected_delivery_date DATE,
    vendor_details JSONB,
    status request_status DEFAULT 'pending',
    priority priority_level DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE budget_category AS ENUM (
    'equipment', 'supplies', 'services', 'travel', 'training', 'maintenance', 'other'
);

CREATE TYPE request_status AS ENUM (
    'draft', 'pending', 'hod_approved', 'vp_approved', 'approved', 'rejected', 'cancelled'
);

CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'urgent');
```

#### Approval Workflow Table
```sql
CREATE TABLE approval_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES budget_requests(id),
    approver_id UUID REFERENCES users(id),
    approval_level INTEGER NOT NULL,
    status approval_status NOT NULL,
    comments TEXT,
    approved_amount DECIMAL(15,2),
    approval_date TIMESTAMPTZ,
    delegation_from UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE approval_status AS ENUM (
    'pending', 'approved', 'rejected', 'delegated'
);
```

### 4.2 Indexing Strategy
```sql
-- Performance optimization indexes
CREATE INDEX idx_budget_requests_status ON budget_requests(status);
CREATE INDEX idx_budget_requests_requester ON budget_requests(requester_id);
CREATE INDEX idx_budget_requests_department ON budget_requests(department_id);
CREATE INDEX idx_budget_requests_created_at ON budget_requests(created_at);
CREATE INDEX idx_approval_workflow_request ON approval_workflow(request_id);
CREATE INDEX idx_approval_workflow_approver ON approval_workflow(approver_id);

-- Composite indexes for common queries
CREATE INDEX idx_requests_status_dept ON budget_requests(status, department_id);
CREATE INDEX idx_requests_amount_category ON budget_requests(amount, category);
```

## 5. Security Implementation

### 5.1 JWT Authentication Strategy
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  departmentId: string;
  permissions: string[];
  iat: number;
  exp: number;
}

// Token configuration
const JWT_CONFIG = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  algorithm: 'RS256',
  issuer: 'smart-budget-system',
  audience: 'mobile-app'
};
```

### 5.2 API Security Middleware
```typescript
// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
};

// Request validation middleware
const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }
    next();
  };
};
```

## 6. Performance & Monitoring

### 6.1 Performance Targets
- **API Response Time**: <200ms for 95% of requests
- **Mobile App Launch**: <3 seconds cold start
- **Database Queries**: <100ms average execution time
- **File Upload**: <30 seconds for 10MB files
- **Offline Sync**: <60 seconds for 100 pending actions

### 6.2 Monitoring Strategy
```typescript
// Application Performance Monitoring
interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  dbConnectionPool: number;
}

// Custom monitoring middleware
const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.info('API_PERFORMANCE', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};
```

## 7. Implementation Roadmap

### 7.1 Team Requirements
- **Mobile Development**: 2 React Native developers
- **Backend Development**: 3 Node.js developers  
- **DevOps Engineer**: 1 specialist
- **UI/UX Designer**: 1 specialist
- **Project Manager**: 1 specialist
- **QA Engineer**: 2 specialists

### 7.2 Development Environment
```bash
# Required Node.js version
node: ">=20.0.0"
npm: ">=10.0.0"

# React Native CLI setup
npx react-native@latest init SmartBudgetApp
cd SmartBudgetApp
npm install expo-cli -g
```

### 7.3 CI/CD Pipeline
```yaml
# .github/workflows/mobile-app.yml
name: Mobile App CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      
  build-ios:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npx expo build:ios
      
  build-android:
    needs: test  
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npx expo build:android
```

## 8. Compliance & Audit Framework

### 8.1 Audit Trail Requirements
```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  sessionId: string;
}

enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ', 
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT'
}
```

### 8.2 Compliance Requirements
- **Data Retention**: 7 years for financial records
- **GDPR Compliance**: Right to be forgotten, data portability
- **Financial Regulations**: SOX compliance for audit trails
- **Educational Standards**: FERPA compliance for student data
- **Indian Regulations**: IT Act 2000, RBI guidelines

## 9. Risk Mitigation Strategies

### 9.1 Technical Risks
| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| Mobile app store rejection | Medium | High | Early store review, compliance checklist |
| Database performance issues | Low | High | Load testing, query optimization |
| Security vulnerabilities | Medium | Critical | Security audits, penetration testing |
| Third-party API failures | Medium | Medium | Circuit breakers, fallback mechanisms |

### 9.2 Business Risks
| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| User adoption resistance | High | High | Change management, training programs |
| Integration complexity | Medium | High | Phased integration, pilot programs |
| Budget overruns | Medium | Medium | Agile development, regular reviews |
| Regulatory changes | Low | High | Compliance monitoring, legal consultation |

## 10. Go-Live Strategy

### 10.1 Deployment Phases
1. **Pilot Department**: 50 users, 1 month
2. **Limited Rollout**: 200 users, 2 months  
3. **Full Deployment**: All users, 3 months
4. **Optimization**: Performance tuning, 2 months

### 10.2 Success Criteria
- System availability >99.5% during business hours
- User login success rate >98%
- Request submission completion rate >95%
- Mobile app crash rate <1%
- Average approval time <48 hours