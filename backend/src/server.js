import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient, Role, BloodGroup } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT || 4000);
const roleMap = { patient: Role.PATIENT, donor: Role.DONOR, hospital: Role.HOSPITAL, bloodbank: Role.BLOOD_BANK, admin: Role.ADMIN };
const bloodGroupMap = { "A+":"A_POS", "A-":"A_NEG", "B+":"B_POS", "B-":"B_NEG", "AB+":"AB_POS", "AB-":"AB_NEG", "O+":"O_POS", "O-":"O_NEG" };
const normalizeBloodGroup = (value) => bloodGroupMap[value] || value;
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role.toLowerCase().replace("_", ""), status: u.status });
const bloodGroups = Object.values(BloodGroup);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

const tokenFor = (user) => jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
const setSession = (res, user) => res.cookie("bloodlink_session", tokenFor(user), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 8 * 60 * 60 * 1000 });
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const requireAuth = asyncRoute(async (req, res, next) => { const token = req.cookies.bloodlink_session || req.headers.authorization?.replace("Bearer ", ""); if (!token) return res.status(401).json({ success: false, message: "Authentication is required." }); const payload = jwt.verify(token, process.env.JWT_SECRET); const user = await prisma.user.findUnique({ where: { id: payload.sub } }); if (!user || user.status !== "ACTIVE") return res.status(401).json({ success: false, message: "Your session is no longer valid." }); req.user = user; next(); });
const requireRole = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ success: false, message: "You do not have permission for this action." });
const audit = (userId, action, entity, entityId, metadata) => prisma.auditLog.create({ data: { userId, action, entity, entityId, metadata } });
const idSchema = z.string().min(1).max(64);
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Too many attempts. Please try again later." } });

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "unavailable", database: "disconnected", message: "Database connection is unavailable." });
  }
});
app.post("/api/auth/register", authLimiter, asyncRoute(async (req, res) => { const data = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(8).regex(/[A-Z]/).regex(/\d/).regex(/[^A-Za-z0-9]/), phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/), city: z.string().min(2).max(60), role: z.enum(["patient","donor","hospital","bloodbank"]), bloodGroup: z.string().optional() }).parse(req.body); const role = roleMap[data.role]; const bloodGroup = data.bloodGroup ? normalizeBloodGroup(data.bloodGroup) : undefined; if (bloodGroup && !bloodGroups.includes(bloodGroup)) return res.status(400).json({ success:false,message:"Invalid blood group." }); const existing = await prisma.user.findUnique({ where:{ email:data.email.toLowerCase() } }); if (existing) return res.status(409).json({ success:false,message:"An account with this email already exists." }); const passwordHash = await bcrypt.hash(data.password, 12); const user = await prisma.user.create({ data:{ name:data.name, email:data.email.toLowerCase(), passwordHash, phone:data.phone, role, ...(role===Role.PATIENT ? { patient:{ create:{ bloodGroup:bloodGroup || "O_POS", city:data.city } } } : role===Role.DONOR ? { donor:{ create:{ bloodGroup:bloodGroup || "O_POS", city:data.city } } } : role===Role.HOSPITAL ? { hospital:{ create:{ hospitalName:data.name, registrationNumber:`DEMO-H-${Date.now()}`, city:data.city } } } : { bloodBank:{ create:{ name:data.name, registrationNumber:`DEMO-BB-${Date.now()}`, city:data.city } } }) } }); await audit(user.id,"REGISTER","User",user.id); setSession(res,user); res.status(201).json({ success:true,user:publicUser(user) }); }));
app.post("/api/auth/login", authLimiter, asyncRoute(async (req,res) => { const data=z.object({email:z.string().email(),password:z.string().min(1),role:z.enum(["patient","donor","hospital","bloodbank","admin"])}).parse(req.body); const user=await prisma.user.findUnique({where:{email:data.email.toLowerCase()}}); if(!user || user.role!==roleMap[data.role] || !(await bcrypt.compare(data.password,user.passwordHash))) return res.status(401).json({success:false,message:"Invalid email, password, or selected role."}); if(user.status!=="ACTIVE") return res.status(403).json({success:false,message:"This account is not active."}); setSession(res,user); await audit(user.id,"LOGIN","User",user.id); res.json({success:true,user:publicUser(user)}); }));
app.post("/api/auth/logout", requireAuth, asyncRoute(async (req,res) => { await audit(req.user.id,"LOGOUT","User",req.user.id); res.clearCookie("bloodlink_session"); res.json({success:true,message:"Signed out successfully."}); }));
app.get("/api/auth/me", requireAuth, (req,res) => res.json({success:true,user:publicUser(req.user)}));
app.post("/api/auth/forgot-password", authLimiter, (_req,res) => res.json({success:true,message:"If that account exists, reset instructions have been sent."}));
app.post("/api/auth/reset-password", requireAuth, asyncRoute(async (req,res) => { const {password}=z.object({password:z.string().min(8).regex(/[A-Z]/).regex(/\d/).regex(/[^A-Za-z0-9]/)}).parse(req.body); await prisma.user.update({where:{id:req.user.id},data:{passwordHash:await bcrypt.hash(password,12)}}); await audit(req.user.id,"RESET_PASSWORD","User",req.user.id); res.json({success:true,message:"Password updated."}); }));

