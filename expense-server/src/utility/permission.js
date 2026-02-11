const { ADMIN_ROLE, VIEWER_ROLE, MANAGER_ROLE } = require('../utility/userRoles');

const permissions = {
    [ADMIN_ROLE] : [
        'user:create',
        'user:update',
        'user:delete',
        'user:view',
        'group:create',
        'group:update',
        'group:delete',
        'group:view',
        'group:members:add',
        'group:members:remove',
        'payment:create',
        'expense:create',
        'expense:view',
        'expense:update',
        'expense:delete',
        'expense:settle',
    ],
    [VIEWER_ROLE] : [
        'user:view',
        'group:view',
        'expense:view',
    ],
    [MANAGER_ROLE] : [
        'user:view',
        'group:create',
        'group:update',
        'group:view',
        'group:members:add',
        'group:members:remove',
        'expense:create',
        'expense:view',
        'expense:update',
        'expense:delete',
        'expense:settle',
    ]
}
module.exports = permissions;