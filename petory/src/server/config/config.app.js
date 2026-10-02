import "server-only";
import { getServerEnv } from "@/shared/config/env";

/** Server-only behavior settings. Secrets remain in environment variables. */
export function getAppConfig() {
  const env = getServerEnv();
  return {
    appUrl: env.NEXT_PUBLIC_APP_URL,
    allowedOrigins: env.ALLOWED_ORIGINS,
    sessionLifetimeSeconds: env.SESSION_LIFETIME_SECONDS,
    maxMediaBytes: env.MAX_MEDIA_BYTES,
    maxMediaPerAccount: env.MAX_MEDIA_PER_ACCOUNT,
    acceptedMediaTypes: ["image/jpeg", "image/png", "image/webp"],
    passwordResetTtlMinutes: env.PASSWORD_RESET_TTL_MINUTES,
    rateLimits: {
      login: { attempts: env.RATE_LIMIT_LOGIN, windowSeconds: 15 * 60 },
      loginGlobal: { attempts: env.RATE_LIMIT_LOGIN_GLOBAL, windowSeconds: 60 * 60 },
      register: { attempts: env.RATE_LIMIT_REGISTER, windowSeconds: 60 * 60 },
      registerGlobal: { attempts: env.RATE_LIMIT_REGISTER_GLOBAL, windowSeconds: 60 * 60 },
      resetRequest: { attempts: env.RATE_LIMIT_RESET_REQUEST, windowSeconds: 60 * 60 },
      resetRequestGlobal: { attempts: env.RATE_LIMIT_RESET_REQUEST_GLOBAL, windowSeconds: 60 * 60 },
      resetConfirm: { attempts: env.RATE_LIMIT_RESET_CONFIRM, windowSeconds: 60 * 60 },
      upload: { attempts: env.RATE_LIMIT_UPLOAD, windowSeconds: 60 * 60 },
      report: { attempts: env.RATE_LIMIT_REPORT, windowSeconds: 60 * 60 },
    },
    mail: {
      provider: env.MAIL_PROVIDER,
      from: env.MAIL_FROM,
      apiKey: env.RESEND_API_KEY,
      apiUrl: env.MAIL_API_URL ?? "https://api.resend.com/emails",
    },
  };
}
