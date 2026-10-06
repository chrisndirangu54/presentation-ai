import PptxGenJS from "pptxgenjs";
import ExcelJS from "exceljs";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { RenderDocument, RenderPage } from "./normalize";

export type BinaryExportTarget = "pptx" | "docx" | "xlsx" | "pdf";

export interface RenderedBinary {
  bytes: Uint8Array;
  contentType: string;
  extension: BinaryExportTarget;
}

function pageLines(page: RenderPage): string[] {
  return page.blocks
    .flatMap((block) => {
      if (block.type === "chart") return [block.text ? `Chart: ${block.text}` : "Chart"];
      if (block.type === "image") return [block.text ? `Image: ${block.text}` : "Image"];
      return block.text ? [block.text] : [];
    })
    .filter(Boolean);
}

export async function renderPptx(doc: RenderDocument): Promise<RenderedBinary> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Presentation AI";
  pptx.subject = doc.title;
  pptx.title = doc.title;

  for (const page of doc.pages) {
    const slide = pptx.addSlide();
    const title = page.title ?? doc.title;
    slide.addText(title, { x: 0.6, y: 0.4, w: 12.0, h: 0.6, fontSize: 26, bold: true });
    const lines = pageLines(page);
    if (lines.length) {
      slide.addText(lines.map((line) => ({ text: line, options: { breakLine: true } })), {
        x: 0.8,
        y: 1.3,
        w: 11.6,
        h: 5.4,
        fontSize: 17,
        breakLine: true,
        valign: "top",
        margin: 0.08,
      });
    }
  }

  const buffer = await pptx.write({ outputType: "nodebuffer" });
  return {
    bytes: new Uint8Array(buffer as Buffer),
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extension: "pptx",
  };
}

export async function renderDocx(doc: RenderDocument): Promise<RenderedBinary> {
  const children: Paragraph[] = [
    new Paragraph({
      text: doc.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
    }),
  ];

  for (const page of doc.pages) {
    if (page.title) {
      children.push(new Paragraph({ text: page.title, heading: HeadingLevel.HEADING_1 }));
    }
    for (const line of pageLines(page)) {
      children.push(new Paragraph({ children: [new TextRun(line)] }));
    }
  }

  const document = new Document({ sections: [{ properties: {}, children }] });
  const buffer = await Packer.toBuffer(document);
  return {
    bytes: new Uint8Array(buffer),
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
  };
}

export async function renderXlsx(doc: RenderDocument): Promise<RenderedBinary> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Presentation AI";

  if (doc.rows?.length) {
    const sheet = workbook.addWorksheet("Data");
    const columns = Object.keys(doc.rows[0] ?? {});
    sheet.columns = columns.map((key) => ({ header: key, key, width: Math.max(14, key.length + 4) }));
    for (const row of doc.rows) sheet.addRow(row);
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  } else {
    doc.pages.forEach((page, index) => {
      const sheet = workbook.addWorksheet((page.title ?? `Page ${index + 1}`).slice(0, 31));
      sheet.addRow(["Type", "Content"]);
      page.blocks.forEach((block) => sheet.addRow([block.type, block.text ?? JSON.stringify(block.data ?? "")]));
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.getColumn(1).width = 18;
      sheet.getColumn(2).width = 80;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    bytes: new Uint8Array(buffer),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
  };
}

function wrapText(text: string, max = 92): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderPdf(doc: RenderDocument): Promise<RenderedBinary> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const sourcePage of doc.pages) {
    let page = pdf.addPage([842, 595]);
    let y = 545;
    page.drawText(sourcePage.title ?? doc.title, {
      x: 48, y, size: 22, font: bold, color: rgb(0.08, 0.08, 0.1),
    });
    y -= 40;

    for (const block of sourcePage.blocks) {
      const value =
        block.type === "chart"
          ? `Chart: ${block.text ?? "visual"}`
          : block.type === "image"
            ? `Image: ${block.text ?? "visual"}`
            : block.text ?? "";
      if (!value) continue;
      for (const line of wrapText(value)) {
        if (y < 50) {
          page = pdf.addPage([842, 595]);
          y = 545;
        }
        page.drawText(line, { x: 52, y, size: 13, font, color: rgb(0.12, 0.12, 0.14) });
        y -= 20;
      }
      y -= 6;
    }
  }

  return {
    bytes: await pdf.save(),
    contentType: "application/pdf",
    extension: "pdf",
  };
}

export async function renderBinary(
  target: BinaryExportTarget,
  doc: RenderDocument,
): Promise<RenderedBinary> {
  switch (target) {
    case "pptx":
      return renderPptx(doc);
    case "docx":
      return renderDocx(doc);
    case "xlsx":
      return renderXlsx(doc);
    case "pdf":
      return renderPdf(doc);
  }
}
