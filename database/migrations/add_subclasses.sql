-- Add nbre_subclasses field to classes table
ALTER TABLE classes
ADD COLUMN nbre_subclasses INT NULL;

-- Add sub_class field to class_students table
ALTER TABLE class_students
ADD COLUMN sub_class INT NULL;

-- Create index on sub_class for better performance
CREATE INDEX idx_class_students_sub_class ON class_students (sub_class);
