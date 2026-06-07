const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown"]);

const ACCEPT =
  ".pdf,.docx,.txt,.md,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const DOCUMENT_UPLOAD_ACCEPT = ACCEPT;

export function isSupportedDocument(file: File): boolean {
  const ext = extension(file.name);
  if (TEXT_EXTENSIONS.has(ext) || ext === "pdf" || ext === "docx") return true;
  return (
    file.type === "application/pdf" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type.startsWith("text/")
  );
}

export async function extractTextFromDocument(file: File): Promise<string> {
  if (!isSupportedDocument(file)) {
    throw new Error("Chỉ hỗ trợ PDF, DOCX, TXT, MD");
  }

  const ext = extension(file.name);

  if (TEXT_EXTENSIONS.has(ext) || file.type.startsWith("text/")) {
    const text = await file.text();
    return normalizeExtractedText(text);
  }

  if (ext === "docx" || file.type.includes("wordprocessingml")) {
    const mammoth = await import("mammoth");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return normalizeExtractedText(result.value);
  }

  if (ext === "pdf" || file.type === "application/pdf") {
    return extractPdfText(await file.arrayBuffer());
  }

  throw new Error("Định dạng file không được hỗ trợ");
}

async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const pdf = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    if (pageText.trim()) parts.push(pageText.trim());
  }

  return normalizeExtractedText(parts.join("\n\n"));
}

function extension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function normalizeExtractedText(text: string): string {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();
  if (!cleaned) throw new Error("File không có nội dung text");
  return cleaned;
}
