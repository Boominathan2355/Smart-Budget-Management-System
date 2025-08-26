# Security Framework: Smart Budget Management System

## Security Overview

This document outlines the comprehensive security framework for the Smart Budget Management System, designed to protect sensitive financial data and ensure compliance with educational sector regulations.

## 1. Threat Model Analysis

### High-Value Assets
- **Financial Data**: Budget requests, approvals, allocations
- **Personal Information**: User credentials, employee data, contact information
- **Institutional Data**: Department structures, spending patterns, vendor information
- **Audit Trails**: Complete transaction and approval history
- **System Access**: Administrative privileges and system configurations

### Threat Actors
| Actor Type | Motivation | Capabilities | Risk Level |
|------------|------------|--------------|------------|
| External Hackers | Financial gain, data theft | Medium to High | High |
| Malicious Insiders | Financial fraud, data theft | High (system access) | Very High |
| Nation-State Actors | Intelligence gathering | Very High | Medium |
| Competitors | Business intelligence | Medium | Low |
| Disgruntled Employees | Sabotage, revenge | Medium to High | Medium |

### Attack Vectors
1. **Web Application Attacks**: SQL injection, XSS, CSRF
2. **Mobile App Attacks**: Reverse engineering, data extraction
3. **API Attacks**: Authentication bypass, rate limiting abuse
4. **Social Engineering**: Phishing, credential theft
5. **Network Attacks**: Man-in-the-middle, packet sniffing
6. **Physical Attacks**: Device theft, shoulder surfing

## 2. Authentication & Authorization

### 2.1 Multi-Factor Authentication (MFA)
```typescript
// auth-service/src/services/MFAService.ts
export class MFAService {
  async setupTOTP(userId: string): Promise<TOTPSetup> {
    const secret = authenticator.generateSecret();
    const qrCodeUrl = authenticator.keyuri(
      userId,
      'Smart Budget System',
      secret
    );

    // Store encrypted secret
    await userSecurityService.storeMFASecret(userId, {
      secret: encrypt(secret),
      method: 'totp',
      isVerified: false
    });

    return {
      secret,
      qrCodeUrl,
      backupCodes: this.generateBackupCodes()
    };
  }

  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const userMFA = await userSecurityService.getMFAConfig(userId);
    if (!userMFA || !userMFA.isVerified) {
      throw new Error('MFA not configured');
    }

    const secret = decrypt(userMFA.secret);
    const isValid = authenticator.verify({
      token,
      secret,
      window: 2 // Allow 2 time windows for clock skew
    });

    if (isValid) {
      // Update last used timestamp
      await userSecurityService.updateMFALastUsed(userId);
      return true;
    }

    // Log failed attempt
    await auditService.logSecurityEvent({
      userId,
      event: 'mfa_verification_failed',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return false;
  }

  async sendSMSCode(userId: string, phoneNumber: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code temporarily
    await redis.setex(`sms_code:${userId}`, 600, JSON.stringify({
      code: await bcrypt.hash(code, 10),
      expiresAt
    }));

    // Send SMS via provider
    await smsService.sendMessage(phoneNumber, {
      message: `Your Smart Budget verification code is: ${code}. Valid for 10 minutes.`,
      templateId: 'mfa_verification'
    });
  }
}
```

### 2.2 Biometric Authentication (Mobile)
```typescript
// mobile/src/services/BiometricAuth.ts
import * as LocalAuthentication from 'expo-local-authentication';
import * as Keychain from 'react-native-keychain';

export class BiometricAuthService {
  async isBiometricSupported(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Smart Budget',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN'
      });

      return result.success;
    } catch (error) {
      logger.error('Biometric authentication error:', error);
      return false;
    }
  }

  async storeCredentialsSecurely(username: string, token: string): Promise<void> {
    await Keychain.setInternetCredentials(
      'smart-budget-app',
      username,
      token,
      {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS
      }
    );
  }

  async retrieveCredentialsSecurely(): Promise<Keychain.UserCredentials | false> {
    try {
      return await Keychain.getInternetCredentials('smart-budget-app');
    } catch (error) {
      logger.error('Failed to retrieve credentials:', error);
      return false;
    }
  }
}
```

