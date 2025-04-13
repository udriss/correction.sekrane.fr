import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  alpha,
  useTheme
} from '@mui/material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TipTapEditor from './TipTapEditor';
import CodeIcon from '@mui/icons-material/Code';
import DeleteIcon from '@mui/icons-material/Delete';

interface ContentEditorProps {
  correction: any;
  activityName?: string;
  activityId?: number;
  studentData?: any;
  studentId?: number;
  classId?: number;
  points_earned?: number[];
}

export default function ContentEditor({
  correction,
  activityName,
  activityId,
  studentData,
  studentId,
  classId,
  points_earned
}: ContentEditorProps) {
  const theme = useTheme();
  const [showHtmlDialog, setShowHtmlDialog] = useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: correction?.content || '<p>Aucun contenu à afficher</p>',
    editable: false,
  });

  const handleShowHTML = useCallback(() => {
    setShowHtmlDialog(true);
  }, []);

  const handleCloseHtmlDialog = () => {
    setShowHtmlDialog(false);
  };

  const handleClear = useCallback(() => {
    editor?.commands.clearContent();
  }, [editor]);

  return (
    <Card sx={{ 
      p: 2, 
      mb: 3, 
      border: '1px solid',
      borderColor: alpha(theme.palette.primary.main, 0.2),
      borderRadius: 2,
      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`
    }}>
      <Typography variant="h6" gutterBottom>
        Contenu de la correction
      </Typography>
      
      <TipTapEditor 
        editor={editor} 
        onClear={handleClear} 
        onShowHTML={handleShowHTML} 
      />

      {/* Dialog pour afficher le HTML */}
      <Dialog open={showHtmlDialog} onClose={handleCloseHtmlDialog} maxWidth="md" fullWidth>
        <DialogTitle>Code HTML</DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 2, maxHeight: '400px', overflow: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {editor?.getHTML()}
            </pre>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHtmlDialog} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}