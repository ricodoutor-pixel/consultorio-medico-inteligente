import { useState, useEffect, useMemo } from 'react';
import { professionals } from '@/data/professionals';
import type { Professional } from '@/data/professionals';

/**
 * Calcula a distância em km entre duas coordenadas (Haversine).
 */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Mapa rápido de cidade → coordenadas aproximadas (lat, lon).
 * Cobre as principais cidades de pacientes/médicos no ecossistema.
 */
const CITY_COORDS: Record<string, [number, number]> = {
  'São Paulo':     [-23.55, -46.63],
  'SP':            [-23.55, -46.63],
  'Rio de Janeiro':[-22.91, -43.17],
  'RJ':            [-22.91, -43.17],
  'Belo Horizonte':[-19.92, -43.94],
  'MG':            [-19.92, -43.94],
  'Brasília':      [-15.78, -47.93],
  'DF':            [-15.78, -47.93],
  'Salvador':      [-12.97, -38.50],
  'BA':            [-12.97, -38.50],
  'Curitiba':      [-25.43, -49.27],
  'PR':            [-25.43, -49.27],
  'Porto Alegre':  [-30.03, -51.23],
  'RS':            [-30.03, -51.23],
  'Recife':        [-8.05,  -34.88],
  'PE':            [-8.05,  -34.88],
  'Fortaleza':     [-3.72,  -38.54],
  'CE':            [-3.72,  -38.54],
  'Manaus':        [-3.12,  -60.02],
  'AM':            [-3.12,  -60.02],
  'Belém':         [-1.46,  -48.50],
  'PA':            [-1.46,  -48.50],
  'La Paz':        [-16.49, -68.14],
  'Bolivia':       [-16.49, -68.14],
  'Buenos Aires':  [-34.60, -58.38],
  'Argentina':     [-34.60, -58.38],
  'Lisboa':        [38.72,   -9.14],
  'Portugal':      [38.72,   -9.14],
  'Miami':         [25.77,  -80.19],
  'USA':           [37.09,  -95.71],
};

function resolveCoords(location?: string): [number, number] | null {
  if (!location) return null;
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (location.toLowerCase().includes(key.toLowerCase())) return coords;
  }
  return null;
}

export interface ScoredProfessional extends Professional {
  distanceKm: number | null;
  score: number;
}

/**
 * Hook que retorna médicos ordenados por: online → distância → avaliação.
 * O Dr. Edilson (med-0) SEMPRE fica disponível para Orientação Técnica
 * independentemente de estar online.
 *
 * @param caseKeyword palavra-chave da triagem (ex: "insônia", "dor", "ansiedade")
 */
export function useFindNearestDoctor(caseKeyword?: string) {
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalização não suportada');
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.message);
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  /** Dr. Edilson — sempre disponível para Orientação Técnica */
  const edilson = useMemo(
    () => professionals.find((p) => p.id === 'med-0'),
    []
  );

  const ranked = useMemo<ScoredProfessional[]>(() => {
    return professionals
      .filter((p) => p.online) // apenas online
      .map((p) => {
        let distanceKm: number | null = null;
        if (userCoords) {
          const pCoords = resolveCoords((p as any).location ?? p.tags?.join(' '));
          if (pCoords) {
            distanceKm = haversineKm(
              userCoords[0], userCoords[1],
              pCoords[0], pCoords[1]
            );
          }
        }
        // Score: online vale muito, distância curta = score alto, avaliação alta = score alto
        const distScore = distanceKm !== null ? Math.max(0, 1000 - distanceKm) : 500;
        const ratingScore = (p.rating ?? 0) * 100;
        // Relevância de especialidade
        const specialtyScore = caseKeyword
          ? (p.tags ?? []).some((t) =>
              t.toLowerCase().includes(caseKeyword.toLowerCase())
            )
            ? 300
            : 0
          : 0;
        const score = distScore + ratingScore + specialtyScore;
        return { ...p, distanceKm, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [professionals, userCoords, caseKeyword]);

  return { ranked, edilson, userCoords, geoLoading, geoError };
}
