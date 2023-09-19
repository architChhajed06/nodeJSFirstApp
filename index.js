// import http from "http";
// import { calculateLovePercent } from "./features.js"
// import fs from "fs";

// // const content = fs.readFile("./index.html", ()=>{
// //     console.log("File read");
// // })


// // console.log(content);





// // console.log(Hello);
// // console.log(nameVar2);
// // console.log(nameVar3);
// // console.log(http);




// console.log(calculateLovePercent());

// const server = http.createServer((req, res)=>{
//     console.log(req.url);

//     if(req.url==='/')
//     {
//         fs.readFile("./index.html", (err,data)=>{
//             res.end(data);
//         })
//     }
//     else if(req.url==='/about')
//     {
//         res.end("ABOUT PAGE");
//     }
//     else if(req.url==='/contact')
//     {
//         res.end("CONTACT US PAGE");
//     }
//     else
//     {
//         res.end("PAGE NOT FOUND");
//     }
// });



// server.listen(5000, ()=>{
//     console.log("Server is working");
// })



import express from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose.connect("mongodb://127.0.0.1:27017", { dbName: "backend", })
.then(()=>{console.log("Connected to databasr")})
.catch((e)=>{console.log("ERROR: ",e)});

const app = express();
app.set("view engine", "ejs");


const messageSchema =  new mongoose.Schema({ name: String, email: String});
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);


const Message = mongoose.model("Messages", messageSchema);


// Using Middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded( {extended: true}));
app.use(cookieParser())

const users = [];


const isAuthenticated = async (req,res, next) => {
    const p = req.cookies.token;
    const { token } = req.cookies;
    console.log("TOKENS: ",p,token);
    if(p)  //If the token exists
    {
        const decoded = jwt.verify(p, "helloWorld");
        console.log("DECODED",decoded);
        req.user = await User.findById(decoded._id);
        next();
    }
    else
    {
        res.redirect('/login');
    }
}

// app.get("/", (req,res)=>{
//     res.sendFile("index.html")
// })


app.get("/", isAuthenticated, (req, res)=>{
    console.log("Req.user: ",req.user)
    res.render("logout", {
        name_user: req.user.name
    });
})



// app.get("/Success", (req,res)=>{
//     res.render("Success")
// })


// app.get("/users", (req,res)=>{
//     res.json({users});
// })



// app.get('/add', (req,res)=>{
//     Message.create({
//         name: "Archit",
//         email: "sample@gmail.com"
//     })
//     .then( () => {
//         res.send("Nice");
//     })
//     // res.send('ADD PAGE');
// })



app.post("/", (req,res)=>{
    console.log(req);
    console.log("This is the body: ", req.body);

    const messageData = { name: req.body.nameEntry, email: req.body.email};

    console.log(messageData);
    Message.create(messageData).then(()=>{
        res.redirect("/Success");
    });
    console.log(users);
})


// app.post("/login", async (req,res)=>{

//     console.log(req.body);
//     const {nameEntry, email, password} = req.body;
//     console.log("USER: ", nameEntry, email);
//     const user = await User.findOne({email});
//     console.log("IN THE LOGIN PAGE: ",user);
//     if(!user)
//     {
//         console.log("REGISTER FIRST");
//         res.redirect('/register')
//         return;
//     }
//     else
//     {
//         res.render('logout', {name_user: user.name});
//         return;
//     }



// })


app.get('/register', (req,res)=>{
    res.render('register');
})


app.get('/login', (req,res)=>{
    res.render('login');
})




app.post('/login', async (req, res)=>{
    const {nameEntry, email, password} = req.body;
    console.log("REQ BODY: ",req.body);
    let user = await User.findOne({email: req.body.email});
    console.log("USER: ",user)

    if(!user)
    {
        console.log("USER NOT FOUND.");
        res.redirect('/register');
        return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch)
    {
        return res.render('login',{email: req.body.email, message:"Incorrect Password"});
    }

    const token = jwt.sign({_id:user._id}, "helloWorld");

    console.log(token);
    res.cookie("token", token, {httpOnly: true, expires: new Date(Date.now()+500*1000)} )
    res.redirect("/");
})


app.post('/register', async (req,res)=>{
    const find_user = await User.findOne({email: req.body.email});
    console.log("find_user: ",find_user);
    console.log("!find_user= ",find_user);
    if(find_user)
    {
        console.log("USER ALREADY EXISTS: ");
        res.redirect('/login');
        return;
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    console.log("POST REQUEST FOR REGISTER: ");
    const new_user = await User.create({
        name: req.body.nameEntry,
        email: req.body.email,
        password: hashedPassword
    })

    console.log("NEW USER CREATED: ", new_user);
    const token = jwt.sign({_id:new_user._id}, "helloWorld");

    console.log(token);
    res.cookie("token", token, {httpOnly: true, expires: new Date(Date.now()+500*1000)} )
    res.redirect("/");
})

app.get("/logout",(req, res)=>{
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now())
    });
    res.redirect("/");
})



app.listen(5000, ()=>{
    console.log("Server is working");
})