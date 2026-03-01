import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Cache for strain images loaded from DB
const imageCache: Record<number, string> = {};
const loadingSet = new Set<number>();

export function useStrainImage(strainId: number, strainName: string, strainType: string, fallbackUrl: string) {
  const [imageUrl, setImageUrl] = useState<string>(imageCache[strainId] || fallbackUrl);
  const [loading, setLoading] = useState(!imageCache[strainId]);

  useEffect(() => {
    if (imageCache[strainId]) {
      setImageUrl(imageCache[strainId]);
      setLoading(false);
      return;
    }

    if (loadingSet.has(strainId)) return;
    loadingSet.add(strainId);

    const loadImage = async () => {
      try {
        // Check DB first
        const { data } = await supabase
          .from("strain_images")
          .select("image_url")
          .eq("strain_id", strainId)
          .single();

        if (data?.image_url) {
          imageCache[strainId] = data.image_url;
          setImageUrl(data.image_url);
          setLoading(false);
          loadingSet.delete(strainId);
          return;
        }

        // Trigger generation via edge function
        const { data: genData, error } = await supabase.functions.invoke("generate-strain-image", {
          body: { strain_id: strainId, strain_name: strainName, strain_type: strainType },
        });

        if (!error && genData?.image_url) {
          imageCache[strainId] = genData.image_url;
          setImageUrl(genData.image_url);
        }
      } catch (err) {
        console.error("Failed to load strain image:", err);
      } finally {
        setLoading(false);
        loadingSet.delete(strainId);
      }
    };

    loadImage();
  }, [strainId, strainName, strainType]);

  return { imageUrl, loading };
}
