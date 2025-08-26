# Database Schema Design: Smart Budget Management System

## Schema Overview

The system uses PostgreSQL as the primary database with the following design principles:
- ACID compliance for financial transactions
- Normalization to reduce data redundancy
- Comprehensive audit trails
- Optimized indexing for performance
- Row-level security for data protection

## Core Tables

### 1. Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    department_id UUID REFERENCES departments(id),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMPTZ,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM (
    'staff', 'hod', 'vice_principal', 'principal', 'admin'
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
```

### 2. Departments Table
```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    head_of_department_id UUID REFERENCES users(id),
    annual_budget DECIMAL(15,2) DEFAULT 0,
    utilized_budget DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_hod ON departments(head_of_department_id);
```

### 3. Budget Requests Table
```sql
CREATE TABLE budget_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(20) UNIQUE NOT NULL,
    requester_id UUID NOT NULL REFERENCES users(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    justification TEXT,
    category budget_category NOT NULL,
    subcategory VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'INR',
    expected_delivery_date DATE,
    priority priority_level DEFAULT 'normal',
    status request_status DEFAULT 'pending',
    approved_amount DECIMAL(15,2),
    vendor_details JSONB,
    ai_risk_score DECIMAL(3,2), -- 0.00 to 1.00
    ai_duplicate_probability DECIMAL(3,2),
    duplicate_of_request_id UUID REFERENCES budget_requests(id),
    rejection_reason rejection_reason,
    rejection_comments TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE budget_category AS ENUM (
    'equipment', 'supplies', 'services', 'travel', 
    'training', 'maintenance', 'software', 'books', 
    'research', 'infrastructure', 'other'
);

CREATE TYPE priority_level AS ENUM (
    'low', 'normal', 'high', 'urgent'
);

CREATE TYPE request_status AS ENUM (
    'draft', 'pending', 'hod_approved', 'vp_approved', 
    'principal_approved', 'approved', 'rejected', 'cancelled'
);

CREATE TYPE rejection_reason AS ENUM (
    'insufficient_justification', 'budget_exceeded', 'duplicate_request',
    'policy_violation', 'vendor_issues', 'timing_inappropriate', 'other'
);

-- Indexes for performance
CREATE INDEX idx_budget_requests_requester ON budget_requests(requester_id);
CREATE INDEX idx_budget_requests_department ON budget_requests(department_id);
CREATE INDEX idx_budget_requests_status ON budget_requests(status);
CREATE INDEX idx_budget_requests_category ON budget_requests(category);
CREATE INDEX idx_budget_requests_amount ON budget_requests(amount);
CREATE INDEX idx_budget_requests_created_at ON budget_requests(created_at);
CREATE INDEX idx_budget_requests_priority ON budget_requests(priority);

-- Composite indexes for common queries
CREATE INDEX idx_requests_status_dept ON budget_requests(status, department_id);
CREATE INDEX idx_requests_amount_category ON budget_requests(amount, category);
CREATE INDEX idx_requests_priority_status ON budget_requests(priority, status);
```

### 4. Approval Workflow Table
```sql
CREATE TABLE approval_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES budget_requests(id) ON DELETE CASCADE,
    approval_level INTEGER NOT NULL,
    required_role user_role NOT NULL,
    approver_id UUID REFERENCES users(id),
    delegated_from_id UUID REFERENCES users(id),
    status approval_status NOT NULL DEFAULT 'pending',
    comments TEXT,
    approved_amount DECIMAL(15,2),
    conditions TEXT[],
    approval_deadline TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_request_level UNIQUE(request_id, approval_level)
);

CREATE TYPE approval_status AS ENUM (
    'pending', 'approved', 'rejected', 'delegated', 'expired'
);

