require('dotenv').config();
const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');//encryption
const jwt = require('jsonwebtoken');
const {OAuth2Client} = require('google-auth-library');
const emailer = require('../services/emailServices');
const {validationResult} = require('express-validator');
const crypto = require('crypto');
const { ADMIN_ROLE } = require('../utility/userRoles');
// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_RATE_LIMIT_MINUTES = 1; // Minimum time between OTP requests

// Generate cryptographically secure OTP
const generateOtp = () => {
    const digits = '0123456789';
    let otp = '';
    const randomBytes = crypto.randomBytes(OTP_LENGTH);
    for (let i = 0; i < OTP_LENGTH; i++) {
        otp += digits[randomBytes[i] % 10];
    }
    return otp;
};

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
            user.role = user.role ? user.role: ADMIN_ROLE;
            user.adminId = user.adminId ? user.adminId: user._id;
            
            if(user && await bcrypt.compare(password, user.password)) {
                const token = jwt.sign({
                    name: user.name,
                    email: user.email,
                    id: user._id,
                    role: user.role ? user.role: ADMIN_ROLE,
                    adminId: user.adminId
                }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

                const refreshToken = jwt.sign({
                    name: user.name,
                    email: user.email,
                    id: user._id,
                    role: user.role ? user.role: ADMIN_ROLE,
                    adminId: user.adminId
                }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });

                resp.cookie('jwtToken', token, { httpOnly: true, secure: false, path: '/' }); 
                resp.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false, path: '/' });
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
                    googleId: googleId,
                    role: ADMIN_ROLE
                });
                // Set adminId to the newly created user's own _id
                user.adminId = user._id;
                await user.save();
            }
            const token = jwt.sign({
                name: user.name,
                email: user.email,
                googleId: user.googleId,
                id: user._id,
                role: user.role ? user.role: ADMIN_ROLE,
                adminId : user.adminId ? user.adminId: user._id
            }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
            const refreshToken = jwt.sign({
                    name: user.name,
                    email: user.email,
                    id: user._id,
                    role: user.role ? user.role: ADMIN_ROLE,
                    adminId : user.adminId ? user.adminId: user._id
                }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
            
            resp.cookie('jwtToken', token, { httpOnly: true, secure: false, path: '/' }); 
            resp.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false, path: '/' });
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
            const user = await userDao.findByEmail(email);
            if(!user){
                // Don't reveal if user exists or not (security best practice)
                return resp.status(200).json({message: "If your email is registered, you will receive an OTP shortly."});
            }

            // Rate limiting: Check if user requested OTP recently
            if (user.resetOtpLastRequest) {
                const timeSinceLastRequest = (Date.now() - user.resetOtpLastRequest.getTime()) / 1000 / 60;
                if (timeSinceLastRequest < OTP_RATE_LIMIT_MINUTES) {
                    return resp.status(429).json({
                        message: `Please wait ${Math.ceil(OTP_RATE_LIMIT_MINUTES - timeSinceLastRequest)} minute(s) before requesting a new OTP.`
                    });
                }
            }

            // Generate cryptographically secure OTP
            const otp = generateOtp();
            
            // Hash OTP before storing (like a password)
            const salt = await bcrypt.genSalt(10);
            const hashedOtp = await bcrypt.hash(otp, salt);
            
            // Store hashed OTP with expiry and reset attempts
            user.resetOtp = hashedOtp;
            user.resetOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
            user.resetOtpAttempts = 0;
            user.resetOtpLastRequest = new Date();
            await user.save();

            
            console.log(`Generated OTP for ${email}: ${otp}`); // For testing purposes only
            // Send OTP via email
            //emailer.send(
            //    email, 
            //    "Password Reset OTP", 
            //    `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.\nIf you didn't request this, please ignore this email.`
            //);
            
            return resp.status(200).json({message: "If your email is registered, you will receive an OTP shortly."});
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

            // Validate password strength
            if (newPassword.length < 8) {
                return resp.status(400).json({message: "Password must be at least 8 characters long"});
            }

            const user = await userDao.findByEmail(email);
            if(!user){
                return resp.status(404).json({message: "User not found"});
            }

            // Check if OTP exists
            if (!user.resetOtp || !user.resetOtpExpiry) {
                return resp.status(400).json({message: "No OTP request found. Please request a new OTP."});
            }

            // Check if OTP has expired
            if (new Date() > user.resetOtpExpiry) {
                user.resetOtp = undefined;
                user.resetOtpExpiry = undefined;
                user.resetOtpAttempts = 0;
                await user.save();
                return resp.status(400).json({message: "OTP has expired. Please request a new one."});
            }

            // Check if max attempts exceeded
            if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
                user.resetOtp = undefined;
                user.resetOtpExpiry = undefined;
                user.resetOtpAttempts = 0;
                await user.save();
                return resp.status(429).json({message: "Too many failed attempts. Please request a new OTP."});
            }

            // Verify OTP (compare with hashed value)
            const isOtpValid = await bcrypt.compare(otp, user.resetOtp);
            if (!isOtpValid) {
                user.resetOtpAttempts += 1;
                await user.save();
                const remainingAttempts = MAX_OTP_ATTEMPTS - user.resetOtpAttempts;
                return resp.status(400).json({
                    message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
                });
            }

            // OTP is valid - update password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            user.password = hashedPassword;
            
            // Clear OTP fields after successful password change
            user.resetOtp = undefined;
            user.resetOtpExpiry = undefined;
            user.resetOtpAttempts = 0;
            user.resetOtpLastRequest = undefined;
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
        const newUser = await userDao.create({ name: username, email, password: hashedPassword, role: ADMIN_ROLE })
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
            role: user.role ? user.role: ADMIN_ROLE,
            adminId : user.adminId ? user.adminId: user._id
        }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        
        resp.cookie('jwtToken', token, { httpOnly: true, secure: false, path: '/' }); 
        return resp.status(201).json({ message: "User registered successfully", user: { name: newUser.name, email: newUser.email, id: newUser._id } });
    },

    isUserLoggedIn: async (req, resp) => {
        try{
            const token = req.cookies?.jwtToken;
            if(!token) {
                const refreshToken = req.cookies?.refreshToken;
                if(!refreshToken){
                    //logic for refresh token
                    return resp.status(400).json({ loggedIn: false });
                }
                const token = jwt.sign({
                    name: newUser.name,
                    email: newUser.email,
                    id: newUser._id,
                    role: user.role ? user.role: ADMIN_ROLE,
                    adminId : user.adminId ? user.adminId: user._id
                }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
                resp.cookie('jwtToken', token, { httpOnly: true, secure: false, path: '/' }); 
                return resp.status(200).json({ message: "User Authnticated", user: user });
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
