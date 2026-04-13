import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPageSEO } from "@/lib/seo-config";

/**
 * Dynamic SEO head — updates title, meta description, keywords and canonical per route.
 * Place inside BrowserRouter in App.tsx.
 */
export function DynamicSEOHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = getPageSEO(pathname);

    // Title
    document.title = seo.title;

    // Helper
    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", seo.description);
    setMeta("name", "keywords", seo.keywords);
    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.description);
    setMeta("property", "og:url", seo.canonical);
    setMeta("name", "twitter:title", seo.title);
    setMeta("name", "twitter:description", seo.description);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.href = seo.canonical;
  }, [pathname]);

  return null;
}
