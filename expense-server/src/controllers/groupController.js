const groupDao = require('../dao/groupDao');

const groupController = {
    createGroup: async (req, resp) => {
        try{
            const {name, description, adminEmail, memberEmail, thumbnail} = req.body;
            if(!name || !adminEmail) {
                return resp.status(400).json({ message: "Name and Admin Email are required" });
            }
            let allmembers = [adminEmail];
            if(memberEmail && Array.isArray(memberEmail)) {
                allmembers = [... new Set([adminEmail, ...memberEmail])];
            }
            const newGroup = await groupDao.create({
                name,
                description, adminEmail,
                membersEmail: allmembers,
                thumbnail
            });
            return resp.status(201).json({ message: "Group created successfully", group: newGroup });
        }
        catch(err) {
            console.log("Error creating group", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    updateGroup: async (req, resp) => {
        try{
            const {groupId, name, description, thumbnail, adminEmail, paymentStatus} = req.body;
            if(!groupId) {
                return resp.status(400).json({ message: "Group ID is required" });
            }
            const updateGroup = await groupDao.updateGroup({
                groupId, name, description, thumbnail, adminEmail, paymentStatus
            });
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
    
    getGroupByStatus: async (req, resp) => {
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
    
    getGroupByEmail: async (req, resp) => {
        try{
            const {email} = req.body;
            if(!email) {
                return resp.status(400).json({ message: "Email and valid status are required" });
            }
            const getGroup = await groupDao.getGroupByEmail(email);
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