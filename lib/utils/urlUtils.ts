/**
 * Utilitaire pour créer des URL avec contrôle sur l'encodage des paramètres
 */

/**
 * Génère une chaîne de requête URL à partir d'un objet URLSearchParams,
 * en évitant l'encodage automatique des caractères spéciaux pour tous les paramètres
 * et en s'assurant qu'il n'y a pas de doublons
 * 
 * @param params Objet URLSearchParams contenant les paramètres à convertir
 * @returns Chaîne de requête URL formatée
 */
export function createQueryString(params: URLSearchParams): string {
  // Utiliser un objet pour stocker uniquement la dernière valeur de chaque paramètre
  // et éviter ainsi les doublons
  const uniqueParams: Record<string, string> = {};
  
  params.forEach((value, key) => {
    // Trim pour enlever les espaces inutiles au début et à la fin
    const trimmedValue = value.trim();
    
    // Stocker uniquement la dernière valeur pour chaque clé
    uniqueParams[key] = trimmedValue;
  });
  
  // Convertir l'objet en tableau de paires clé=valeur
  const urlParams = Object.entries(uniqueParams).map(
    ([key, value]) => `${key}=${value}`
  );
  
  return urlParams.join('&');
}

/**
 * Construit une URL complète pour la navigation
 * 
 * @param baseUrl L'URL de base (ex: '/corrections')
 * @param params Objet URLSearchParams
 * @returns URL complète
 */
export function buildUrl(
  baseUrl: string,
  params: URLSearchParams
): string {
  const queryString = createQueryString(params);
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}