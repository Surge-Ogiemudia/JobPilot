import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  email: string;
  hashedPassword: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    hashedPassword: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// ─── Profile ───────────────────────────────────────────────────────────────

export interface IWorkExperience {
  _id?: Types.ObjectId;
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface IEducation {
  _id?: Types.ObjectId;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
}

export interface IProfile extends Document {
  userId: Types.ObjectId;
  fullName: string;
  headline: string;
  summary: string;
  workExperience: IWorkExperience[];
  education: IEducation[];
  contactInfo: {
    email: string;
    phone?: string;
    location: string;
    rightToWork: string;
  };
  links: {
    linkedin?: string;
    github?: string;
    personalSite?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WorkExperienceSchema = new Schema<IWorkExperience>({
  company: { type: String, required: true },
  title: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: String,
  current: { type: Boolean, default: false },
  description: { type: String, default: "" },
  achievements: { type: [String], default: [] },
});

const EducationSchema = new Schema<IEducation>({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: String,
});

const ProfileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, default: "" },
    headline: { type: String, default: "" },
    summary: { type: String, default: "" },
    workExperience: { type: [WorkExperienceSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    contactInfo: {
      email: { type: String, default: "" },
      phone: String,
      location: { type: String, default: "" },
      rightToWork: { type: String, default: "" },
    },
    links: {
      linkedin: String,
      github: String,
      personalSite: String,
    },
  },
  { timestamps: true }
);

export const Profile =
  mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);

// ─── Skill ─────────────────────────────────────────────────────────────────

export interface ISkill extends Document {
  userId: Types.ObjectId;
  name: string;
  type: "skill" | "certificate";
  status: "have" | "in_progress" | "needed";
  evidenceFileId?: Types.ObjectId;
  evidenceUrl?: string;
  sourceApplicationIds: Types.ObjectId[];
  dateCompleted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new Schema<ISkill>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["skill", "certificate"], required: true },
    status: { type: String, enum: ["have", "in_progress", "needed"], default: "have" },
    evidenceFileId: Schema.Types.ObjectId,
    evidenceUrl: String,
    sourceApplicationIds: { type: [Schema.Types.ObjectId], default: [] },
    dateCompleted: Date,
  },
  { timestamps: true }
);

export const Skill =
  mongoose.models.Skill || mongoose.model<ISkill>("Skill", SkillSchema);

// ─── Portfolio ─────────────────────────────────────────────────────────────

export interface IPortfolioItem extends Document {
  userId: Types.ObjectId;
  title: string;
  description: string;
  status: "suggested" | "in_progress" | "complete";
  prdText?: string;
  githubUrl?: string;
  sourceApplicationId?: Types.ObjectId;
  dateStarted?: Date;
  dateCompleted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioItemSchema = new Schema<IPortfolioItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["suggested", "in_progress", "complete"],
      default: "suggested",
    },
    prdText: String,
    githubUrl: String,
    sourceApplicationId: Schema.Types.ObjectId,
    dateStarted: Date,
    dateCompleted: Date,
  },
  { timestamps: true }
);

export const PortfolioItem =
  mongoose.models.PortfolioItem ||
  mongoose.model<IPortfolioItem>("PortfolioItem", PortfolioItemSchema);

// ─── Application ───────────────────────────────────────────────────────────

export const APPLICATION_STAGES = [
  "JD_PASTED",
  "RESEARCHED",
  "NETWORK_MAPPED",
  "GAP_CHECK_DONE",
  "CERT_PENDING",
  "PORTFOLIO_CHECK_DONE",
  "PORTFOLIO_PENDING",
  "OUTREACH_DRAFTED",
  "OUTREACH_SENT",
  "CV_DRAFTED",
  "CV_REVIEWED",
  "SUBMITTED",
  "ACK_RECEIVED",
  "HM_OUTREACH_SENT",
  "IN_PROGRESS",
  "CLOSED",
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const STATUS_ENUM = ["received", "next_stage", "rejected", "offer", "unclear"] as const;
export type ApplicationStatus = (typeof STATUS_ENUM)[number];

export interface IStageHistoryEntry {
  stage: ApplicationStage;
  enteredAt: Date;
  exitedAt?: Date;
  wasSoftLockOverridden: boolean;
  overrideReason?: string;
}

export interface ICVVersion {
  _id: Types.ObjectId;
  content: string;
  generatedAt: Date;
  isApproved: boolean;
  reviewResult?: { passed: boolean; issues: string[] };
}

export interface ICoverLetterVersion {
  _id: Types.ObjectId;
  content: string;
  generatedAt: Date;
  isApproved: boolean;
}

export interface IOutreachMessage {
  contactId: Types.ObjectId;
  draftedText: string;
  sent: boolean;
  sentAt?: Date;
  replyText?: string;
}

export interface IApplication extends Document {
  userId: Types.ObjectId;
  companyName: string;
  roleTitle: string;
  jobPostingUrl?: string;
  jdText: string;
  currentStage: ApplicationStage;
  stageHistory: IStageHistoryEntry[];
  researchSummary?: string;
  gapCheckResult?: { missing: Array<{ name: string; rationale: string }>; matched: string[] };
  portfolioSuggestionId?: Types.ObjectId;
  cvVersions: ICVVersion[];
  coverLetterVersions: ICoverLetterVersion[];
  outreachMessages: IOutreachMessage[];
  submittedAt?: Date;
  gmailThreadId?: string;
  systemSuggestedStatus?: ApplicationStatus;
  systemSuggestedConfidence?: number;
  userConfirmedStatus?: ApplicationStatus;
  closedAt?: Date;
  closedReason?: "offer_accepted" | "offer_declined" | "rejected" | "withdrawn" | "ghosted";
  createdAt: Date;
  updatedAt: Date;
}

const StageHistorySchema = new Schema<IStageHistoryEntry>({
  stage: { type: String, enum: APPLICATION_STAGES, required: true },
  enteredAt: { type: Date, required: true },
  exitedAt: Date,
  wasSoftLockOverridden: { type: Boolean, default: false },
  overrideReason: String,
});

const CVVersionSchema = new Schema<ICVVersion>({
  content: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false },
  reviewResult: {
    passed: Boolean,
    issues: [String],
  },
});

