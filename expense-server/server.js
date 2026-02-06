require('dotenv').config(); //to use env keys
const express = require('express');
const mongoose =  require('mongoose');//to connect to mongoDB
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const arbacRoutes = require('./src/routes/rbacRoutes');
const cookieParser = require('cookie-parser');
const cors = require('cors'); //cors policy error by the browser @frontend
const PORT = 5001;
const app = express();

mongoose
  .connect(process.env.MONGODB_CONNECTION_KEY) //this line shouln't be pushed to GitHub(use env keys)
  .then(() => { console.log("Connected to MongoDB"); })
  .catch((err) => { console.log("Error connecting to MongoDB", err); });

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json()); //MiddleWare converts json to jsobj
app.use(cookieParser()); // cookies to js obj
app.use('/auth', authRoutes);
app.use('/group', groupRoutes);
app.use('/rbac', arbacRoutes);

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