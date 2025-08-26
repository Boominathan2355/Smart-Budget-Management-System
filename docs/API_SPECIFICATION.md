# API Specification: Smart Budget Management System

## Authentication Endpoints

### POST /api/v1/auth/login
Login with email and password

**Request Body:**
```json
{
  "email": "user@institution.edu",
  "password": "securePassword123",
  "deviceId": "device-uuid-here",
  "platform": "ios" | "android"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here",
    "user": {
      "id": "user-uuid",
      "email": "user@institution.edu",
      "role": "hod",
      "department": {
        "id": "dept-uuid",
        "name": "Computer Science",
        "code": "CS"
      },
      "permissions": ["create_request", "approve_department"]
    }
  }
}
```

### POST /api/v1/auth/refresh
Refresh access token

**Request Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

### POST /api/v1/auth/logout
Logout user and invalidate tokens

**Headers:**
```
Authorization: Bearer jwt-token-here
```

## Budget Request Endpoints

### POST /api/v1/budget/requests
Create new budget request

**Headers:**
```
Authorization: Bearer jwt-token-here
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "title": "Laboratory Equipment Purchase",
  "description": "New microscopes for biology lab",
  "amount": 450000.00,
  "category": "equipment",
  "expectedDeliveryDate": "2024-06-15",
  "justification": "Current equipment is outdated and affecting research quality",
  "vendorDetails": {
    "name": "Scientific Instruments Ltd",
    "contact": "+91-9876543210",
    "quotationNumber": "SI-2024-001"
  },
  "attachments": ["file1.pdf", "file2.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "request-uuid",
    "requestNumber": "REQ-2024-001234",
    "status": "pending",
    "currentApprovalLevel": 1,
    "nextApprover": {
      "id": "approver-uuid",
      "name": "Dr. John Smith",
      "role": "hod"
    },
    "estimatedApprovalTime": "2-3 business days"
  }
}
```

### GET /api/v1/budget/requests
Get user's budget requests with filters

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (pending, approved, rejected)
- `category`: Filter by category
- `startDate`: Filter by creation date (ISO format)
- `endDate`: Filter by creation date (ISO format)
- `search`: Search in title and description

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "request-uuid",
        "requestNumber": "REQ-2024-001234",
        "title": "Laboratory Equipment",
        "amount": 450000.00,
        "status": "pending",
        "category": "equipment",
        "priority": "normal",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "currentApprovalLevel": 1,
        "attachmentCount": 2
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### GET /api/v1/budget/requests/:id
Get specific budget request details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "request-uuid",
    "requestNumber": "REQ-2024-001234",
    "title": "Laboratory Equipment Purchase",
    "description": "New microscopes for biology lab",
    "amount": 450000.00,
    "category": "equipment",
    "priority": "normal",
    "status": "pending",
    "requester": {
      "id": "user-uuid",
      "name": "Dr. Sarah Johnson",
      "department": "Biology"
    },
    "approvalWorkflow": [
      {
        "level": 1,
        "approverRole": "hod",
        "approver": {
          "id": "approver-uuid",
          "name": "Dr. John Smith"
        },
        "status": "pending",
        "deadline": "2024-01-18T17:00:00Z"
      }
    ],
    "attachments": [
      {
        "id": "file-uuid",
        "filename": "quotation.pdf",
        "size": 2048576,
        "uploadedAt": "2024-01-15T10:30:00Z",
        "url": "https://storage.example.com/files/quotation.pdf"
      }
    ],
    "auditTrail": [
      {
        "action": "created",
        "timestamp": "2024-01-15T10:30:00Z",
        "user": "Dr. Sarah Johnson",
        "details": "Request submitted for approval"
      }
    ]
  }
}
```

## Approval Endpoints

### PUT /api/v1/budget/requests/:id/approve
Approve a budget request

**Request Body:**
```json
{
  "comments": "Approved for laboratory improvement",
  "approvedAmount": 450000.00,
  "conditions": ["Purchase must be completed by Q2 2024"]
}
```

### PUT /api/v1/budget/requests/:id/reject
Reject a budget request

**Request Body:**
```json
{
  "reason": "insufficient_justification",
  "comments": "Please provide more detailed cost breakdown",
  "suggestions": "Consider phased implementation approach"
}
```

### GET /api/v1/budget/approvals/pending
Get pending approvals for current user

**Query Parameters:**
- `priority`: Filter by priority (urgent, high, normal, low)
- `department`: Filter by department
- `amountRange`: Filter by amount range (0-50000, 50001-200000, 200001+)

**Response:**
```json
{
  "success": true,
  "data": {
    "pendingApprovals": [
      {
        "id": "request-uuid",
        "title": "Research Conference Registration",
        "amount": 75000.00,
        "requester": {
          "name": "Prof. Michael Chen",
          "department": "Engineering"
        },
        "priority": "normal",
        "submittedAt": "2024-01-14T14:20:00Z",
        "daysWaiting": 2,
        "approvalDeadline": "2024-01-19T17:00:00Z"
      }
    ],
    "summary": {
      "totalPending": 8,
      "urgentCount": 2,
      "overdueCount": 1,
      "totalValue": 850000.00
    }
  }
}
```

## Document Management Endpoints

### POST /api/v1/documents/upload
Upload document or receipt

**Headers:**
```
Authorization: Bearer jwt-token-here
Content-Type: multipart/form-data
```

**Request Body:**
```
FormData with file and metadata
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "file-uuid",
    "filename": "receipt.jpg",
    "size": 1024576,
    "mimeType": "image/jpeg",
    "url": "https://storage.example.com/files/receipt.jpg",
    "ocrResults": {
      "extractedText": "Invoice #12345\nAmount: ₹45,000\nDate: 15/01/2024",
      "confidence": 0.95,
      "detectedAmount": 45000.00,
      "detectedDate": "2024-01-15"
    }
  }
}
```

### POST /api/v1/documents/:id/ocr
Process OCR on uploaded document

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedText": "Invoice #12345\nAmount: ₹45,000\nDate: 15/01/2024",
    "structuredData": {
      "amount": 45000.00,
      "date": "2024-01-15",
      "vendor": "ABC Suppliers",
      "invoiceNumber": "12345"
    },
    "confidence": 0.95
  }
}
```