### 2.3 Role-Based Access Control (RBAC)
```typescript
// shared/src/security/RBAC.ts
export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  name: string;
  permissions: Permission[];
  hierarchy: number; // Higher number = more authority
}

export const ROLES: Record<string, Role> = {
  staff: {
    name: 'staff',
    hierarchy: 1,
    permissions: [
      { resource: 'budget_request', action: 'create' },
      { resource: 'budget_request', action: 'read', conditions: { owner: true } },
      { resource: 'budget_request', action: 'update', conditions: { owner: true, status: 'draft' } },
      { resource: 'document', action: 'upload' },
      { resource: 'notification', action: 'read', conditions: { recipient: true } }
    ]
  },
  hod: {
    name: 'hod',
    hierarchy: 2,
    permissions: [
      ...ROLES.staff.permissions,
      { resource: 'budget_request', action: 'approve', conditions: { department: true, amount: { max: 50000 } } },
      { resource: 'budget_request', action: 'read', conditions: { department: true } },
      { resource: 'budget_allocation', action: 'read', conditions: { department: true } },
      { resource: 'analytics', action: 'read', conditions: { department: true } }
    ]
  },
  vice_principal: {
    name: 'vice_principal',
    hierarchy: 3,
    permissions: [
      ...ROLES.hod.permissions,
      { resource: 'budget_request', action: 'approve', conditions: { amount: { max: 200000 } } },
      { resource: 'budget_request', action: 'read' },
      { resource: 'budget_allocation', action: 'read' },
      { resource: 'analytics', action: 'read' },
      { resource: 'user', action: 'delegate_approval' }
    ]
  },
  principal: {
    name: 'principal',
    hierarchy: 4,
    permissions: [
      ...ROLES.vice_principal.permissions,
      { resource: 'budget_request', action: 'approve' }, // No amount limit
      { resource: 'budget_allocation', action: 'create' },
      { resource: 'budget_allocation', action: 'update' },
      { resource: 'analytics', action: 'export' }
    ]
  },
  admin: {
    name: 'admin',
    hierarchy: 5,
    permissions: [
      { resource: '*', action: '*' } // Full system access
    ]
  }
};

export class RBACService {
  async checkPermission(
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    const user = await userService.getUserWithRole(userId);
    const role = ROLES[user.role];

    if (!role) {
      return false;
    }

    // Check for wildcard permissions (admin)
    const wildcardPermission = role.permissions.find(
      p => p.resource === '*' && p.action === '*'
    );
    if (wildcardPermission) {
      return true;
    }

    // Find matching permission
    const permission = role.permissions.find(
      p => p.resource === resource && p.action === action
    );

    if (!permission) {
      return false;
    }

    // Check conditions if present
    if (permission.conditions && context) {
      return this.evaluateConditions(permission.conditions, context, user);
    }

    return true;
  }

  private evaluateConditions(
    conditions: Record<string, any>,
    context: Record<string, any>,
    user: User
  ): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'owner':
          if (value && context.ownerId !== user.id) return false;
          break;
        case 'department':
          if (value && context.departmentId !== user.departmentId) return false;
          break;
        case 'amount':
          if (value.max && context.amount > value.max) return false;
          if (value.min && context.amount < value.min) return false;
          break;
        case 'status':
          if (Array.isArray(value) && !value.includes(context.status)) return false;
          if (typeof value === 'string' && context.status !== value) return false;
          break;
      }
    }
    return true;
  }
}
```

## 3. Data Protection

### 3.1 Encryption Strategy
```typescript
// shared/src/security/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;

  constructor(private masterKey: string) {}

  encrypt(plaintext: string): EncryptedData {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, this.masterKey);
    cipher.setAAD(Buffer.from('smart-budget-system'));

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decrypt(encryptedData: EncryptedData): string {
    const decipher = crypto.createDecipher(this.algorithm, this.masterKey);
    decipher.setAAD(Buffer.from('smart-budget-system'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Field-level encryption for sensitive data
  async encryptSensitiveFields(data: Record<string, any>): Promise<Record<string, any>> {
    const sensitiveFields = ['bankAccount', 'panNumber', 'aadhaarNumber'];
    const result = { ...data };

    for (const field of sensitiveFields) {
      if (result[field]) {
        result[field] = this.encrypt(result[field]);
      }
    }

    return result;
  }
}
```

