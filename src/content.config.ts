import path from "node:path";
import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/** Text in every locale. Both are required so the two versions stay in sync. */
const localized = z.strictObject({
  es: z.string().trim().min(1),
  en: z.string().trim().min(1),
});

const nonEmptyList = <T extends z.ZodType>(item: T) => z.array(item).min(1);

/**
 * An optional object that may also be written as `{}`. The admin panel
 * (Keystatic, see keystatic.config.ts) saves an optional group whose fields
 * are all blank that way, so `{}` means "not set", same as leaving it out.
 */
const optionalGroup = <T extends z.ZodType>(group: T) =>
  z.preprocess(
    (value) =>
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
        ? undefined
        : value,
    group.optional(),
  );

/** Optional text in every locale: both or neither. */
const optionalLocalized = optionalGroup(localized);

const pkg = z.strictObject({
  name: localized,
  scope: localized,
  deliverables: nonEmptyList(localized),
  deliveryDays: z.number().int().positive(),
  revisions: z.number().int().nonnegative(),
  // Kept for the future; never rendered while prices are out of scope.
  price: optionalGroup(
    z.strictObject({
      amount: z.number().positive(),
      currency: z.string().length(3),
    }),
  ),
});

// The E2E suite adds fixture entries (e.g. a gig with no related work) when
// CONTENT_FIXTURES=true. Production builds never set it.
const withFixtures = process.env.CONTENT_FIXTURES === "true";

function yamlFiles(collection: string) {
  return glob({
    base: ".",
    pattern: [
      `src/content/${collection}/*.yaml`,
      ...(withFixtures ? [`e2e/fixtures/content/${collection}/*.yaml`] : []),
    ],
    // The slug is the file name, wherever the file lives.
    generateId: ({ entry }) => path.basename(entry, ".yaml"),
  });
}

const gigs = defineCollection({
  loader: yamlFiles("gigs"),
  schema: ({ image }) =>
    z.strictObject({
      order: z.number().int(),
      title: localized,
      summary: localized,
      description: localized,
      category: localized,
      tags: nonEmptyList(localized),
      gallery: nonEmptyList(z.strictObject({ image: image(), alt: localized })),
      // Exactly three packages, one per tier.
      packages: z.strictObject({
        basic: pkg,
        standard: pkg,
        premium: pkg,
      }),
      faq: nonEmptyList(
        z.strictObject({ question: localized, answer: localized }),
      ),
      requirements: nonEmptyList(localized),
    }),
});

const projects = defineCollection({
  loader: yamlFiles("projects"),
  schema: ({ image }) =>
    z
      .strictObject({
        gigs: nonEmptyList(reference("gigs")),
        title: localized,
        descriptor: localized,
        role: localized,
        duration: optionalLocalized,
        problem: localized,
        solution: localized,
        result: localized,
        metrics: z.array(localized).optional(),
        tech: nonEmptyList(z.string().trim().min(1)),
        confidential: z.boolean(),
        // Rendered only for non-confidential projects.
        client: z.string().trim().min(1).optional(),
        links: z
          .array(z.strictObject({ label: localized, url: z.url() }))
          .optional(),
        images: z
          .array(z.strictObject({ image: image(), alt: localized }))
          .optional(),
      })
      .refine((p) => !p.confidential || (!p.client && !p.links?.length), {
        message: "A confidential project must not have a client name or links",
      }),
});

/** "2011" or "2021-10": the CV lists some early roles by year only. */
const yearMonth = z
  .string()
  .regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, "Expected YYYY or YYYY-MM");

const experience = z
  .strictObject({
    role: localized,
    // Omitted for independent work.
    employer: z.string().trim().min(1).optional(),
    location: optionalLocalized,
    start: yearMonth,
    // Omitted while the role is current.
    end: yearMonth.optional(),
    // Who the work was for, only as anonymized descriptors (industry and
    // region), never by name.
    clients: z.array(localized).optional(),
    achievements: nonEmptyList(localized),
    tech: z.array(z.string().trim().min(1)),
  })
  .refine((e) => !e.end || e.end >= e.start, {
    message: "An experience entry cannot end before it starts",
  });

// Singleton: exactly one file (see src/content/profile.ts). It feeds both the
// About page and the CV PDF.
const profile = defineCollection({
  loader: yamlFiles("profile"),
  schema: z.strictObject({
    name: z.string().trim().min(1),
    headline: localized,
    location: localized,
    positioning: localized,
    summary: nonEmptyList(localized),
    experience: nonEmptyList(experience),
    skills: nonEmptyList(
      z.strictObject({
        area: localized,
        items: nonEmptyList(z.string().trim().min(1)),
      }),
    ),
    education: nonEmptyList(
      z.strictObject({
        title: localized,
        institution: z.string().trim().min(1),
        location: optionalLocalized,
        year: z.number().int().optional(),
        details: optionalLocalized,
      }),
    ),
    courses: nonEmptyList(
      z.strictObject({
        // Course titles are proper names and are not translated.
        name: z.string().trim().min(1),
        provider: z.string().trim().min(1).optional(),
        certification: z.boolean().default(false),
      }),
    ),
    languages: nonEmptyList(
      z.strictObject({ language: localized, level: localized }),
    ),
  }),
});

// What other people say about the work. The initial set is empty, and the
// home page renders the section only when at least one exists.
const testimonials = defineCollection({
  loader: yamlFiles("testimonials"),
  schema: z.strictObject({
    order: z.number().int().default(0),
    quote: localized,
    author: z
      .strictObject({
        name: z.string().trim().min(1).optional(),
        role: optionalLocalized,
        company: z.string().trim().min(1).optional(),
      })
      .default({}),
    link: z.url().optional(),
  }),
});

// Singleton (see src/content/settings.ts): site-wide values the owner edits.
// E2E builds swap it for e2e/fixtures/content/settings/ instead of adding to
// it, so tests control the values (e.g. a fake booking URL).
const settings = defineCollection({
  loader: glob({
    base: ".",
    pattern: withFixtures
      ? "e2e/fixtures/content/settings/*.yaml"
      : "src/content/settings/*.yaml",
    generateId: ({ entry }) => path.basename(entry, ".yaml"),
  }),
  schema: z.strictObject({
    // Public Cal.com link behind every "Book a call" button.
    bookingUrl: z.url(),
    // Shown as "<n>+ years" in the hero and the trust bar.
    yearsOfExperience: z.number().int().positive(),
    // Key technologies listed in the home page's trust bar.
    trustBar: nonEmptyList(z.string().trim().min(1)),
    social: z.strictObject({
      github: z.url(),
      linkedin: z.url().optional(),
    }),
  }),
});

export const collections = { gigs, projects, profile, testimonials, settings };
