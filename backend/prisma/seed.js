import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role, BloodGroup } from "@prisma/client";
const prisma = new PrismaClient();
const accounts = [
  ["Ananya Iyer","patient@bloodlink.demo",Role.PATIENT,"+91 98765 10482","Bengaluru","O_POS","Patient@123"],
  ["Karthik Raman","donor@bloodlink.demo",Role.DONOR,"+91 99807 21645","Mysuru","O_POS","Donor@123"],
  ["Sanjay Memorial Hospital","hospital@bloodlink.demo",Role.HOSPITAL,"+91 80416 72390","Bengaluru","A_POS","Hospital@123"],
  ["Sahyadri Blood Centre","bloodbank@bloodlink.demo",Role.BLOOD_BANK,"+91 80882 61437","Mangaluru","B_POS","BloodBank@123"],
  ["BloodLink Platform Admin","admin@bloodlink.demo",Role.ADMIN,"+91 80000 10001","Bengaluru","AB_POS","Admin@123"],
];
for (const [name,email,role,phone,city,bloodGroup,password] of accounts) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({ where:{email}, update:{name,phone,passwordHash,role,status:"ACTIVE"}, create:{name,email,phone,passwordHash,role} });
  if(role===Role.PATIENT) await prisma.patient.upsert({where:{userId:user.id},update:{bloodGroup,city},create:{userId:user.id,bloodGroup,city}});
  if(role===Role.DONOR) await prisma.donor.upsert({where:{userId:user.id},update:{bloodGroup,city,availabilityStatus:true},create:{userId:user.id,bloodGroup,city,availabilityStatus:true}});
  if(role===Role.HOSPITAL) await prisma.hospital.upsert({where:{userId:user.id},update:{hospitalName:name,city},create:{userId:user.id,hospitalName:name,registrationNumber:"KAR-HSP-20481",city}});
  if(role===Role.BLOOD_BANK) await prisma.bloodBank.upsert({where:{userId:user.id},update:{name,city},create:{userId:user.id,name,registrationNumber:"KAR-BB-11042",city}});
}
const donorNames = [["Meera Kulkarni","meera.kulkarni@bloodlink.demo","A_POS","Bengaluru"],["Farhan Siddiqui","farhan.siddiqui@bloodlink.demo","B_NEG","Mysuru"],["Nandini Rao","nandini.rao@bloodlink.demo","AB_POS","Mangaluru"],["Vikram Shetty","vikram.shetty@bloodlink.demo","O_NEG","Bengaluru"]];
for (const [name,email,bloodGroup,city] of donorNames) { const passwordHash=await bcrypt.hash("Donor@123",12); const user=await prisma.user.upsert({where:{email},update:{},create:{name,email,phone:"+91 90000 00000",passwordHash,role:Role.DONOR}}); await prisma.donor.upsert({where:{userId:user.id},update:{bloodGroup,city},create:{userId:user.id,bloodGroup,city,availabilityStatus:true}}); }
const bankUser=await prisma.user.findUnique({where:{email:"bloodbank@bloodlink.demo"},include:{bloodBank:true}});
for(const [bloodGroup,unitsAvailable] of [[BloodGroup.O_POS,36],[BloodGroup.A_POS,22],[BloodGroup.B_POS,18],[BloodGroup.O_NEG,7]]) await prisma.bloodInventory.upsert({where:{id:`seed-${bloodGroup}`},update:{unitsAvailable},create:{id:`seed-${bloodGroup}`,bloodBankId:bankUser.bloodBank.id,bloodGroup,unitsAvailable,expiryDate:new Date("2027-01-01")}});
console.log("BloodLink demo accounts and seed records created.");
await prisma.$disconnect();