### 3.2 Database Security
```sql
-- Row Level Security (RLS) Policies
ALTER TABLE budget_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own requests
CREATE POLICY "users_own_requests" ON budget_requests
    FOR ALL USING (requester_id = current_user_id());

-- HODs can see department requests
CREATE POLICY "hod_department_requests" ON budget_requests
    FOR SELECT USING (
        department_id IN (
            SELECT id FROM departments 
            WHERE head_of_department_id = current_user_id()
        )
    );

-- Approvers can see requests in their approval queue
CREATE POLICY "approver_pending_requests" ON budget_requests
    FOR SELECT USING (
        id IN (
            SELECT request_id FROM approval_workflow 
            WHERE approver_id = current_user_id() 
            AND status = 'pending'
        )
    );

-- Audit log protection
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_only" ON audit_logs
    FOR ALL USING (
        current_user_role() = 'admin'
    );

-- Encryption at rest
ALTER TABLE users ALTER COLUMN password_hash SET STORAGE EXTERNAL;
ALTER TABLE documents ALTER COLUMN ocr_text SET STORAGE EXTERNAL;

-- Create encrypted tablespace for sensitive data
CREATE TABLESPACE encrypted_data 
LOCATION '/var/lib/postgresql/encrypted' 
WITH (encryption_key_id = 'master-key-1');

-- Move sensitive tables to encrypted tablespace
ALTER TABLE users SET TABLESPACE encrypted_data;
ALTER TABLE audit_logs SET TABLESPACE encrypted_data;
```

### 3.3 API Security
```typescript
// shared/src/middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

export const securityMiddleware = [
  // Security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.smartbudget.edu"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  // Rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      auditService.logSecurityEvent({
        type: 'rate_limit_exceeded',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path
      });
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP'
        }
      });
    }
  }),

  // Slow down repeated requests
  slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per 15 minutes at full speed
    delayMs: 500 // slow down subsequent requests by 500ms per request
  })
];

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return validator.escape(obj.trim());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[validator.escape(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}
```

## 4. Mobile App Security

### 4.1 Certificate Pinning
```typescript
// mobile/src/services/ApiClient.ts
import { NetworkingModule } from 'react-native';

export class SecureApiClient {
  private baseURL: string;
  private certificateFingerprints: string[];

  constructor() {
    this.baseURL = process.env.API_BASE_URL!;
    this.certificateFingerprints = [
      'SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Production cert
      'SHA256:BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='  // Backup cert
    ];
  }

  async makeRequest(endpoint: string, options: RequestOptions): Promise<any> {
    // Verify certificate pinning
    if (Platform.OS !== 'web') {
      await this.verifyCertificate();
    }

    // Add security headers
    const headers = {
      ...options.headers,
      'X-Requested-With': 'SmartBudgetApp',
      'X-App-Version': Constants.expoConfig?.version || '1.0.0',
      'X-Platform': Platform.OS,
      'X-Device-ID': await this.getDeviceId()
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });

    // Verify response integrity
    await this.verifyResponseIntegrity(response);

    return response.json();
  }

  private async verifyCertificate(): Promise<void> {
    // Implementation depends on platform-specific certificate pinning
    // For production, use libraries like react-native-cert-pinner
  }

  private async verifyResponseIntegrity(response: Response): Promise<void> {
    const signature = response.headers.get('X-Response-Signature');
    if (!signature) {
      throw new Error('Missing response signature');
    }

    // Verify HMAC signature of response body
    const body = await response.clone().text();
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RESPONSE_SIGNING_KEY!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Response integrity check failed');
    }
  }
}
```

