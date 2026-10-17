export type SenderProfile = { name: string; email: string };
export const PROFILE_KEY = "accesslens-contact-v1";

export function normalizeProfile(value: unknown): SenderProfile {
  const candidate = value as Partial<SenderProfile> | null;
  return {
    name:
      typeof candidate?.name === "string"
        ? candidate.name
            .trim()
            .slice(0, 80)
            .replace(/[\r\n]/g, " ")
        : "",
    email:
      typeof candidate?.email === "string"
        ? candidate.email
            .trim()
            .slice(0, 254)
            .replace(/[\r\n]/g, "")
        : "",
  };
}

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function signature(profile?: SenderProfile): string {
  const sender = normalizeProfile(profile);
  return [sender.name, validEmail(sender.email) ? sender.email : ""]
    .filter(Boolean)
    .join("\n");
}
