const jwt = require('jsonwebtoken');
const { ADMIN_ROLE } = require('../utility/userRoles');

const authMiddleware = {
    protect: async (req, resp, next) => {
        try{
            const token = req.cookies?.jwtToken;
            if(!token) {
                return resp.status(401).json({message: "Unauthorized: No token provided"});
            }
            try{ 
                const user = jwt.verify(token, process.env.JWT_SECRET_KEY);
                req.user = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role ? user.role: ADMIN_ROLE,
                    adminId : user.adminId ? user.adminId: user._id
                };
                next();
            }
            catch(err){
                return resp.status(401).json({message: "Unauthorized access"});
            }
        }
        catch(error){
            console.log("Authentication error", error);
            resp.status(500).json({message: "Internal server error"});
        }
        
    },
}
module.exports = authMiddleware;