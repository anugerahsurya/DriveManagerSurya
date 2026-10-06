import { appIcon } from "@/lib/app-icon-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS membulatkan sudut sendiri, jadi ikon ini persegi penuh.
export default function AppleIcon() {
  return appIcon(180, false);
}
