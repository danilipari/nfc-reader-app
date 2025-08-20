<template>
  <div
    :class="chipClasses"
    :role="clickable ? 'button' : 'status'"
    :tabindex="clickable ? '0' : undefined"
    :aria-pressed="clickable && selected ? 'true' : 'false'"
    :aria-label="ariaLabel"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <span v-if="$slots.avatar" class="md-chip__avatar">
      <slot name="avatar" />
    </span>
    
    <span v-if="$slots.icon" class="md-chip__icon">
      <slot name="icon" />
    </span>
    
    <span class="md-chip__label">
      <slot />
    </span>
    
    <button
      v-if="removable"
      class="md-chip__remove"
      aria-label="Remove chip"
      @click.stop="handleRemove"
    >
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'assist' | 'filter' | 'input' | 'suggestion'
  selected?: boolean
  disabled?: boolean
  clickable?: boolean
  removable?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'assist',
  selected: false,
  disabled: false,
  clickable: true,
  removable: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  remove: [event: MouseEvent]
}>()

const chipClasses = computed(() => [
  'md-chip',
  `md-chip--${props.variant}`,
  {
    'md-chip--selected': props.selected,
    'md-chip--disabled': props.disabled,
    'md-chip--clickable': props.clickable
  }
])

const handleClick = (event: MouseEvent) => {
  if (props.disabled || !props.clickable) return
  emit('click', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled || !props.clickable) return
  
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('click', event as unknown as MouseEvent)
  }
}

const handleRemove = (event: MouseEvent) => {
  if (props.disabled) return
  emit('remove', event)
}
</script>

<style scoped>
.md-chip {
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-surface: #1d1b20;
  --md-sys-color-surface-variant: #e7e0ec;
  --md-sys-color-on-surface-variant: #49454f;
  --md-sys-color-outline: #79747e;
  --md-sys-color-secondary-container: #e8def8;
  --md-sys-color-on-secondary-container: #1d192b;
  
  /* Success/Error colors */
  --md-chip-success: #00c853;
  --md-chip-error: #ba1a1a;
  --md-chip-warning: #ff9800;
  
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 16px;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 16px;
  background-color: transparent;
  color: var(--md-sys-color-on-surface-variant);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1px;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  overflow: hidden;
}

/* Variant styles */
.md-chip--assist {
  background-color: var(--md-sys-color-surface-variant);
  border-color: transparent;
}

.md-chip--filter {
  border-color: var(--md-sys-color-outline);
}

.md-chip--filter.md-chip--selected {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  border-color: transparent;
}

.md-chip--input {
  background-color: var(--md-sys-color-surface-variant);
  border-color: transparent;
}

.md-chip--suggestion {
  border-color: var(--md-sys-color-outline);
}

/* Interactive states */
.md-chip--clickable {
  cursor: pointer;
}

.md-chip--clickable:hover:not(.md-chip--disabled) {
  background-color: color-mix(in srgb, currentColor 8%, var(--md-sys-color-surface-variant));
}

.md-chip--clickable:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.md-chip--clickable:active:not(.md-chip--disabled) {
  transform: scale(0.98);
}

.md-chip--disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

/* Elements */
.md-chip__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  margin-left: -8px;
}

.md-chip__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: -4px;
}

.md-chip__label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.md-chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: currentColor;
  cursor: pointer;
  transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1);
  margin-right: -8px;
}

.md-chip__remove:hover {
  background-color: color-mix(in srgb, currentColor 12%, transparent);
}

.md-chip__remove:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 1px;
}

.md-chip__remove:active {
  background-color: color-mix(in srgb, currentColor 16%, transparent);
}

/* Size adjustments when avatar/icon present */
.md-chip:has(.md-chip__avatar) {
  padding-left: 12px;
}

.md-chip:has(.md-chip__icon) {
  padding-left: 12px;
}

.md-chip:has(.md-chip__remove) {
  padding-right: 12px;
}

/* Status color variants (when used as status indicators) */
.md-chip--success {
  background-color: color-mix(in srgb, var(--md-chip-success) 12%, transparent);
  color: var(--md-chip-success);
  border-color: var(--md-chip-success);
}

.md-chip--error {
  background-color: color-mix(in srgb, var(--md-chip-error) 12%, transparent);
  color: var(--md-chip-error);
  border-color: var(--md-chip-error);
}

.md-chip--warning {
  background-color: color-mix(in srgb, var(--md-chip-warning) 12%, transparent);
  color: var(--md-chip-warning);
  border-color: var(--md-chip-warning);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .md-chip {
    --md-sys-color-primary: #d0bcff;
    --md-sys-color-on-surface: #e6e0e9;
    --md-sys-color-surface-variant: #49454f;
    --md-sys-color-on-surface-variant: #cac4d0;
    --md-sys-color-outline: #938f99;
    --md-sys-color-secondary-container: #4f378b;
    --md-sys-color-on-secondary-container: #eaddff;
  }
}

/* Fallback for browsers that don't support color-mix */
@supports not (background-color: color-mix(in srgb, red 50%, blue)) {
  .md-chip--clickable:hover:not(.md-chip--disabled) {
    background-color: rgba(73, 69, 79, 0.08);
  }
  
  .md-chip__remove:hover {
    background-color: rgba(0, 0, 0, 0.12);
  }
  
  .md-chip--success {
    background-color: rgba(0, 200, 83, 0.12);
  }
  
  .md-chip--error {
    background-color: rgba(186, 26, 26, 0.12);
  }
  
  .md-chip--warning {
    background-color: rgba(255, 152, 0, 0.12);
  }
}
</style>