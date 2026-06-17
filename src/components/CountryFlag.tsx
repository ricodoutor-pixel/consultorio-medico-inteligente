// Renders a country flag as an <img> (works on Windows where flag emojis don't render).
// Accepts either an ISO-2 code ("BR") or a flag emoji ("🇧🇷").

const EMOJI_TO_ISO: Record<string, string> = {
  "🇧🇷": "br", "🇵🇹": "pt", "🇧🇴": "bo", "🇲🇽": "mx", "🇨🇴": "co",
  "🇦🇷": "ar", "🇻🇪": "ve", "🇯🇵": "jp", "🇺🇸": "us", "🇬🇧": "gb",
  "🇪🇸": "es", "🇨🇳": "cn", "🇨🇱": "cl", "🇵🇪": "pe", "🇺🇾": "uy",
  "🇵🇾": "py", "🇪🇨": "ec", "🇫🇷": "fr", "🇩🇪": "de", "🇮🇹": "it",
};

function emojiToIso(input: string): string | null {
  if (!input) return null;
  if (EMOJI_TO_ISO[input]) return EMOJI_TO_ISO[input];
  if (/^[A-Za-z]{2}$/.test(input)) return input.toLowerCase();
  // derive from regional indicators
  const codes = Array.from(input).map((c) => c.codePointAt(0) ?? 0);
  if (codes.length >= 2 && codes[0] >= 0x1f1e6 && codes[0] <= 0x1f1ff) {
    const a = String.fromCharCode(0x61 + (codes[0] - 0x1f1e6));
    const b = String.fromCharCode(0x61 + (codes[1] - 0x1f1e6));
    return a + b;
  }
  return null;
}

interface Props {
  code: string;
  className?: string;
  title?: string;
}

export function CountryFlag({ code, className, title }: Props) {
  const iso = emojiToIso(code);
  if (!iso) return null;
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      width={20}
      height={14}
      alt={title ?? iso.toUpperCase()}
      title={title ?? iso.toUpperCase()}
      loading="lazy"
      className={className ?? "inline-block h-3.5 w-auto rounded-[2px] shadow-sm flex-shrink-0"}
    />
  );
}

export default CountryFlag;
