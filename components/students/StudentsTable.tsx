import React from 'react';
import Link from 'next/link';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { Student } from '@/app/students/page';

interface StudentsTableProps {
  students: Student[];
  filteredStudents: Student[];
  paginatedStudents: Student[];
  page: number;
  rowsPerPage: number;
  orderBy: keyof Student;
  order: 'asc' | 'desc';
  confirmingDelete: number | null;
  onRequestSort: (property: keyof Student) => void;
  onChangePage: (event: unknown, newPage: number) => void;
  onChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEditClick: (student: Student) => void;
  onDeleteClick: (studentId: number) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (studentId: number) => void;
  onOpenClassManager: (classId: number) => void;
  onResetFilters: () => void;
}

const StudentsTable: React.FC<StudentsTableProps> = ({
  students,
  filteredStudents,
  paginatedStudents,
  page,
  rowsPerPage,
  orderBy,
  order,
  confirmingDelete,
  onRequestSort,
  onChangePage,
  onChangeRowsPerPage,
  onEditClick,
  onDeleteClick,
  onCancelDelete,
  onConfirmDelete,
  onOpenClassManager,
  onResetFilters
}) => {
  if (students.length === 0) {
    return (
      <Paper className="mb-8">
        <Box textAlign="center" my={8} className="p-8 border border-dashed border-gray-300 rounded-lg">
          <PersonIcon fontSize="large" className="text-gray-400 mb-4" />
          <Typography variant="h6" gutterBottom>
            Aucun étudiant trouvé
          </Typography>
          <Typography variant="body1" color="textSecondary" mb={4} className="max-w-md mx-auto">
            Ajoutez des étudiants pour commencer à gérer vos classes et vos corrections.
          </Typography>
          <Button 
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            component={Link}
            href="/students/new"
            size="large"
            className="shadow-lg"
          >
            Ajouter mon premier étudiant
          </Button>
        </Box>
      </Paper>
    );
  }
  
  if (filteredStudents.length === 0) {
    return (
      <Paper className="p-8 text-center mb-8">
        <SearchIcon fontSize="large" className="text-gray-400 mb-2" />
        <Typography variant="h6" className="mb-2">Aucun étudiant ne correspond à votre recherche</Typography>
        <Button 
          onClick={onResetFilters}
          variant="outlined"
        >
          Réinitialiser les filtres
        </Button>
      </Paper>
    );
  }
  
  return (
    <Paper className="mb-8">
      <TableContainer>
        <Table aria-label="tableau des étudiants">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'last_name'}
                  direction={orderBy === 'last_name' ? order : 'asc'}
                  onClick={() => onRequestSort('last_name')}
                >
                  Nom
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'first_name'}
                  direction={orderBy === 'first_name' ? order : 'asc'}
                  onClick={() => onRequestSort('first_name')}
                >
                  Prénom
                </TableSortLabel>
              </TableCell>
              <TableCell>Email</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'className'}
                  direction={orderBy === 'className' ? order : 'asc'}
                  onClick={() => onRequestSort('className')}
                >
                  Classe
                </TableSortLabel>
              </TableCell>
              <TableCell>Groupe</TableCell>
              <TableCell>Corrections</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedStudents.map((student) => (
              <TableRow key={student.id} hover>
                <TableCell component="th" scope="row">
                  <div className="flex items-center gap-2">
                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                      {student.last_name ? student.last_name.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                    <span>{student.last_name}</span>
                  </div>
                </TableCell>
                <TableCell>{student.first_name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  {student.className && (
                    <Tooltip title="Gérer les étudiants de cette classe">
                      <Chip 
                        size="small" 
                        label={student.className} 
                        color="primary" 
                        variant="outlined"
                        onClick={() => student.classId && onOpenClassManager(student.classId)}
                        clickable
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                            backgroundColor: 'rgba(25, 118, 210, 0.08)'
                          }
                        }}
                      />
                    </Tooltip>
                  )}
                  {/* Afficher les classes additionnelles si disponibles */}
                  {student.additionalClasses && student.additionalClasses.map((cls) => (
                    <Chip 
                      key={cls.id}
                      size="small" 
                      label={cls.name} 
                      color="secondary" 
                      variant="outlined"
                      onClick={() => onOpenClassManager(cls.id)}
                      clickable
                      sx={{ 
                        ml: 0.5,
                        cursor: 'pointer',
                        '&:hover': { 
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          backgroundColor: 'rgba(156, 39, 176, 0.08)'
                        }
                      }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  {student.group && (
                    <Chip 
                      size="small" 
                      label={student.group} 
                      color="secondary" 
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {student.corrections_count ? (
                    <Tooltip title="Voir les corrections de cet étudiant">
                      <Chip 
                        size="small"
                        label={student.corrections_count}
                        color="success"
                        component={Link}
                        href={`/students/${student.id}/corrections`}
                        clickable
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                            backgroundColor: 'rgba(46, 125, 50, 0.08)'
                          }
                        }}
                      />
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onEditClick(student)}
                      title="Modifier"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    
                    {confirmingDelete === student.id ? (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => onConfirmDelete(student.id!)}
                          title="Confirmer la suppression"
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="inherit"
                          onClick={onCancelDelete}
                          title="Annuler la suppression"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteClick(student.id!)}
                        title="Supprimer"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredStudents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onChangePage}
        onRowsPerPageChange={onChangeRowsPerPage}
        labelRowsPerPage="Lignes par page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
      />
    </Paper>
  );
};

export default StudentsTable;
