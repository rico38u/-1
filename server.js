import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app=express(); const PORT=process.env.PORT||3000;
const __dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(cors({origin:process.env.CLIENT_ORIGIN?.split(',')||'*'}));
app.use(express.json({limit:'2mb'})); app.use('/uploads',express.static(path.join(__dirname,'uploads')));
const storage=multer.diskStorage({destination:path.join(__dirname,'uploads'),filename:(r,f,cb)=>cb(null,Date.now()+'-'+f.originalname.replace(/[^a-zA-Z0-9._-]/g,'_'))});
const upload=multer({storage,limits:{fileSize:250*1024*1024}});

const User=mongoose.model('User',new mongoose.Schema({username:{type:String,unique:true,index:true,required:true},passwordHash:{type:String,required:true},bio:{type:String,default:'⚡ مستخدم جديد على Nexora'},avatarUrl:String,followers:{type:Number,default:0},following:{type:Number,default:0},createdAt:{type:Date,default:Date.now}}));
const Media=mongoose.model('Media',new mongoose.Schema({uploader:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},uploaderName:String,title:String,type:{type:String,enum:['video','image'],required:true},url:String,views:{type:Number,default:0},likes:{type:Number,default:0},createdAt:{type:Date,default:Date.now}}));
const Message=mongoose.model('Message',new mongoose.Schema({sender:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},receiver:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},text:{type:String,required:true},createdAt:{type:Date,default:Date.now},read:{type:Boolean,default:false}}));
function token(u){return jwt.sign({id:u._id,username:u.username},process.env.JWT_SECRET,{expiresIn:'30d'});} function auth(req,res,next){try{const h=req.headers.authorization||''; req.user=jwt.verify(h.replace('Bearer ',''),process.env.JWT_SECRET);next();}catch{return res.status(401).json({error:'Unauthorized'});}}
app.get('/api/health',(req,res)=>res.json({ok:true}));
app.post('/api/auth/register',async(req,res)=>{try{let username=String(req.body.username||'').trim().toLowerCase();let password=String(req.body.password||'');if(!/^[a-z0-9_]{3,30}$/i.test(username)||password.length<6)return res.status(400).json({error:'اسم مستخدم غير صالح أو كلمة المرور أقل من 6 أحرف'});if(await User.exists({username}))return res.status(409).json({error:'اسم المستخدم مستخدم بالفعل'});const u=await User.create({username,passwordHash:await bcrypt.hash(password,12)});res.status(201).json({token:token(u),user:{id:u._id,username:u.username,bio:u.bio}});}catch(e){res.status(500).json({error:e.message});}});
app.post('/api/auth/login',async(req,res)=>{const u=await User.findOne({username:String(req.body.username||'').trim().toLowerCase()});if(!u||!await bcrypt.compare(String(req.body.password||''),u.passwordHash))return res.status(401).json({error:'بيانات الدخول غير صحيحة'});res.json({token:token(u),user:{id:u._id,username:u.username,bio:u.bio,avatarUrl:u.avatarUrl}});});
app.get('/api/users/search',auth,async(req,res)=>{const q=String(req.query.q||'').trim();const users=await User.find(q?{username:{$regex:q,$options:'i'}}:{}).select('username bio avatarUrl followers').limit(30);res.json(users);});
app.get('/api/media',async(req,res)=>res.json(await Media.find().sort({createdAt:-1}).limit(200)));
app.post('/api/media',auth,upload.single('file'),async(req,res)=>{if(!req.file)return res.status(400).json({error:'الملف مطلوب'});const u=await User.findById(req.user.id);const type=req.file.mimetype.startsWith('video/')?'video':'image';const m=await Media.create({uploader:u._id,uploaderName:u.username,title:req.body.title||'منشور جديد',type,url:'/uploads/'+req.file.filename});res.status(201).json(m);});
app.post('/api/media/:id/view',async(req,res)=>res.json(await Media.findByIdAndUpdate(req.params.id,{$inc:{views:1}},{new:true})));
app.post('/api/media/:id/like',auth,async(req,res)=>res.json(await Media.findByIdAndUpdate(req.params.id,{$inc:{likes:1}},{new:true})));
app.get('/api/messages/:userId',auth,async(req,res)=>{const me=req.user.id,other=req.params.userId;res.json(await Message.find({$or:[{sender:me,receiver:other},{sender:other,receiver:me}]}).sort({createdAt:1}).limit(500));});
app.post('/api/messages',auth,async(req,res)=>{const m=await Message.create({sender:req.user.id,receiver:req.body.receiver,text:String(req.body.text||'').slice(0,5000)});res.status(201).json(m);});

mongoose.connect(process.env.MONGODB_URI).then(()=>app.listen(PORT,()=>console.log('Nexora API on '+PORT))).catch(e=>{console.error('MongoDB error:',e.message);process.exit(1)});
