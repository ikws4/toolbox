"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to determine if the code is running on client side
 * Returns false during SSR, then true after hydration completes
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient;
}
