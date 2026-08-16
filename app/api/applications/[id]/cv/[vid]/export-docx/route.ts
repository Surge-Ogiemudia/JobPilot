import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Application } from "@/lib/db/models";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, vid } = await params;
  await connectDB();

  const app = await Application.findOne({ _id: id, userId: session.user.id }).lean() as {
    cvVersions: Array<{ _id: { toString: () => string }; content: string }>;
    companyName: string; roleTitle: string;
  } | null;
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const version = app.cvVersions.find((v) => v._id.toString() === vid);
  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  // Convert Markdown to basic DOCX structure
  const lines = version.content.split("\n");
  const docChildren: Paragraph[] = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      docChildren.push(new Paragraph({
        text: line.replace(/^# /, ""),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }));
    } else if (line.startsWith("## ")) {
      docChildren.push(new Paragraph({
        text: line.replace(/^## /, ""),
        heading: HeadingLevel.HEADING_2,
      }));
    } else if (line.startsWith("### ")) {
      docChildren.push(new Paragraph({
        text: line.replace(/^### /, ""),
        heading: HeadingLevel.HEADING_3,
      }));
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      docChildren.push(new Paragraph({
        children: [new TextRun(line.replace(/^[*-] /, ""))],
        bullet: { level: 0 },
      }));
    } else if (line.startsWith("**") && line.endsWith("**")) {
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: line.replace(/\*\*/g, ""), bold: true })],
      }));
    } else if (line.trim() === "") {
      docChildren.push(new Paragraph(""));
    } else {
      docChildren.push(new Paragraph({ children: [new TextRun(line)] }));
    }
  }

  const doc = new Document({
    creator: "JobPilot",
    title: `CV - ${app.roleTitle} at ${app.companyName}`,
    sections: [{ children: docChildren }],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `CV_${app.companyName.replace(/\s+/g, "_")}_${app.roleTitle.replace(/\s+/g, "_")}.docx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
