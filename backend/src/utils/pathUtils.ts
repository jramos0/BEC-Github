/**
 * parse and normalize PlanB resource URLs into GitHub content paths
 */
export function extractPathFromUrl(url: string): string {
  // strip off URL fragment or query parameters
  const cleanUrl = url.split(/[#?]/)[0];

  // determine resource type (professor vs resources)
  const isProfessor = cleanUrl.includes("/professor/");
  const base = isProfessor ? "/professor/" : "/resources/";

  const parts = cleanUrl.split(base)[1];
  if (!parts) {
    console.error(`❌ Invalid URL structure: ${url}`);
    throw new Error("Invalid URL");
  }

  // extract type segment and raw slug (with UUID)
  const [type, rawSlug] = isProfessor
    ? ["professors", parts]
    : parts.split("/");

  if (!type || !rawSlug) {
    console.error(`❌ Incomplete URL parts: ${parts}`);
    throw new Error("Incomplete URL");
  }

  // remove trailing -UUID (8-4-4-4-12 hex) if present
  const slug = rawSlug.replace(
    /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 
    ""
  );

  console.log("🔍 extractPathFromUrl:", { type, rawSlug, slug });

  // build correct GitHub path per resource type
  switch (type) {
    case "newsletters":
      return `resources/newsletters/${slug}/newsletter.yml`;
    case "projects":
      return `resources/projects/${slug}/project.yml`;
    case "professors":
      return `professors/${slug}/professor.yml`;
    default:
      console.error(`❌ Unknown resource type: ${type}`);
      throw new Error(`Unknown resource type: ${type}`);
  }
}
