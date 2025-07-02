
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
    const cardIdHash = cardId.replace(/-/g, '').substring(0, 16);
    const paddedHash = (cardIdHash + '0000000000000000').substring(0, 16);
    
    // Ensure all characters are numeric by converting any non-numeric to numbers
    const numericOnly = paddedHash.split('').map(char => {
      const code = char.charCodeAt(0);
      return (code % 10).toString();
    }).join('');
    
    const fullCardNumber = `4000${numericOnly.substring(4, 16)}`;
    
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
    const cardIdHash = cardId.replace(/-/g, '');
    const cvvHash = cardIdHash.substring(0, 3);
    const numericCVV = cvvHash.split('').map(char => {
      const code = char.charCodeAt(0);
      return (code % 10).toString();
    }).join('');
    return numericCVV.padStart(3, '0');
  }

  /**
   * Clear the cache (useful for testing or when needed)
   */
  static clearCache(): void {
    this.cardNumberCache.clear();
  }
}
