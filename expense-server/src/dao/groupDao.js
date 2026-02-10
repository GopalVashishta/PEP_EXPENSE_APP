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
        const group = await group.findById(groupId).select('paymentStatus.date');
        return group ? group.paymentStatus.data: null;
    },
    // Default sorted by createdAt desc(recent first)
    getGroupsPaginated: async (email, limit, skip, sortOptions={ createdAt: -1}) => {
        // limits = page-size, skip/Offset = where to start, coz if some already loaded skip them
        
        const[groups,totalCount] = await Promise.all([
            // Find groups with given email,
            // sort them to preserve order across pages,
            // skip and limit to get results of desired page.
            group.find({membersEmail: email})
                 .sort(sortOptions)
                 .skip(skip)
                 .limit(limit),
            // Count the no. of records in the collection
            group.countDocuments({membersEmail: email})
        ]); // async+await executes 2 in sequence, but promise both in parallel

        return {groups, totalCount};
    },
}

module.exports = groupDao;