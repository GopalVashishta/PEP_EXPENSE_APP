require('dotenv').config();
const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');//encryption
const jwt = require('jsonwebtoken');
const {OAuth2Client} = require('google-auth-library');
const emailer = require('../services/emailServices');
const {validationResult} = require('express-validator');

const authController = {
    login: async (req, resp) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return resp.status(400).json({ errors: errors.array() });
        }
        try{
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
        }
        catch(error){
            console.log("Error during login: Google SSO registered user", error);
            return resp.status(401).json({message:"Please log in via google"});
        }
    },

    
    googleSso: async (req, resp) => {
        try{
            const {idToken} = req.body;
            if(!idToken){
                return resp.status(400).json({message: "Invalid request"});
            }
            //Verification of the token with Google
            const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const googleResponse = await googleClient.verifyIdToken({idToken: idToken, audience: process.env.GOOGLE_CLIENT_ID});
            const payload=  googleResponse.getPayload();
            const {sub: googleId, name, email} = payload;
            
            let user = await userDao.findByEmail(email);
            if(!user){
                user = await userDao.create({
                    name: name,
                    email: email,
                    googleId: googleId
                });
            }
            const token = jwt.sign({
                name: user.name,
                email: user.email,
                googleId: user.googleId,
                id: user._id,
            }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
            resp.cookie('jwtToken', token, { httpOnly: true, secure: true, domain: 'localhost', path: '/' }); 

            return resp.status(200).json({ message: "User Authnticated", user: user });

        }
        catch(err){
            console.log("Error during Google SSO", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    resetPassword : async (req, resp) => {
        try{
            const {email} = req.body;
            if(!email){
                return resp.status(400).json({message: "Email is required"});
            }
            const user =  await userDao.findByEmail(email);
            if(!user){
                return resp.status(200).json({message: "Password reset link sent to email if it exists in our records."});
            }
            // store the OTP in DB
            otp = 
            emailer.send(email, "Password Reset Request", "The otp is 123456 and u will be redirected to the change password page.");
            return resp.status(200).json({message: "Password reset link sent to email if it exists in our records."});
        }
        catch(err){
            console.log("Error during password reset", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },

    changePassword : async (req, resp) => {
        try{
            const {email, newPassword, otp} = req.body;
            if(!email || !newPassword || !otp){
                return resp.status(400).json({message: "All fields are required"});
            }
            const user =  await userDao.findByEmail(email);
            if(!user){
                return resp.status(404).json({message: "User not found"});
            }
            //verify OTP from the db
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            user.password = hashedPassword;
            await user.save();
            return resp.status(200).json({message: "Password changed successfully."});

        }catch(err){
            console.log("Error changing password", err);
            return resp.status(500).json({ message: "Internal Server Error" });
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
        
        const token = jwt.sign({
            name: newUser.name,
            email: newUser.email,
            id: newUser._id,
        }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        
        resp.cookie('jwtToken', token, { httpOnly: true, secure: true, domain: 'localhost', path: '/' }); 
        return resp.status(201).json({ message: "User registered successfully", user: { name: newUser.name, email: newUser.email, id: newUser._id } });
    },

    isUserLoggedIn: async (req, resp) => {
        try{
            const token = req.cookies?.jwtToken;
            if(!token) {
                return resp.status(200).json({ loggedIn: false });
            }
            jwt.verify(token, process.env.JWT_SECRET_KEY, (error, user) => {
                if(error) {
                    return resp.status(401).json({ messaage: "Invalid token" });
                }
            return resp.status(200).json({ user: user });
            });
        }
        catch(err){
            console.log("Error verifying user token", err);
            return resp.status(500).json({ message: "Internal Server Error" });
        }
    },
    logout: async (req, resp) => {
        try{
            resp.clearCookie('jwtToken');
            resp.json({ message: "Logout successful" });
        }
        catch(error){
            console.log(error);
            return resp.status(500).json({messaage: "Internal Server Error"});
        }
    },

}
module.exports  = authController;
