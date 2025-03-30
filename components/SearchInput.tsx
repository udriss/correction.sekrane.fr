import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchInputProps {
  placeholder?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  minLength?: number;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Rechercher...',
  size = 'medium',
  fullWidth = false,
  variant = 'outlined',
  minLength = 2,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchTerm.length >= minLength) {
      router.push(`/recherche?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <Box component="form" onSubmit={handleSearch} className={className}>
      <TextField
        placeholder={placeholder}
        size={size}
        fullWidth={fullWidth}
        variant={variant}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm.length >= minLength && (
            <InputAdornment position="end">
              <IconButton type="submit" edge="end">
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    </Box>
  );
};

export default SearchInput;
