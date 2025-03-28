import { Editor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box, IconButton, ToggleButton, ToggleButtonGroup, Divider, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CodeIcon from '@mui/icons-material/Code';
import DeleteIcon from '@mui/icons-material/Delete';

interface TipTapEditorProps {
  editor: Editor | null;
  onClear: () => void;
  onShowHTML: () => void;
}

export default function TipTapEditor({ editor, onClear, onShowHTML }: TipTapEditorProps) {
  if (!editor) return null;

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup size="small">
            <ToggleButton
              value="bold"
              selected={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <FormatBoldIcon />
            </ToggleButton>
            <ToggleButton
              value="italic"
              selected={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <FormatItalicIcon />
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          <ToggleButtonGroup size="small">
            <ToggleButton
              value="bulletList"
              selected={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <FormatListBulletedIcon />
            </ToggleButton>
            <ToggleButton
              value="orderedList"
              selected={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <FormatListNumberedIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Effacer le contenu">
            <IconButton size="small" onClick={onClear} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Voir le code HTML">
            <IconButton size="small" onClick={onShowHTML}>
              <CodeIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ 
        p: 2,
        '& .ProseMirror': {
          minHeight: '300px',
          outline: 'none',
          'p': {
            margin: '0 0 1em 0'
          },
          'ul,ol': {
            marginBottom: '1em',
            paddingLeft: '1.5em',
            li: {
              marginBottom: '0.5em'
            }
          }
        }
      }}>
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
