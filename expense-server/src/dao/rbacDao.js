const User = require("../model/users");

const generateTemporaryPassword = (designedLength) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";
  for (let i = 0; i < designedLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const rbacDao = {
  create: async (email, name, role, password, adminId) => {
     return await User.create({
      email: email,
      password: password,
      name: name,
      role: role,
      adminId: adminId,
    });
  },
  update: async (userId, name, role) => {
    return await User.findByIdAndUpdate(userId, { name, role }, { new: true });
  },
  delete: async (userId) => {
    return await User.findByIdAndDelete(userId);
  },

  getUsersByAdminId: async (adminId) => {
    return await User.find({ adminId }).select("-password");
  },
};

module.exports = rbacDao;