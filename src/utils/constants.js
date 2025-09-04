export const USER_ROLES = {
  COORDINATOR: 'coordinator',
  BUDGET_COORDINATOR: 'budget_coordinator',
  PROGRAM_COORDINATOR: 'program_coordinator',
  HOD: 'hod',
  DEAN: 'dean',
  VICE_PRINCIPAL: 'vice_principal',
  PRINCIPAL: 'principal',
  JOINT_SECRETARY: 'joint_secretary',
  SECRETARY: 'secretary'
};

export const ROLE_LABELS = {
  [USER_ROLES.COORDINATOR]: 'Coordinator',
  [USER_ROLES.BUDGET_COORDINATOR]: 'Budget Coordinator',
  [USER_ROLES.PROGRAM_COORDINATOR]: 'Program Coordinator',
  [USER_ROLES.HOD]: 'Head of Department',
  [USER_ROLES.DEAN]: 'Dean',
  [USER_ROLES.VICE_PRINCIPAL]: 'Vice Principal',
  [USER_ROLES.PRINCIPAL]: 'Principal',
  [USER_ROLES.JOINT_SECRETARY]: 'Joint Secretary',
  [USER_ROLES.SECRETARY]: 'Secretary'
};

export const EVENT_CATEGORIES = {
  WORKSHOP: 'workshop',
  EVENTS: 'events',
  SEMINAR_HALLS: 'seminar_halls',
  LAB_MATERIALS: 'lab_materials',
  ALLOWANCE: 'allowance',
  GUEST_LECTURE: 'guest_lecture'
};

export const CATEGORY_LABELS = {
  [EVENT_CATEGORIES.WORKSHOP]: 'Workshop',
  [EVENT_CATEGORIES.EVENTS]: 'Events (General/Departmental)',
  [EVENT_CATEGORIES.SEMINAR_HALLS]: 'Seminar Halls',
  [EVENT_CATEGORIES.LAB_MATERIALS]: 'Lab Materials',
  [EVENT_CATEGORIES.ALLOWANCE]: 'Allowance',
  [EVENT_CATEGORIES.GUEST_LECTURE]: 'Guest Lecture'
};

export const DEPARTMENTS = [
  'CSE (Computer Science and Engineering)',
  'IT (Information Technology)',
  'ECE (Electronics & Communication Engineering)',
  'EEE (Electrical & Electronics Engineering)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Automobile Engineering',
  'AI & DS (Artificial Intelligence & Data Science)',
  'Mechatronics Engineering',
  'Biomedical Engineering',
  'MBA (Management Studies)',
  'MCA (Computer Applications)',
  'Science & Humanities (Maths, Physics, Chemistry, English)'
];

export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RECONCILED: 'reconciled'
};

export const APPROVAL_HIERARCHY = [
  USER_ROLES.BUDGET_COORDINATOR,
  USER_ROLES.PROGRAM_COORDINATOR,
  USER_ROLES.HOD,
  USER_ROLES.DEAN,
  USER_ROLES.VICE_PRINCIPAL,
  USER_ROLES.PRINCIPAL,
  USER_ROLES.JOINT_SECRETARY,
  USER_ROLES.SECRETARY
];