### 4.2 Root/Jailbreak Detection
```typescript
// mobile/src/security/DeviceIntegrity.ts
import JailMonkey from 'jail-monkey';
import DeviceInfo from 'react-native-device-info';

export class DeviceIntegrityService {
  async checkDeviceIntegrity(): Promise<IntegrityResult> {
    const checks = {
      isJailBroken: JailMonkey.isJailBroken(),
      isOnExternalStorage: JailMonkey.isOnExternalStorage(),
      isDebuggedMode: await JailMonkey.isDebuggedMode(),
      isDevelopmentSettingsMode: JailMonkey.isDevelopmentSettingsMode(),
      hasHooks: JailMonkey.hookDetected(),
      isEmulator: await DeviceInfo.isEmulator(),
    };

    const riskScore = this.calculateRiskScore(checks);
    const isSecure = riskScore < 0.3; // 30% risk threshold

    return {
      isSecure,
      riskScore,
      checks,
      recommendations: this.getSecurityRecommendations(checks)
    };
  }

  private calculateRiskScore(checks: Record<string, boolean>): number {
    const weights = {
      isJailBroken: 0.4,
      isOnExternalStorage: 0.2,
      isDebuggedMode: 0.2,
      isDevelopmentSettingsMode: 0.1,
      hasHooks: 0.3,
      isEmulator: 0.1
    };

    let score = 0;
    for (const [check, result] of Object.entries(checks)) {
      if (result && weights[check]) {
        score += weights[check];
      }
    }

    return Math.min(score, 1.0);
  }

  async enforceSecurityPolicy(integrityResult: IntegrityResult): Promise<void> {
    if (!integrityResult.isSecure) {
      // Log security violation
      await auditService.logSecurityEvent({
        type: 'device_integrity_violation',
        deviceId: await DeviceInfo.getUniqueId(),
        riskScore: integrityResult.riskScore,
        checks: integrityResult.checks
      });

      // Block access for high-risk devices
      if (integrityResult.riskScore > 0.7) {
        throw new SecurityError('Device security requirements not met');
      }

      // Show warning for medium-risk devices
      if (integrityResult.riskScore > 0.3) {
        Alert.alert(
          'Security Warning',
          'Your device may have security vulnerabilities. Some features may be limited.',
          [{ text: 'OK' }]
        );
      }
    }
  }
}
```

## 5. Network Security

### 5.1 TLS Configuration
```typescript
// api-gateway/src/config/tls.ts
import https from 'https';
import fs from 'fs';

export const tlsOptions = {
  key: fs.readFileSync(process.env.TLS_PRIVATE_KEY_PATH!),
  cert: fs.readFileSync(process.env.TLS_CERTIFICATE_PATH!),
  ca: fs.readFileSync(process.env.TLS_CA_PATH!),
  
  // Security settings
  secureProtocol: 'TLSv1_2_method',
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384'
  ].join(':'),
  honorCipherOrder: true,
  
  // Client certificate verification (optional)
  requestCert: false,
  rejectUnauthorized: true
};

// Create HTTPS server
export const createSecureServer = (app: Express) => {
  return https.createServer(tlsOptions, app);
};
```

### 5.2 API Gateway Security
```typescript
// api-gateway/src/middleware/security.ts
export const apiSecurityMiddleware = [
  // Request ID for tracking
  (req: Request, res: Response, next: NextFunction) => {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
  },

  // IP whitelist for admin endpoints
  (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/v1/admin')) {
      const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
      const clientIP = req.ip || req.connection.remoteAddress;
      
      if (!allowedIPs.includes(clientIP)) {
        auditService.logSecurityEvent({
          type: 'unauthorized_admin_access',
          ipAddress: clientIP,
          endpoint: req.path,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'IP_NOT_ALLOWED',
            message: 'Access denied from this IP address'
          }
        });
      }
    }
    next();
  },

  // Request size limiting
  express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      // Check for malicious payloads
      const body = buf.toString();
      if (body.includes('<script>') || body.includes('javascript:')) {
        throw new Error('Potentially malicious content detected');
      }
    }
  }),

  // CORS with strict origin checking
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      
      // Allow requests with no origin (mobile apps)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        auditService.logSecurityEvent({
          type: 'cors_violation',
          origin,
          userAgent: req.get('User-Agent')
        });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  })
];
```

## 6. Audit and Compliance

