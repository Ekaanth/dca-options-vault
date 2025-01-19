import { useState, useEffect } from 'react';

const STRK_ID = '22691'; // STRK token ID on CoinMarketCap

export function useStarkPrice() {
  const [price, setPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStrkPrice = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/coinmarketcap/cryptocurrency/quotes/latest?id=${STRK_ID}&convert=USD`, {
      // const response = await fetch(`/api/quotes/latest?id=${STRK_ID}&convert=USD`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.status?.error_message || 
          `HTTP error! status: ${response.status}`
        );
      }
      
      const data = await response.json();
      
      if (data.status?.error_code) {
        throw new Error(data.status.error_message || 'Error fetching price data');
      }

      if (data.data?.[STRK_ID]) {
        const strkData = data.data[STRK_ID];
        setPrice(strkData.quote.USD.price);
        setPriceChange(strkData.quote.USD.percent_change_24h);
      } else {
        throw new Error('No price data available for STRK');
      }
    } catch (error) {
      console.error('Error fetching STRK price:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch price');
      // Set fallback values for development
      setPrice(0.41);
      setPriceChange(0.41);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrkPrice();

    // Refresh price every 30 seconds
    const interval = setInterval(fetchStrkPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  return { price, priceChange, isLoading, error, refetch: fetchStrkPrice };
} 