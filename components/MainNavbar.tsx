import React, { useState } from 'react';
import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';

export default function MainNavbar() {
  const [classMenuAnchor, setClassMenuAnchor] = useState<null | HTMLElement>(null);

  const handleClassMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setClassMenuAnchor(event.currentTarget);
  };

  const handleClassMenuClose = () => {
    setClassMenuAnchor(null);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          My Application
        </Typography>
        <Button component={Link} href="/activities/new" color="inherit" sx={{ fontWeight: 500 }}>
          <AddIcon sx={{ fontSize: '1.5rem' }} />
        </Button>
        <Tooltip title="Gestion des classes">
          <IconButton color="inherit" onClick={handleClassMenuOpen} size="large">
            <SchoolIcon sx={{ fontSize: '1.5rem' }} />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={classMenuAnchor}
          open={Boolean(classMenuAnchor)}
          onClose={handleClassMenuClose}
          onClick={handleClassMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem component={Link} href="/classes">
            <ListItemIcon>
              <FormatListBulletedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Liste des classes" />
          </MenuItem>
          <MenuItem component={Link} href="/classes/new">
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Nouvelle classe" />
          </MenuItem>
          <Divider />
          <MenuItem component={Link} href="/classes?view=students">
            <ListItemIcon>
              <PeopleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Gestion des étudiants" />
          </MenuItem>
          <MenuItem component={Link} href="/classes?view=activities">
            <ListItemIcon>
              <MenuBookIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Activités par classe" />
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
