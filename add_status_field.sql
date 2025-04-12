
-- Add 'status' column to corrections table
ALTER TABLE corrections 
ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE' COMMENT 'Status of the correction: ACTIVE, DEACTIVATED, NON_RENDU, ABSENT';

-- Update existing records to set status based on active field
UPDATE corrections 
SET status = CASE
    WHEN active = 1 THEN 'ACTIVE'
    WHEN active = 0 THEN 'DEACTIVATED'
    ELSE 'ACTIVE'
END;

