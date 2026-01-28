const group = require('../model/group');
const fs = require('fs');
const path = require('path');

const auditDir = path.join(__dirname, '..', '..', 'auditLogs');

const ensureAuditDir = () => {
    if(!fs.existsSync(auditDir)) {
        fs.mkdirSync(auditDir, { recursive: true });
    }
};

const buildAuditPath = (groupId) => path.join(auditDir, `${groupId}_audit.log`);

const _setAuditLog = (groupId, data) => {
    if(!groupId || !data) return null;
    ensureAuditDir();
    const filePath = buildAuditPath(groupId);
    const entry = `${new Date().toISOString()} - ${data}`;
    const payload = fs.existsSync(filePath) ? `\n${entry}` : entry;
    fs.appendFileSync(filePath, payload);
    return fs.readFileSync(filePath, 'utf-8');
};

const _getAuditLog = (groupId) => {
    if(!groupId) return '';
    ensureAuditDir();
    const filePath = buildAuditPath(groupId);
    if(!fs.existsSync(filePath)) {
        return '';
    }
    return fs.readFileSync(filePath, 'utf-8');
};

const groupDao = {
    create: async (data) =>{
        const newGroup = new group(data);
        const saved = await newGroup.save();
        _setAuditLog(saved._id, `Group created by ${saved.adminEmail}`);
        return saved;        
    },

    updateGroup: async (data) =>{
        const {groupId, name, description, thumbnail, adminEmail, paymentStatus} = data;
        const updated = await group.findByIdAndUpdate(groupId,{
            name, description, thumbnail, adminEmail, paymentStatus,
        }, {new: true});
        _setAuditLog(groupId, `Group updated by ${adminEmail || 'unknown'}`);
        return updated;
    },

    addMember: async (groupId, ...membersEmail) =>{
        const updated = await group.findByIdAndUpdate(groupId, {
            $addToSet: { membersEmail: { $each: membersEmail } }
        }, { new: true });
        _setAuditLog(groupId, `Members added: ${membersEmail.join(', ')}`);
        return updated;
    },

    removeMembers: async (groupId,...membersEmail) =>{
        const updated = await group.findByIdAndUpdate(groupId, {
            $pull: { membersEmail: { $in: membersEmail } }
        }, { new: true });
        _setAuditLog(groupId, `Members removed: ${membersEmail.join(', ')}`);
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
        return _getAuditLog(groupId);
    },

    setAuditLog: async (groupId, data) => {
        return _setAuditLog(groupId, data);
    }

}

module.exports = groupDao;