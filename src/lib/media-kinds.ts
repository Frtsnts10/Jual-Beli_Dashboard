/** Where an uploaded image is used (also its folder in Storage). */
export type MediaKind = "logo" | "banner" | "product";

/** Images must be https (or the local Storage emulator while developing). */
export function isImageUrl(url: string): boolean {
  const emu = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  return /^https:\/\//.test(url) || (!!emu && url.startsWith(`http://${emu}/`));
}
