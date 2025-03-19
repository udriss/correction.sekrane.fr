import React from 'react';
import Link from 'next/link';
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Box 
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';

interface CenteredNavbarProps {
  currentPath?: string;
}

export default function CenteredNavbar({ currentPath = '' }: CenteredNavbarProps) {
  return (
    <Box className="flex justify-center w-full">
      <AppBar 
        position="static" 
        color="primary" 
        elevation={3}
        className="w-full max-w-[600px] rounded-bl-2xl rounded-br-2xl"
        sx={{ 
          borderBottomLeftRadius: '16px', 
          borderBottomRightRadius: '16px',
          overflow: 'hidden'
        }}
      >
        <Toolbar className="justify-center">
          <Box className="flex space-x-2">
            <Button
              component={Link}
              href="/"
              color="inherit"
              startIcon={<HomeIcon />}
              variant={currentPath === '/' ? 'outlined' : 'text'}
              className="text-white"
            >
              Accueil
            </Button>

            <Button
              component={Link}
              href="/activities/new"
              color="inherit"
              startIcon={<AddIcon />}
              variant={currentPath.includes('/activities/new') ? 'outlined' : 'text'}
              className="text-white"
            >
              Nouvelle Activité
            </Button>

            <Button
              component={Link}
              href="/corrections"
              color="inherit"
              startIcon={<AssignmentIcon />}
              variant={currentPath.includes('/corrections') ? 'outlined' : 'text'}
              className="text-white"
            >
              Corrections
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
