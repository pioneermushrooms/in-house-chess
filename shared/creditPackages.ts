// Credit purchase packages for In-House Chess Club
// Players can buy credits with real money to wager on games

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceUsd: number; // Price in USD cents (e.g., 500 = $5.00)
  bonus: number; // Bonus credits (e.g., 10% extra)
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 100,
    priceUsd: 500, // $5.00
    bonus: 0,
  },
  {
    id: "standard",
    name: "Standard Pack",
    credits: 250,
    priceUsd: 1000, // $10.00
    bonus: 25, // 10% bonus
    popular: true,
  },
  {
    id: "premium",
    name: "Premium Pack",
    credits: 550,
    priceUsd: 2000, // $20.00
    bonus: 50, // 10% bonus
  },
  {
    id: "ultimate",
    name: "Ultimate Pack",
    credits: 1200,
    priceUsd: 5000, // $50.00
    bonus: 200, // 20% bonus
  },
];

// Helper function to format price
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Helper function to get total credits (base + bonus)
export function getTotalCredits(pkg: CreditPackage): number {
  return pkg.credits + pkg.bonus;
}
