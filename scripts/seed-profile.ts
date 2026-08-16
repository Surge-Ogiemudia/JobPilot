import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set.");
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const ProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  fullName: { type: String, required: true },
  headline: { type: String },
  summary: { type: String },
  contactInfo: {
    email: { type: String },
    phone: { type: String },
    location: { type: String },
    rightToWork: { type: String },
  },
  links: {
    linkedin: { type: String },
    github: { type: String },
    personalSite: { type: String },
  },
  workExperience: [{
    company: { type: String },
    title: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    current: { type: Boolean },
    description: { type: String },
    achievements: [{ type: String }],
  }],
  education: [{
    institution: { type: String },
    degree: { type: String },
    field: { type: String },
    startDate: { type: String },
    endDate: { type: String },
  }],
});
const Profile = mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);

const SkillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ["skill", "certificate"], default: "skill" },
  status: { type: String, enum: ["have", "in_progress", "needed"], default: "have" },
  sourceApplicationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],
  dateCompleted: { type: Date },
});
const Skill = mongoose.models.Skill || mongoose.model("Skill", SkillSchema);

async function seedProfile() {
  await mongoose.connect(MONGODB_URI!);
  console.log("✅ Connected to MongoDB");

  const email = process.env.SEED_EMAIL ?? "admin@jobpilot.local";
  const user = await User.findOne({ email });

  if (!user) {
    console.error(`❌ User ${email} not found. Run npm run seed first.`);
    await mongoose.disconnect();
    return;
  }

  const profileData = {
    userId: user._id,
    fullName: "Surge Ogiemudia",
    headline: "IT & Cybersecurity Specialist | BSc CompSci & MSc Cybersecurity | NHS Clinical & Enterprise Infrastructure Experience",
    summary: "Qualified Computer Scientist (BSc) and Cybersecurity Specialist (MSc) with hands-on enterprise infrastructure experience (Dell rack servers, data centre networking) and marine robotics support (Oshen Ltd). Currently embedded within Derriford Hospital (University Hospitals Plymouth NHS Trust), maintaining strict NHS Information Governance compliance in live clinical environments. Seeking a substantive IT Support, Desktop, Systems, or Cybersecurity position within NHS Digital / Health Informatics.",
    contactInfo: {
      email: user.email,
      phone: "+44 7000 000000",
      location: "United Kingdom",
      rightToWork: "British Citizen / Right to Work in UK",
    },
    links: {
      linkedin: "https://linkedin.com/in/surge-ogiemudia",
      github: "https://github.com/Surge-Ogiemudia",
    },
    workExperience: [
      {
        company: "Freelance",
        title: "Field Service Engineer",
        startDate: "April 2025",
        endDate: "Present",
        current: true,
        description: "Deployed to enterprise and data centre environments to install, upgrade, and repair hardware on Dell rack servers and networking equipment.",
        achievements: [
          "Replaced and configured network interface cards, performed structured rack cabling and patch panel termination.",
          "Restored data centre systems to full operational status with zero unscheduled downtime.",
          "Maintained accurate service records and site documentation in line with strict customer SLA requirements.",
        ],
      },
      {
        company: "Oshen Ltd. | Autonomous Marine Robotics",
        title: "Technical Support Engineer",
        startDate: "November 2024",
        endDate: "December 2025",
        current: false,
        description: "Built and deployed autonomous robotic systems from the ground up for marine environments, covering mechanical assembly, electronics wiring, and systems commissioning.",
        achievements: [
          "Diagnosed and resolved hardware, software, and network faults on computer-controlled robotic platforms during live sea trials.",
          "Installed and configured workstations, embedded systems, and supporting software for real-time sensor processing.",
          "Produced detailed technical reports, incident logs, and operational metrics to support engineering handover and SLA compliance.",
        ],
      },
      {
        company: "Derriford Hospital, University Hospitals Plymouth NHS Trust",
        title: "NHS Records and Patient Services Operative (Contract)",
        startDate: "January 2025",
        endDate: "Present",
        current: true,
        description: "Deployed across multiple departments at a large acute NHS hospital providing operational and logistical support in a live clinical environment.",
        achievements: [
          "Managed patient notes and records including retrieval, filing, and inter-departmental transportation in line with NHS Information Governance standards.",
          "Assisted clinical staff and patients with navigation and departmental access across a busy hospital site.",
          "Maintained strict confidentiality and professional conduct when working alongside NHS clinical and administrative teams.",
        ],
      },
    ],
    education: [
      {
        institution: "University",
        degree: "Master of Science (MSc)",
        field: "Cybersecurity",
        startDate: "2023",
        endDate: "2024",
      },
      {
        institution: "University",
        degree: "Bachelor of Science (BSc)",
        field: "Computer Science",
        startDate: "2020",
        endDate: "2023",
      },
    ],
  };

  await Profile.findOneAndUpdate({ userId: user._id }, profileData, { upsert: true, new: true });
  console.log("✅ Profile seeded successfully!");

  // Seed initial skills
  const initialSkills = [
    { name: "BSc Computer Science", type: "certificate", status: "have" },
    { name: "MSc Cybersecurity", type: "certificate", status: "have" },
    { name: "NHS Information Governance & Data Protection", type: "skill", status: "have" },
    { name: "Dell Rack Server Hardware & Maintenance", type: "skill", status: "have" },
    { name: "Network Cabling & Patch Panel Termination", type: "skill", status: "have" },
    { name: "Embedded Systems & Workstation Configuration", type: "skill", status: "have" },
    { name: "Robotics Hardware & Fault Diagnostics", type: "skill", status: "have" },
    { name: "ITIL v4 Foundation", type: "certificate", status: "in_progress" },
    { name: "Microsoft Active Directory & M365 Administration", type: "skill", status: "in_progress" },
    { name: "CompTIA Security+", type: "certificate", status: "needed" },
  ];

  for (const s of initialSkills) {
    await Skill.findOneAndUpdate(
      { userId: user._id, name: s.name },
      { ...s, userId: user._id },
      { upsert: true }
    );
  }
  console.log("✅ Skills seeded successfully!");

  await mongoose.disconnect();
}

seedProfile().catch((e) => {
  console.error(e);
  process.exit(1);
});
