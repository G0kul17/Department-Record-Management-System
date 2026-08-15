import "isomorphic-fetch";
import dotenv from "dotenv";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import logger from "../utils/logger.js";
import { getTraceCtx } from "../utils/traceStore.js";
import { loginSessionExpiredOtpEmail } from "../utils/emailTemplates.js";

dotenv.config();

const GRAPH_SCOPES = ["https://graph.microsoft.com/.default"];

function getMailConfig() {
  const clientId = process.env.CLIENT_ID;
  const tenantId = process.env.TENANT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const senderEmail =
    process.env.OUTLOOK_SENDER_EMAIL ||
    process.env.SENDER_EMAIL ||
    process.env.EMAIL_USER;

  return { clientId, tenantId, clientSecret, senderEmail };
}

function assertMailConfig() {
  const { clientId, tenantId, clientSecret, senderEmail } = getMailConfig();
  if (!clientId || !tenantId || !clientSecret || !senderEmail) {
    throw new Error(
      "Microsoft Graph mail configuration is incomplete. Set CLIENT_ID, TENANT_ID, CLIENT_SECRET, and OUTLOOK_SENDER_EMAIL.",
    );
  }

  return { clientId, tenantId, clientSecret, senderEmail };
}

export async function getAccessToken() {
  const { clientId, tenantId, clientSecret } = assertMailConfig();

  const cca = new ConfidentialClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  });

  const result = await cca.acquireTokenByClientCredential({
    scopes: GRAPH_SCOPES,
  });

  if (!result?.accessToken) {
    throw new Error("Unable to acquire Microsoft Graph access token");
  }

  return result.accessToken;
}

function createGraphClient(accessToken) {
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken,
    },
  });
}

function normalizeGraphError(err) {
  const statusCode =
    err?.statusCode || err?.status || err?.response?.status || null;
  const responseBody =
    err?.body || err?.response?.body || err?.response?.data || null;
  const graphMessage =
    responseBody?.error?.message ||
    responseBody?.message ||
    err?.message ||
    "Unknown Microsoft Graph error";

  const normalized = new Error(graphMessage);
  normalized.statusCode = statusCode;
  normalized.graphError = responseBody?.error || responseBody || null;
  normalized.innerError = err;
  return normalized;
}

export async function sendMail({ to, subject, text, html }) {
  const { senderEmail } = assertMailConfig();
  const accessToken = await getAccessToken();
  const client = createGraphClient(accessToken);
  const ctx = getTraceCtx();
  const bodyContent = html || text || "";
  const contentType = html ? "HTML" : "Text";

  logger.debug("mail.send.start", {
    "email.to": to,
    "email.subject": subject,
    ...ctx,
  });

  try {
    await client
      .api(`/users/${encodeURIComponent(senderEmail)}/sendMail`)
      .post({
        message: {
          subject,
          body: {
            contentType,
            content: bodyContent,
          },
          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
        },
        saveToSentItems: true,
      });

    logger.info("mail.send.complete", {
      "email.to": to,
      "email.subject": subject,
      ...ctx,
    });

    return { success: true };
  } catch (err) {
    const normalizedErr = normalizeGraphError(err);
    logger.error("mail.send.error", {
      err: normalizedErr,
      "email.to": to,
      "email.subject": subject,
      "graph.status_code": normalizedErr.statusCode,
      "graph.error": normalizedErr.graphError,
      ...ctx,
    });
    throw normalizedErr;
  }
}

export async function sendOTPEmail(to, otp) {
  const OTP_EXPIRY_MIN = parseInt(process.env.OTP_EXPIRY_MIN, 10) || 5;
  const { html, text } = loginSessionExpiredOtpEmail({ otp, OTP_EXPIRY_MIN });

  // Development fake-mail mode is opt-in only. By default we still attempt
  // real delivery so OTPs are not silently swallowed.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_FAKE_MAIL === "true"
  ) {
    logger.warn("mail.send.skipped", {
      "email.to": to,
      "email.subject": "Login OTP",
      reason: "development fake-mail mode enabled",
    });
    return { success: false, skipped: true };
  }

  return sendMail({
    to,
    subject: "Login OTP",
    html,
    text,
  });
}

export function isMailConfigured() {
  const { clientId, tenantId, clientSecret, senderEmail } = getMailConfig();
  return Boolean(clientId && tenantId && clientSecret && senderEmail);
}