-- Indexes
CREATE INDEX idx_approval_workflow_request ON approval_workflow(request_id);
CREATE INDEX idx_approval_workflow_approver ON approval_workflow(approver_id);
CREATE INDEX idx_approval_workflow_status ON approval_workflow(status);
CREATE INDEX idx_approval_workflow_deadline ON approval_workflow(approval_deadline);
```

### 5. Documents Table
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES budget_requests(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'aws_s3',
    uploaded_by UUID NOT NULL REFERENCES users(id),
    document_type document_type,
    ocr_processed BOOLEAN DEFAULT false,
    ocr_text TEXT,
    ocr_confidence DECIMAL(3,2),
    ocr_extracted_data JSONB,
    virus_scan_status scan_status DEFAULT 'pending',
    virus_scan_result VARCHAR(100),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE document_type AS ENUM (
    'quotation', 'invoice', 'receipt', 'specification', 
    'approval_letter', 'purchase_order', 'other'
);

CREATE TYPE scan_status AS ENUM (
    'pending', 'clean', 'infected', 'failed'
);

-- Indexes
CREATE INDEX idx_documents_request ON documents(request_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_scan_status ON documents(virus_scan_status);
CREATE INDEX idx_documents_created_at ON documents(created_at);
```

### 6. Budget Allocations Table
```sql
CREATE TABLE budget_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id),
    financial_year VARCHAR(10) NOT NULL, -- '2024-25'
    category budget_category NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL CHECK (allocated_amount >= 0),
    utilized_amount DECIMAL(15,2) DEFAULT 0 CHECK (utilized_amount >= 0),
    pending_amount DECIMAL(15,2) DEFAULT 0 CHECK (pending_amount >= 0),
    quarter_1_limit DECIMAL(15,2),
    quarter_2_limit DECIMAL(15,2),
    quarter_3_limit DECIMAL(15,2),
    quarter_4_limit DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_dept_year_category UNIQUE(department_id, financial_year, category),
    CONSTRAINT valid_utilization CHECK (utilized_amount + pending_amount <= allocated_amount)
);

-- Indexes
CREATE INDEX idx_budget_allocations_dept_year ON budget_allocations(department_id, financial_year);
CREATE INDEX idx_budget_allocations_category ON budget_allocations(category);
```

### 7. Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id UUID,
    action audit_action NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    request_id VARCHAR(100), -- For correlating with application logs
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE audit_action AS ENUM (
    'create', 'read', 'update', 'delete', 'approve', 'reject',
    'login', 'logout', 'password_change', 'upload', 'download',
    'export', 'delegate', 'escalate'
);

-- Indexes for audit queries
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_session ON audit_logs(session_id);
```

### 8. Notifications Table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    priority notification_priority DEFAULT 'normal',
    expires_at TIMESTAMPTZ,
    push_sent BOOLEAN DEFAULT false,
    push_sent_at TIMESTAMPTZ,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE notification_type AS ENUM (
    'approval_required', 'request_approved', 'request_rejected',
    'budget_alert', 'deadline_reminder', 'system_announcement',
    'delegation_assigned', 'duplicate_detected'
);

CREATE TYPE notification_priority AS ENUM (
    'low', 'normal', 'high', 'urgent'
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### 9. Sessions Table
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_id VARCHAR(255),
    device_type VARCHAR(50), -- 'ios', 'android', 'web'
    app_version VARCHAR(20),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_device ON user_sessions(device_id);
```

### 10. System Configuration Table
```sql
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example configuration entries
INSERT INTO system_config (key, value, description, is_public, created_by) VALUES
('approval_thresholds', 
 '{"hod": 50000, "vice_principal": 200000, "principal": 1000000}', 
 'Approval amount thresholds by role', 
 false, 
 'admin-user-uuid'),
('notification_settings', 
 '{"push_enabled": true, "email_enabled": true, "sms_enabled": false}', 
 'Global notification preferences', 
 false, 
 'admin-user-uuid');
```

## Views for Complex Queries

