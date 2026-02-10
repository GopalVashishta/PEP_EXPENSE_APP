const groupDao = require('../dao/groupDao');
const usersController = require('./profileController');

const groupController = {
    create: async (req, resp) => {
        try{
            const user = req.user;
            const userInfo = await usersController.getUserInfo(user.email);
            if(userInfo.credits  === undefined) {
                userInfo.credits = 1; //for backward compatibility, if already exisiting user doesn't have enough creds
            }
            if(userInfo.credits == 0) {
                return resp.status(400).json({ message: "Insufficient credits to create a group" });
            }
            
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
                    currency: 'INR',
                    date: Date.now(),
                    isPaid: false
                }
            });
            userInfo.credits -= 1; // 1 credit to create a group
            await userInfo.save();

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
            return resp.status(200).json(updateGroup);
        }
        catch(err) {
            console.log("Error updating group", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    addMembers: async (req, resp) =>{
        try{
            const {groupId, emails} = req.body;
            if(!groupId || !emails || !Array.isArray(emails) || emails.length === 0) {
                return resp.status(400).json({ message: "Group ID and Members Email are required" });
            }
            const updateGroup = await groupDao.addMember(groupId, ...emails);
            return resp.status(200).json({message: "Members added successfully", group: updateGroup });
        }
        catch(err) {
            console.log("Error adding members", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    removeMembers: async (req, resp) => {
        try{
            const {groupId, emails} = req.body;
            if(!groupId || !emails || !Array.isArray(emails) || emails.length === 0) {
                return resp.status(400).json({ message: "Group ID and Members Email are required" });
            }
            const updateGroup = await groupDao.removeMembers(groupId, ...emails);
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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            if(!email) {
                return resp.status(400).json({ message: "Email and valid status are required" });
            }

            const sortBy = req.query.sortBy || 'newest';
            let sortOptions = {createdAt: -1};
            if(sortBy === 'oldest'){
                sortOptions = {createdAt: 1};
            }
            const { groups, totalCount } = await groupDao.getGroupsPaginated(email, limit, skip, sortOptions);
            resp.status(200).json({
                groups: groups,
                pagination: {
                    totalItems: totalCount,
                    totalPages: Math.ceil(totalCount/limit),
                    currentPage: page,
                    itemsPerPage: limit
                }
            });
        }
        catch(err) {
            console.log("Error fetching groups by status", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    }, 

    getGroupByPaymentStatus: async (req, resp) => {
        try{
            const {isPaid} = req.query;
            const status = isPaid === 'true';
            const getGroup = await groupDao.getGroupByStatus(email, status);
            // TODO: SHOW ON FRONTEND
            return resp.status(200).json(getGroup);
        }
        catch(err) {
            console.log("Error fetching groups by status", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },  

    getAudit: async (req, resp) => {
        try{
            const {groupId} = req.body;
            if(!groupId) {
                return resp.status(400).json({ message: "Group ID is required" });
            }
            const auditLog = await groupDao.getAuditLog(groupId);
            //TODO: SHOW ON FRONTEND
            return resp.status(200).json({ auditLog });
        }
        catch(err) {
            console.log("Error fetching audit log", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

};
module.exports = groupController;