### 6.1 Comprehensive Audit Logging
```typescript
// shared/src/services/AuditService.ts
export class AuditService {
  async logUserAction(action: UserAction): Promise<void> {
    const auditEntry = {
      id: uuidv4(),
      userId: action.userId,
      sessionId: action.sessionId,
      action: action.type,
      resourceType: action.resourceType,
      resourceId: action.resourceId,
      oldValues: action.oldValues ? JSON.stringify(action.oldValues) : null,
      newValues: action.newValues ? JSON.stringify(action.newValues) : null,
      ipAddress: action.ipAddress,
      userAgent: action.userAgent,
      success: action.success,
      errorMessage: action.errorMessage,
      requestId: action.requestId,
      createdAt: new Date()
    };

    // Store in database
    await auditRepository.create(auditEntry);

    // Also send to external SIEM if configured
    if (process.env.SIEM_ENDPOINT) {
      await this.sendToSIEM(auditEntry);
    }

    // Real-time alerting for critical actions
    if (this.isCriticalAction(action.type)) {
      await alertingService.sendSecurityAlert(auditEntry);
    }
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const securityEntry = {
      id: uuidv4(),
      eventType: event.type,
      severity: event.severity || 'medium',
      description: event.description,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      userId: event.userId,
      additionalData: event.data ? JSON.stringify(event.data) : null,
      createdAt: new Date()
    };

    await securityEventRepository.create(securityEntry);

    // Immediate alerting for high-severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      await alertingService.sendImmediateAlert(securityEntry);
    }
  }

  private isCriticalAction(action: string): boolean {
    const criticalActions = [
      'approve_high_value_request', // >₹2L
      'user_role_change',
      'budget_allocation_change',
      'system_config_change',
      'bulk_approval',
      'emergency_override'
    ];
    
    return criticalActions.includes(action);
  }

  async generateAuditReport(params: AuditReportParams): Promise<AuditReport> {
    const query = `
      SELECT 
        al.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.role,
        d.name as department_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE al.created_at BETWEEN $1 AND $2
        AND ($3 IS NULL OR al.action = ANY($3))
        AND ($4 IS NULL OR u.department_id = ANY($4))
      ORDER BY al.created_at DESC
    `;

    const results = await dbPool.query(query, [
      params.startDate,
      params.endDate,
      params.actions,
      params.departmentIds
    ]);

    return {
      entries: results.rows,
      summary: await this.generateAuditSummary(params),
      generatedAt: new Date(),
      generatedBy: params.requestedBy
    };
  }
}
```

### 6.2 GDPR Compliance
```typescript
// shared/src/services/GDPRService.ts
export class GDPRService {
  async exportUserData(userId: string): Promise<UserDataExport> {
    // Collect all user data across services
    const [
      userData,
      budgetRequests,
      approvals,
      documents,
      notifications,
      auditLogs
    ] = await Promise.all([
      userService.getUserData(userId),
      budgetService.getUserRequests(userId),
      approvalService.getUserApprovals(userId),
      documentService.getUserDocuments(userId),
      notificationService.getUserNotifications(userId),
      auditService.getUserAuditLogs(userId)
    ]);

    return {
      exportId: uuidv4(),
      userId,
      exportedAt: new Date(),
      data: {
        profile: userData,
        budgetRequests,
        approvals,
        documents: documents.map(doc => ({
          ...doc,
          downloadUrl: doc.url // Temporary signed URL
        })),
        notifications,
        auditTrail: auditLogs
      },
      dataRetentionInfo: {
        budgetRequests: '7 years (financial regulations)',
        auditLogs: '10 years (compliance requirements)',
        personalData: 'Until account deletion requested'
      }
    };
  }

  async deleteUserData(userId: string, reason: string): Promise<DeletionResult> {
    const transaction = await dbPool.transaction();
    
    try {
      // Check for data retention requirements
      const retentionCheck = await this.checkDataRetentionRequirements(userId);
      if (!retentionCheck.canDelete) {
        throw new Error(`Cannot delete data: ${retentionCheck.reason}`);
      }

      // Anonymize instead of delete for audit compliance
      await this.anonymizeUserData(userId, transaction);
      
      // Delete non-essential personal data
      await this.deletePersonalData(userId, transaction);
      
      // Log deletion
      await auditService.logUserAction({
        userId: null, // System action
        type: 'user_data_deleted',
        resourceType: 'user',
        resourceId: userId,
        success: true,
        reason
      });

      await transaction.commit();

      return {
        success: true,
        deletedAt: new Date(),
        retainedData: retentionCheck.retainedItems,
        anonymizedData: ['audit_logs', 'budget_requests']
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async anonymizeUserData(userId: string, transaction: any): Promise<void> {
    const anonymousId = `ANON_${Date.now()}`;
    
    // Anonymize audit logs
    await transaction.query(
      'UPDATE audit_logs SET user_id = NULL, ip_address = NULL, user_agent = $1 WHERE user_id = $2',
      ['ANONYMIZED', userId]
    );

    // Anonymize budget requests (keep for financial records)
    await transaction.query(
      'UPDATE budget_requests SET requester_id = NULL WHERE requester_id = $1',
      [userId]
    );
  }
}
```

