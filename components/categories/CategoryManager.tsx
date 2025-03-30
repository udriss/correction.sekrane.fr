'use client';

import React, { useState } from 'react';
import { Snackbar } from '@mui/material';
import { CategoryManagementDialog, DeleteCategoryDialog } from './CategoryDialog';

interface Category {
  id: number;
  name: string;
}

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export default function CategoryManager({ 
  categories, 
  onCategoriesChange, 
  dialogOpen, 
  setDialogOpen 
}: CategoryManagerProps) {
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null);
  const [categoryDeleteSuccess, setCategoryDeleteSuccess] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const handleCloseCategoryDialog = () => {
    setDialogOpen(false);
  };

  const handleAddCategory = async (categoryName: string) => {
    setIsAddingCategory(true);
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la catégorie');
      }
      
      const newCategory = await response.json();
      const updatedCategories = [...categories, newCategory];
      onCategoriesChange(updatedCategories);
      
      setNotification({
        open: true,
        message: `Catégorie "${categoryName}" ajoutée avec succès`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error creating category:', error);
      
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Problème lors de la création de la catégorie'}`,
        severity: 'error'
      });
    } finally {
      setIsAddingCategory(false);
    }
  };

  const openDeleteCategoryDialog = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteWarning(true);
    setCategoryDeleteError(null);
    setCategoryDeleteSuccess(false);
  };
  
  const handleCloseDeleteCategoryDialog = () => {
    setShowDeleteWarning(false);
    setCategoryToDelete(null);
    setCategoryDeleteSuccess(false);
    setCategoryDeleteError(null);
  };
  
  const handleDeleteCategory = async (category: Category) => {
    setIsDeletingCategory(true);
    setCategoryDeleteError(null);
    setCategoryDeleteSuccess(false);
    
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression de la catégorie');
      }
      
      // Update categories list by removing the deleted category
      const updatedCategories = categories.filter(cat => cat.id !== category.id);
      onCategoriesChange(updatedCategories);
      
      setCategoryDeleteSuccess(true);
      
      setNotification({
        open: true,
        message: `Catégorie "${category.name}" supprimée avec succès`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setCategoryDeleteError(error.message || 'Erreur lors de la suppression de la catégorie');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  return (
    <>
      <CategoryManagementDialog
        open={dialogOpen}
        onClose={handleCloseCategoryDialog}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={openDeleteCategoryDialog}
        isAddingCategory={isAddingCategory}
      />
      
      <DeleteCategoryDialog
        open={showDeleteWarning}
        categoryToDelete={categoryToDelete}
        onClose={handleCloseDeleteCategoryDialog}
        onDelete={handleDeleteCategory}
        isDeletingCategory={isDeletingCategory}
        deleteError={categoryDeleteError}
        deleteSuccess={categoryDeleteSuccess}
      />
      
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        message={notification.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
