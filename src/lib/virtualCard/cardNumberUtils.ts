
// Centralized card number utilities to ensure consistency across all components
export class CardNumberUtils {
  // Cache to store generated card numbers to ensure consistency
  private static cardNumberCache = new Map<string, string>();
  
  /**
   * Generate a consistent 16-digit card number based on card ID
   * This ensures the same card ID always generates the same card number
   */
  static getConsistentCardNumber(cardId: string): string {
    // Check cache first
    if (this.cardNumberCache.has(cardId)) {
      return this.cardNumberCache.get(cardId)!;
    }

    // Generate a consistent 16-digit card number based on card ID
    // Use a simple hash to convert the UUID to a numeric string
    let hash = 0;
    for (let i = 0; i < cardId.length; i++) {
      const char = cardId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Make sure hash is positive
    hash = Math.abs(hash);
    
    // Convert to 12-digit string and pad with zeros if needed
    const cardSuffix = hash.toString().padStart(12, '0').slice(0, 12);
    
    // Create full 16-digit card number starting with 4000
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
