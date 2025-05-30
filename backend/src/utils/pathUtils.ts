/**
 * Parse and normalize PlanB resource URLs into GitHub content paths
 */
export function extractPathFromUrl(url: string): string {
  // Strip off URL fragment or query parameters
  const cleanUrl = url.split(/[#?]/)[0];

  // Determine base path and type
  let base: string;
  if (cleanUrl.includes("/professor/")) {
    base = "/professor/";
  } else if (cleanUrl.includes("/events/")) {
    base = "/events/";
  } else {
    base = "/resources/";
  }

  // Extract path after base
  const parts = cleanUrl.split(base)[1];
  if (!parts) {
    console.error(`❌ Invalid URL structure: ${url}`);
    throw new Error("Invalid URL");
  }

  let type: string;
  let rawSlug: string;

  if (base === "/professor/") {
    type = "professors";
    rawSlug = parts;
  } else if (base === "/events/") {
    type = "events";
    rawSlug = parts; // This is now expected to be the event's name (slug), not a UUID
  } else {
    [type, rawSlug] = parts.split("/");
  }

  if (!type || !rawSlug) {
    console.error(`❌ Incomplete URL parts: ${parts}`);
    throw new Error("Incomplete URL");
  }

  // Remove trailing UUID if present (only for types other than events)
  const slug = type !== "events"
    ? rawSlug.replace(
        /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        ""
      )
    : rawSlug;

  console.log("🔍 extractPathFromUrl:", { type, rawSlug, slug });

  // Build correct GitHub path per resource type
  switch (type) {
    case "newsletters":
      return `resources/newsletters/${slug}/newsletter.yml`;
    case "projects":
      return `resources/projects/${slug}/project.yml`;
    case "professors":
      return `professors/${slug}/professor.yml`;
    case "events":
      return `events/${slug}/event.yml`;
    default:
      console.error(`❌ Unknown resource type: ${type}`);
      throw new Error(`Unknown resource type: ${type}`);
  }
}
