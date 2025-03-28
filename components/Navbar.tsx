'use client';

import React from 'react';
import { AppBar, Toolbar } from '@mui/material';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';

const Navbar = () => {
  return (
    <AppBar position="sticky">
      <Toolbar>
        {/* Ajouter le ThemeSwitcher dans votre navbar */}
        <ThemeSwitcher />
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;