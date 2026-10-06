import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key() {
  const secret = process.env.APP_ENCRYPTION_KEY;
  if (!secret || secret.length < 24) {
    throw new Error("APP_ENCRYPTION_KEY must be configured with a strong secret");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptJson(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptJson<T>(value: string): T {
  const [ivText, tagText, cipherText] = value.split(".");
  if (!ivText || !tagText || !cipherText) throw new Error("Invalid encrypted payload");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivText, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(cipherText, "base64url")),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}
