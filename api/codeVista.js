
import cors from 'cors';

import multer from 'multer';

const upload=multer();

import bcrypt from 'bcrypt';

import path from 'path';

const salt=bcrypt.genSaltSync(10);

import cookieParser from 'cookie-parser';

import express, { urlencoded } from 'express';

import jwt from 'jsonwebtoken';

import { mongoose } from 'mongoose';

const app=express();

import dotenv from 'dotenv';

import bodyParser from 'body-parser';

import pythonVerify from './verificationService/pythonVerify.js';

import javaVerify from './verificationService/javaVerify.js';

import jsVerify from './verificationService/jsVerify.js';

import cVerify from './verificationService/cVerify.js';

import cppVerify from './verificationService/cppVerify.js';

import askAI from './AIservice/askAI.js';

import { mongodbsrv } from './env.js';

app.use(bodyParser.json());

app.use(cookieParser());

dotenv.config();

app.use(cors(({
    origin: 'http://localhost:3000',
    credentials: true,
})));

const secretKey="CodeVista.js"

const uri=mongodbsrv;

var hackthonsarray=[];

var newsarray=[];

var researcharray=[];

mongoose.set('strictQuery', true);

mongoose.connect(databaseUrl);

const adminSchema=new mongoose.Schema({
    Username: String,
    Password: String,
});

const userSchema=new mongoose.Schema({
    Username:String,
    Password: String,
});

const hackthonSchema=new mongoose.Schema({
    Title:String,
    Description:String,
    PostDate:Date,
    EndDate:Date,//deadline
    RegistrationLink:String,
    ImageLink:String,
});

const newsSchema=new mongoose.Schema({
    Title:String,
    Description:String,
    PostDate:Date,
    DocumentLink:String,
});

const researchSchema=new mongoose.Schema({
    Title:String,
    Description:String,
    PublishDate:Date,
    DocumentLink:String,
});

const User = mongoose.model('USER', userSchema);

const Admin = mongoose.model('ADMIN', adminSchema);

const Hackthon=mongoose.model("HACKTHON",hackthonSchema);

const Research=mongoose.model("RESEARCH",researchSchema);

const News=mongoose.model("NEWS",newsSchema);

async function getAllHackthonElements() {
    try {
      const Hackthonobjects = await Hackthon.find({});
      hackthonsarray = Hackthonobjects.map(obj => obj.toObject());
// Convert Mongoose documents to plain JavaScript objects
    } 
    catch (err) {
      console.error(err);
    }
}
const __filename = new URL(import.meta.url).pathname;

const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'build')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

async function getAllNewsElements() {
    try {
      const Newsobjects = await News.find({});
      newsarray = Newsobjects.map(obj => obj.toObject()); // Convert Mongoose documents to plain JavaScript objects
    } 
    catch (err) {
      console.error(err);
    }
}

async function getAllResearchElements() {
    try {
      const Researchobjects = await Research.find({});
      researcharray= Researchobjects.map(obj => obj.toObject()); // Convert Mongoose documents to plain JavaScript objects
    } 
    catch (err) {
      console.error(err);
    }
}

function callback(num){
    console.log("listening at port "+num);
    getAllHackthonElements();
    getAllNewsElements();
    getAllResearchElements()
}

const authenticateJWT=(req,res,next)=>{//middle ware to authenticate the user or admin
    const authHeader=req.cookies.token;
    if(authHeader){
        const token =authHeader;
        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(403).json({ message: 'Token expired' });
                }
                return res.status(403).json({ message: 'Invalid token' });
            }
            req.user = user;
            next();
        });
        
    }
    else {
        console.error('Unauthorized access attempt:', req.url);
        res.status(401).json({ message: 'Unauthorized: Token missing' });
    }    
};

//admin routes

app.post("/admins/signup",(req,res)=>{//allows the admin to signup
    const {username,password}=req.body;
    Admin
    .findOne({ Username : username })
    .then((admin)=>{
        if(admin){
            res.status(403).json({ message: 'Admin already exists' });
        }
        else{
            const obj = { "Username": username, "Password": bcrypt.hashSync(password,salt), };
            const newAdmin = new Admin(obj);
            newAdmin.save()
            .then(()=>{
                const token = jwt.sign({ username, role: 'admin' }, secretKey, { expiresIn: '1h' });
                res.cookie('token',token,{ httpOnly: true, secure: true }).json('ok');
            })
            .catch((error)=>{
                res.status(500).json({ message: 'Internal server error', error: error.message });
            })
        }
    })
    .catch((error)=>{
        res.status(400).json({ message: 'Internal server error', error: error.message });
    });
});

