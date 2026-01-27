const User = require('../model/users');

const userDao = {
    findByEmail : async (email) =>{
        try{ 
        const userRecord = await User.findOne({email}); //findMany also
        return userRecord;
        }
        catch(err){
            console.log("Error finding user by email", err);
            throw new Error({code: "DB_ERROR", message: "Error finding user by email"});
        }
    },
    create :  async (userData) => {
        try{ 
          const  newUser = new User(userData);
          return await newUser.save(); 
        }
        catch(err){
            if(err.code === 11000){
                throw new Error({code: 'USER_ALREADY_EXISTS', message: 'User with this email already exists'});
            }
            else{ 
            console.log(err);
            throw new Error({code: "INVALID_USER_DATA", message: "Name, email, password are required to create a user"});
            }
        }
    }
};

module.exports =  userDao;