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

// Générer du HTML à partir des éléments
export const generateHtmlFromItems = (contentItems: ContentItem[]): string => {
  const topLevelItems = contentItems.filter(item => !item.parentId);
  let html = '<ul class="list-disc ml-6">\n';
  for (const item of topLevelItems) {
    if (item.type === 'text') {
      html += `  <li data-item-id="${item.id}">${item.content}</li>\n`;
    } else if (item.type === 'list') {
      // For list items, only the title (item.content) is displayed as a bullet
      html += `  <li data-item-id="${item.id}">${item.content}</li>\n`;
      // ...existing code to optionally handle children if needed...
    }
  }
  html += '</ul>\n';
  return html;
};

// Extraire le texte visible tel qu'un utilisateur le verrait lors d'un copier-coller
export const extractFormattedText = (_: ContentItem[]): string => {
  // Récupérer l'élément contenant l'aperçu
  const previewElement = document.querySelector('#preview .border.rounded-md') || 
                        document.querySelector('.preview-area') ||
                        document.getElementById('preview');
  
  // Si l'élément existe, récupérer son texte tel qu'il serait copié par un utilisateur
  if (previewElement) {
    return (previewElement as HTMLElement).innerText || '';
  }
  
  // Fallback: générer une liste à puces à partir des éléments
  return _.filter(item => !item.parentId)
          .map(item => `• ${item.content}`)
          .join('\n');
};




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
