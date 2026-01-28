require('dotenv').config(); //to use env keys
const express = require('express');
const mongoose =  require('mongoose');//to connect to mongoDB
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const cookieParser = require('cookie-parser');
const PORT = 5001;
const app = express();

mongoose
  .connect(process.env.MONGODB_CONNECTION_KEY) //this line shouln't be pushed to GitHub(use env keys)
  .then(() => { console.log("Connected to MongoDB"); })
  .catch((err) => { console.log("Error connecting to MongoDB", err); });

app.use(express.json()); //MiddleWare (intercet every request that is coming to the server)
app.use(cookieParser()); // parse signed/unsigned cookies for auth
app.use('/auth', authRoutes);
app.use('/group', groupRoutes);

/*    
//now in authController(src foler content)
app.post('/register', (req, resp) => {

})

app.post('/login', (req, resp) => {
})
*/
app.listen(PORT, (err) => {
    console.log(`Server is running on port ${PORT}`);
});