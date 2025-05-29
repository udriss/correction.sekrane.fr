import { ContentItem } from '@/types/correction';
import { getMediaUrl } from '@/hooks/useMediaUrl';

// Convertir le HTML en éléments du DOM pour l'analyse
export const parseHtmlToItems = (html: string): ContentItem[] => {
  try {
    // Initialiser les éléments de contenu
    const items: ContentItem[] = [];
    let itemIdCounter = 0;

    // Si pas de contenu, avoir un élément vide par défaut
    if (!html.trim()) {
      items.push({
        id: `item-${itemIdCounter++}`,
        type: 'text',
        content: ''
      });
      return items;
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Fonction récursive pour analyser les nœuds
    const parseNode = (node: Node, parentId?: string) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          items.push({
            id: `item-${itemIdCounter++}`,
            type: 'text',
            content: text,
            parentId
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const itemId = element.getAttribute('data-item-id') || `item-${itemIdCounter++}`;

        if (element.tagName === 'P') {
          items.push({
            id: itemId,
            type: 'text',
            content: element.textContent || '',
            parentId
          });
        } else if (element.tagName === 'UL') {
          const fragmentId = element.getAttribute('data-fragment-id');
          const fragmentName = element.getAttribute('data-fragment-name');
          
          items.push({
            id: itemId,
            type: 'list',
            content: fragmentName ? decodeURIComponent(fragmentName) : 'Liste',
            parentId,
            fragmentId: fragmentId ? parseInt(fragmentId, 10) : undefined,
            fragmentName: fragmentName ? decodeURIComponent(fragmentName) : undefined
          });
          
          // Récupérer tous les éléments LI
          Array.from(element.querySelectorAll('li')).forEach(li => {
            const liItemId = li.getAttribute('data-item-id') || `item-${itemIdCounter++}`;
            items.push({
              id: liItemId,
              type: 'listItem',
              content: li.textContent || '',
              parentId: itemId
            });
          });
        } else if (element.tagName === 'DIV') {
          // Vérifier si c'est un conteneur d'image
          const imgElement = element.querySelector('img');
          if (imgElement) {
            items.push({
              id: itemId,
              type: 'image',
              src: imgElement.getAttribute('src') || '',
              alt: imgElement.getAttribute('alt') || '',
              content: '',
              parentId
            });
          } 
          // Vérifier si c'est un conteneur d'audio
          else {
            const audioElement = element.querySelector('audio');
            if (audioElement) {
              const descriptionElement = element.querySelector('.audio-description');
              items.push({
                id: itemId,
                type: 'audio',
                src: audioElement.getAttribute('src') || '',
                content: descriptionElement?.textContent || '',
                parentId
              });
            } else {
              // Si ce n'est ni image ni audio, traiter les enfants
              Array.from(element.childNodes).forEach(child => {
                parseNode(child, parentId);
              });
            }
          }
        } else {
          Array.from(element.childNodes).forEach(child => {
            parseNode(child, parentId);
          });
        }
      }
    };
    
    // Parcourir tous les nœuds du body
    Array.from(doc.body.childNodes).forEach(node => {
      parseNode(node);
    });
    
    // Si aucun élément trouvé, avoir un élément vide par défaut
    if (items.length === 0) {
      items.push({
        id: `item-${itemIdCounter++}`,
        type: 'text',
        content: ''
      });
    }
    
    return items;
  } catch (error) {
    console.error('Erreur lors de l\'analyse du HTML:', error);
    // En cas d'erreur, créer un élément avec le HTML brut
    return [{
      id: 'item-0',
      type: 'text',
      content: html || ''
    }];
  }
};

export function generateHtmlFromItems(items: ContentItem[]): string {
  let html = '';
  
  // Inclure les styles CSS pour les titres d'exercices et fragments
  html += generateFeedbackStyles();
  
  // Traiter les éléments principaux
  for (const item of items) {
    if (item.parentId) continue; // Les éléments enfants sont traités avec leurs parents
    
    html += generateHtmlForItem(item, items);
  }
  
  return html;
}

function generateHtmlForItem(item: ContentItem, allItems: ContentItem[]): string {
  // Attributs communs à tous les éléments pour faciliter le ciblage en JavaScript
  const commonAttrs = `data-item-id="${item.id}"${item.fragmentId ? ` data-fragment-id="${item.fragmentId}"` : ''}`;
  
  // Ajouter un timestamp unique pour forcer le navigateur à traiter chaque rendu comme différent
  const timestamp = Date.now();
  const updateMarker = `data-last-update="${timestamp}"`;
  
  switch (item.type) {
    case 'text':
      // Détection et amélioration des listes à puces (lignes commençant par • ou - ou *)
      const lines = item.content ? item.content.trim().split('\n').filter(line => line.trim()) : [];
      
      // Vérifier si c'est une liste à puces
      const isFormattedList = lines.length > 0 && lines.every(line => 
        line.trim().startsWith('•') || 
        line.trim().startsWith('-') || 
        line.trim().startsWith('*')
      );
      
      // Vérifier si c'est un fragment de correction, mais exclure les exercise-title qui sont déjà formatés
      const isExerciseTitle = item.content && (
        item.content.includes('exercise-title') ||
        // Détecter les titres d'exercices typiques
        (item.content.match(/^(Exercice|Question|Partie|Problème)\s*\d+/i)) ||
        // Détecter les contenus très courts qui ressemblent à des titres
        (item.content.length < 100 && item.content.match(/^[A-Z][^.!?]*$/))
      );
      
      // Détecter les différents types de corrections
      const isPreregisteredFragment = !isExerciseTitle && (
        item.fragmentId || item.originalFragmentId || 
        (item.isFromFragment === true) ||
        (item.content && item.content.match(/^Q\d+/)) // Fragments qui commencent par "QX"
      );
      
      const isCustomCorrection = !isExerciseTitle && !isPreregisteredFragment && (
        (item.isFromFragment === false) ||
        (item.content && (
          item.content.includes('.') || 
          item.content.includes('!') || 
          item.content.includes('?') ||
          lines.length > 1 ||
          (item.content.length > 100) // Longs textes are likely corrections
        ))
      );
      
      const isFragmentCorrection = isPreregisteredFragment || isCustomCorrection;
      
      if (isFormattedList) {
        // C'est déjà une liste à puces formatée, transformer en véritable liste HTML
        let listItems = lines
          .map(line => {
            const content = line.trim().substring(1).trim(); // Enlever le symbole de puce
            return `<li>${content}</li>`;
          })
          .join('');
          
        return `<ul ${commonAttrs} ${updateMarker} class="bullet-list formatted-list">${listItems}</ul>`;
      } else if (isFragmentCorrection && (item.fragmentId || item.originalFragmentId || item.isFromFragment !== undefined)) {
        // C'est un fragment de correction, créer une liste structurée
        const fragmentContent = item.content || '';
        
        // Déterminer la classe CSS en fonction du type de correction
        const correctionClass = isPreregisteredFragment ? 'fragment-correction' : 'custom-correction';
        
        // Diviser le contenu en phrases ou sections logiques
        const sentences = fragmentContent
          .split(/[.!?;]+/)
          .map(s => s.trim())
          .filter(s => s.length > 10); // Ignorer les fragments trop courts
        
        // Alternative: diviser par lignes si pas assez de phrases
        const lines = fragmentContent
          .split(/\n+/)
          .map(s => s.trim())
          .filter(s => s.length > 5);
        
        // Utiliser la méthode qui donne le plus de points distincts
        const contentParts = sentences.length > 1 ? sentences : 
                           lines.length > 1 ? lines : 
                           [fragmentContent];
        
        if (contentParts.length > 1) {
          // Créer une liste à puces pour les fragments multi-points
          const listItems = contentParts
            .map(part => {
              // Ajouter un point final si nécessaire
              const trimmed = part.trim();
              const needsPunctuation = !trimmed.match(/[.!?;:]$/);
              return `<li>${trimmed}${needsPunctuation ? '.' : ''}</li>`;
            })
            .join('');
          
          return `<div ${commonAttrs} ${updateMarker} class="${correctionClass}">
            ${item.fragmentName ? `<div class="fragment-title">${item.fragmentName}</div>` : ''}
            <ul class="correction-fragment-list">${listItems}</ul>
          </div>`;
        } else {
          // Une seule phrase, afficher comme un paragraphe avec style fragment
          return `<div ${commonAttrs} ${updateMarker} class="${correctionClass} single-point">
            ${item.fragmentName ? `<div class="fragment-title">${item.fragmentName}</div>` : ''}
            <p class="single-correction-point">${fragmentContent}</p>
          </div>`;
        }
      }
      
      // Si ce n'est pas une liste ni un fragment, c'est un paragraphe normal
      return `<p ${commonAttrs} ${updateMarker} class="text-item">${item.content || ''}</p>`;
      
    case 'image':
      const imageUrl = getMediaUrl(item.src);
      const isSvg = item.src && item.src.toLowerCase().includes('.svg');
      
      // Pour les SVG, nous ajoutons des styles spéciaux pour un meilleur support
      const imageStyles = isSvg 
        ? "max-width: 100%; margin: 0 auto; height: auto;"
        : "max-width: 100%; margin: 0 auto;";
      
      // Générer un ID unique pour cette image pour la gestion d'erreur SVG
      const imageId = `img-${item.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Script inline pour gérer les erreurs SVG avec fallback
      const svgErrorScript = isSvg ? `
        <script>
          (function() {
            const img = document.getElementById('${imageId}');
            if (img) {
              const handleSvgError = function(imgElement, isRetry) {
                console.error('Erreur de chargement SVG dans feedback:', imgElement.src);
                console.error('SVG error details:', {
                  src: imgElement.src,
                  naturalWidth: imgElement.naturalWidth,
                  naturalHeight: imgElement.naturalHeight,
                  complete: imgElement.complete
                });
                
                // Fonction pour afficher l'erreur
                const showImageError = function(element) {
                  const parent = element.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div style="padding: 20px; border: 2px dashed #ccc; border-radius: 4px; text-align: center; color: #666; background-color: #f9f9f9; margin: 1.5rem auto;"><p>⚠️ Image non disponible</p><p style="font-size: 12px; margin: 5px 0 0 0;">Le fichier SVG n\\'a pas pu être chargé</p></div>';
                  }
                };
                
                // Pour les SVG, essayer le fallback data URL si pas déjà essayé
                if (!isRetry && imgElement.src.toLowerCase().includes('.svg')) {
                  fetch(imgElement.src)
                    .then(function(response) {
                      if (!response.ok) throw new Error('HTTP ' + response.status);
                      return response.text();
                    })
                    .then(function(svgContent) {
                      if (svgContent.includes('<svg')) {
                        const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
                        imgElement.src = svgDataUrl;
                        console.log('SVG loaded as data URL successfully in feedback');
                        return;
                      }
                      throw new Error('Invalid SVG content');
                    })
                    .catch(function(fetchError) {
                      console.error('SVG fetch failed in feedback:', fetchError);
                      showImageError(imgElement);
                    });
                  return;
                }
                
                // Sinon afficher l'erreur
                showImageError(imgElement);
              };
              
              // Gestionnaire d'erreur
              img.addEventListener('error', function() {
                handleSvgError(this, false);
              });
              
              // Vérifier si l'image SVG est "chargée" mais sans dimensions
              img.addEventListener('load', function() {
                if (this.src.toLowerCase().includes('.svg') && this.naturalWidth === 0 && this.naturalHeight === 0) {
                  console.log('SVG loaded but with zero dimensions, trying fallback');
                  handleSvgError(this, false);
                } else {
                  console.log('Image loaded successfully in feedback:', this.src);
                }
              });
            }
          })();
        </script>
      ` : '';
      
      // Centrer l'image avec un conteneur div
      return `<div class="image-container${isSvg ? ' svg-image' : ''}" ${commonAttrs} ${updateMarker} style="text-align: center; margin: 1.5rem auto;">
        <img id="${imageId}" src="${imageUrl || item.src}" alt="${item.alt || 'Image uploadée'}" style="${imageStyles}" />
      </div>${svgErrorScript}`;
      
    case 'audio':
      // Lecteur audio compact avec style cohérent avec DraggableItem.tsx
      return `<div class="audio-container" ${commonAttrs} ${updateMarker} style="margin: 1.5rem auto; max-width: 450px;">
        <div style="
          background-color: #fafafa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.2s ease-in-out;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: ${item.content ? '12px' : '0'};
        " 
        onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'" 
        onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
          <div style="
            background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
            padding: 6.4px;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 32px;
            height: 32px;
            flex-shrink: 0;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <audio controls style="flex-grow: 1; height: 40px; min-width: 0;" src="${getMediaUrl(item.src) || item.src}">
            Votre navigateur ne supporte pas l'élément audio.
          </audio>
        </div>
        ${item.content ? `<div class="audio-description" style="
          padding: 8px 12px;
          border-left: 3px solid #1976d2;
          background-color: #f5f5f5;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #333;
          font-style: italic;
        ">${item.content}</div>` : ''}
      </div>`;
      
    case 'list':
      // Transformer en véritable liste HTML avec puces
      let listHtml = `<ul ${commonAttrs} ${updateMarker} class="correction-list">`;
      
      // Trouver les enfants de cette liste
      const children = allItems.filter(child => child.parentId === item.id);
      
      for (const child of children) {
        const childTimestamp = timestamp + 1000 + Math.floor(Math.random() * 1000);
        const childMarker = `data-last-update="${childTimestamp}"`;
        
        // Utiliser un identifiant unique pour chaque élément de liste
        listHtml += `<li data-item-id="${child.id}" data-parent-id="${item.id}" ${childMarker}>${child.content || ''}</li>`;
      }
      
      listHtml += `</ul>`;
      return listHtml;
      
    case 'listItem':
      return `<li data-item-id="${item.id}" data-parent-id="${item.parentId || ''}" ${updateMarker}>${item.content || ''}</li>`;
      
    default:
      return '';
  }
}

// Fonction pour extraire le texte formaté (pour le presse-papier)
export function extractFormattedText(items: ContentItem[]): string {
  let text = '';
  
  for (const item of items) {
    if (item.parentId) continue;
    
    if (item.type === 'text') {
      const content = item.content || '';
      
      // Exclure les exercise-title de la transformation en bullet list
      const isExerciseTitle = content && (
        content.includes('exercise-title') ||
        content.match(/^(Exercice|Question|Partie|Problème)\s*\d+/i) ||
        (content.length < 100 && content.match(/^[A-Z][^.!?]*$/))
      );
      
      // Vérifier si c'est un fragment de correction qui a été transformé
      if (!isExerciseTitle && (item.fragmentId || item.originalFragmentId || item.isFromFragment !== undefined) && content) {
        // Traiter comme un fragment de correction avec titre
        if (item.fragmentName) {
          text += `${item.fragmentName}:\n`;
        }
        
        // Diviser en phrases et formater comme liste si applicable
        const sentences = content
          .split(/[.!?;]+/)
          .map(s => s.trim())
          .filter(s => s.length > 10);
        
        const lines = content
          .split(/\n+/)
          .map(s => s.trim())
          .filter(s => s.length > 5);
        
        const contentParts = sentences.length > 1 ? sentences : 
                           lines.length > 1 ? lines : 
                           [content];
        
        if (contentParts.length > 1) {
          for (const part of contentParts) {
            const trimmed = part.trim();
            const needsPunctuation = !trimmed.match(/[.!?;:]$/);
            text += `• ${trimmed}${needsPunctuation ? '.' : ''}\n`;
          }
        } else {
          text += `• ${content}\n`;
        }
        text += '\n';
      } else {
        // Traitement normal
        text += `${content}\n\n`;
      }
    } else if (item.type === 'image') {
      text += `[Image: ${item.alt || 'Image uploadée'}]\n\n`;
    } else if (item.type === 'audio') {
      text += `[Audio${item.content ? `: ${item.content}` : ''}]\n\n`;
    } else if (item.type === 'list') {
      // Traiter les listes avec leur titre
      if (item.content) {
        text += `${item.content}:\n`;
      }
      
      // Trouver les enfants de cette liste
      const children = items.filter(child => child.parentId === item.id);
      
      for (const child of children) {
        text += `• ${child.content || ''}\n`;
      }
      
      text += '\n';
    }
  }
  
  return text.trim();
}

// Fonction simplifiée pour traiter les fragments comme des paragraphes
export const updateContentItemsFromEditable = (contentItems: ContentItem[]): void => {
  // Pour chaque élément de contenu, mettre à jour son contenu depuis l'élément éditable
  contentItems.forEach(item => {
    // Chercher l'élément éditable par id
    const editableElement = document.getElementById(item.id);
    
    if (editableElement) {
      // Mettre à jour le contenu de l'item avec le texte de l'élément éditable
      item.content = editableElement.textContent || '';
      
      // Trouver et mettre à jour l'élément correspondant dans l'aperçu
      const previewElement = document.querySelector(`#preview [data-item-id="${item.id}"]`);
      if (previewElement) {
        previewElement.textContent = item.content;
      }
    }
  });
};

