import PDFDocument from "pdfkit";
import type { Profile } from "../content/profile";
import { formatPeriod } from "../i18n/dates";
import { useTranslations, type Locale } from "../i18n/ui";

const ACCENT = "#0f766e";
const INK = "#0f172a";
const MUTED = "#475569";
const MARGIN = 50;

/**
 * The CV as a print-styled A4 PDF, from the same profile as the About page.
 * It never contains phone numbers or references: the profile has neither,
 * and references are only offered "upon request".
 */
export function renderCvPdf(
  profile: Profile,
  locale: Locale,
): Promise<Uint8Array<ArrayBuffer>> {
  const t = useTranslations(locale);
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    lang: locale,
    displayTitle: true,
    info: {
      Title: `${profile.name} · CV`,
      Author: profile.name,
      Subject: profile.headline[locale],
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on("error", reject);
  });

  const width = doc.page.width - 2 * MARGIN;
  const bottom = () => doc.page.height - MARGIN;
  /** Starts a new page unless `height` more points fit on this one. */
  const keep = (height: number) => {
    if (doc.y + height > bottom()) doc.addPage();
  };

  const heading = (text: string) => {
    keep(60);
    doc.moveDown(1);
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(ACCENT)
      .text(text.toLocaleUpperCase(locale), { characterSpacing: 1.2 });
    const y = doc.y + 2;
    doc
      .moveTo(MARGIN, y)
      .lineTo(MARGIN + width, y)
      .lineWidth(0.5)
      .strokeColor(ACCENT)
      .stroke();
    doc.moveDown(0.6);
  };

  const body = (text: string, color = INK) =>
    doc.font("Helvetica").fontSize(9.5).fillColor(color).text(text, {
      lineGap: 1.5,
    });

  const bullets = (items: string[]) =>
    doc.font("Helvetica").fontSize(9.5).fillColor(INK).list(items, {
      bulletRadius: 1.4,
      textIndent: 10,
      bulletIndent: 4,
      lineGap: 1.5,
      paragraphGap: 1.5,
    });

  // Header
  doc.font("Helvetica-Bold").fontSize(22).fillColor(INK).text(profile.name);
  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor(ACCENT)
    .text(profile.headline[locale]);
  doc.moveDown(0.3);
  doc
    .fontSize(9)
    .fillColor(MUTED)
    .text(
      [
        profile.location[locale],
        profile.links.github.replace(/^https?:\/\//, ""),
        profile.links.linkedin?.replace(/^https?:\/\//, ""),
      ]
        .filter(Boolean)
        .join("  ·  "),
    );

  heading(t("about.profile"));
  body(profile.positioning[locale]);
  for (const paragraph of profile.summary) {
    doc.moveDown(0.4);
    body(paragraph[locale], MUTED);
  }

  heading(t("about.experience"));
  profile.experience.forEach((job, i) => {
    if (i > 0) doc.moveDown(0.8);
    keep(70);
    const period = formatPeriod(locale, job, t("about.present"));
    const top = doc.y;
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(period, MARGIN, top, { width, align: "right" });
    doc
      .font("Helvetica-Bold")
      .fontSize(10.5)
      .fillColor(INK)
      .text(job.role[locale], MARGIN, top, { width: width - 130 });
    const where = [job.employer, job.location?.[locale]].filter(Boolean);
    if (where.length > 0) {
      doc.font("Helvetica").fontSize(9.5).fillColor(ACCENT);
      doc.text(where.join(" · "));
    }
    if (job.clients?.length) {
      doc
        .font("Helvetica-Oblique")
        .fontSize(9)
        .fillColor(MUTED)
        .text(
          `${t("about.clients")}: ${job.clients.map((c) => c[locale]).join("; ")}`,
        );
    }
    doc.moveDown(0.3);
    bullets(job.achievements.map((item) => item[locale]));
    if (job.tech.length > 0) {
      doc.moveDown(0.2);
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(MUTED)
        .text(`${t("about.tech")}: ${job.tech.join(", ")}`);
    }
  });

  heading(t("about.skills"));
  for (const { area, items } of profile.skills) {
    doc
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .fillColor(INK)
      .text(`${area[locale]}: `, { continued: true })
      .font("Helvetica")
      .fillColor(MUTED)
      .text(items.join(", "), { lineGap: 1.5 });
  }

  heading(t("about.education"));
  for (const item of profile.education) {
    keep(30);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK);
    doc.text(item.title[locale]);
    body(
      [item.institution, item.location?.[locale], item.year]
        .filter(Boolean)
        .join(" · "),
      MUTED,
    );
    if (item.details) body(item.details[locale], MUTED);
    doc.moveDown(0.3);
  }

  heading(t("about.courses"));
  bullets(
    profile.courses.map((course) =>
      [
        course.name,
        course.provider,
        course.certification ? t("about.certification") : undefined,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
  );

  heading(t("about.languages"));
  body(
    profile.languages
      .map(({ language, level }) => `${language[locale]} (${level[locale]})`)
      .join("  ·  "),
  );

  doc.moveDown(1.5);
  doc
    .font("Helvetica-Oblique")
    .fontSize(9)
    .fillColor(MUTED)
    .text(t("about.references"));

  doc.end();
  return done;
}
