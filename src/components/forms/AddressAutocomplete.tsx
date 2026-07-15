import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, hasBrowserKey } from "@/lib/google-maps-loader";
import { MapPin, Loader2 } from "lucide-react";

export type ParsedAddress = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formatted: string;
  latitude: number | null;
  longitude: number | null;
};

interface Props {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  onSelect: (addr: ParsedAddress) => void;
  countryRestriction?: string[]; // e.g. ['br']
}

function extract(components: any[], type: string, short = false): string {
  const c = components?.find((x: any) => x.types?.includes(type));
  if (!c) return "";
  return short ? c.short_name : c.long_name;
}

export default function AddressAutocomplete({
  label = "Endereço",
  placeholder = "Digite rua ou CEP…",
  defaultValue = "",
  onSelect,
  countryRestriction = ["br"],
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (!hasBrowserKey()) {
      setErr("Autocomplete indisponível — chave Maps ausente");
      return;
    }
    let ac: any;
    loadGoogleMaps()
      .then((google) => {
        if (!inputRef.current) return;
        ac = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["address"],
          componentRestrictions: countryRestriction?.length
            ? { country: countryRestriction }
            : undefined,
        });
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const comps = place.address_components ?? [];
          const parsed: ParsedAddress = {
            street: extract(comps, "route"),
            number: extract(comps, "street_number"),
            neighborhood:
              extract(comps, "sublocality_level_1") ||
              extract(comps, "sublocality") ||
              extract(comps, "neighborhood"),
            city:
              extract(comps, "administrative_area_level_2") ||
              extract(comps, "locality"),
            state: extract(comps, "administrative_area_level_1", true),
            postalCode: extract(comps, "postal_code"),
            country: extract(comps, "country", true),
            formatted: place.formatted_address ?? "",
            latitude: place.geometry?.location?.lat?.() ?? null,
            longitude: place.geometry?.location?.lng?.() ?? null,
          };
          setValue(parsed.formatted);
          onSelect(parsed);
        });
        setReady(true);
      })
      .catch((e) => setErr(e.message ?? String(e)));
  }, [onSelect]);

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        {!ready && !err && (
          <Loader2 className="absolute right-2 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {err && <p className="text-[10px] text-red-400">{err}</p>}
      <p className="text-[10px] text-muted-foreground">
        Selecione uma sugestão para preencher rua, bairro, cidade, estado e CEP automaticamente.
      </p>
    </div>
  );
}
