/**
 * Keystatic admin panel (/keystatic): the same content as the YAML files in
 * src/content/, described field by field. Every field here mirrors
 * src/content.config.ts, the schema the build validates against, so what the
 * panel saves is what the site builds from, and the files stay hand-editable.
 *
 * Storage (docs/adr/0004-keystatic-admin-in-github-mode.md):
 * - `pnpm dev`: local mode, saves straight to the files in this checkout.
 * - production build: GitHub mode, every save is a commit on the repository.
 */
import { collection, config, fields, singleton } from "@keystatic/core";
import { githubStorage } from "./src/admin/storage";

type TextOptions = { multiline?: boolean; description?: string };

/** `{ es, en }`, both required (the schema's `localized`). */
function localized(label: string, options: TextOptions = {}) {
  return fields.object(
    {
      es: fields.text({
        label: "Español",
        multiline: options.multiline,
        validation: { isRequired: true },
      }),
      en: fields.text({
        label: "English",
        multiline: options.multiline,
        validation: { isRequired: true },
      }),
    },
    { label, description: options.description, layout: [6, 6] },
  );
}

/** `{ es, en }` that may be left blank: fill both languages or neither. */
function optionalLocalized(label: string, options: TextOptions = {}) {
  return fields.object(
    {
      es: fields.text({ label: "Español", multiline: options.multiline }),
      en: fields.text({ label: "English", multiline: options.multiline }),
    },
    {
      label,
      description:
        options.description ?? "Optional: fill both languages or neither.",
      layout: [6, 6],
    },
  );
}

type LocalizedValue = { fields: { es: { value: string } } };

/** Item label for lists of `{ es, en }`: the Spanish text. */
const esLabel = (props: LocalizedValue) => props.fields.es.value || "(empty)";

/** Item label for lists of objects: the Spanish text of one of their fields. */
const esLabelOf =
  <K extends string>(key: K) =>
  (props: { fields: Record<K, LocalizedValue> }) =>
    esLabel(props.fields[key]);

function localizedList(label: string, options: TextOptions = {}) {
  return fields.array(localized(label, options), {
    label,
    itemLabel: esLabel,
    validation: { length: { min: 1 } },
  });
}

function requiredText(label: string, description?: string) {
  return fields.text({ label, description, validation: { isRequired: true } });
}

function stringList(label: string, min: 0 | 1 = 1) {
  return fields.array(requiredText("Item"), {
    label,
    itemLabel: (props) => props.value || "(empty)",
    validation: { length: { min } },
  });
}

/**
 * The file name is the slug (and the URL), so it's not stored in the file.
 * A text slug field is never written: Keystatic keeps it in the file name.
 */
const slug = fields.text({
  label: "Slug",
  description:
    "File name and URL segment: lowercase letters, numbers and hyphens. Renaming it changes the URL.",
  validation: {
    isRequired: true,
    pattern: {
      regex: /^[a-z0-9]+(-[a-z0-9]+)*$/,
      message: "Use lowercase letters, numbers and hyphens",
    },
  },
});

/** Images live next to the entry: src/assets/<kind>/<slug>/… */
function imageWithAlt(kind: "gigs" | "projects") {
  return fields.object({
    image: fields.image({
      label: "Image",
      directory: `src/assets/${kind}`,
      publicPath: `../../assets/${kind}/`,
      validation: { isRequired: true },
    }),
    alt: localized("Alt text", {
      description: "Describes the image for screen readers.",
    }),
  });
}

const yearMonth = /^\d{4}(-(0[1-9]|1[0-2]))?$/;
const optionalYearMonth = /^(\d{4}(-(0[1-9]|1[0-2]))?)?$/;
const yearMonthMessage = "Use YYYY or YYYY-MM, e.g. 2021-10";

