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

const pkg = z.strictObject({
  name: localized,
  scope: localized,
  deliverables: nonEmptyList(localized),
  deliveryDays: z.number().int().positive(),
  revisions: z.number().int().nonnegative(),
  // Kept for the future; never rendered while prices are out of scope.
  price: z
    .strictObject({
      amount: z.number().positive(),
      currency: z.string().length(3),
    })
    .optional(),
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
        duration: localized.optional(),
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

export const collections = { gigs, projects };
