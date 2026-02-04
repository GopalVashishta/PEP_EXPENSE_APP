const groupDao = require('../dao/groupDao');

const groupController = {
    createGroup: async (req, resp) => {
        try{
            const user = req.user;
            const {name, description, memberEmail, thumbnail} = req.body;
            if(!name || !user.email) {
                return resp.status(400).json({ message: "Name and Admin Email are required" });
            }
            let allmembers = [user.email];
            if(memberEmail && Array.isArray(memberEmail)) {
                allmembers = [... new Set([user.email, ...memberEmail])];
            }
            const newGroup = await groupDao.create({
                name,
                description, adminEmail: user.email,
                membersEmail: allmembers,
                thumbnail,
                paymentStatus: {
                    amount: 0,
                    currency: 'INR'
                }
            });
            return resp.status(201).json({ message: "Group created successfully", group: newGroup._id });
        }
        catch(err) {
            console.log("Error creating group", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    update: async (req, resp) => {
        try{
            const updateGroup = await groupDao.updateGroup(req.body);
            if(!updateGroup){
                return resp.status(404).json({message: "Group not found"});
            }
            return resp.status(200).json({ message: "Group updated successfully", group: updateGroup });
        }
        catch(err) {
            console.log("Error updating group", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    addMembers: async (req, resp) =>{
        try{
            const {groupId, membersEmail} = req.body;
            if(!groupId || !membersEmail || !Array.isArray(membersEmail) || membersEmail.length === 0) {
                return resp.status(400).json({ message: "Group ID and Members Email are required" });
            }
            const updateGroup = await groupDao.addMember(groupId, ...membersEmail);
            return resp.status(200).json({message: "Members added successfully", group: updateGroup });
        }
        catch(err) {
            console.log("Error adding members", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    removeMembers: async (req, resp) => {
        try{
            const {groupId, membersEmail} = req.body;
            if(!groupId || !membersEmail || !Array.isArray(membersEmail) || membersEmail.length === 0) {
                return resp.status(400).json({ message: "Group ID and Members Email are required" });
            }
            const updateGroup = await groupDao.removeMembers(groupId, ...membersEmail);
            return resp.status(200).json({message: "Members removed successfully", group: updateGroup });
        }
        catch(err) {
            console.log("Error removing members", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    }, 
    
    getGroupByUser: async (req, resp) => {
        try{
            const email = req.user.email; // sent via authMiddleware
            if(!email) {
                return resp.status(400).json({ message: "Email and valid status are required" });
            }
            const getGroup = await groupDao.getGroupByEmail(email);
            return resp.status(200).json({ message: "Groups fetched successfully", groups: getGroup });
        }
        catch(err) {
            console.log("Error fetching groups by status", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    }, 

    getGroupByPaymentStatus: async (req, resp) => {
        try{
            const {email, status} = req.body;
            if(!email || typeof status !== 'boolean') {
                return resp.status(400).json({ message: "Email and valid status are required" });
            }
            const getGroup = await groupDao.getGroupByStatus(email, status);
            // TODO: SHOW ON FRONTEND
            return resp.status(200).json({ message: "Groups fetched successfully", groups: getGroup });
        }
        catch(err) {
            console.log("Error fetching groups by status", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },  

    getAuditLog: async (req, resp) => {
        try{
            const {groupId} = req.body;
            if(!groupId) {
                return resp.status(400).json({ message: "Group ID is required" });
            }
            const auditLog = await groupDao.getAuditLog(groupId);
            //TODO: SHOW ON FRONTEND
            return resp.status(200).json({ message: "Audit log fetched successfully", auditLog });
        }
        catch(err) {
            console.log("Error fetching audit log", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

};
module.exports = groupController;