const pkg = (label: string) =>
  fields.object(
    {
      name: localized("Name"),
      scope: localized("Scope", { multiline: true }),
      deliverables: localizedList("Deliverables"),
      deliveryDays: fields.integer({
        label: "Estimated delivery (days)",
        validation: { isRequired: true, min: 1 },
      }),
      revisions: fields.integer({
        label: "Revisions",
        validation: { isRequired: true, min: 0 },
      }),
      price: fields.object(
        {
          amount: fields.number({ label: "Amount", validation: { min: 1 } }),
          currency: fields.text({
            label: "Currency",
            description: "ISO code, e.g. USD.",
            validation: {
              pattern: {
                regex: /^([A-Z]{3})?$/,
                message: "Use a three-letter code, e.g. USD",
              },
            },
          }),
        },
        {
          label: "Price (never shown on the site)",
          description: "Optional: fill both or neither.",
          layout: [6, 6],
        },
      ),
    },
    { label },
  );

export default config({
  storage: import.meta.env.DEV ? { kind: "local" } : githubStorage,
  ui: { brand: { name: "jcortes.pages.dev" } },

  collections: {
    gigs: collection({
      label: "Gigs",
      slugField: "slug",
      path: "src/content/gigs/*",
      format: { data: "yaml" },
      columns: ["order"],
      schema: {
        slug,
        order: fields.integer({
          label: "Order",
          description: "Position in listings, lowest first.",
          validation: { isRequired: true },
        }),
        title: localized("Title"),
        summary: localized("Summary", { multiline: true }),
        description: localized("Description", { multiline: true }),
        category: localized("Category"),
        tags: localizedList("Tags"),
        gallery: fields.array(imageWithAlt("gigs"), {
          label: "Gallery",
          itemLabel: esLabelOf("alt"),
          validation: { length: { min: 1 } },
        }),
        packages: fields.object(
          {
            basic: pkg("Basic"),
            standard: pkg("Standard"),
            premium: pkg("Premium"),
          },
          { label: "Packages" },
        ),
        faq: fields.array(
          fields.object({
            question: localized("Question"),
            answer: localized("Answer", { multiline: true }),
          }),
          {
            label: "FAQ",
            itemLabel: esLabelOf("question"),
            validation: { length: { min: 1 } },
          },
        ),
        requirements: localizedList("What I need from you", {
          multiline: true,
        }),
      },
    }),

    projects: collection({
      label: "Projects",
      slugField: "slug",
      path: "src/content/projects/*",
      format: { data: "yaml" },
      schema: {
        slug,
        gigs: fields.multiRelationship({
          label: "Gigs",
          description: "Shown as related work on these gigs.",
          collection: "gigs",
          validation: { length: { min: 1 } },
        }),
        title: localized("Title"),
        descriptor: localized("Client descriptor", {
          description:
            "Industry and region only, e.g. 'Fintech company in the US'.",
        }),
        role: localized("Role"),
        duration: optionalLocalized("Duration"),
        problem: localized("Problem", { multiline: true }),
        solution: localized("Solution", { multiline: true }),
        result: localized("Result", { multiline: true }),
        metrics: fields.array(localized("Metric"), {
          label: "Metrics",
          itemLabel: esLabel,
        }),
        tech: stringList("Technologies"),
        confidential: fields.checkbox({
          label: "Confidential",
          description:
            "Anonymous client: no client name and no links (the build rejects them).",
          defaultValue: true,
        }),
        client: fields.text({
          label: "Client name",
          description: "Only for non-confidential projects.",
        }),
        links: fields.array(
          fields.object({
            label: localized("Label"),
            url: fields.url({ label: "URL", validation: { isRequired: true } }),
          }),
          {
            label: "Links",
            description: "Only for non-confidential projects.",
            itemLabel: esLabelOf("label"),
          },
        ),
        images: fields.array(imageWithAlt("projects"), {
          label: "Images",
          itemLabel: esLabelOf("alt"),
        }),
      },
    }),

    testimonials: collection({
      label: "Testimonials",
      slugField: "slug",
      path: "src/content/testimonials/*",
      format: { data: "yaml" },
      schema: {
        slug,
        order: fields.integer({
          label: "Order",
          description: "Lowest first.",
          defaultValue: 0,
          validation: { isRequired: true },
        }),
        quote: localized("Quote", { multiline: true }),
        author: fields.object(
          {
            name: fields.text({ label: "Name" }),
            role: optionalLocalized("Role"),
            company: fields.text({ label: "Company" }),
          },
          { label: "Author", description: "All optional." },
        ),
        link: fields.url({ label: "Link" }),
      },
    }),
  },

  singletons: {
    profile: singleton({
      label: "Profile / CV",
      path: "src/content/profile/profile",
      format: { data: "yaml" },
      schema: {
        name: requiredText("Name"),
        headline: localized("Headline"),
        location: localized("Location"),
        positioning: localized("Positioning", { multiline: true }),
        summary: localizedList("Summary paragraphs", { multiline: true }),
        experience: fields.array(
          fields.object({
            role: localized("Role"),
            employer: fields.text({
              label: "Employer",
              description: "Leave empty for independent work.",
            }),
            location: optionalLocalized("Location"),
            start: fields.text({
              label: "Start",
              validation: {
                isRequired: true,
                pattern: { regex: yearMonth, message: yearMonthMessage },
              },
            }),
            end: fields.text({
              label: "End",
              description: "Leave empty while the role is current.",
              validation: {
                pattern: {
                  regex: optionalYearMonth,
                  message: yearMonthMessage,
                },
              },
            }),
            clients: fields.array(localized("Client descriptor"), {
              label: "Clients",
              description:
                "Anonymized descriptors only (industry and region), never names.",
              itemLabel: esLabel,
            }),
            achievements: localizedList("Achievements", { multiline: true }),
            tech: stringList("Technologies", 0),
          }),
          {
            label: "Experience",
            itemLabel: (props) =>
              `${props.fields.role.fields.es.value || "(empty)"} · ${props.fields.start.value}`,
            validation: { length: { min: 1 } },
          },
        ),
        skills: fields.array(
          fields.object({
            area: localized("Area"),
            items: stringList("Skills"),
          }),
          {
            label: "Skills",
            itemLabel: esLabelOf("area"),
            validation: { length: { min: 1 } },
          },
        ),
        education: fields.array(
          fields.object({
            title: localized("Title"),
            institution: requiredText("Institution"),
            location: optionalLocalized("Location"),
            year: fields.integer({ label: "Year" }),
            details: optionalLocalized("Details"),
          }),
          {
            label: "Education",
            itemLabel: esLabelOf("title"),
            validation: { length: { min: 1 } },
          },
        ),
        courses: fields.array(
          fields.object({
            name: requiredText("Name", "Course titles aren't translated."),
            provider: fields.text({ label: "Provider" }),
            certification: fields.checkbox({ label: "Certification" }),
          }),
          {
            label: "Courses and certifications",
            itemLabel: (props) => props.fields.name.value || "(empty)",
            validation: { length: { min: 1 } },
          },
        ),
        languages: fields.array(
          fields.object({
            language: localized("Language"),
            level: localized("Level"),
          }),
          {
            label: "Languages",
            itemLabel: esLabelOf("language"),
            validation: { length: { min: 1 } },
          },
        ),
      },
    }),

    settings: singleton({
      label: "Site settings",
      path: "src/content/settings/site",
      format: { data: "yaml" },
      schema: {
        bookingUrl: fields.url({
          label: "Booking URL",
          description: "Cal.com link behind every 'Book a call' button.",
          validation: { isRequired: true },
        }),
        yearsOfExperience: fields.integer({
          label: "Years of experience",
          description: "Shown as '<n>+ years'.",
          validation: { isRequired: true, min: 1 },
        }),
        trustBar: stringList("Trust bar technologies"),
        social: fields.object(
          {
            github: fields.url({
              label: "GitHub",
              validation: { isRequired: true },
            }),
            linkedin: fields.url({ label: "LinkedIn" }),
          },
          { label: "Social links" },
        ),
      },
    }),
  },
});
