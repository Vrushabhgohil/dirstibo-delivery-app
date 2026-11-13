export const Colors = {
  // Master FMCG Delivery Branding
  primary: '#A8D83D',       // Lime Green (Action & Highlight)
  primaryDark: '#294D32',   // Dark Green (Brand Header & Text)
  primaryLight: '#F1F8E8',  // Light Green (Pill & Background Tint)
  
  // Surfaces & Backgrounds
  background: '#F7F8F5',    // Soft Off-White Application Canvas
  card: '#FFFFFF',          // Clean White Surface
  cardElevated: '#FFFFFF',
  
  // Typography
  text: '#202820',          // Primary Dark Charcoal Green Text
  textSecondary: '#858B83', // Secondary Slate/Muted Text
  textLight: '#A4ABA1',     // Inactive / Placeholder Text
  
  // Dividers & Borders
  border: '#E9EDE5',        // Soft Card & Input Border
  borderSubtle: '#F0F3ED',
  
  // Semantic Indicators
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // Status Colors
  statusAssigned: '#3B82F6',
  statusInTransit: '#F59E0B',
  statusDelivered: '#16A34A',
  statusPartial: '#8B5CF6',
  statusFailed: '#EF4444',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Typography = {
  heading1: { fontSize: 24, fontWeight: '700' as const, color: Colors.text },
  heading2: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  heading3: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 14, fontWeight: '400' as const, color: Colors.text },
  bodyMedium: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  bodyBold: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
  captionBold: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  tiny: { fontSize: 10, fontWeight: '500' as const, color: Colors.textSecondary },
};

