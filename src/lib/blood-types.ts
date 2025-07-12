export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
] as const;

export type BloodType = typeof BLOOD_TYPES[number];

export const URGENCY_LEVELS = {
  CRITICAL: 'critical',
  URGENT: 'urgent', 
  STANDARD: 'standard'
} as const;

export type UrgencyLevel = typeof URGENCY_LEVELS[keyof typeof URGENCY_LEVELS];

// Blood compatibility matrix - who can receive from whom
export const bloodCompatibility: Record<BloodType, BloodType[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal receiver
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'] // Can only receive O-
};

// Who can donate to whom
export const canDonateTo: Record<BloodType, BloodType[]> = {
  'A+': ['A+', 'AB+'],
  'A-': ['A+', 'A-', 'AB+', 'AB-'],
  'B+': ['B+', 'AB+'],
  'B-': ['B+', 'B-', 'AB+', 'AB-'],
  'AB+': ['AB+'],
  'AB-': ['AB+', 'AB-'],
  'O+': ['A+', 'B+', 'AB+', 'O+'],
  'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] // Universal donor
};

export function getCompatibleDonors(patientBloodType: BloodType): BloodType[] {
  return bloodCompatibility[patientBloodType];
}

export function canDonateToPatient(donorBloodType: BloodType, patientBloodType: BloodType): boolean {
  return canDonateTo[donorBloodType].includes(patientBloodType);
}

export function getUrgencyColor(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'critical': return 'var(--danger)';
    case 'urgent': return 'var(--warning)';
    case 'standard': return 'var(--primary)';
    default: return 'var(--text-secondary)';
  }
}

export function getUrgencyRadius(urgency: UrgencyLevel): number {
  switch (urgency) {
    case 'critical': return 5;  // 5km
    case 'urgent': return 10;   // 10km
    case 'standard': return 20; // 20km
    default: return 10;
  }
}