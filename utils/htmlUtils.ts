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
      // Détection de list à puces (lignes commençant par • ou - ou *)
      if (item.content && (
          item.content.trim().split('\n').filter(line => line.trim()).every(line => 
            line.trim().startsWith('•') || 
            line.trim().startsWith('-') || 
            line.trim().startsWith('*')
          )
      )) {
        // C'est une liste à puces, transformer en véritable liste HTML
        let listItems = item.content
          .trim()
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const content = line.trim().substring(1).trim(); // Enlever le symbole de puce
            return `<li>${content}</li>`;
          })
          .join('');
          
        return `<ul ${commonAttrs} ${updateMarker} class="bullet-list">${listItems}</ul>`;
      }
      
      // Si ce n'est pas une liste, c'est un paragraphe normal
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
      text += `${item.content || ''}\n\n`;
    } else if (item.type === 'image') {
      text += `[Image: ${item.alt || 'Image uploadée'}]\n\n`;
    } else if (item.type === 'audio') {
      text += `[Audio${item.content ? `: ${item.content}` : ''}]\n\n`;
    } else if (item.type === 'list') {
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
