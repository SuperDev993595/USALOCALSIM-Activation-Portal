import Prelude, {
  APIConnectionError,
  APIError,
  AuthenticationError,
  PermissionDeniedError,
  RateLimitError,
  UnprocessableEntityError,
} from "@prelude.so/sdk";

function getPreludeClient(): Prelude | null {
  const apiToken = process.env.PRELUDE_API_TOKEN ?? process.env.API_TOKEN;
  if (!apiToken) return null;
  return new Prelude({ apiToken });
}

function logPreludeException(context: string, err: unknown): void {
  if (err instanceof APIError && err.status !== undefined) {
    console.error(`[prelude] ${context}`, { status: err.status, message: err.message, body: err.error });
    return;
  }
  console.error(`[prelude] ${context}`, err);
}

function extractApiErrorHint(err: APIError): string | undefined {
  const body = err.error as Record<string, unknown> | undefined;
  if (!body || typeof body !== "object") return undefined;
  const msg = body.message;
  if (typeof msg === "string") return msg.slice(0, 160);
  if (Array.isArray(msg) && msg.every((m) => typeof m === "string")) return msg.join(" ").slice(0, 160);
  return undefined;
}

/** Safe client message; details only in development or when PRELUDE_DEBUG=1. */
function formatPreludeHttpError(operation: string, err: unknown): string {
  logPreludeException(operation, err);

  const debugClient =
    process.env.NODE_ENV === "development" || process.env.PRELUDE_DEBUG === "1";

  if (err instanceof AuthenticationError || (err instanceof APIError && err.status === 401)) {
    return debugClient
      ? `Prelude auth failed (401). Check PRELUDE_API_TOKEN / API_TOKEN. ${err instanceof Error ? err.message : ""}`
      : "SMS verification could not be started. The server SMS configuration needs to be fixed.";
  }

  if (err instanceof PermissionDeniedError || (err instanceof APIError && err.status === 403)) {
    return "SMS verification was denied for this API key or account.";
  }

  if (err instanceof RateLimitError || (err instanceof APIError && err.status === 429)) {
    return "Too many SMS verification requests. Try again later.";
  }

  if (err instanceof UnprocessableEntityError || (err instanceof APIError && err.status === 422)) {
    const hint = err instanceof APIError ? extractApiErrorHint(err) : undefined;
    if (hint) return hint;
    return "This phone number or verification request was rejected by the SMS provider.";
  }

  if (err instanceof APIError && err.status === 400) {
    const hint = extractApiErrorHint(err);
    if (hint) return hint;
    return "Invalid verification request.";
  }

  if (err instanceof APIConnectionError) {
    return "Could not reach the SMS verification service. Check network and try again.";
  }

  if (debugClient && err instanceof Error) {
    return err.message.slice(0, 240);
  }

  return "Could not send verification code. Try again later.";
}

function mapCreateFailure(
  status: Prelude.VerificationCreateResponse["status"],
  reason?: Prelude.VerificationCreateResponse["reason"],
): string {
  if (status === "blocked") {
    if (reason) {
      const map: Partial<Record<typeof reason, string>> = {
        invalid_phone_number: "That phone number does not look valid.",
        invalid_phone_line: "This line cannot receive SMS verification.",
        in_block_list: "This number cannot be used for verification.",
        repeated_attempts: "Too many verification attempts. Try again later.",
        suspicious: "Verification could not be started. Try again later.",
      };
      return map[reason] ?? "Verification could not be started for this number. Try again later.";
    }
    return "Verification could not be started for this number. Try again later.";
  }
  return "Could not send verification code. Try again later.";
}

const SHOP_PRELUDE_SKIP = true;
/** Start SMS verification via Prelude (sends OTP). */
export async function preludeStartPhoneVerification(
  phoneE164: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (SHOP_PRELUDE_SKIP) {
    console.info(`[SHOP_PRELUDE_SKIP] verification skipped (dev) for ${phoneE164}`);
    return { ok: true };
  }

  const client = getPreludeClient();
  if (!client) {
    return { ok: false, error: "SMS verification is not configured." };
  }

  try {
    const res = await client.verification.create({
      target: { type: "phone_number", value: phoneE164 },
      options: {
        method: "message",
        code_size: 6,
      },
    });

    if (res.status === "blocked") {
      return { ok: false, error: mapCreateFailure(res.status, res.reason) };
    }
    if (res.status !== "success" && res.status !== "retry") {
      console.warn("[prelude] verification.create unexpected status", res.status, res.reason);
      return { ok: false, error: mapCreateFailure(res.status, res.reason) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatPreludeHttpError("verification.create", err) };
  }
}

export type PreludeCheckFailure = {
  ok: false;
  error: string;
  kind: "wrong_code" | "expired" | "config" | "network";
};

/** Check OTP with Prelude. When SHOP_PRELUDE_SKIP=1, only the code "123456" succeeds (see .env.example). */
export async function preludeCheckPhoneVerification(
  phoneE164: string,
  rawCode: string,
): Promise<{ ok: true } | PreludeCheckFailure> {
  const code = rawCode.replace(/\D/g, "").slice(0, 6);

  if (SHOP_PRELUDE_SKIP) {
    if (code === "123456") return { ok: true };
    return { ok: false, error: "Incorrect code.", kind: "wrong_code" };
  }

  const client = getPreludeClient();
  if (!client) {
    return { ok: false, error: "SMS verification is not configured.", kind: "config" };
  }

  try {
    const res = await client.verification.check({
      target: { type: "phone_number", value: phoneE164 },
      code,
    });

    if (res.status === "success") {
      return { ok: true };
    }
    if (res.status === "expired_or_not_found") {
      return {
        ok: false,
        error: "Code expired or missing. Request a new code.",
        kind: "expired",
      };
    }
    return { ok: false, error: "Incorrect code.", kind: "wrong_code" };
  } catch (err) {
    logPreludeException("verification.check", err);
    return { ok: false, error: "Could not verify code. Try again.", kind: "network" };
  }
}