app.post("/admins/login",async (req,res)=>{//allows the admin to login
    try {
        const { username, password } = req.body;
    
        const admin = await Admin.findOne({ Username: username });
    
        if (!admin) {
          return res.status(400).json({ message: "User does not exist" });
        }
    
        const passOk = bcrypt.compareSync(password, admin.Password);
    
        if (passOk) {
          const token = jwt.sign({ username, role: 'admin' }, secretKey, { expiresIn: '1h' });
          res.cookie('token', token, { httpOnly: true, secure: true }).json({ message: 'Login successful' });
      } else {
          res.status(403).json({ message: 'Incorrect password' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
      }
    });

app.post("/admins/logout",async (req,res)=>{
    try {
        const authToken = req.cookies.token;
    
        if (!authToken) {
          return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
        }
        res.cookie('token', '', { httpOnly: true, secure: true }).json({ message: 'Logout successful' });
      } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
      }
    });

    app.post("/admins/postHackthon", async (req, res) => {
        try {
            const details = req.body;
            if (!details.Title || !details.Description || !details.RegistrationLink) {
            return res.status(400).json({ message: 'Missing required fields' });
            }            
            const EndDate = new Date('05 October 2011 14:48 UTC');//should update
            const obj = {
                "Title": details.Title,
                "Description": details.Description,
                "PostDate": Date.now().toString(),
                "EndDate": EndDate,
                "RegistrationLink": details.RegistrationLink,
                "ImageLink": details.ImageLink
            };
    
            const newHackthon = new Hackthon(obj);
            await newHackthon.save();
    
            res.status(201).send(JSON.stringify(newHackthon));
        } catch (error) {
            console.error('Error in /admins/postHackthon:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    });
    
    app.post("/admins/postNews", authenticateJWT, async (req, res) => {
        try {
            const details = req.body;
            if (!details.Title || !details.Description || !details.completeLink) {
                return res.status(400).json({ message: 'Missing required fields' });
            }
            const obj = {
                "Title": details.Title,
                "Description": details.Description,
                "PostDate": Date.now().toString(),
                "DocumentLink": details.completeLink
            };
            const newNews = new News(obj);
            await newNews.save();
            res.status(201).send(JSON.stringify(newNews));
        } catch (error) {
            console.error('Error in /admins/postNews:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    });
    
    app.post("/admins/postResearch", authenticateJWT, async (req, res) => {
        try {
            const details = req.body;
                if (!details.Title || !details.Description || !details.DocumentLink) {
                return res.status(400).json({ message: 'Missing required fields' });
            }
            const obj = {
                "Title": details.Title,
                "Description": details.Description,
                "PublishDate": Date.now().toString(),
                "DocumentLink": details.DocumentLink
            };
            const newResearch = new Research(obj);
            await newResearch.save();
            res.status(201).send(JSON.stringify(newResearch));
        } catch (error) {
            console.error('Error in /admins/postResearch:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    });
    
//user routes

app.post("/users/signup",async (req,res)=>{//allows the user to signup
    const {username,password}=req.body;
    User
    .findOne({ Username : username })
    .then((user)=>{
        if(user){
            res.status(403).json({ message: 'User already exists' });
        }
        else{
            const obj = { "Username": username, "Password": bcrypt.hashSync(password,salt), };
            const newUser = new User(obj);
            newUser.save()
            .then(()=>{
                const token = jwt.sign({ username, role: 'user' }, secretKey, { expiresIn: '1h' });
                res.cookie('token',token,{ httpOnly: true, secure: true }).json('ok');
            })
            .catch((error)=>{
                res.status(500).json({ message: 'Internal server error', error: error.message });
            })
        }
    })
    .catch((error)=>{
        res.status(400).json({ message: 'Internal server error', error: error.message });
    });
});

app.post("/users/login", async (req, res) => {
    try {
      const { username, password } = req.body;
  
      const user = await User.findOne({ Username: username });
  
      if (!user) {
        return res.status(400).json({ message: "User does not exist" });
      }
  
      const passOk = bcrypt.compareSync(password, user.Password);
  
      if (passOk) {
        const token = jwt.sign({ username, role: 'user' }, secretKey, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: true }).json({ message: 'Login successful' });
    } else {
        res.status(403).json({ message: 'Incorrect password' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
  
  app.get("/users/logout", authenticateJWT,async (req, res) => {
    try {
      const authToken = req.cookies.token;
  
      if (!authToken) {
        return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      }
      res.cookie('token', '', { httpOnly: true, secure: true }).json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
  
  app.get("/users/hackthon", authenticateJWT, async (req, res) => {
    try {
        await getAllHackthonElements();
        res.status(200).json({ data: hackthonsarray, message: 'Success' });
    } catch (error) {
        console.error('Error in /users/hackthon:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get("/users/news", authenticateJWT, async (req, res) => {
    try {
        await getAllNewsElements()
        res.status(200).json({ data: newsarray, message: 'Success' });
    } catch (error) {
        console.error('Error in /users/news:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get("/users/research", authenticateJWT, async (req, res) => {
    try {
        await getAllResearchElements()
        res.status(200).json({ data: researcharray, message: 'Success' });
    } catch (error) {
        console.error('Error in /users/research:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post("/users/attend",authenticateJWT,upload.fields([{ name: 'code' }, { name: 'json' }]), async (req, res) => {
    try {
        const code = req.body['code'];
        const pack = JSON.parse(req.body['json']);
        let response;
        const prgid=String(Math.floor(Math.random()*10000));
        switch (pack.language) {
            case 1:
                response = await pythonVerify(String("python"+prgid), code);
                break;
            case 2:
                response = await javaVerify(pack.className, code);
                break;
            case 3:
                response = await cVerify(String("c"+prgid), code);
                break;
            case 4:
                response = await cppVerify(String("cpp"+prgid), code);
                break;
            case 5:
                response = await jsVerify(String("js"+prgid), code);
                break;
        }
        res.status(200).json({ response: response, message: 'Success' });
    } catch (error) {
        console.error('Error in /users/attend:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});
app.post("/users/askAI", authenticateJWT,upload.fields([{name:'prompt'}]), async (req, res) => {
    try {
        const prompt = req.body['prompt'];
        const response = await askAI(prompt);
        if (response) {
            res.status(200).json({ response: response.content, message: 'Success' });
        }
    } catch (error) {
        console.error('Error in /users/askAI:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

const port=4000;
app.listen(port,callback(port));
