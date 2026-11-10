/**
 * FarmVerse 5-Phase Registration Types
 */

export type FarmVerseRole =
  | 'FARM_OWNER'
  | 'FARM_MANAGER'
  | 'FARMER'
  | 'FIELD_WORKER'

export interface RoleOption {
  id: FarmVerseRole
  titleKey: string
  descKey: string
  badgeKey: string
}

export const FARMVERSE_ROLES: RoleOption[] = [
  {
    id: 'FARM_OWNER',
    titleKey: 'roleOwnerTitle',
    descKey: 'roleOwnerDesc',
    badgeKey: 'roleOwnerBadge',
  },
  {
    id: 'FARM_MANAGER',
    titleKey: 'roleManagerTitle',
    descKey: 'roleManagerDesc',
    badgeKey: 'roleManagerBadge',
  },
  {
    id: 'FARMER',
    titleKey: 'roleFarmerTitle',
    descKey: 'roleFarmerDesc',
    badgeKey: 'roleFarmerBadge',
  },
  {
    id: 'FIELD_WORKER',
    titleKey: 'roleWorkerTitle',
    descKey: 'roleWorkerDesc',
    badgeKey: 'roleWorkerBadge',
  },
]

export interface Phase1AccountData {
  fullName: string
  email: string
  mobileNumber: string
  password: string
  confirmPassword: string
}

export interface Phase2RoleData {
  selectedRole: FarmVerseRole | null
}

export interface Phase3FarmData {
  farmOrOrgName: string
  state: string
  district: string
  villageOrLocation: string
  farmSize: string
  farmSizeUnit: 'acre' | 'hectare'
  ownershipOrScope: string
}

export interface Phase4ProfessionalData {
  organizationName: string
  designation: string
  specialization: string
  experienceYears: string
  alternateContact: string
  preferredCommunication: 'whatsapp' | 'email' | 'phone'
}

export interface RegistrationFormData {
  account: Phase1AccountData
  role: Phase2RoleData
  farm: Phase3FarmData
  professional: Phase4ProfessionalData
  agreedToTerms: boolean
}

export type RegistrationPhase = 1 | 2 | 3 | 4 | 5
