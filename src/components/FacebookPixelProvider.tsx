/**
 * FacebookPixelProvider — drop into the component tree inside BrowserRouter
 * to auto-track PageView on every route change.
 */
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

export function FacebookPixelProvider() {
  useFacebookPixel();
  return null;
}
