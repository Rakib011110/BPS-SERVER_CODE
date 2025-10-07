export const SOCIAL_PROVIDERS = {
  GOOGLE: "GOOGLE",
  FACEBOOK: "FACEBOOK",
  GITHUB: "GITHUB",
} as const;

export type TSocialProvider = keyof typeof SOCIAL_PROVIDERS;
