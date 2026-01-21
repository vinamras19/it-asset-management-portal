export const rolePermissions = {
    employee: {
        assets: ['read'],
        selection: ['create', 'read', 'update', 'delete'],
        requests: ['create', 'read'],
        profile: ['read', 'update'],
        tickets: ['create', 'read']
    },
    warehouse_manager: {
        assets: ['create', 'read', 'update'],
        requests: ['read', 'update'],
        analytics: ['read'],
        profile: ['read', 'update'],
        tickets: ['read', 'update']
    },
    auditor: {
        assets: ['read'],
        requests: ['read'],
        users: ['read'],
        analytics: ['read'],
        profile: ['read', 'update'],
        audit_logs: ['read']
    },
    admin: {
        assets: ['create', 'read', 'update', 'delete'],
        requests: ['create', 'read', 'update', 'delete'],
        users: ['create', 'read', 'update', 'delete'],
        analytics: ['read'],
        selection: ['read', 'delete'],
        profile: ['read', 'update', 'delete'],
        audit_logs: ['read'],
        tickets: ['create', 'read', 'update', 'delete'],
        licenses: ['create', 'read', 'update', 'delete']
    }
};
export const hasPermission = (role, resource, action) => {
    const permissions = rolePermissions[role];
    if (!permissions) return false;
    if (!permissions[resource]) return false;
    return permissions[resource].includes(action);
};