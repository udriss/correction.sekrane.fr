import React from 'react';
import { ContentItem } from '@/types/correction';
import DraggableItem from '@/app/components/DraggableItem';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';

interface CorrectionContentEditorProps {
  contentItems: ContentItem[];
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  updateItem: (index: number, content: string) => void;
  removeItem: (index: number) => void;
  addNewParagraph: () => void;
  addNewImage: (imageUrl: string) => void;
  addNewAudio: (audioUrl: string) => void;
  activityId: number;
  correctionId: string;
}

const CorrectionContentEditor: React.FC<CorrectionContentEditorProps> = ({
  contentItems,
  moveItem,
  updateItem,
  removeItem,
  addNewParagraph,
  addNewImage,
  addNewAudio,
  activityId,
  correctionId
}) => {
  // Filtre des éléments parents (pas de parentId)
  const parentItems = contentItems.filter(item => !item.parentId);
  
  // Gestion de la fin du drag
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    
    // Si pas de destination (drop en dehors de la zone) ou même position, on ne fait rien
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Appeler la fonction moveItem avec les indices source et destination
    moveItem(source.index, destination.index);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`correction-content-${correctionId}`} type="CONTENT_ITEM">
        {(provided) => (
          <div 
            className="relative" 
            style={{ minHeight: '50px' }}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {parentItems.map((item, index) => (
              <DraggableItem
                key={item.id}
                item={item}
                index={index}
                moveItem={moveItem}
                updateItem={updateItem}
                removeItem={removeItem}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default CorrectionContentEditor;
