import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { ebookDownloads, ebookAnalyticsSummary, ebookAnalyticsProfession, ebookAnalyticsCountry, ebookAnalyticsSource } from "../../drizzle/schema";
import { sql, eq, and, gte, lte } from "drizzle-orm";

export const ebookAnalyticsRouter = router({
  /**
   * Get overall analytics summary
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const downloads = await db.query.ebookDownloads.findMany();

        if (downloads.length === 0) {
          return {
            totalDownloads: 0,
            uniqueEmails: 0,
            uniqueCountries: 0,
            professionBreakdown: {},
            countryBreakdown: {},
            sourceBreakdown: {},
            deviceBreakdown: {},
          };
        }

        // Calculate aggregates
        const uniqueEmails = new Set(downloads.map((d) => d.email)).size;
        const uniqueCountries = new Set(downloads.map((d) => d.country).filter(Boolean)).size;

        // Profession breakdown
        const professionBreakdown = downloads.reduce(
          (acc, d) => {
            const prof = d.profession || "Not specified";
            acc[prof] = (acc[prof] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Country breakdown
        const countryBreakdown = downloads.reduce(
          (acc, d) => {
            const country = d.country || "Unknown";
            acc[country] = (acc[country] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Source breakdown
        const sourceBreakdown = downloads.reduce(
          (acc, d) => {
            const source = d.source || "direct";
            acc[source] = (acc[source] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Device breakdown
        const deviceBreakdown = downloads.reduce(
          (acc, d) => {
            const device = d.deviceType || "unknown";
            acc[device] = (acc[device] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        return {
          totalDownloads: downloads.length,
          uniqueEmails,
          uniqueCountries,
          professionBreakdown,
          countryBreakdown,
          sourceBreakdown,
          deviceBreakdown,
        };
      } catch (error) {
        console.error("Error getting analytics summary:", error);
        throw new Error("Failed to get analytics summary");
      }
    }),

  /**
   * Get analytics by profession
   */
  getByProfession: protectedProcedure.query(async () => {
    try {
      const downloads = await db.query.ebookDownloads.findMany();

      const professionStats = downloads.reduce(
        (acc, d) => {
          const prof = d.profession || "Not specified";
          if (!acc[prof]) {
            acc[prof] = {
              profession: prof,
              totalDownloads: 0,
              uniqueEmails: new Set<string>(),
              countries: new Set<string>(),
              sources: new Set<string>(),
            };
          }
          acc[prof].totalDownloads++;
          acc[prof].uniqueEmails.add(d.email);
          if (d.country) acc[prof].countries.add(d.country);
          if (d.source) acc[prof].sources.add(d.source);
          return acc;
        },
        {} as Record<string, any>
      );

      return Object.values(professionStats).map((stat: any) => ({
        profession: stat.profession,
        totalDownloads: stat.totalDownloads,
        uniqueEmails: stat.uniqueEmails.size,
        topCountries: Array.from(stat.countries).slice(0, 3),
        topSources: Array.from(stat.sources).slice(0, 3),
        percentage: ((stat.totalDownloads / downloads.length) * 100).toFixed(2),
      }));
    } catch (error) {
      console.error("Error getting analytics by profession:", error);
      throw new Error("Failed to get analytics by profession");
    }
  }),

  /**
   * Get analytics by country
   */
  getByCountry: protectedProcedure.query(async () => {
    try {
      const downloads = await db.query.ebookDownloads.findMany();

      const countryStats = downloads.reduce(
        (acc, d) => {
          const country = d.country || "Unknown";
          if (!acc[country]) {
            acc[country] = {
              country,
              totalDownloads: 0,
              uniqueEmails: new Set<string>(),
              professions: new Set<string>(),
              sources: new Set<string>(),
            };
          }
          acc[country].totalDownloads++;
          acc[country].uniqueEmails.add(d.email);
          if (d.profession) acc[country].professions.add(d.profession);
          if (d.source) acc[country].sources.add(d.source);
          return acc;
        },
        {} as Record<string, any>
      );

      return Object.values(countryStats)
        .map((stat: any) => ({
          country: stat.country,
          totalDownloads: stat.totalDownloads,
          uniqueEmails: stat.uniqueEmails.size,
          topProfessions: Array.from(stat.professions).slice(0, 3),
          topSources: Array.from(stat.sources).slice(0, 3),
          percentage: ((stat.totalDownloads / downloads.length) * 100).toFixed(2),
        }))
        .sort((a, b) => b.totalDownloads - a.totalDownloads);
    } catch (error) {
      console.error("Error getting analytics by country:", error);
      throw new Error("Failed to get analytics by country");
    }
  }),

  /**
   * Get analytics by traffic source
   */
  getBySource: protectedProcedure.query(async () => {
    try {
      const downloads = await db.query.ebookDownloads.findMany();

      const sourceStats = downloads.reduce(
        (acc, d) => {
          const source = d.source || "direct";
          if (!acc[source]) {
            acc[source] = {
              source,
              totalDownloads: 0,
              uniqueEmails: new Set<string>(),
              countries: new Set<string>(),
              professions: new Set<string>(),
            };
          }
          acc[source].totalDownloads++;
          acc[source].uniqueEmails.add(d.email);
          if (d.country) acc[source].countries.add(d.country);
          if (d.profession) acc[source].professions.add(d.profession);
          return acc;
        },
        {} as Record<string, any>
      );

      return Object.values(sourceStats)
        .map((stat: any) => ({
          source: stat.source,
          totalDownloads: stat.totalDownloads,
          uniqueEmails: stat.uniqueEmails.size,
          topCountries: Array.from(stat.countries).slice(0, 3),
          topProfessions: Array.from(stat.professions).slice(0, 3),
          percentage: ((stat.totalDownloads / downloads.length) * 100).toFixed(2),
        }))
        .sort((a, b) => b.totalDownloads - a.totalDownloads);
    } catch (error) {
      console.error("Error getting analytics by source:", error);
      throw new Error("Failed to get analytics by source");
    }
  }),

  /**
   * Get device analytics
   */
  getByDevice: protectedProcedure.query(async () => {
    try {
      const downloads = await db.query.ebookDownloads.findMany();

      const deviceStats = downloads.reduce(
        (acc, d) => {
          const device = d.deviceType || "unknown";
          if (!acc[device]) {
            acc[device] = {
              deviceType: device,
              totalDownloads: 0,
              uniqueEmails: new Set<string>(),
              browsers: new Set<string>(),
              os: new Set<string>(),
            };
          }
          acc[device].totalDownloads++;
          acc[device].uniqueEmails.add(d.email);
          if (d.browser) acc[device].browsers.add(d.browser);
          if (d.os) acc[device].os.add(d.os);
          return acc;
        },
        {} as Record<string, any>
      );

      return Object.values(deviceStats).map((stat: any) => ({
        deviceType: stat.deviceType,
        totalDownloads: stat.totalDownloads,
        uniqueEmails: stat.uniqueEmails.size,
        topBrowsers: Array.from(stat.browsers).slice(0, 3),
        topOS: Array.from(stat.os).slice(0, 3),
        percentage: ((stat.totalDownloads / downloads.length) * 100).toFixed(2),
      }));
    } catch (error) {
      console.error("Error getting analytics by device:", error);
      throw new Error("Failed to get analytics by device");
    }
  }),

  /**
   * Get top countries
   */
  getTopCountries: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const downloads = await db.query.ebookDownloads.findMany();

        const countryStats = downloads.reduce(
          (acc, d) => {
            const country = d.country || "Unknown";
            acc[country] = (acc[country] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        return Object.entries(countryStats)
          .map(([country, count]) => ({
            country,
            downloads: count,
            percentage: ((count / downloads.length) * 100).toFixed(2),
          }))
          .sort((a, b) => b.downloads - a.downloads)
          .slice(0, input.limit);
      } catch (error) {
        console.error("Error getting top countries:", error);
        throw new Error("Failed to get top countries");
      }
    }),

  /**
   * Get top professions
   */
  getTopProfessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const downloads = await db.query.ebookDownloads.findMany();

        const professionStats = downloads.reduce(
          (acc, d) => {
            const profession = d.profession || "Not specified";
            acc[profession] = (acc[profession] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        return Object.entries(professionStats)
          .map(([profession, count]) => ({
            profession,
            downloads: count,
            percentage: ((count / downloads.length) * 100).toFixed(2),
          }))
          .sort((a, b) => b.downloads - a.downloads)
          .slice(0, input.limit);
      } catch (error) {
        console.error("Error getting top professions:", error);
        throw new Error("Failed to get top professions");
      }
    }),

  /**
   * Get download trends over time
   */
  getTrends: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const downloads = await db.query.ebookDownloads.findMany();

        // Group by date
        const trends = downloads.reduce(
          (acc, d) => {
            const date = new Date(d.downloadedAt).toISOString().split("T")[0];
            if (!acc[date]) {
              acc[date] = 0;
            }
            acc[date]++;
            return acc;
          },
          {} as Record<string, number>
        );

        return Object.entries(trends)
          .map(([date, count]) => ({
            date,
            downloads: count,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-input.days);
      } catch (error) {
        console.error("Error getting trends:", error);
        throw new Error("Failed to get trends");
      }
    }),

  /**
   * Export analytics as CSV
   */
  exportCSV: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Access denied");
    }

    try {
      const downloads = await db.query.ebookDownloads.findMany();

      const headers = [
        "Email",
        "Name",
        "Profession",
        "Country",
        "Region",
        "City",
        "Source",
        "Device Type",
        "Browser",
        "OS",
        "Downloaded At",
      ];

      const rows = downloads.map((d) => [
        d.email,
        d.name || "N/A",
        d.profession || "N/A",
        d.country || "Unknown",
        d.region || "N/A",
        d.city || "N/A",
        d.source || "direct",
        d.deviceType || "unknown",
        d.browser || "N/A",
        d.os || "N/A",
        new Date(d.downloadedAt).toLocaleString("pt-BR"),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      return {
        success: true,
        csv,
        filename: `ebook-analytics-${new Date().toISOString().split("T")[0]}.csv`,
      };
    } catch (error) {
      console.error("Error exporting CSV:", error);
      throw new Error("Failed to export CSV");
    }
  }),
});
