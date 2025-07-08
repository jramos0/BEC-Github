/**
 * Parse and normalize PlanB resource URLs into GitHub content paths
 */
export function extractPathFromUrl(url: string): string {
  const cleanUrl = url.split(/[#?]/)[0];

  const baseMap: Record<string, string> = {
    "/professor/": "professors",
    "/events/": "events",
    "/resources/": "resources",
    "/tutorials/wallet/": "wallet",
    "/tutorials/node/": "node",
    "/tutorials/mining/": "mining",
    "/tutorials/exchange/": "exchange",
    "/tutorials/business/": "business",
    "/tutorials/privacy/": "privacy",
    "/tutorials/computer-security/": "computer-security",
    "/tutorials/contribution/": "contribution",
  };

  const matchingBase = Object.keys(baseMap)
    .sort((a, b) => b.length - a.length) 
    .find(base => cleanUrl.includes(base));

  if (!matchingBase) {
    console.error(`❌ Unknown URL base: ${url}`);
    throw new Error("Unknown URL base");
  }

  const section = baseMap[matchingBase];
  const relativePath = cleanUrl.split(matchingBase)[1];
  if (!relativePath) {
    console.error(`❌ Invalid URL structure: ${url}`);
    throw new Error("Invalid URL");
  }

  const parts = relativePath.split("/").filter(Boolean);

  let slug = "";
  if (section === "professors" || section === "events") {
    slug = parts[0];
  } else {
    if (parts.length < 2) {
      console.error(`❌ Incomplete URL parts: ${relativePath}`);
      throw new Error("Incomplete URL");
    }
    slug = parts[1];
  }

  // Remover UUID si lo hay
  slug = slug.replace(
    /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    ""
  );

  console.log("🔍 extractPathFromUrl:", { section, slug });

  // Construcción del path final
  switch (section) {
    case "professors":
      return `professors/${slug}/professor.yml`;
    case "events":
      return `events/${slug}/event.yml`;
    case "wallet":
      return `tutorials/wallet/${slug}/tutorial.yml`;
    case "node":
      return `tutorials/node/${slug}/tutorial.yml`;
    case "mining":
      return `tutorials/mining/${slug}/tutorial.yml`;
    case "exchange":
      return `tutorials/exchange/${slug}/tutorial.yml`;
    case "business":
      return `tutorials/business/${slug}/tutorial.yml`;
    case "privacy":
      return `tutorials/privacy/${slug}/tutorial.yml`;
    case "computer-security":
      return `tutorials/computer-security/${slug}/tutorial.yml`;
    case "contribution":
      return `tutorials/contribution/${slug}/tutorial.yml`;
    case "resources":
      if (parts[0] === "newsletters") {
        return `resources/newsletters/${slug}/newsletter.yml`;
      } else if (parts[0] === "projects") {
        return `resources/projects/${slug}/project.yml`;
      }
      break;
  }

  console.error(`❌ Unknown section or type: ${section}`);
  throw new Error(`Unknown section or type: ${section}`);
}
