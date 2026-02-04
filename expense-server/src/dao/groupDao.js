const group = require('../model/group');

const groupDao = {
    create: async (data) =>{
        const newGroup = new group(data);
        const saved = await newGroup.save();
        return saved;        
    },

    updateGroup: async (data) =>{
        const {groupId, name, description, thumbnail, adminEmail, paymentStatus} = data;
        const updated = await group.findByIdAndUpdate(groupId,{
            name, description, thumbnail, adminEmail, paymentStatus,
        }, {new: true});
        return updated;
    },

    addMember: async (groupId, ...membersEmail) =>{
        const updated = await group.findByIdAndUpdate(groupId, {
            $addToSet: { membersEmail: { $each: membersEmail } }
        }, { new: true });
        return updated;
    },

    removeMembers: async (groupId,...membersEmail) =>{
        const updated = await group.findByIdAndUpdate(groupId, {
            $pull: { membersEmail: { $in: membersEmail } }
        }, { new: true });
        return updated;
    },

    getGroupByEmail: async (email) =>{
        return await group.find({ membersEmail: email });
    },

    getGroupByStatus: async (email, status) =>{
        return await group.find({ membersEmail: email, 'paymentStatus.isPaid': status });
    },
    /**
     * We'll only return when was the last time group
     * was settled to begin with
     * In future, we can remove this separate entity!
     * @param {*} groupId
     */
    getAuditLog: async (groupId) =>{
        //return _getAuditLog(groupId);
        const group = await Group.findById(groupId).select('paymentStatus.date');
        return group ? group.paymentStatus.data: null;
    },

}

module.exports = groupDao;