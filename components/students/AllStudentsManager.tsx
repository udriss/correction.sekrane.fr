import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Chip,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  SelectChangeEvent,
  Alert
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import LinkIcon from '@mui/icons-material/Link';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import StudentEditDialog from './StudentEditDialog';
import BatchStudentForm from './BatchStudentForm';
import { Student, Class } from '@/app/students/page';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed';
import GradientBackground from '@/components/ui/GradientBackground';



interface AllStudentsManagerProps {
  students: Student[];
  classes: Class[];
  loading: boolean;
  onStudentUpdate: () => void;
  onError: (message: string) => void;
}

// Interface for BatchStudent that matches the one in BatchStudentForm
interface BatchStudent {
  first_name: string;
  last_name: string;
  email?: string;
  gender: 'M' | 'F' | 'N';
  sub_class?: number | null;
}

const AllStudentsManagerNEW: React.FC<AllStudentsManagerProps> = ({
  students,
  classes,
  loading,
  onStudentUpdate,
  onError
}) => {
  // Local states for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState(0);
  const [filterClass, setFilterClass] = useState<number | 'all'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Student>('last_name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  
  // States for student management
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<{id: number, name: string}[]>([]);
  const [availableSubgroups, setAvailableSubgroups] = useState<string[]>([]);
  const [loadingSubgroups, setLoadingSubgroups] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  
  // State for batch form
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<null | {id: number, name: string, nbre_subclasses?: number}>(null);

  const router = useRouter();



  // Filter students based on criteria
  const filteredStudents = students
    .filter(student => {
      // Filter by search term
      if (searchTerm && 
          !(student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      
      // Filter by tab (with/without corrections)
      if (filterTab === 1 && (!student.corrections_count || student.corrections_count <= 0)) {
        return false; // "With Corrections" tab
      } else if (filterTab === 2 && (student.corrections_count && student.corrections_count > 0)) {
        return false; // "Without Correction" tab
      }

      // Filter by class - check in allClasses array if available, otherwise fallback to classId
      if (filterClass !== 'all') {
        if (student.allClasses) {
          return student.allClasses.some((cls: {classId: number}) => cls.classId === filterClass);
        } else {
          return student.classId === filterClass;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by selected property
      const valueA = a[orderBy] || '';
      const valueB = b[orderBy] || '';
      
      if (order === 'asc') {
        return valueA < valueB ? -1 : 1;
      } else {
        return valueA > valueB ? -1 : 1;
      }
    });

  // Pagination
  const paginatedStudents = filteredStudents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Event handlers for filters
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setFilterTab(newValue);
    setPage(0); // Reset pagination when changing tabs
  };

  // Class filter change handler with subgroup info retrieval
  const handleClassFilterChange = (event: SelectChangeEvent<number | 'all'>) => {
    const newValue = event.target.value as number | 'all';
    setFilterClass(newValue);
    
    // If a class is selected, fetch its information
    if (newValue !== 'all') {
      fetch(`/api/classes/${newValue}`)
        .then(response => response.json())
        .then(data => {
          const classData = classes.find(c => c.id === newValue);
          if (classData) {
            setSelectedClass({
              id: classData.id,
              name: classData.name,
              nbre_subclasses: data.nbre_subclasses || 0
            });
          }
        })
        .catch(error => {
          console.error('Error fetching class details:', error);
        });
    } else {
      setSelectedClass(null);
    }
    
    setPage(0); // Reset pagination when changing class
  };

  // Table handlers
  const handleRequestSort = (property: keyof Student) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterTab(0);
    setFilterClass('all');
    setPage(0);
  };

  // Delete handlers
  const handleDeleteClick = (studentId: number) => {
    setConfirmingDelete(studentId);
  };

  const handleCancelDelete = () => {
    setConfirmingDelete(null);
  };

  const handleConfirmDelete = async (studentId: number) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting student');
      }

      onStudentUpdate(); // Refresh student list
      setConfirmingDelete(null);
    } catch (err) {
      console.error('Error:', err);
      onError('Error deleting student');
      setConfirmingDelete(null);
    }
  };

  // Edit handlers
  const fetchClassSubgroups = async (classId: number) => {
    try {
      setLoadingSubgroups(true);
      const response = await fetch(`/api/classes/${classId}`);
      
      if (!response.ok) {
        throw new Error('Error loading class data');
      }
      
      const classData = await response.json();

      
      // If the class has a defined number of subclasses
      if (classData.nbre_subclasses) {
        const groups = Array.from({ length: classData.nbre_subclasses }, (_, i) => (i + 1).toString());
        setAvailableSubgroups(groups);
      } else {
        setAvailableSubgroups([]);
      }
    } catch (error) {
      console.error('Error loading subgroups:', error);
      setAvailableSubgroups([]);
    } finally {
      setLoadingSubgroups(false);
    }
  };

  const handleEditClick = async (student: Student) => {
    setEditingStudent(student);
    setEditError(null);
    
    try {
      // Get all classes for the student
      const studentClassesResponse = await fetch(`/api/students/${student.id}/classes`);
      
      if (studentClassesResponse.ok) {
        const allStudentClasses = await studentClassesResponse.json();
        
        // Map classes to the format expected by the Autocomplete component
        const mappedClasses = allStudentClasses.map((cls: any) => ({
          id: cls.id,
          name: cls.name
        }));
        
        setSelectedClasses(mappedClasses);
        
        // If the student has a main class, retrieve its subgroups
        if (student.classId) {
          fetchClassSubgroups(student.classId);
        }
      } else {
        // Fallback if we can't retrieve all classes
        if (student.classId) {
          const studentClass = classes.find(c => c.id === student.classId);
          if (studentClass) {
            setSelectedClasses([{ id: studentClass.id, name: studentClass.name }]);
            fetchClassSubgroups(student.classId);
          } else {
            setSelectedClasses([]);
          }
        } else {
          setSelectedClasses([]);
        }
      }
    } catch (error) {
      console.error('Error retrieving student classes:', error);
      // Fallback in case of error
      if (student.classId) {
        const studentClass = classes.find(c => c.id === student.classId);
        if (studentClass) {
          setSelectedClasses([{ id: studentClass.id, name: studentClass.name }]);
        } else {
          setSelectedClasses([]);
        }
      } else {
        setSelectedClasses([]);
      }
    }
    
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setEditingStudent(null);
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editingStudent || !editingStudent.id) return;
    setEditError(null);
    
    try {
      // Explicitly format each field to ensure they are correctly sent
      const studentData = {
        id: editingStudent.id,
        first_name: editingStudent.first_name,
        last_name: editingStudent.last_name,
        email: editingStudent.email,
        gender: editingStudent.gender || 'N',
        classId: selectedClasses.length > 0 ? selectedClasses[0].id : null,
        group: editingStudent.group || null,
      };
      
      
      
      // 1. Update student basic information
      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Error during update');
        } catch (e) {
          throw new Error(`Error ${response.status}: ${errorText || 'Unknown error'}`);
        }
      }
      
      const updatedStudent = await response.json();
      
      
      // 2. Class association management - first update the main class
      if (studentData.classId) {
        const updateClassResponse = await fetch(`/api/classes/${studentData.classId}/students/${editingStudent.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sub_class: studentData.group
          }),
        });
        
        if (!updateClassResponse.ok) {
          console.warn('Warning: Group update failed');
        }
      }
      
      // 3. Handle additional classes
      // Get current classes
      const currentClassesResponse = await fetch(`/api/students/${editingStudent.id}/classes`);
      if (currentClassesResponse.ok) {
        const currentClasses = await currentClassesResponse.json();
        
        // For each selected class
        for (const selectedClass of selectedClasses) {
          const classExists = currentClasses.some((c: any) => c.id === selectedClass.id);
          
          if (!classExists) {
            // Add the student to this class if not already there
            await fetch(`/api/classes/${selectedClass.id}/students`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                student_id: editingStudent.id,
                first_name: editingStudent.first_name,
                last_name: editingStudent.last_name,
                email: editingStudent.email,
                gender: editingStudent.gender || 'N',
                sub_class: selectedClass.id === studentData.classId ? studentData.group : null
              }),
            });
          } else if (selectedClass.id === studentData.classId && studentData.group) {
            // Update the subgroup if it's the main class
            await fetch(`/api/classes/${selectedClass.id}/students/${editingStudent.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sub_class: studentData.group
              }),
            });
          }
        }
        
        // Remove the student from unselected classes
        for (const currentClass of currentClasses) {
          if (!selectedClasses.some(c => c.id === currentClass.id)) {
            try {
              await fetch(`/api/classes/${currentClass.id}/students/${editingStudent.id}`, {
                method: 'DELETE',
              });
            } catch (error) {
              console.error(`Error removing student from class ${currentClass.id}:`, error);
            }
          }
        }
      }
      
      // Close dialog and refresh data
      setOpenEditDialog(false);
      setEditingStudent(null);
      setSelectedClasses([]);
      onStudentUpdate();
      
    } catch (err) {
      console.error('Error during update:', err);
      setEditError(`Update error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // BatchStudentForm integration handlers
  const handleOpenBatchForm = () => {
    // If a class filter is active, use this class by default
    if (filterClass !== 'all') {
      const classData = classes.find(c => c.id === filterClass);
      if (classData) {
        // Get number of subclasses for selected class
        fetch(`/api/classes/${filterClass}`)
          .then(response => response.json())
          .then(data => {
            setSelectedClass({
              id: classData.id,
              name: classData.name,
              nbre_subclasses: data.nbre_subclasses || 0
            });
          })
          .catch(error => {
            console.error('Error getting class details:', error);
          });
      }
    }
    
    setShowBatchForm(true);
  };

  const handleAddBatchStudents = async (batchStudents: BatchStudent[]) => {
    try {
      // Prepare data for API
      const classId = selectedClass?.id || (filterClass === 'all' ? null : filterClass);
      
      // Add each student through the API
      for (const student of batchStudents) {
        const studentData = {
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email || '',
          gender: student.gender || 'N',
          classId: classId,
          group: student.sub_class ? student.sub_class.toString() : null
        };
        
        // Add student to database
        const response = await fetch('/api/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studentData),
        });
        
        if (!response.ok) {
          throw new Error(`Error adding student ${student.first_name} ${student.last_name}`);
        }
      }
      
      // Refresh data after successful addition
      onStudentUpdate();
    } catch (err: any) {
      console.error('Error during batch addition:', err);
      throw err;
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        mb: 4,
        overflow: 'hidden',
        borderRadius: '8px'
      }}
    >
      {/* Header */}
      <GradientBackground variant="primary">
        <Box sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="large" color='primary' />
              <Box>
                <Typography variant="h5" component="h2" color='textPrimary' sx={{ fontWeight: 'bold', }}>
                    {filterClass === 'all' 
                    ? (filteredStudents.length === 1 ? '1 étudiant' : `${filteredStudents.length} étudiants trouvés`)
                    : (filteredStudents.length === 1 
                      ? `1 étudiant de la classe ${classes.find(c => c.id === filterClass)?.name || ''}` 
                      : `${filteredStudents.length} étudiants de la classe ${classes.find(c => c.id === filterClass)?.name || ''}`)}
                </Typography>
              </Box>
            </Box>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PersonAddIcon />}
                onClick={handleOpenBatchForm}
                sx={{
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  background: (theme) => theme.gradients.secondary,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                    background: (theme) => theme.gradients.secondary,
                    filter: 'brightness(1.3)',
                  }
                }}
              >
                Plus d'étudiants
              </Button>
          </Box>
        </Box>
      </GradientBackground>

      <Divider />

      {/* Batch student form */}
      {showBatchForm && (
        <BatchStudentForm
          onClose={() => setShowBatchForm(false)}
          onAddStudents={handleAddBatchStudents}
          classData={selectedClass}
          currentFilter={filterClass !== 'all' ? classes.find(c => c.id === filterClass)?.name : null}
        />
      )}
      
      {/* Filters */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            placeholder="Rechercher des étudiants ..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Class</InputLabel>
            <Select
              value={filterClass}
              onChange={handleClassFilterChange}
              label="Classes"
            >
              <MenuItem value="all">Tout</MenuItem>
              {classes.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    {cls.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {searchTerm || filterClass !== 'all' || filterTab !== 0 ? (
            <Button
              size="small"
              variant="outlined"
              onClick={handleResetFilters}
              startIcon={<CloseIcon />}
            >
              Rétablir
            </Button>
          ) : null}
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={filterTab} onChange={handleTabChange}>
            <Tab label="Tout" />
            <Tab label="Avec correction" />
            <Tab label="Sans correction" />
          </Tabs>
        </Box>
      </Box>
      
      {/* Students table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, maxWidth: '400px', mx: 'auto' }}>
          <LoadingSpinner size="md" text="Chargement des étudiants" />
        </Box>
      ) : filteredStudents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <SearchIcon fontSize="large" color="disabled" />
          <Typography variant="h6" color="textSecondary" sx={{ mt: 1 }}>
            No students match your search
          </Typography>
          <Button 
            onClick={handleResetFilters}
            variant="outlined"
            sx={{ mt: 2 }}
          >
            Rétablir filtres
          </Button>
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table aria-label="students table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'last_name'}
                      direction={orderBy === 'last_name' ? order : 'asc'}
                      onClick={() => handleRequestSort('last_name')}
                    >
                      Nom
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'first_name'}
                      direction={orderBy === 'first_name' ? order : 'asc'}
                      onClick={() => handleRequestSort('first_name')}
                    >
                      Prénom
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'className'}
                      direction={orderBy === 'className' ? order : 'asc'}
                      onClick={() => handleRequestSort('className')}
                    >
                      Classe(s)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Groupe(s)</TableCell>
                  <TableCell>Corrections</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStudents.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                        sx={{ 
                          width: 28, 
                          height: 28, 
                          bgcolor: student.gender === 'M' ? 'info.main' : student.gender === 'F' ? 'secondary.main' : 'grey.500',
                          fontSize: '1.5rem',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                        }}
                        >
                        {student.gender === 'M' ? <MaleIcon fontSize="medium" /> : 
                          student.gender === 'F' ? <FemaleIcon fontSize="medium" /> : 
                          student.gender === 'N' ? <GpsNotFixedIcon fontSize="small" /> : 
                          <NotInterestedIcon fontSize="medium" />}
                        </Avatar>
                        <span>{student.last_name}</span>
                      </Box>
                    </TableCell>
                    <TableCell>{student.first_name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {student.className && (
                          <Chip 
                            size="small" 
                            label={student.className} 
                            sx={{ color: theme => theme.palette.primary.light, cursor: 'default' }}
                            variant="outlined"
                          />
                        )}
                        {student.additionalClasses?.map((cls) => (
                          <Chip 
                            key={cls.id}
                            size="small" 
                            label={cls.name} 
                            variant="outlined"
                            sx={{ color: theme => theme.palette.primary.light, cursor: 'default' }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {student.group && (
                        <Chip 
                          size="small" 
                          label={student.group} 
                          color="info" 
                          variant="outlined"
                          sx={{ cursor: 'default' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {student.corrections_count ? (
                        <Tooltip title="Consulter tous les corrections">
                          <Chip 
                            size="small"
                            label={student.corrections_count}
                            color="success"
                            component={Link}
                            href={`/students/${student.id}`}
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
                          Aucun
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Modifier étudiant">
                          <IconButton
                            size="small"
                            sx={{ color: theme => theme.palette.text.secondary }}
                            onClick={() => handleEditClick(student)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Consulter étudiant">
                          <IconButton
                            size="small"
                            color="info"
                            component={Link}
                            href={`/students/${student.id}`}
                          >
                            <LinkIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {confirmingDelete === student.id ? (
                          <>
                            <Tooltip title="Confirmer la suppression">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleConfirmDelete(student.id!)}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Annuler">
                              <IconButton
                                size="small"
                                color="inherit"
                                onClick={handleCancelDelete}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Tooltip title="Effacer étudiant">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(student.id!)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredStudents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
          />
        </>
      )}
      
      {/* Edit dialog */}
      <StudentEditDialog
        open={openEditDialog}
        student={editingStudent}
        classes={classes}
        selectedClasses={selectedClasses}
        availableSubgroups={availableSubgroups}
        loadingSubgroups={loadingSubgroups}
        onClose={handleEditClose}
        onSave={handleEditSave}
        onStudentChange={setEditingStudent}
        onSelectedClassesChange={setSelectedClasses}
        fetchClassSubgroups={fetchClassSubgroups}
      />

      {/* Display edit errors if necessary */}
      {editError && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{editError}</Alert>
        </Box>
      )}
    </Paper>
  );
};

export default AllStudentsManagerNEW;
