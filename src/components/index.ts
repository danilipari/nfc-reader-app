/**
 * Material Design 3 Components
 * 
 * A collection of Vue 3 components following Material Design 3 principles.
 * All components are built with TypeScript, accessibility, and theming support.
 */

export { default as MaterialCard } from './MaterialCard.vue'
export { default as MaterialButton } from './MaterialButton.vue'
export { default as MaterialChip } from './MaterialChip.vue'
export { default as StatusDisplay } from './StatusDisplay.vue'
export { default as ActionGrid } from './ActionGrid.vue'
export { default as LoadingState } from './LoadingState.vue'
export { default as ErrorDisplay } from './ErrorDisplay.vue'
export { default as HeroSection } from './HeroSection.vue'

export type MaterialCardProps = {
  variant?: 'elevated' | 'filled' | 'outlined'
  clickable?: boolean
  disabled?: boolean
}

export type MaterialButtonProps = {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal' | 'fab'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
}

export type MaterialChipProps = {
  variant?: 'assist' | 'filter' | 'input' | 'suggestion'
  selected?: boolean
  disabled?: boolean
  clickable?: boolean
  removable?: boolean
  ariaLabel?: string
}

export type StatusDisplayProps = {
  status?: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'neutral'
  title?: string
  message?: string
  details?: Array<{ label: string; value: string }>
  dismissible?: boolean
  dismissLabel?: string
  variant?: 'banner' | 'card' | 'inline'
}

export type ActionGridProps = {
  actions: Array<{
    id?: string
    label: string
    icon?: string | object
    variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal' | 'fab'
    size?: 'small' | 'medium' | 'large'
    disabled?: boolean
    loading?: boolean
    ariaLabel?: string
    action?: string | (() => void)
  }>
  columns?: 1 | 2 | 3 | 4 | 'auto'
  gap?: 'small' | 'medium' | 'large'
  alignment?: 'start' | 'center' | 'end' | 'stretch'
  loading?: boolean
  responsive?: boolean
}

export type LoadingStateProps = {
  type?: 'spinner' | 'skeleton' | 'linear' | 'dots' | 'pulse'
  size?: 'small' | 'medium' | 'large'
  title?: string
  message?: string
  progress?: number
  showProgress?: boolean
  showActions?: boolean
  variant?: 'default' | 'overlay' | 'inline'
  color?: 'primary' | 'secondary' | 'surface'
}

export type ErrorDisplayProps = {
  type?: 'general' | 'network' | 'validation' | 'permission' | 'timeout' | 'nfc'
  title?: string
  message?: string
  details?: string | object
  suggestions?: string[]
  retryable?: boolean
  dismissible?: boolean
  variant?: 'banner' | 'card' | 'inline'
  severity?: 'error' | 'warning' | 'info'
  retryLabel?: string
  dismissLabel?: string
  detailsLabel?: string
  suggestionsLabel?: string
}

export type HeroSectionProps = {
  title?: string
  description?: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'surface' | 'gradient'
  size?: 'compact' | 'medium' | 'large'
  showPattern?: boolean
  centered?: boolean
}
