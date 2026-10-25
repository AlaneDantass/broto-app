export interface PastelStyle {
  swatch: string;
  bg: string;
  border: string;
  text: string;
}

// Tonalidade única de Verde Pastel usada quando "Poucas Cores" está ativo
export const PASTEL_GREEN_UNIFIED: PastelStyle = {
  swatch: "#A8D8B2",
  bg: "#DCEFE0",
  border: "#9CCBA6",
  text: "#234829",
};

// Paleta de cores pastéis suaves para o Quadro de Rotina e Calendário
export const PASTEL_PALETTE: PastelStyle[] = [
  { swatch: "#A8D8B2", bg: "#DCEFE0", border: "#9CCBA6", text: "#234829" }, // Verde Pastel
  { swatch: "#A8D1E7", bg: "#E1F0F7", border: "#8FC2DF", text: "#1E455C" }, // Azul Céu Pastel
  { swatch: "#CBB8F5", bg: "#EFE9FC", border: "#B79EEB", text: "#3E2A6B" }, // Lavanda Pastel
  { swatch: "#F7C5A8", bg: "#FCECE2", border: "#EEB08C", text: "#633216" }, // Pêssego Pastel
  { swatch: "#F6BECB", bg: "#FCE8ED", border: "#ECA1B3", text: "#642334" }, // Rosa Pastel
  { swatch: "#F6DF9D", bg: "#FDF6DF", border: "#EBD080", text: "#5C450A" }, // Amarelo Manteiga Pastel
  { swatch: "#A9DFDA", bg: "#E2F5F3", border: "#8ECFC9", text: "#1C4B47" }, // Menta Pastel
  { swatch: "#E2BEEA", bg: "#F5E9F8", border: "#D4A3DF", text: "#51235C" }, // Lilás Pastel
  { swatch: "#F2B8B0", bg: "#FCE7E4", border: "#E69F95", text: "#61241B" }, // Coral Pastel
  { swatch: "#BACCE6", bg: "#E8EFF8", border: "#9FB7DA", text: "#253957" }, // Azul Sereno Pastel
];

export const PASTEL_SWATCHES = PASTEL_PALETTE.map((p) => p.swatch);

// Mapeamento de cores vivas legadas para seus equivalentes pastéis suaves
const LEGACY_TO_PASTEL: Record<string, PastelStyle> = {
  "#E76F51": PASTEL_PALETTE[3], // Pêssego Pastel
  "#2A9D8F": PASTEL_PALETTE[6], // Menta Pastel
  "#457B9D": PASTEL_PALETTE[1], // Azul Céu Pastel
  "#8338EC": PASTEL_PALETTE[2], // Lavanda Pastel
  "#F15BB5": PASTEL_PALETTE[4], // Rosa Pastel
  "#F4A261": PASTEL_PALETTE[3], // Pêssego Pastel
  "#E9C46A": PASTEL_PALETTE[5], // Amarelo Manteiga Pastel
  "#264653": PASTEL_PALETTE[0], // Verde Pastel
  "#1D3557": PASTEL_PALETTE[9], // Azul Sereno Pastel
  "#D90429": PASTEL_PALETTE[8], // Coral Pastel
  "#6B705C": PASTEL_PALETTE[0], // Verde Pastel
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
};

/**
 * Retorna as cores pastéis (fundo, borda, texto e marcador) para uma cor informada.
 * Quando `poucasCores` está ativo, retorna sempre a tonalidade única de verde pastel.
 */
export const getPastelStyle = (
  rawColor?: string | null,
  poucasCores: boolean = false
): PastelStyle => {
  if (poucasCores) {
    return PASTEL_GREEN_UNIFIED;
  }

  if (!rawColor) {
    return PASTEL_PALETTE[0];
  }

  const upper = rawColor.toUpperCase().trim();

  // Verifica se já faz parte da paleta pastel
  const directMatch = PASTEL_PALETTE.find(
    (p) =>
      p.swatch.toUpperCase() === upper ||
      p.bg.toUpperCase() === upper ||
      p.border.toUpperCase() === upper
  );
  if (directMatch) return directMatch;

  // Verifica se é uma cor viva legada
  if (LEGACY_TO_PASTEL[upper]) {
    return LEGACY_TO_PASTEL[upper];
  }

  // Converte qualquer outro hex customizado para versão pastel suave
  const rgb = hexToRgb(upper);
  if (!rgb) return PASTEL_PALETTE[0];

  const bg = rgbToHex(
    rgb.r * 0.18 + 255 * 0.82,
    rgb.g * 0.18 + 255 * 0.82,
    rgb.b * 0.18 + 255 * 0.82
  );
  const swatch = rgbToHex(
    rgb.r * 0.42 + 255 * 0.58,
    rgb.g * 0.42 + 255 * 0.58,
    rgb.b * 0.42 + 255 * 0.58
  );
  const border = rgbToHex(
    rgb.r * 0.35 + 255 * 0.65,
    rgb.g * 0.35 + 255 * 0.65,
    rgb.b * 0.35 + 255 * 0.65
  );
  const text = rgbToHex(rgb.r * 0.45, rgb.g * 0.45, rgb.b * 0.45);

  return { swatch, bg, border, text };
};
