import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';

import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PeopleIcon from '@mui/icons-material/People';
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`class-tabpanel-${index}`}
      aria-labelledby={`class-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface ClassTabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  children: React.ReactNode;
}

export function ClassTabs({ value, onChange, children }: ClassTabsProps) {
  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={onChange} aria-label="class tabs">
          <Tab label="Activités" icon={<MenuBookIcon />} iconPosition="start" />
          <Tab label="Étudiants" icon={<PeopleIcon />} iconPosition="start" />
          <Tab label="Corrections" icon={<AssignmentTurnedInIcon />} iconPosition="start" />
          <Tab icon={<QrCodeIcon />} label="Export PDF" />
        </Tabs>
      </Box>

      {React.Children.map(children, (child, index) => (
        <TabPanel value={value} index={index}>
          {child}
        </TabPanel>
      ))}
    </>
  );
}