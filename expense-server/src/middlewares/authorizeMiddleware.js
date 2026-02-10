const permission = require('../utility/permission');

const authorize = (requirePermission) => {
    return (req, res, next) => {
        // (Assuming) AuthMiddleware must run before this middleware so that we can have acces to user object
        const user = req.user;
        //console.log("User role:", user.role, "Required permission:", requirePermission);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userPermissions = permission[user.role] || [];
        //console.log(userPermissions);
        if (!userPermissions.includes(requirePermission)) {
            return res.status(403).json({message: "Forbidden: Insufficient Permissions"});
        }
        next();
    }
};

module.exports = authorize;