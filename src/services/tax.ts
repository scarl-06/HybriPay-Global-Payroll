import logger from "./logger";

export interface TaxRule {
  country: string;
  percentage: number;
  authorityWallet: string;
}

const TAX_RULES: Record<string, TaxRule> = {
  USA: {
    country: "USA",
    percentage: 25,
    authorityWallet: "6JuLPbQNecgiFZvZvYj8PLDU7yN7r9xRTDYsiKYTi5p1",
  },
  Europe: {
    country: "Europe",
    percentage: 30,
    authorityWallet: "E3AiYBGC6HVFrjZDARN2qs1zoc4gz8GM5g9XK7XgJHYV",
  },
  Japan: {
    country: "Japan",
    percentage: 20,
    authorityWallet: "Ep3S42suZRMiSZTyhhH6ZiXLiwRG7DiUZBxUpazcB8r",
  },
  India: {
    country: "India",
    percentage: 10,
    authorityWallet: "ERxkSNdtTUCq1D3LC343o1yB6qkaRCvG8uigpuibkvAn",
  },
};

export const getTaxRule = (country: string): TaxRule => {
  const rule = TAX_RULES[country] || TAX_RULES.USA;
  logger.info({ message: "Applying tax rule", country: rule.country, percentage: rule.percentage });
  return rule;
};