// Fonction pour traiter les fragments ajoutés par drag-and-drop
export const handleFragmentAddition = (
  fragment: HTMLElement, 
  contentItems: ContentItem[]
): ContentItem => {
  // Générer un nouvel ID pour le fragment
  const newId = `item-${Date.now()}`;
  
  // Ajouter un attribut data-item-id pour pouvoir le retrouver dans l'aperçu
  fragment.setAttribute('data-item-id', newId);
  
  // Créer un nouvel élément de contenu pour le fragment
  const newItem: ContentItem = {
    id: newId,
    type: 'text', // Traiter comme un paragraphe
    content: fragment.textContent || ''
  };
  
  // Ajouter au tableau des éléments de contenu
  contentItems.push(newItem);
  
  // Retourner le nouvel élément pour référence
  return newItem;
};

// Fonction pour synchroniser les fragments draggable avec l'aperçu
export const syncDraggables = (contentItems: ContentItem[]): void => {
  // Trouver tous les éléments draggable sur la page
  const draggables = document.querySelectorAll('.draggable');
  
  draggables.forEach(draggable => {
    // Récupérer l'ID de l'élément
    const id = draggable.getAttribute('data-item-id');
    if (!id) return;
    
    // Trouver l'élément correspondant dans contentItems
    const item = contentItems.find(item => item.id === id);
    
    // Si l'élément existe dans contentItems, mettre à jour son contenu
    if (item) {
      // Mise à jour avec innerHTML pour refléter les modifications de contenu 
      item.content = draggable.innerHTML || '';
      
      // Mettre à jour l'aperçu
      const previewElement = document.querySelector(`#preview [data-item-id="${id}"]`);
      if (previewElement) {
        previewElement.innerHTML = item.content;
      }
    } 
    // Si l'élément n'existe pas, le traiter comme un nouveau fragment
    else {
      handleFragmentAddition(draggable as HTMLElement, contentItems);
    }
  });
};

