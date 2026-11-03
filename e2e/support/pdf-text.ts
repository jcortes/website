import { extractText, getDocumentProxy, getMeta } from "unpdf";

/**
 * Everything a reader of a PDF can see: the text of every page plus the
 * document metadata (title, author, subject…) shown by PDF viewers.
 */
export async function pdfText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: true });
  const { info } = await getMeta(pdf);
  // Text fields only: dates (CreationDate "D:2026…") would look like numbers.
  const metadata = Object.entries(info)
    .filter(([key]) => !key.endsWith("Date"))
    .map(([, value]) => value)
    .filter((value): value is string => typeof value === "string");
  return [text, ...metadata].join("\n");
}
