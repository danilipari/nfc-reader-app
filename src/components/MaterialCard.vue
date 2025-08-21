<template>
  <div
    :class="cardClasses"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? '0' : undefined"
    :aria-pressed="clickable && pressed ? 'true' : undefined"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <div v-if="$slots.header" class="md-card__header">
      <slot name="header" />
    </div>
    
    <div v-if="$slots.media" class="md-card__media">
      <slot name="media" />
    </div>
    
    <div class="md-card__content">
      <slot />
    </div>
    
    <div v-if="$slots.actions" class="md-card__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  variant?: 'elevated' | 'filled' | 'outlined'
  clickable?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'elevated',
  clickable: false,
  disabled: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const pressed = ref(false)

const cardClasses = computed(() => [
  'md-card',
  `md-card--${props.variant}`,
  {
    'md-card--clickable': props.clickable,
    'md-card--disabled': props.disabled,
    'md-card--pressed': pressed.value
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
    pressed.value = true
    emit('click', event as unknown as MouseEvent)
    
    setTimeout(() => {
      pressed.value = false
    }, 150)
  }
}
</script>

<style scoped>
.md-card {
  --md-elevation-premium: 0 8px 32px rgba(31, 38, 135, 0.37), 0 4px 16px rgba(31, 38, 135, 0.2);
  --md-elevation-hover: 0 20px 40px rgba(31, 38, 135, 0.5), 0 12px 24px rgba(31, 38, 135, 0.3);
  --md-elevation-pressed: 0 4px 16px rgba(31, 38, 135, 0.3), 0 2px 8px rgba(31, 38, 135, 0.2);
  
  --md-sys-color-surface: #fef7ff;
  --md-sys-color-surface-container: #f3eff4;
  --md-sys-color-surface-container-low: #f7f2fa;
  --md-sys-color-surface-container-high: #ede8f1;
  --md-sys-color-surface-variant: #e7e0ec;
  --md-sys-color-outline: #79747e;
  --md-sys-color-outline-variant: #cac4d0;
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-surface: #1d1b20;
  --md-sys-color-on-surface-variant: #49454f;
  
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.25) 0%, 
    rgba(255, 255, 255, 0.1) 100%);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--md-elevation-premium);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  position: relative;
  isolation: isolate;
  transform-style: preserve-3d;
}

.md-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, 
    rgba(102, 126, 234, 0.3) 0%, 
    rgba(118, 75, 162, 0.2) 50%,
    rgba(240, 147, 251, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  pointer-events: none;
  z-index: -1;
}

.md-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.2) 50%, 
    transparent 100%);
  transition: left 0.8s cubic-bezier(0.19, 1, 0.22, 1);
  pointer-events: none;
  z-index: 1;
}

.md-card--elevated {
  box-shadow: var(--md-elevation-level1);
}

.md-card--filled {
  background-color: var(--md-sys-color-surface-variant);
  box-shadow: var(--md-elevation-level0);
}

.md-card--outlined {
  box-shadow: var(--md-elevation-level0);
  border: 1px solid var(--md-sys-color-outline);
}

.md-card--clickable {
  cursor: pointer;
}

.md-card--clickable:hover:not(.md-card--disabled) {
  box-shadow: var(--md-elevation-hover);
  transform: translateY(-8px) rotateX(2deg) scale(1.02);
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.35) 0%, 
    rgba(255, 255, 255, 0.15) 100%);
  border-color: rgba(102, 126, 234, 0.4);
}

.md-card--clickable:hover:not(.md-card--disabled)::after {
  left: 100%;
}

.md-card--clickable:hover:not(.md-card--disabled)::before {
  opacity: 0.8;
  animation: cardGlow 2s ease-in-out infinite;
}

@keyframes cardGlow {
  0%, 100% {
    opacity: 0.6;
    filter: blur(25px);
  }
  50% {
    opacity: 1;
    filter: blur(20px);
  }
}

.md-card--clickable:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.md-card--clickable:focus-visible::before {
  opacity: 0.6;
}

.md-card--clickable.md-card--pressed {
  transform: scale(0.98) translateY(2px);
  box-shadow: var(--md-elevation-pressed);
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15) 0%, 
    rgba(255, 255, 255, 0.05) 100%);
}

.md-card--clickable:active:not(.md-card--disabled) {
  transform: scale(0.98) translateY(2px);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--md-elevation-pressed);
}

.md-card--disabled {
  opacity: 0.38;
  cursor: not-allowed;
  filter: grayscale(0.2);
}

.md-card--outlined:hover:not(.md-card--disabled) {
  border-color: var(--md-sys-color-primary);
  box-shadow: var(--md-elevation-level1);
}

.md-card--filled:hover:not(.md-card--disabled) {
  background-color: color-mix(in srgb, var(--md-sys-color-surface-variant) 92%, var(--md-sys-color-primary));
}

.md-card__header {
  padding: 16px 16px 0 16px;
  color: var(--md-sys-color-on-surface);
}

.md-card__media {
  width: 100%;
  overflow: hidden;
}

.md-card__content {
  padding: 16px;
  flex: 1;
  color: var(--md-sys-color-on-surface);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

.md-card__actions {
  padding: 8px 16px 16px 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .md-card {
    --md-sys-color-surface: #141218;
    --md-sys-color-surface-container: #211f26;
    --md-sys-color-surface-container-low: #1d1b20;
    --md-sys-color-surface-container-high: #2b2930;
    --md-sys-color-surface-variant: #49454f;
    --md-sys-color-outline: #938f99;
    --md-sys-color-outline-variant: #49454f;
    --md-sys-color-primary: #d0bcff;
    --md-sys-color-on-surface: #e6e0e9;
    --md-sys-color-on-surface-variant: #cac4d0;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .md-card {
    transition: none;
  }
  
  .md-card::before {
    transition: none;
  }
}

@media (prefers-contrast: high) {
  .md-card {
    border: 1px solid var(--md-sys-color-outline);
  }
  
  .md-card--outlined {
    border-width: 2px;
  }
}

/* Fallback for browsers that don't support color-mix */
@supports not (background-color: color-mix(in srgb, red 50%, blue)) {
  .md-card--clickable:hover:not(.md-card--disabled) {
    background-color: var(--md-sys-color-surface-container);
  }
  
  .md-card--filled:hover:not(.md-card--disabled) {
    background-color: var(--md-sys-color-surface-container-high);
  }
  
  .md-card::before {
    background: linear-gradient(135deg, 
      rgba(103, 80, 164, 0.1),
      rgba(103, 80, 164, 0.05));
  }
  
  @media (prefers-color-scheme: dark) {
    .md-card::before {
      background: linear-gradient(135deg, 
        rgba(208, 188, 255, 0.1),
        rgba(208, 188, 255, 0.05));
    }
  }
}
</style>
