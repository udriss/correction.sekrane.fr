# Gestion des médias en production - Next.js

## Problème résolu

Le problème était que les images et fichiers audio ajoutés dans le système de correction ne s'affichaient pas en production. Cela était dû au fait que Next.js sert les fichiers du dossier `public` de manière statique lors du build, et les nouvelles images ajoutées après le build ne sont pas accessibles.

## Solution mise en place

### 1. API média universelle

L'API `/api/media/[activity_id]/[file_name]/route.ts` a été étendue pour gérer :
- ✅ Fichiers audio (déjà présent)
- ✅ Fichiers images (ajouté)
- ✅ Types MIME appropriés pour tous les formats
- ✅ Mise en cache pour de meilleures performances
- ✅ Gestion d'erreurs robuste

### 2. Hook `useMediaUrl`

Un nouveau hook `/hooks/useMediaUrl.ts` a été créé pour :
- ✅ Convertir automatiquement les URLs `/uploads/` vers `/api/media/` côté client
- ✅ Gérer les URLs absolutes (http/https) sans modification
- ✅ Assurer la cohérence entre développement et production
- ✅ Fournir une fonction utilitaire non-React pour les autres contextes

### 3. Modifications du composant DraggableItem

Le composant `/app/components/DraggableItem.tsx` a été mis à jour pour :
- ✅ Utiliser le hook `useMediaUrl` pour les images et audio
- ✅ Gérer les erreurs de chargement avec des messages informatifs
- ✅ Maintenir la compatibilité avec l'existant

### 4. Modifications des utilitaires HTML

Le fichier `/utils/htmlUtils.ts` a été mis à jour pour :
- ✅ Utiliser `getMediaUrl` dans la génération HTML
- ✅ Assurer la cohérence entre l'éditeur et l'aperçu
- ✅ Gérer les URLs de médias dans toutes les fonctions de rendu

## Avantages de cette solution

1. **Compatibilité universelle** : Fonctionne en développement et production
2. **Performance** : Cache approprié pour les fichiers média
3. **Sécurité** : Contrôle d'accès via l'API
4. **Maintenabilité** : Hook centralisé pour la gestion des URLs
5. **Flexibilité** : Support futur facile pour d'autres types de médias

## Structure des URLs

### Avant (problématique en production)
```
/uploads/123/image.jpg  ❌ Ne fonctionne pas après build
```

### Après (solution universelle)
```
Development: /uploads/123/image.jpg  ✅ Dossier public direct
Production:  /api/media/123/image.jpg ✅ Via API sécurisée
```

## Utilisation

### Dans un composant React
```tsx
import { useMediaUrl } from '@/hooks/useMediaUrl';

const MyComponent = ({ imageSrc }) => {
  const imageUrl = useMediaUrl(imageSrc);
  
  return (
    <img 
      src={imageUrl} 
      alt="Image" 
      onError={() => console.log('Erreur de chargement')}
    />
  );
};
```

### Dans une fonction utilitaire
```ts
import { getMediaUrl } from '@/hooks/useMediaUrl';

const generateHTML = (src: string) => {
  const url = getMediaUrl(src);
  return `<img src="${url}" alt="Image" />`;
};
```

## Tests recommandés

1. ✅ Upload d'une image en développement
2. ✅ Upload d'une image en production
3. ✅ Affichage dans DraggableItem
4. ✅ Affichage dans l'aperçu HTML
5. ✅ Gestion des erreurs de chargement
6. ✅ Performance des fichiers en cache

## Migration

Aucune migration n'est nécessaire car :
- Les anciennes URLs continuent de fonctionner
- La conversion est automatique côté client
- Les nouveaux uploads utilisent déjà la bonne logique (existante dans l'API upload)

## Notes techniques

- L'API média utilise `Content-Type` approprié pour chaque format
- Support du streaming partiel avec `Accept-Ranges: bytes`
- Cache d'un an pour optimiser les performances
- Gestion d'erreur 404 claire pour les fichiers introuvables
