const userDao = require('../dao/userDao');

const usersController = {
    getUserInfo: async (req, resp) => {
        try{
            const email = req.user.email;
            const user = await userDao.findByEmail(email);
            return resp.json({ user: user });

        }
        catch(error){
            console.log(error);
            return resp.status(500).json({ message: "Internal Server Error" })
        }
    },

}
module.exports = usersController;