import { getCollection, type CollectionEntry } from "astro:content";

export type Testimonial = CollectionEntry<"testimonials">;

/** Every testimonial, in display order. Often none. */
export async function getTestimonials(): Promise<Testimonial[]> {
  const entries = await getCollection("testimonials");
  return entries.sort(
    (a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id),
  );
}