app.get("/api/users/me",requireAuth,(req,res)=>res.json({success:true,user:publicUser(req.user)}));
app.put("/api/users/me",requireAuth,asyncRoute(async(req,res)=>{const data=z.object({name:z.string().min(2).max(80).optional(),phone:z.string().regex(/^\+?[0-9\s-]{10,15}$/).optional()}).parse(req.body);const user=await prisma.user.update({where:{id:req.user.id},data});res.json({success:true,user:publicUser(user)});}));
app.get("/api/donors",requireAuth,asyncRoute(async(req,res)=>{const q=z.object({bloodGroup:z.string().optional(),city:z.string().optional(),available:z.enum(["true","false"]).optional()}).parse(req.query);if(q.bloodGroup&&!bloodGroups.includes(q.bloodGroup))return res.status(400).json({success:false,message:"Invalid blood group."});const donors=await prisma.donor.findMany({where:{...(q.bloodGroup?{bloodGroup:q.bloodGroup}:{}),...(q.city?{city:{equals:q.city,mode:"insensitive"}}:{}),...(q.available?{availabilityStatus:q.available==="true"}:{})},include:{user:{select:{id:true,name:true,phone:true,email:true}}},take:100});res.json({success:true,data:donors});}));
app.get("/api/donors/search",requireAuth,asyncRoute(async(req,res)=>{const {bloodGroup,city,available}=req.query;const donors=await prisma.donor.findMany({where:{...(bloodGroup?{bloodGroup}:{}),...(city?{city:{equals:city,mode:"insensitive"}}:{}),...(available?{availabilityStatus:available==="true"}:{})},include:{user:{select:{id:true,name:true,phone:true}}},take:100});res.json({success:true,data:donors});}));
app.get("/api/donors/:id",requireAuth,asyncRoute(async(req,res)=>{const donor=await prisma.donor.findUnique({where:{id:idSchema.parse(req.params.id)},include:{user:{select:{id:true,name:true,phone:true}}}});if(!donor)return res.status(404).json({success:false,message:"Donor not found."});res.json({success:true,data:donor});}));
app.put("/api/donors/availability",requireAuth,requireRole(Role.DONOR),asyncRoute(async(req,res)=>{const {available}=z.object({available:z.boolean()}).parse(req.body);const donor=await prisma.donor.update({where:{userId:req.user.id},data:{availabilityStatus:available}});await audit(req.user.id,"UPDATE_AVAILABILITY","Donor",donor.id,{available});res.json({success:true,data:donor});}));
app.get("/api/requests",requireAuth,asyncRoute(async(req,res)=>{const rows=await prisma.bloodRequest.findMany({orderBy:{createdAt:"desc"},take:100});res.json({success:true,data:rows});}));
app.post("/api/requests",requireAuth,requireRole(Role.PATIENT,Role.HOSPITAL),asyncRoute(async(req,res)=>{const d=z.object({bloodGroup:z.enum(bloodGroups),unitsRequired:z.number().int().min(1).max(10),urgency:z.enum(["Critical","High","Moderate","Low"]),city:z.string().min(2).max(60),notes:z.string().max(1000).optional()}).parse(req.body);const profile=req.user.role===Role.PATIENT?await prisma.patient.findUnique({where:{userId:req.user.id}}):null;const hospital=req.user.role===Role.HOSPITAL?await prisma.hospital.findUnique({where:{userId:req.user.id}}):null;const row=await prisma.bloodRequest.create({data:{...d,patientId:profile?.id,hospitalId:hospital?.id}});await audit(req.user.id,"CREATE_REQUEST","BloodRequest",row.id);res.status(201).json({success:true,data:row});}));
app.put("/api/requests/:id",requireAuth,asyncRoute(async(req,res)=>{const data=z.object({status:z.enum(["PENDING","ACCEPTED","PROCESSING","FULFILLED","REJECTED","CANCELLED"])}).parse(req.body);const row=await prisma.bloodRequest.update({where:{id:idSchema.parse(req.params.id)},data});await audit(req.user.id,"UPDATE_REQUEST","BloodRequest",row.id,{status:data.status});res.json({success:true,data:row});}));
app.delete("/api/requests/:id",requireAuth,asyncRoute(async(req,res)=>{await prisma.bloodRequest.delete({where:{id:idSchema.parse(req.params.id)}});res.status(204).end();}));
app.get("/api/notifications",requireAuth,asyncRoute(async(req,res)=>res.json({success:true,data:await prisma.notification.findMany({where:{userId:req.user.id},orderBy:{createdAt:"desc"}})})));
app.put("/api/notifications/:id/read",requireAuth,asyncRoute(async(req,res)=>{const row=await prisma.notification.update({where:{id:idSchema.parse(req.params.id)},data:{isRead:true}});if(row.userId!==req.user.id)return res.status(403).json({success:false,message:"You do not have permission for this notification."});res.json({success:true,data:row});}));
app.get("/api/admin/users",requireAuth,requireRole(Role.ADMIN),asyncRoute(async(_req,res)=>res.json({success:true,data:await prisma.user.findMany({select:{id:true,name:true,email:true,role:true,status:true,createdAt:true}})})));
app.get("/api/admin/analytics",requireAuth,requireRole(Role.ADMIN),asyncRoute(async(_req,res)=>{const [users,donors,hospitals,bloodBanks,requests,units]=await Promise.all([prisma.user.count(),prisma.donor.count(),prisma.hospital.count(),prisma.bloodBank.count(),prisma.bloodRequest.count({where:{status:{in:["PENDING","ACCEPTED","PROCESSING"]}}}),prisma.bloodInventory.aggregate({_sum:{unitsAvailable:true}})]);res.json({success:true,data:{users,donors,hospitals,bloodBanks,activeRequests:requests,bloodUnits:units._sum.unitsAvailable||0}});}));
app.use((err,_req,res,_next)=>{if(err instanceof z.ZodError)return res.status(400).json({success:false,message:"Please check the submitted information.",errors:err.flatten().fieldErrors});if(err.name==="JsonWebTokenError"||err.name==="TokenExpiredError")return res.status(401).json({success:false,message:"Your session has expired. Please sign in again."});console.error(err);res.status(500).json({success:false,message:"Unable to process this request."});});
app.listen(PORT,()=>console.log(`BloodLink API listening on ${PORT}`));