## Analytics & Reporting Endpoints

### GET /api/v1/analytics/dashboard
Get dashboard analytics

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 245,
      "pendingRequests": 12,
      "approvedRequests": 198,
      "rejectedRequests": 35,
      "totalBudgetAllocated": 50000000,
      "totalBudgetUtilized": 28000000,
      "utilizationPercentage": 56.0
    },
    "trends": {
      "requestsThisMonth": 24,
      "requestsLastMonth": 18,
      "monthlyGrowth": 33.3,
      "averageApprovalTime": 2.5
    },
    "departmentBreakdown": [
      {
        "department": "Computer Science",
        "allocated": 10000000,
        "utilized": 6500000,
        "pending": 450000,
        "requestCount": 45
      }
    ]
  }
}
```

### GET /api/v1/analytics/reports/export
Export detailed reports

**Query Parameters:**
- `format`: Export format (pdf, excel, csv)
- `reportType`: Type of report (budget_summary, transaction_detail, audit_trail)
- `startDate`: Report start date
- `endDate`: Report end date
- `departments`: Comma-separated department IDs

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://storage.example.com/reports/budget-summary-2024-01.pdf",
    "expiresAt": "2024-01-16T10:30:00Z",
    "fileSize": 2048576,
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Notification Endpoints

### GET /api/v1/notifications
Get user notifications

**Query Parameters:**
- `read`: Filter by read status (true, false)
- `type`: Filter by notification type
- `limit`: Number of notifications (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notification-uuid",
        "type": "approval_required",
        "title": "New Budget Request Requires Approval",
        "message": "Laboratory Equipment request from Dr. Sarah Johnson",
        "data": {
          "requestId": "request-uuid",
          "amount": 450000.00
        },
        "read": false,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "unreadCount": 3
  }
}
```

### PUT /api/v1/notifications/:id/read
Mark notification as read

### POST /api/v1/notifications/mark-all-read
Mark all notifications as read

## Error Response Format

All endpoints return errors in this standardized format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "amount",
      "issue": "Amount must be greater than 0"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-uuid-for-tracking"
  }
}
```

## Rate Limiting

All API endpoints are subject to rate limiting:

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes per IP
- **File Upload**: 20 uploads per hour per user
- **Export Reports**: 10 exports per hour per user

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642320000
```