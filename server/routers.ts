import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { investmentRouter } from "./routers/investments";
import { affiliateRouter } from "./routers/affiliates";
import { transactionRouter } from "./routers/transactions";
import { adminRouter } from "./routers/admin";
import { webhookRouter } from "./routers/webhooks";
import { mercadopagoRouter } from "./routers/mercadopago";
import { consultationRouter } from "./routers/consultation";
import { verdinhoChatRouter } from "./routers/verdinhoChatRouter";
import { sentimentRouter } from "./routers/sentimentRouter";
import { sentimentDashboardRouter } from "./routers/sentimentDashboardRouter";
import { monitoringRouter } from "./routers/monitoring";
import { referralRouter } from "./routers/referral";
import { recommendationsRouter } from "./routers/recommendations";
import { checkpointSyncRouter } from "./routers/checkpointSync";
import { ebookRouter } from "./routers/ebook";
import { ebookAnalyticsRouter } from "./routers/ebookAnalytics";
import { dominationRouter } from "./routers/domination";
// import { marketplaceRouter } from "./routers/marketplaceRouter"; // TODO: Fix marketplace router

const COOKIE_NAME = "auth-token";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  investments: investmentRouter,
  affiliates: affiliateRouter,
  transactions: transactionRouter,
  admin: adminRouter,
  webhooks: webhookRouter,
  mercadopago: mercadopagoRouter,
  consultation: consultationRouter,
  verdinho: verdinhoChatRouter,
  sentiment: sentimentRouter,
  sentimentDashboard: sentimentDashboardRouter,
  monitoring: monitoringRouter,
  referral: referralRouter,
  recommendations: recommendationsRouter,
  checkpointSync: checkpointSyncRouter,
  ebook: ebookRouter,
  ebookAnalytics: ebookAnalyticsRouter,
  domination: dominationRouter,
  // marketplace: marketplaceRouter, // TODO: Fix marketplace router
});

export type AppRouter = typeof appRouter;
