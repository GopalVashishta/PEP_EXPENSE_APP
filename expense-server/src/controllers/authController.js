require('dotenv').config();
const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');//encryption
const jwt = require('jsonwebtoken');

const authController = {
    login: async (req, resp) => {
        const { email, password } = req.body;
        if(!email || !password) { return resp.status(400).json({ message: "All fields are required" }); }
        const user = await userDao.findByEmail(email);
        
        if(user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({
                name: user.name,
                email: user.email,
                id: user._id,
            }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
            resp.cookie('jwtToken', token, { httpOnly: true, secure: true, domain: 'localhost', path: '/' }); 

            return resp.status(200).json({ message: "User Authnticated", user: user });
        }
        else {
            return resp.status(401).json({ message: "Invalid email or password" });
        }
    },


    register: async (req, resp) => {
        const { username, email, password } = req.body;
        if(!username || !email || !password) {
            return resp.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await userDao.findByEmail(email)
        .then((user) => user)
        .catch((err) => {
            if(err.code === 'DB_ERROR') {
                console.log("Database error while checking existing user", err);
                return resp.status(500).json({ message: "Internal Server Error" });
            }
        });//Checking if user already exists
        if(existingUser) {
            return resp.status(409).json({ message: "User with this email already exists" });
        }

        //encrypting password before saving to DB
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //Creating new user with Error handling
        const newUser = await userDao.create({ name: username, email, password: hashedPassword})
            .then((user) => user)
            .catch((err) => {
                if(err.code === 'INVALID_USER_DATA') {
                    console.log("Invalid user data provided", err);
                    return resp.status(400).json({ message: "Invalid user data" });
                }
                if(err.code === 'USER_ALREADY_EXISTS') {
                    return resp.status(409).json({ message: "User with this email already exists" });
                }
                console.log("Error creating user", err);
            });

        return resp.status(201).json({ message: "User registered successfully", user: newUser.id });
    }
}
module.exports  = authController;