## 7. Security Monitoring and Incident Response

### 7.1 Security Information and Event Management (SIEM)
```typescript
// security/src/services/SIEMService.ts
export class SIEMService {
  async analyzeSecurityEvents(): Promise<SecurityAnalysis> {
    const recentEvents = await this.getRecentSecurityEvents(24); // Last 24 hours
    
    const analysis = {
      suspiciousLogins: this.detectSuspiciousLogins(recentEvents),
      bruteForceAttempts: this.detectBruteForceAttempts(recentEvents),
      unusualDataAccess: this.detectUnusualDataAccess(recentEvents),
      privilegeEscalation: this.detectPrivilegeEscalation(recentEvents),
      dataExfiltration: this.detectDataExfiltration(recentEvents)
    };

    // Generate alerts for high-risk events
    for (const [category, incidents] of Object.entries(analysis)) {
      if (incidents.length > 0) {
        await this.generateSecurityAlert(category, incidents);
      }
    }

    return analysis;
  }

  private detectSuspiciousLogins(events: SecurityEvent[]): SuspiciousActivity[] {
    const loginEvents = events.filter(e => e.type === 'login_attempt');
    const suspicious: SuspiciousActivity[] = [];

    // Group by user
    const userLogins = groupBy(loginEvents, 'userId');
    
    for (const [userId, logins] of Object.entries(userLogins)) {
      // Multiple failed attempts
      const failedLogins = logins.filter(l => !l.success);
      if (failedLogins.length >= 5) {
        suspicious.push({
          type: 'multiple_failed_logins',
          userId,
          count: failedLogins.length,
          timespan: '24 hours',
          riskLevel: 'high'
        });
      }

      // Logins from multiple locations
      const uniqueIPs = new Set(logins.map(l => l.ipAddress));
      if (uniqueIPs.size >= 3) {
        suspicious.push({
          type: 'multiple_location_logins',
          userId,
          locations: Array.from(uniqueIPs),
          riskLevel: 'medium'
        });
      }

      // Unusual time patterns
      const nightLogins = logins.filter(l => {
        const hour = new Date(l.timestamp).getHours();
        return hour < 6 || hour > 22;
      });
      
      if (nightLogins.length >= 3) {
        suspicious.push({
          type: 'unusual_time_access',
          userId,
          count: nightLogins.length,
          riskLevel: 'medium'
        });
      }
    }

    return suspicious;
  }

  private async generateSecurityAlert(
    category: string, 
    incidents: SuspiciousActivity[]
  ): Promise<void> {
    const alert = {
      id: uuidv4(),
      category,
      severity: this.calculateAlertSeverity(incidents),
      incidents,
      detectedAt: new Date(),
      status: 'open'
    };

    // Store alert
    await securityAlertRepository.create(alert);

    // Send notifications
    await this.notifySecurityTeam(alert);

    // Auto-response for critical alerts
    if (alert.severity === 'critical') {
      await this.executeAutoResponse(alert);
    }
  }

  private async executeAutoResponse(alert: SecurityAlert): Promise<void> {
    switch (alert.category) {
      case 'bruteForceAttempts':
        // Temporarily block IP addresses
        for (const incident of alert.incidents) {
          await this.blockIPAddress(incident.ipAddress, '1 hour');
        }
        break;
        
      case 'privilegeEscalation':
        // Lock affected user accounts
        for (const incident of alert.incidents) {
          await userService.lockAccount(incident.userId, 'Security incident');
        }
        break;
        
      case 'dataExfiltration':
        // Revoke all sessions for affected users
        for (const incident of alert.incidents) {
          await sessionService.revokeAllUserSessions(incident.userId);
        }
        break;
    }
  }
}
```

