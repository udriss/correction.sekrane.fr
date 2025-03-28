import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	List,
	ListItemIcon,
	Checkbox,
	ListItemText,
	ListItemButton,
	Typography
} from '@mui/material';

export interface Activity {
	id: number;
	name: string;
	experimental_points: number;
	theoretical_points: number;
}

interface AssociateActivitiesModalProps {
	open: boolean;
	availableActivities: Activity[];
	currentActivities: Activity[]; // Added this prop to know which activities are already associated
	onClose: () => void;
	onAssociate: (selectedActivities: Activity[], activitiesToRemove: Activity[]) => void; // Modified to also return activities to remove
}

export default function AssociateActivitiesModal({
	open,
	availableActivities,
	currentActivities,
	onClose,
	onAssociate
}: AssociateActivitiesModalProps) {
	// Initialize with IDs of activities already associated with the class
	const [selected, setSelected] = useState<number[]>([]);
	const [initialSelectedIds, setInitialSelectedIds] = useState<number[]>([]);
	
	// Reset selection when the modal opens or when currentActivities changes
	useEffect(() => {
		if (open) {
			const currentActivityIds = currentActivities.map(a => a.id);
			setSelected(currentActivityIds);
			setInitialSelectedIds(currentActivityIds);
		}
	}, [open, currentActivities]);

	const handleToggle = (id: number) => {
		setSelected(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
	};

	const handleAssociate = () => {
		// Find activities to add (selected but not in initialSelectedIds)
		const activitiesToAdd = availableActivities.filter(
			activity => selected.includes(activity.id) && !initialSelectedIds.includes(activity.id)
		);
		
		// Find activities to remove (in initialSelectedIds but not in selected)
		const activitiesToRemove = currentActivities.filter(
			activity => initialSelectedIds.includes(activity.id) && !selected.includes(activity.id)
		);
		
		onAssociate(activitiesToAdd, activitiesToRemove);
		// Don't reset selected here as the parent component will close the modal
	};

	return (
		<Dialog open={open} onClose={onClose} fullWidth>
			<DialogTitle>Gérer les activités associées</DialogTitle>
			<DialogContent>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					Sélectionnez les activités à associer à cette classe. Les activités déjà associées sont cochées.
					Décochez-les pour les retirer de la classe.
				</Typography>
				<List>
					{availableActivities.map(activity => (
						<ListItemButton key={activity.id} onClick={() => handleToggle(activity.id)}>
							<ListItemIcon>
								<Checkbox
									edge="start"
									checked={selected.includes(activity.id)}
									tabIndex={-1}
									disableRipple
								/>
							</ListItemIcon>
							<ListItemText
								primary={activity.name}
								secondary={`Points: Exp: ${activity.experimental_points}, Théo: ${activity.theoretical_points}`}
								/>
							{initialSelectedIds.includes(activity.id) && (
								<Typography variant="caption" color="primary" sx={{ ml: 1 }}>
									Associée
								</Typography>
							)}
						</ListItemButton>
					))}
				</List>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Annuler</Button>
				<Button 
					onClick={handleAssociate} 
					variant="contained"
					disabled={
						// Disable if no changes made (both add/remove lists empty)
						selected.length === initialSelectedIds.length && 
						selected.every(id => initialSelectedIds.includes(id))
					}
				>
					Appliquer les changements
				</Button>
			</DialogActions>
		</Dialog>
	);
}
