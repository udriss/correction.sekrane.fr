import { ContentItem } from '@/types/correction';

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
      // Centrer l'image avec un conteneur div
      return `<div class="image-container" ${commonAttrs} ${updateMarker} style="text-align: center; margin: 1.5rem auto;">
        <img src="${item.src}" alt="${item.alt || 'Image'}" style="max-width: 100%; margin: 0 auto;" />
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
