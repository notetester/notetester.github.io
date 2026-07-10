import { writeFile } from "node:fs/promises";
import { aiProjectLessons } from "../content/lessons-ai-projects.ts";
import { foundationLessons } from "../content/lessons-foundations.ts";
import { fullstackLessons } from "../content/lessons-fullstack.ts";

const baseUrl = "https://notetester.github.io";
const staticRoutes = ["", "/roadmap", "/glossary", "/projects", "/sources"];
const lessons = [...foundationLessons, ...fullstackLessons, ...aiProjectLessons];
const routes = [
  ...staticRoutes.map((route) => ({ path: route, priority: route === "" ? "1.0" : "0.7" })),
  ...lessons.map((lesson) => ({ path: `/learn/${lesson.slug}`, priority: "0.8" })),
];

const entries = routes.map(({ path, priority }) => `  <url>
    <loc>${baseUrl}${path}/</loc>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

await writeFile(new URL("../public/sitemap.xml", import.meta.url), xml, "utf8");
console.log(`Generated sitemap with ${routes.length} routes.`);
