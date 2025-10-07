export const USER_ROLE = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  USER: 'USER',
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
  HR: 'HR',
  MARKETING_TEAM: 'MARKETING_TEAM',
  CUSTOMER_SERVICE_TEAM: 'CUSTOMER_SERVICE_TEAM',
} as const;

  export const USER_STATUS = {
    ACTIVE: 'ACTIVE',
    BLOCKED: 'BLOCKED',
  } as const;
  
  export const UserSearchableFields = [
    'name',
    'email',
    'mobileNumber',
    'phone',
    'nid',
    'role',
    'status',
  ];