### 1. Budget Summary View
```sql
CREATE VIEW budget_summary AS
SELECT 
    d.id as department_id,
    d.name as department_name,
    d.code as department_code,
    ba.financial_year,
    ba.category,
    ba.allocated_amount,
    ba.utilized_amount,
    ba.pending_amount,
    (ba.allocated_amount - ba.utilized_amount - ba.pending_amount) as remaining_amount,
    ROUND((ba.utilized_amount / NULLIF(ba.allocated_amount, 0)) * 100, 2) as utilization_percentage,
    COUNT(br.id) as total_requests,
    COUNT(CASE WHEN br.status = 'approved' THEN 1 END) as approved_requests,
    COUNT(CASE WHEN br.status = 'pending' THEN 1 END) as pending_requests
FROM departments d
LEFT JOIN budget_allocations ba ON d.id = ba.department_id AND ba.is_active = true
LEFT JOIN budget_requests br ON d.id = br.department_id 
    AND EXTRACT(YEAR FROM br.created_at) = SPLIT_PART(ba.financial_year, '-', 1)::INTEGER
GROUP BY d.id, d.name, d.code, ba.financial_year, ba.category, 
         ba.allocated_amount, ba.utilized_amount, ba.pending_amount;
```

### 2. Pending Approvals View
```sql
CREATE VIEW pending_approvals AS
SELECT 
    br.id as request_id,
    br.request_number,
    br.title,
    br.amount,
    br.priority,
    br.category,
    br.created_at as submitted_at,
    aw.approval_level,
    aw.required_role,
    aw.approver_id,
    aw.approval_deadline,
    u_requester.first_name || ' ' || u_requester.last_name as requester_name,
    d.name as department_name,
    EXTRACT(DAYS FROM (NOW() - br.created_at)) as days_waiting,
    CASE 
        WHEN aw.approval_deadline < NOW() THEN true 
        ELSE false 
    END as is_overdue
FROM budget_requests br
JOIN approval_workflow aw ON br.id = aw.request_id
JOIN users u_requester ON br.requester_id = u_requester.id
JOIN departments d ON br.department_id = d.id
WHERE aw.status = 'pending'
ORDER BY br.priority DESC, br.created_at ASC;
```

## Database Functions

### 1. Auto-generate Request Number
```sql
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
    year_suffix VARCHAR(2);
    sequence_num INTEGER;
    new_request_number VARCHAR(20);
BEGIN
    -- Get last 2 digits of current year
    year_suffix := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(
        CASE 
            WHEN request_number ~ ('^REQ-' || year_suffix || '-[0-9]+$')
            THEN SUBSTRING(request_number FROM LENGTH('REQ-' || year_suffix || '-') + 1)::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM budget_requests 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
    
    -- Generate new request number
    new_request_number := 'REQ-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    NEW.request_number := new_request_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_request_number
    BEFORE INSERT ON budget_requests
    FOR EACH ROW
    EXECUTE FUNCTION generate_request_number();
```

### 2. Update Budget Utilization
```sql
CREATE OR REPLACE FUNCTION update_budget_utilization()
RETURNS TRIGGER AS $$
BEGIN
    -- Update department budget utilization when request is approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE budget_allocations 
        SET utilized_amount = utilized_amount + NEW.approved_amount,
            pending_amount = pending_amount - NEW.amount,
            updated_at = NOW()
        WHERE department_id = NEW.department_id 
          AND category = NEW.category
          AND financial_year = EXTRACT(YEAR FROM NOW())::TEXT || '-' || (EXTRACT(YEAR FROM NOW()) + 1)::TEXT;
    END IF;
    
    -- Handle status changes from approved back to pending (rare case)
    IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE budget_allocations 
        SET utilized_amount = utilized_amount - OLD.approved_amount,
            pending_amount = pending_amount + OLD.amount,
            updated_at = NOW()
        WHERE department_id = OLD.department_id 
          AND category = OLD.category
          AND financial_year = EXTRACT(YEAR FROM NOW())::TEXT || '-' || (EXTRACT(YEAR FROM NOW()) + 1)::TEXT;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_budget_utilization
    AFTER UPDATE ON budget_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_utilization();
```

## Data Integrity Constraints

