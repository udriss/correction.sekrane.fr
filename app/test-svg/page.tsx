'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import DraggableItem from '@/app/components/DraggableItem';
import { ContentItem } from '@/types/correction';
import { Box, Typography, Paper, Button } from '@mui/material';

export default function TestSvgPage() {
  const [items, setItems] = useState<ContentItem[]>([
    {
      id: 'svg-test-1',
      type: 'image',
      src: '/uploads/test/test.svg',
      alt: 'SVG de test via uploads direct',
      content: 'Test SVG direct'
    },
    {
      id: 'svg-test-2', 
      type: 'image',
      src: 'test/test.svg', // Sera transformé par useMediaUrl
      alt: 'SVG de test via API media',
      content: 'Test SVG via API'
    },
    {
      id: 'png-test',
      type: 'image', 
      src: '/uploads/test/test.png',
      alt: 'PNG de test',
      content: 'Test PNG pour comparaison'
    }
  ]);

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const newItems = [...items];
    const draggedItem = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, draggedItem);
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index: number, content: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], content };
    setItems(newItems);
  };

  const addSvgTest = () => {
    const newItem: ContentItem = {
      id: `svg-test-${Date.now()}`,
      type: 'image',
      src: 'test/test.svg',
      alt: 'Nouveau SVG de test',
      content: 'SVG ajouté dynamiquement'
    };
    setItems([...items, newItem]);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Test d'affichage SVG dans DraggableItem
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Cette page teste l'affichage des images SVG dans le composant DraggableItem.
          Les SVG doivent s'afficher correctement avec le bon type MIME et les bons styles.
        </Typography>
      </Paper>

      <Button 
        variant="outlined" 
        onClick={addSvgTest}
        sx={{ mb: 2 }}
      >
        Ajouter un test SVG
      </Button>

      <DragDropContext onDragEnd={() => {}}>
        <Droppable droppableId="test-svg-list">
          {(provided) => (
            <Box
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {items.map((item, index) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  index={index}
                  moveItem={moveItem}
                  removeItem={removeItem}
                  updateItem={updateItem}
                />
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
      
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tests à vérifier :
        </Typography>
        <ul>
          <li>Les SVG s'affichent-ils correctement ?</li>
          <li>Y a-t-il des erreurs dans la console ?</li>
          <li>Le bon type MIME est-il utilisé ?</li>
          <li>Les SVG se chargent-ils via l'API media ?</li>
        </ul>
      </Paper>
    </Box>
  );
}