### 7.2 Incident Response Procedures
```typescript
// security/src/services/IncidentResponseService.ts
export class IncidentResponseService {
  async handleSecurityIncident(incident: SecurityIncident): Promise<IncidentResponse> {
    const response = {
      incidentId: uuidv4(),
      severity: incident.severity,
      status: 'investigating',
      startedAt: new Date(),
      actions: []
    };

    // Immediate containment
    if (incident.severity === 'critical') {
      await this.executeImmediateContainment(incident);
      response.actions.push('immediate_containment_executed');
    }

    // Notify incident response team
    await this.notifyIncidentTeam(incident);
    response.actions.push('team_notified');

    // Preserve evidence
    await this.preserveEvidence(incident);
    response.actions.push('evidence_preserved');

    // Begin investigation
    await this.startInvestigation(incident);
    response.actions.push('investigation_started');

    return response;
  }

  private async executeImmediateContainment(incident: SecurityIncident): Promise<void> {
    switch (incident.type) {
      case 'data_breach':
        // Isolate affected systems
        await this.isolateAffectedSystems(incident.affectedSystems);
        // Revoke compromised credentials
        await this.revokeCompromisedCredentials(incident.affectedUsers);
        break;
        
      case 'malware_detected':
        // Quarantine infected systems
        await this.quarantineInfectedSystems(incident.affectedSystems);
        break;
        
      case 'unauthorized_access':
        // Lock affected accounts
        await this.lockAffectedAccounts(incident.affectedUsers);
        // Block suspicious IP addresses
        await this.blockSuspiciousIPs(incident.sourceIPs);
        break;
    }
  }

  async generateIncidentReport(incidentId: string): Promise<IncidentReport> {
    const incident = await incidentRepository.getById(incidentId);
    const timeline = await this.getIncidentTimeline(incidentId);
    const impact = await this.assessIncidentImpact(incident);
    const lessons = await this.extractLessonsLearned(incident);

    return {
      incident,
      timeline,
      impact,
      rootCause: incident.rootCause,
      remediation: incident.remediationSteps,
      prevention: lessons.preventionMeasures,
      generatedAt: new Date()
    };
  }
}
```

## 8. Security Testing and Validation

