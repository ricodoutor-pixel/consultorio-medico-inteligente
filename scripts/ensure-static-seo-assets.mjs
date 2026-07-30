import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const assetsToCopy = [
  ["public/sitemap-final.xml", "dist/sitemap-final.xml"],
  ["public/sitemap.xml", "dist/sitemap.xml"],
  ["public/robots.txt", "dist/robots.txt"],
  ["public/_redirects", "dist/_redirects"],
  ["public/_headers", "dist/_headers"],
  ["public/.htaccess", "dist/.htaccess"],
];

for (const [sourceRelative, destinationRelative] of assetsToCopy) {
  const source = resolve(sourceRelative);
  const destination = resolve(destinationRelative);

  try {
    if (!existsSync(source)) {
      console.warn(`[static-seo] skipping missing file: ${sourceRelative}`);
      continue;
    }

    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
    console.log(`[static-seo] copied ${sourceRelative} -> ${destinationRelative}`);
  } catch (err) {
    console.warn(`[static-seo] Failed to copy ${sourceRelative} to ${destinationRelative}:`, err.message);
  }
}