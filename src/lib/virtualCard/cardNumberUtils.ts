
// Centralized card number utilities to ensure consistency across all components
export class CardNumberUtils {
  // Cache to store generated card numbers to ensure consistency
  private static cardNumberCache = new Map<string, string>();
  
  /**
   * Generate a consistent 16-digit card number based on card ID
   * This ensures the same card ID always generates the same card number
   * Uses a deterministic algorithm that matches the backend implementation
   */
  static getConsistentCardNumber(cardId: string): string {
    // Check cache first
    if (this.cardNumberCache.has(cardId)) {
      return this.cardNumberCache.get(cardId)!;
    }

    // Remove hyphens from UUID and use first 16 characters
    const cleanId = cardId.replace(/-/g, '');
    
    // Convert each character to its char code and sum them
    let hashSum = 0;
    for (let i = 0; i < cleanId.length; i++) {
      hashSum += cleanId.charCodeAt(i);
    }
    
    // Generate a seed based on the hash sum
    const seed = hashSum % 1000000000000; // 12 digits max
    
    // Create the card number: 4000 + 12 digit number based on seed
    const cardSuffix = seed.toString().padStart(12, '0');
    const fullCardNumber = `4000${cardSuffix}`;
    
    // Cache the result
    this.cardNumberCache.set(cardId, fullCardNumber);
    
    return fullCardNumber;
  }

  /**
   * Generate a formatted card number (with spaces) for display
   */
  static getFormattedCardNumber(cardId: string): string {
    const fullNumber = this.getConsistentCardNumber(cardId);
    return `${fullNumber.substring(0, 4)} ${fullNumber.substring(4, 8)} ${fullNumber.substring(8, 12)} ${fullNumber.substring(12, 16)}`;
  }

  /**
   * Generate a masked card number for display
   */
  static getMaskedCardNumber(cardId: string): string {
    const fullNumber = this.getConsistentCardNumber(cardId);
    return `${fullNumber.substring(0, 4)} **** **** ${fullNumber.substring(12, 16)}`;
  }

  /**
   * Generate a consistent CVV based on card ID
   */
  static getConsistentCVV(cardId: string): string {
    // Generate a simple hash for CVV
    let hash = 0;
    for (let i = 0; i < cardId.length; i++) {
      const char = cardId.charCodeAt(i);
      hash = ((hash << 3) - hash) + char;
      hash = hash & hash;
    }
    
    // Convert to 3-digit CVV
    const cvv = (Math.abs(hash) % 900 + 100).toString();
    return cvv;
  }

  /**
   * Clear the cache (useful for testing or when needed)
   */
  static clearCache(): void {
    this.cardNumberCache.clear();
  }
}