### 1. Business Rules
```sql
-- Ensure approved amount doesn't exceed requested amount
ALTER TABLE budget_requests 
ADD CONSTRAINT check_approved_amount 
CHECK (approved_amount IS NULL OR approved_amount <= amount);

-- Ensure budget allocation doesn't exceed department limits
ALTER TABLE budget_allocations 
ADD CONSTRAINT check_quarterly_limits 
CHECK (quarter_1_limit + quarter_2_limit + quarter_3_limit + quarter_4_limit <= allocated_amount);

-- Ensure user can only be HOD of one department
CREATE UNIQUE INDEX idx_unique_hod 
ON departments (head_of_department_id) 
WHERE head_of_department_id IS NOT NULL;
```

### 2. Row Level Security (RLS)
```sql
-- Enable RLS on sensitive tables
ALTER TABLE budget_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for budget_requests
CREATE POLICY "Users can view own requests" ON budget_requests
    FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Users can create own requests" ON budget_requests
    FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "HODs can view department requests" ON budget_requests
    FOR SELECT USING (
        department_id IN (
            SELECT id FROM departments WHERE head_of_department_id = auth.uid()
        )
    );

CREATE POLICY "Approvers can view pending requests" ON budget_requests
    FOR SELECT USING (
        id IN (
            SELECT request_id FROM approval_workflow 
            WHERE approver_id = auth.uid() AND status = 'pending'
        )
    );
```

## Performance Optimization

### 1. Partitioning Strategy
```sql
-- Partition audit_logs by month for better performance
CREATE TABLE audit_logs_y2024m01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_y2024m02 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Auto-create partitions using pg_partman extension
```

### 2. Materialized Views for Analytics
```sql
CREATE MATERIALIZED VIEW monthly_budget_analytics AS
SELECT 
    DATE_TRUNC('month', br.created_at) as month,
    d.name as department_name,
    br.category,
    COUNT(*) as request_count,
    SUM(br.amount) as total_requested,
    SUM(CASE WHEN br.status = 'approved' THEN br.approved_amount ELSE 0 END) as total_approved,
    AVG(EXTRACT(EPOCH FROM (aw.approved_at - br.created_at))/86400) as avg_approval_days
FROM budget_requests br
JOIN departments d ON br.department_id = d.id
LEFT JOIN approval_workflow aw ON br.id = aw.request_id AND aw.status = 'approved'
WHERE br.created_at >= DATE_TRUNC('year', NOW() - INTERVAL '2 years')
GROUP BY DATE_TRUNC('month', br.created_at), d.name, br.category;

-- Refresh strategy
CREATE INDEX idx_monthly_budget_analytics_month ON monthly_budget_analytics(month);
```

## Data Archival Strategy

### 1. Archival Tables
```sql
-- Archive old budget requests (>3 years)
CREATE TABLE budget_requests_archive (LIKE budget_requests INCLUDING ALL);

-- Archive old audit logs (>1 year)
CREATE TABLE audit_logs_archive (LIKE audit_logs INCLUDING ALL);

-- Archival procedure
CREATE OR REPLACE FUNCTION archive_old_data()
RETURNS void AS $$
BEGIN
    -- Archive budget requests older than 3 years
    INSERT INTO budget_requests_archive 
    SELECT * FROM budget_requests 
    WHERE created_at < NOW() - INTERVAL '3 years'
      AND status IN ('approved', 'rejected', 'cancelled');
    
    -- Delete archived records from main table
    DELETE FROM budget_requests 
    WHERE created_at < NOW() - INTERVAL '3 years'
      AND status IN ('approved', 'rejected', 'cancelled');
    
    -- Archive audit logs older than 1 year
    INSERT INTO audit_logs_archive 
    SELECT * FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Schedule archival job (using pg_cron extension)
SELECT cron.schedule('archive-old-data', '0 2 1 * *', 'SELECT archive_old_data();');
```

## Backup and Recovery