const CoverLetterVersionSchema = new Schema<ICoverLetterVersion>({
  content: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false },
});

const OutreachMessageSchema = new Schema<IOutreachMessage>({
  contactId: { type: Schema.Types.ObjectId, required: true },
  draftedText: { type: String, default: "" },
  sent: { type: Boolean, default: false },
  sentAt: Date,
  replyText: String,
});

const ApplicationSchema = new Schema<IApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyName: { type: String, required: true },
    roleTitle: { type: String, required: true },
    jobPostingUrl: String,
    jdText: { type: String, required: true },
    currentStage: {
      type: String,
      enum: APPLICATION_STAGES,
      default: "JD_PASTED",
    },
    stageHistory: { type: [StageHistorySchema], default: [] },
    researchSummary: String,
    gapCheckResult: {
      missing: [{ name: String, rationale: String }],
      matched: [String],
    },
    portfolioSuggestionId: Schema.Types.ObjectId,
    cvVersions: { type: [CVVersionSchema], default: [] },
    coverLetterVersions: { type: [CoverLetterVersionSchema], default: [] },
    outreachMessages: { type: [OutreachMessageSchema], default: [] },
    submittedAt: Date,
    gmailThreadId: String,
    systemSuggestedStatus: { type: String, enum: STATUS_ENUM },
    systemSuggestedConfidence: Number,
    userConfirmedStatus: { type: String, enum: STATUS_ENUM },
    closedAt: Date,
    closedReason: {
      type: String,
      enum: ["offer_accepted", "offer_declined", "rejected", "withdrawn", "ghosted"],
    },
  },
  { timestamps: true }
);

export const Application =
  mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);

// ─── Network Contact ────────────────────────────────────────────────────────

export const CONTACT_CATEGORIES = [
  "same_title_same_company",
  "different_title_same_company",
  "same_title_different_company",
  "hiring_manager",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export interface INetworkContact extends Document {
  userId: Types.ObjectId;
  applicationId: Types.ObjectId;
  category: ContactCategory;
  pastedProfileText: string;
  parsedSummary?: {
    title: string;
    company: string;
    tenure: string;
    notableSkills: string[];
  };
  outreachMessageDrafted?: string;
  outreachSent: boolean;
  replyReceived: boolean;
  replyText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NetworkContactSchema = new Schema<INetworkContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", required: true },
    category: { type: String, enum: CONTACT_CATEGORIES, required: true },
    pastedProfileText: { type: String, required: true },
    parsedSummary: {
      title: String,
      company: String,
      tenure: String,
      notableSkills: [String],
    },
    outreachMessageDrafted: String,
    outreachSent: { type: Boolean, default: false },
    replyReceived: { type: Boolean, default: false },
    replyText: String,
  },
  { timestamps: true }
);

export const NetworkContact =
  mongoose.models.NetworkContact ||
  mongoose.model<INetworkContact>("NetworkContact", NetworkContactSchema);

// ─── Content Post ───────────────────────────────────────────────────────────

export interface IContentPost extends Document {
  userId: Types.ObjectId;
  dateSuggested: Date;
  draftText: string;
  source: "general" | "portfolio_project" | "milestone";
  sourcePortfolioItemId?: Types.ObjectId;
  status: "suggested" | "posted" | "skipped";
  postedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContentPostSchema = new Schema<IContentPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateSuggested: { type: Date, default: Date.now },
    draftText: { type: String, required: true },
    source: {
      type: String,
      enum: ["general", "portfolio_project", "milestone"],
      default: "general",
    },
    sourcePortfolioItemId: Schema.Types.ObjectId,
    status: { type: String, enum: ["suggested", "posted", "skipped"], default: "suggested" },
    postedAt: Date,
  },
  { timestamps: true }
);

export const ContentPost =
  mongoose.models.ContentPost ||
  mongoose.model<IContentPost>("ContentPost", ContentPostSchema);
