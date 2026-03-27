/**
 * Tutorial Subcategories with Parent Category Mappings (based on your folder tree)
 *
 * Folder tree:
 * Tutorials/
 * ├── WALLET/ (Desktop, Hardware, Mobile, Backup)
 * ├── NODE/ (Bitcoin, Lightning Network, Others)
 * ├── MINING/ (Hardware, Pool)
 * ├── BUSINESS/ (Point-of-Sale, Others)
 * ├── EXCHANGE/ (Peer-to-Peer, Centralized)
 * ├── PRIVACY/ (On-Chain, Analysis)
 * ├── COMPUTER SECURITY/ (Authentication, Communication, Operating System, Data)
 * └── CONTRIBUTION/ (Tutorial, Resource, Others)
 *
 * Structure:
 * - User sees only subcategory in dropdown
 * - Each subcategory maps to a parent category
 * - Parent category determines folder structure
 */

export type TutorialCategory =
  | 'wallet'
  | 'node'
  | 'mining'
  | 'business'
  | 'exchange'
  | 'privacy'
  | 'computer-security'
  | 'contribution';

export interface TutorialSubcategory {
  value: string;           // Internal value (used as ID)
  label: string;           // Display name shown to user
  parentCategory: TutorialCategory; // Parent category for folder structure
  folderName: string;      // Exact folder name to create/use on disk
}

/**
 * Tutorial subcategories organized by parent category.
 * folderName matches the exact subfolder name in your repository structure.
 */
export const tutorialSubcategories: TutorialSubcategory[] = [
  // WALLET
  { value: 'wallet-desktop', label: 'Desktop', parentCategory: 'wallet', folderName: 'Desktop' },
  { value: 'wallet-hardware', label: 'Hardware', parentCategory: 'wallet', folderName: 'Hardware' },
  { value: 'wallet-mobile', label: 'Mobile', parentCategory: 'wallet', folderName: 'Mobile' },
  { value: 'wallet-backup', label: 'Backup', parentCategory: 'wallet', folderName: 'Backup' },

  // NODE
  { value: 'node-bitcoin', label: 'Bitcoin', parentCategory: 'node', folderName: 'Bitcoin' },
  { value: 'node-lightning-network', label: 'Lightning Network', parentCategory: 'node', folderName: 'Lightning Network' },
  { value: 'node-others', label: 'Others', parentCategory: 'node', folderName: 'Others' },

  // MINING
  { value: 'mining-hardware', label: 'Hardware', parentCategory: 'mining', folderName: 'Hardware' },
  { value: 'mining-pool', label: 'Pool', parentCategory: 'mining', folderName: 'Pool' },

  // BUSINESS
  { value: 'business-point-of-sale', label: 'Point-of-Sale', parentCategory: 'business', folderName: 'Point-of-Sale' },
  { value: 'business-others', label: 'Others', parentCategory: 'business', folderName: 'Others' },

  // EXCHANGE
  { value: 'exchange-peer-to-peer', label: 'Peer-to-Peer', parentCategory: 'exchange', folderName: 'Peer-to-Peer' },
  { value: 'exchange-centralized', label: 'Centralized', parentCategory: 'exchange', folderName: 'Centralized' },

  // PRIVACY
  { value: 'privacy-on-chain', label: 'On-Chain', parentCategory: 'privacy', folderName: 'On-Chain' },
  { value: 'privacy-analysis', label: 'Analysis', parentCategory: 'privacy', folderName: 'Analysis' },

  // COMPUTER SECURITY
  { value: 'computer-security-authentication', label: 'Authentication', parentCategory: 'computer-security', folderName: 'Authentication' },
  { value: 'computer-security-communication', label: 'Communication', parentCategory: 'computer-security', folderName: 'Communication' },
  { value: 'computer-security-operating-system', label: 'Operating System', parentCategory: 'computer-security', folderName: 'Operating System' },
  { value: 'computer-security-data', label: 'Data', parentCategory: 'computer-security', folderName: 'Data' },

  // CONTRIBUTION
  { value: 'contribution-tutorial', label: 'Tutorial', parentCategory: 'contribution', folderName: 'Tutorial' },
  { value: 'contribution-resource', label: 'Resource', parentCategory: 'contribution', folderName: 'Resource' },
  { value: 'contribution-others', label: 'Others', parentCategory: 'contribution', folderName: 'Others' },
];

/**
 * Map from parentCategory -> exact top-level folder name
 * (useful when creating the category folder)
 */
export const categoryFolderName: Record<TutorialCategory, string> = {
  'wallet': 'WALLET',
  'node': 'NODE',
  'mining': 'MINING',
  'business': 'BUSINESS',
  'exchange': 'EXCHANGE',
  'privacy': 'PRIVACY',
  'computer-security': 'COMPUTER SECURITY',
  'contribution': 'CONTRIBUTION',
};

/**
 * Get parent category for a given subcategory value
 */
export function getParentCategory(subcategoryValue: string): TutorialCategory | undefined {
  const subcategory = tutorialSubcategories.find(sub => sub.value === subcategoryValue);
  return subcategory?.parentCategory;
}

/**
 * Get exact category folder name (e.g., "WALLET") for a given subcategory value
 */
export function getCategoryFolderName(subcategoryValue: string): string | undefined {
  const parent = getParentCategory(subcategoryValue);
  return parent ? categoryFolderName[parent] : undefined;
}

/**
 * Get exact subcategory folder name (e.g., "Desktop") for a given subcategory value
 */
export function getSubcategoryFolderName(subcategoryValue: string): string | undefined {
  const subcategory = tutorialSubcategories.find(sub => sub.value === subcategoryValue);
  return subcategory?.folderName;
}

/**
 * Get all subcategories for a specific parent category
 */
export function getSubcategoriesByParent(parentCategory: TutorialCategory): TutorialSubcategory[] {
  return tutorialSubcategories.filter(sub => sub.parentCategory === parentCategory);
}

/**
 * Get display label for a subcategory value
 */
export function getSubcategoryLabel(subcategoryValue: string): string | undefined {
  const subcategory = tutorialSubcategories.find(sub => sub.value === subcategoryValue);
  return subcategory?.label;
}

/**
 * Validate if a subcategory value exists
 */
export function isValidSubcategory(subcategoryValue: string): boolean {
  return tutorialSubcategories.some(sub => sub.value === subcategoryValue);
}
