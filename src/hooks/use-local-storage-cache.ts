
import { useLocalStorage } from "@/hooks/use-local-storage";

interface CacheOptions {
  expirationMinutes?: number;
}

export function useLocalStorageCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  initialData: T,
  options: CacheOptions = {}
) {
  const { expirationMinutes = 60 } = options;
  
  const [cache, setCache] = useLocalStorage<{
    data: T;
    timestamp: number;
  }>(key, {
    data: initialData,
    timestamp: 0,
  });

  const isCacheValid = () => {
    const now = Date.now();
    const expirationTime = expirationMinutes * 60 * 1000;
    return now - cache.timestamp < expirationTime;
  };

  const fetchData = async (forceFresh = false) => {
    try {
      if (!forceFresh && isCacheValid()) {
        return cache.data;
      }
      
      const freshData = await fetcher();
      setCache({ data: freshData, timestamp: Date.now() });
      return freshData;
    } catch (error) {
      console.error(`Error fetching data for ${key}:`, error);
      // Return cached data even if expired in case of error
      return cache.data;
    }
  };

  return {
    data: cache.data,
    lastUpdated: new Date(cache.timestamp),
    isCacheValid: isCacheValid(),
    fetchData,
    invalidateCache: () => fetchData(true),
  };
}
