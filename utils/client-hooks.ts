import { useLayoutEffect, useEffect } from 'react';

// Définir un hook useIsomorphicLayoutEffect qui utilise useLayoutEffect côté client
// et useEffect côté serveur pour éviter les avertissements SSR
export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