### 8.1 Automated Security Testing
```typescript
// security/tests/SecurityTests.ts
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should prevent SQL injection in login', async () => {
      const maliciousPayload = {
        email: "admin@test.com'; DROP TABLE users; --",
        password: "password"
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should enforce rate limiting', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'test@test.com', password: 'wrong' })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should validate JWT tokens properly', async () => {
      const invalidToken = 'invalid.jwt.token';
      
      const response = await request(app)
        .get('/api/v1/budget/requests')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Authorization', () => {
    it('should enforce role-based access control', async () => {
      const staffToken = await getTestToken('staff');
      
      const response = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ email: 'new@test.com' });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should prevent horizontal privilege escalation', async () => {
      const user1Token = await getTestToken('staff', 'user1');
      const user2RequestId = 'user2-request-id';
      
      const response = await request(app)
        .get(`/api/v1/budget/requests/${user2RequestId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Input Validation', () => {
    it('should sanitize XSS attempts', async () => {
      const xssPayload = {
        title: '<script>alert("xss")</script>',
        description: 'Normal description',
        amount: 50000
      };

      const token = await getTestToken('staff');
      const response = await request(app)
        .post('/api/v1/budget/requests')
        .set('Authorization', `Bearer ${token}`)
        .send(xssPayload);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### 8.2 Penetration Testing Checklist
```markdown
## Annual Penetration Testing Scope

### Web Application Testing
- [ ] Authentication bypass attempts
- [ ] Session management vulnerabilities
- [ ] Input validation and injection attacks
- [ ] Business logic flaws
- [ ] File upload vulnerabilities
- [ ] API security testing
- [ ] CORS misconfigurations

### Mobile Application Testing
- [ ] Static analysis of app binaries
- [ ] Dynamic analysis during runtime
- [ ] Local data storage security
- [ ] Network communication security
- [ ] Certificate pinning validation
- [ ] Root/jailbreak detection bypass
- [ ] Reverse engineering resistance

### Infrastructure Testing
- [ ] Network segmentation validation
- [ ] Database security assessment
- [ ] Cloud configuration review
- [ ] Container security scanning
- [ ] Secrets management validation
- [ ] Backup security verification

### Social Engineering Testing
- [ ] Phishing simulation campaigns
- [ ] Physical security assessment
- [ ] Employee security awareness validation
- [ ] Vendor security verification
```

## 9. Compliance Framework

### 9.1 Regulatory Compliance Matrix
| Regulation | Requirement | Implementation | Status |
|------------|-------------|----------------|--------|
| **IT Act 2000 (India)** | Data protection | Encryption at rest/transit | ✅ |
| **RBI Guidelines** | Financial audit trails | Comprehensive logging | ✅ |
| **GDPR** | Right to be forgotten | Data export/deletion APIs | ✅ |
| **ISO 27001** | Information security management | Security policies and procedures | 🔄 |
| **SOX Compliance** | Financial controls | Approval workflows and audit trails | ✅ |
| **FERPA** | Educational records protection | Access controls and encryption | ✅ |

### 9.2 Security Policies
```typescript
// shared/src/policies/SecurityPolicies.ts
export const SECURITY_POLICIES = {
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 12, // Last 12 passwords
    maxAge: 90, // Days
    lockoutThreshold: 5,
    lockoutDuration: 30 // Minutes
  },

  sessionPolicy: {
    maxDuration: 8 * 60 * 60, // 8 hours
    idleTimeout: 30 * 60, // 30 minutes
    maxConcurrentSessions: 3,
    requireReauthForSensitive: true
  },

  dataRetentionPolicy: {
    budgetRequests: 7 * 365, // 7 years in days
    auditLogs: 10 * 365, // 10 years in days
    userSessions: 90, // 90 days
    notifications: 365, // 1 year
    documents: 7 * 365 // 7 years
  },

  encryptionPolicy: {
    algorithm: 'AES-256-GCM',
    keyRotationInterval: 90, // Days
    minimumTLSVersion: '1.2',
    certificateValidityPeriod: 365 // Days
  }
};
```

## 10. Security Training and Awareness

### 10.1 Developer Security Training
```markdown
## Mandatory Security Training Topics

### Secure Coding Practices
- Input validation and sanitization
- SQL injection prevention
- XSS prevention techniques
- Authentication and session management
- Error handling and information disclosure
- Cryptographic best practices

### Mobile Security
- Secure storage mechanisms
- Certificate pinning implementation
- Root/jailbreak detection
- Code obfuscation techniques
- Secure communication protocols

### API Security
- OAuth 2.0 and JWT best practices
- Rate limiting implementation
- CORS configuration
- API versioning and deprecation
- Security testing automation

### Incident Response
- Security incident identification
- Escalation procedures
- Evidence preservation
- Communication protocols
- Post-incident analysis
```

### 10.2 User Security Awareness
```markdown
## User Security Training Program

### For All Users
- Password security best practices
- Phishing recognition and reporting
- Mobile device security
- Social engineering awareness
- Incident reporting procedures

### For Administrators
- Privileged access management
- System configuration security
- Vendor security assessment
- Backup and recovery procedures
- Compliance requirements

### For Approvers
- Digital signature verification
- Approval authority limits
- Delegation procedures
- Fraud detection indicators
- Emergency override protocols
```

This comprehensive security framework ensures the Smart Budget Management System meets enterprise-grade security requirements while maintaining usability and compliance with educational sector regulations.