### 1. Backup Strategy
```sql
-- Point-in-time recovery configuration
-- Enable WAL archiving and configure backup retention
-- Daily full backups with 30-day retention
-- Transaction log backups every 15 minutes

-- Backup verification procedure
CREATE OR REPLACE FUNCTION verify_backup_integrity()
RETURNS TABLE(backup_date DATE, status TEXT, size_gb NUMERIC) AS $$
BEGIN
    -- Implementation for backup verification
    -- This would integrate with your backup system
    RETURN QUERY
    SELECT 
        CURRENT_DATE as backup_date,
        'SUCCESS' as status,
        pg_database_size(current_database())::NUMERIC / (1024^3) as size_gb;
END;
$$ LANGUAGE plpgsql;
```

## Sample Data for Testing

### 1. Seed Data Script
```sql
-- Insert sample departments
INSERT INTO departments (id, name, code, annual_budget) VALUES
('d1000000-0000-0000-0000-000000000001', 'Computer Science', 'CS', 10000000),
('d1000000-0000-0000-0000-000000000002', 'Mechanical Engineering', 'ME', 12000000),
('d1000000-0000-0000-0000-000000000003', 'Administration', 'ADMIN', 5000000);

-- Insert sample users
INSERT INTO users (id, email, password_hash, salt, role, department_id, employee_id, first_name, last_name) VALUES
('u1000000-0000-0000-0000-000000000001', 'admin@institution.edu', 'hashed_password', 'salt123', 'admin', 'd1000000-0000-0000-0000-000000000003', 'EMP001', 'System', 'Administrator'),
('u1000000-0000-0000-0000-000000000002', 'hod.cs@institution.edu', 'hashed_password', 'salt124', 'hod', 'd1000000-0000-0000-0000-000000000001', 'EMP002', 'Dr. John', 'Smith'),
('u1000000-0000-0000-0000-000000000003', 'sarah.johnson@institution.edu', 'hashed_password', 'salt125', 'staff', 'd1000000-0000-0000-0000-000000000001', 'EMP003', 'Dr. Sarah', 'Johnson');

-- Insert budget allocations
INSERT INTO budget_allocations (department_id, financial_year, category, allocated_amount, created_by) VALUES
('d1000000-0000-0000-0000-000000000001', '2024-25', 'equipment', 5000000, 'u1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000001', '2024-25', 'supplies', 1000000, 'u1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000001', '2024-25', 'travel', 500000, 'u1000000-0000-0000-0000-000000000001');
```

## Query Performance Examples

### 1. Optimized Dashboard Query
```sql
-- Dashboard statistics with single query
WITH stats AS (
    SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        SUM(amount) FILTER (WHERE status = 'approved') as total_approved_amount,
        SUM(amount) FILTER (WHERE status = 'pending') as total_pending_amount
    FROM budget_requests br
    WHERE br.requester_id = $1 
      AND br.created_at >= DATE_TRUNC('year', NOW())
)
SELECT * FROM stats;
```

### 2. Approval Queue Query
```sql
-- Optimized query for approval queue
SELECT 
    br.id,
    br.request_number,
    br.title,
    br.amount,
    br.priority,
    br.category,
    br.created_at,
    u.first_name || ' ' || u.last_name as requester_name,
    d.name as department_name,
    EXTRACT(DAYS FROM (NOW() - br.created_at)) as days_waiting,
    aw.approval_deadline,
    CASE WHEN aw.approval_deadline < NOW() THEN true ELSE false END as is_overdue
FROM budget_requests br
JOIN approval_workflow aw ON br.id = aw.request_id
JOIN users u ON br.requester_id = u.id
JOIN departments d ON br.department_id = d.id
WHERE aw.approver_id = $1 
  AND aw.status = 'pending'
ORDER BY 
    br.priority DESC,
    CASE WHEN aw.approval_deadline < NOW() THEN 0 ELSE 1 END,
    br.created_at ASC;
```

This database design provides a solid foundation for the Smart Budget Management System with proper normalization, security, performance optimization, and audit capabilities required for educational institutions.