// Générer les styles CSS pour les titres d'exercices et fragments de correction
export function generateFeedbackStyles(): string {
  return `
    <style>
      .exercise-title {
        margin-top: 1.5rem;
        text-align: center;
        margin-bottom: 2rem;
        padding: 0.75rem 1rem;
        font-weight: bold;
        font-size: 1.1rem;
        background: linear-gradient(90deg, rgba(25, 118, 210, 0.2), rgba(156, 39, 176, 0.2));
        border: 1px solid black;
        box-shadow: 0px 0px 15px 0px #898989;
        border-radius: 1rem;
        page-break-before: auto;
        page-break-after: avoid;
      }
      
      .exercise-title:first-child {
        margin-top: 0;
      }
      
      /* S'assurer que les titres d'exercices ne sont pas affectés par les styles des paragraphes */
      .exercise-title::before {
        content: none !important;
      }
      
      .exercise-title p {
        margin: 0;
        padding: 0;
      }
      
      /* Styles pour les fragments de correction */
      .fragment-correction {
        margin: 1rem 0;
        padding: 0.75rem;
        border-left: 4px solid #1976d2;
        background-color: rgba(25, 118, 210, 0.05);
        border-radius: 0 8px 8px 0;
      }
      
      /* Styles pour les corrections personnalisées (non issues de fragments préenregistrés) */
      .custom-correction {
        margin: 1rem 0;
        padding: 0.75rem;
        border-left: 4px solid #e65100;
        background-color: rgba(230, 81, 0, 0.08);
        border-radius: 0 8px 8px 0;
      }
      
      .fragment-title {
        font-weight: bold;
        color: #1565c0;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }
      
      .custom-correction .fragment-title {
        color: #bf360c;
      }
      
      .correction-fragment-list {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
        list-style-type: disc;
      }
      
      .correction-fragment-list li {
        margin: 0.4rem 0;
        line-height: 1.5;
        color: #212121;
        padding-left: 0.25rem;
      }
      
      .single-correction-point {
        margin: 0.5rem 0;
        line-height: 1.5;
        color: #212121;
      }
      
      .fragment-correction.single-point {
        border-left-color:rgb(39, 82, 176);
        background-color: rgba(108, 173, 125, 0.05);
      }
      
      .custom-correction.single-point {
        border-left-color: #d84315;
        background-color: rgba(216, 67, 21, 0.08);
      }
      
      /* Amélioration des listes déjà formatées */
      .formatted-list {
        margin: 1rem 0;
        padding-left: 2rem;
        background-color: rgba(2, 136, 209, 0.03);
        border-radius: 4px;
        padding: 0.5rem 1rem 0.5rem 2rem;
      }
      
      .formatted-list li {
        margin: 0.4rem 0;
        line-height: 1.5;
      }
      
      /* Styles généraux pour les listes à puces */
      .bullet-list, .correction-list {
        list-style-type: disc;
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }
      
      .bullet-list li, .correction-list li {
        margin: 0.3rem 0;
        line-height: 1.5;
        padding-left: 0.25rem;
      }
      
      /* Amélioration pour les fragments longs */
      .fragment-correction p, .fragment-correction li {
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      
      /* Styles pour les paragraphes normaux vs fragments */
      .text-item {
        margin: 0.75rem 0;
        line-height: 1.6;
        color: #212121;
      }
    </style>
  `;
}
