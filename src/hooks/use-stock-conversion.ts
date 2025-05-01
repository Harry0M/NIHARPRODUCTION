
import { useState, useEffect } from 'react';

interface UseStockConversionProps {
  primaryQuantity: number;
  primaryUnit: string;
  alternateUnit?: string;
  conversionRate?: number;
}

interface StockConversionResult {
  alternateQuantity: number;
  formattedPrimaryQuantity: string;
  formattedAlternateQuantity: string | null;
  convertToAlternate: (quantity: number) => number;
  convertToPrimary: (quantity: number) => number;
}

export const useStockConversion = ({
  primaryQuantity,
  primaryUnit,
  alternateUnit,
  conversionRate = 1,
}: UseStockConversionProps): StockConversionResult => {
  const [alternateQuantity, setAlternateQuantity] = useState<number>(0);

  useEffect(() => {
    setAlternateQuantity(primaryQuantity * conversionRate);
  }, [primaryQuantity, conversionRate]);

  const convertToAlternate = (quantity: number): number => {
    return quantity * conversionRate;
  };

  const convertToPrimary = (quantity: number): number => {
    return conversionRate !== 0 ? quantity / conversionRate : 0;
  };

  return {
    alternateQuantity,
    formattedPrimaryQuantity: `${primaryQuantity} ${primaryUnit}`,
    formattedAlternateQuantity: alternateUnit 
      ? `${alternateQuantity.toFixed(2)} ${alternateUnit}` 
      : null,
    convertToAlternate,
    convertToPrimary,
  };
};
