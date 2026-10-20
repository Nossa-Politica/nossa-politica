import type { MetadataRoute } from "next";
import { URL_DO_SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    // A API só alimenta o Explorar e o Comparar; não é página para buscadores
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${URL_DO_SITE}/sitemap.xml`,
  };
}
