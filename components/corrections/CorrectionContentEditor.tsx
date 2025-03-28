import React from 'react';
import { Paper, Typography, IconButton, TextField } from '@mui/material';
import { ContentItem } from '@/types/correction';
import DraggableItem from '@/app/components/DraggableItem';
import AddIcon from '@mui/icons-material/Add';
import ImageUploader from '@/app/components/ImageUploader';

interface CorrectionContentEditorProps {
  contentItems: ContentItem[];
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  updateItem: (index: number, content: string) => void;
  removeItem: (index: number) => void;
  addNewParagraph: () => void;
  addNewImage: (imageUrl: string) => void;
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
  activityId,
  correctionId
}) => {
  return (
      <div >
        {contentItems.map((item, index) => (
          !item.parentId && (
            <DraggableItem
              key={item.id}
              item={item}
              index={index}
              moveItem={moveItem}
              updateItem={updateItem}
              removeItem={removeItem}
            />
          )
        ))}
      </div>
  );
};

export default CorrectionContentEditor;
