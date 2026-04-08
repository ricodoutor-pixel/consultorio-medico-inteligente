import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { ebookDownloads } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { getGeolocationFromIP, parseUserAgent, getClientIP, detectTrafficSource } from "../_core/geolocation";

export const ebookRouter = router({
  /**
   * Registrar download de e-book com analytics
   * Valida email e registra o usuário com dados de geolocalização
   */
  registerDownload: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
        profession: z.string().optional(),
        referrer: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Extract client IP
        const ipAddress = getClientIP(ctx.req);

        // Get geolocation
        const geolocation = await getGeolocationFromIP(ipAddress);

        // Parse user agent
        const userAgent = ctx.req.headers["user-agent"] || "";
        const deviceInfo = parseUserAgent(userAgent);

        // Detect traffic source
        const source = detectTrafficSource(input.referrer || ctx.req.headers["referer"]);

        // Registrar download no banco de dados
        const download = await db.insert(ebookDownloads).values({
          email: input.email,
          name: input.name || "Não informado",
          profession: input.profession || "Não informado",
          downloadedAt: new Date(),
          ipAddress: ipAddress,
          userAgent: userAgent,
          // Geolocation
          country: geolocation?.country,
          region: geolocation?.region,
          city: geolocation?.city,
          latitude: geolocation?.latitude,
          longitude: geolocation?.longitude,
          // Traffic source
          referrer: input.referrer,
          source: source,
          // Device info
          deviceType: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
        });

        // Notificar o dono sobre novo download
        await notifyOwner({
          title: "📚 Novo Download de E-book",
          content: `${input.name || "Usuário"} (${input.profession || "Profissão não informada"}) baixou o e-book de Cannabis Medicinal.\n\nEmail: ${input.email}\nPaís: ${geolocation?.country}\nDispositivo: ${deviceInfo.deviceType}\nFonte: ${source}`,
        });

        return {
          success: true,
          message: "Download registrado com sucesso",
          downloadUrl:
            "https://files.manuscdn.com/user_upload_by_module/session_file/310519663065229674/fnbZJMGCJUpGmwzl.pdf",
        };
      } catch (error) {
        console.error("Erro ao registrar download:", error);
        throw new Error("Erro ao registrar download");
      }
    }),

  /**
   * Obter estatísticas de downloads
   * Apenas para admin
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Acesso negado");
    }

    try {
      const downloads = await db.query.ebookDownloads.findMany();

      const stats = {
        totalDownloads: downloads.length,
        uniqueEmails: new Set(downloads.map((d) => d.email)).size,
        professions: downloads
          .filter((d) => d.profession && d.profession !== "Não informado")
          .reduce(
            (acc, d) => {
              acc[d.profession] = (acc[d.profession] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        countries: downloads
          .filter((d) => d.country && d.country !== "Unknown")
          .reduce(
            (acc, d) => {
              acc[d.country] = (acc[d.country] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        sources: downloads.reduce(
          (acc, d) => {
            const source = d.source || "direct";
            acc[source] = (acc[source] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        devices: downloads.reduce(
          (acc, d) => {
            const device = d.deviceType || "unknown";
            acc[device] = (acc[device] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        recentDownloads: downloads.slice(-10).reverse(),
      };

      return stats;
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      throw new Error("Erro ao obter estatísticas");
    }
  }),

  /**
   * Listar todos os downloads (apenas admin)
   */
  listDownloads: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Acesso negado");
      }

      try {
        const downloads = await db.query.ebookDownloads.findMany({
          limit: input.limit,
          offset: input.offset,
          orderBy: (downloads, { desc }) => [desc(downloads.downloadedAt)],
        });

        return downloads;
      } catch (error) {
        console.error("Erro ao listar downloads:", error);
        throw new Error("Erro ao listar downloads");
      }
    }),

  /**
   * Exportar downloads em CSV (apenas admin)
   */
  exportCSV: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Acesso negado");
    }

    try {
      const downloads = await db.query.ebookDownloads.findMany();

      // Criar CSV
      const headers = [
        "Email",
        "Nome",
        "Profissão",
        "País",
        "Região",
        "Cidade",
        "Fonte",
        "Dispositivo",
        "Browser",
        "SO",
        "Data de Download",
      ];
      const rows = downloads.map((d) => [
        d.email,
        d.name,
        d.profession,
        d.country,
        d.region,
        d.city,
        d.source,
        d.deviceType,
        d.browser,
        d.os,
        new Date(d.downloadedAt).toLocaleString("pt-BR"),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      return {
        success: true,
        csv,
        filename: `ebook-downloads-${new Date().toISOString().split("T")[0]}.csv`,
      };
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      throw new Error("Erro ao exportar CSV");
    }
  }),
});
