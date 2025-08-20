<template>
  <button
    ref="buttonRef"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :type="type"
    @click="handleClick"
    @mousedown="createRipple"
  >
    <!-- Ripple container -->
    <span class="md-button__ripple-container">
      <span 
        v-for="ripple in ripples" 
        :key="ripple.id"
        class="md-button__ripple"
        :style="ripple.style"
      ></span>
    </span>
    
    <!-- Loading spinner -->
    <span v-if="loading" class="md-button__loading">
      <svg class="md-button__spinner" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
          <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
        </circle>
      </svg>
    </span>
    
    <!-- Icon slot -->
    <span v-if="$slots.icon && !loading" class="md-button__icon">
      <slot name="icon" />
    </span>
    
    <!-- Label slot -->
    <span v-if="$slots.default" class="md-button__label">
      <slot />
    </span>
    
    <!-- State layer for hover/focus effects -->
    <span class="md-button__state-layer"></span>
  </button>
</template>

<script setup lang="ts">
import { computed, useSlots, ref } from 'vue'

interface Props {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal' | 'fab'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
}

interface Ripple {
  id: number
  style: {
    left: string
    top: string
    width: string
    height: string
    animationDuration: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'filled',
  size: 'medium',
  disabled: false,
  loading: false,
  type: 'button'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const slots = useSlots()
const buttonRef = ref<HTMLButtonElement>()
const ripples = ref<Ripple[]>([])
let rippleId = 0

const buttonClasses = computed(() => [
  'md-button',
  `md-button--${props.variant}`,
  `md-button--${props.size}`,
  {
    'md-button--disabled': props.disabled,
    'md-button--loading': props.loading,
    'md-button--icon-only': !slots.default
  }
])

const createRipple = (event: MouseEvent) => {
  if (props.disabled || props.loading || !buttonRef.value) return

  const button = buttonRef.value
  const rect = button.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const size = Math.max(rect.width, rect.height) * 2

  const newRipple: Ripple = {
    id: rippleId++,
    style: {
      left: `${x - size / 2}px`,
      top: `${y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      animationDuration: '600ms'
    }
  }

  ripples.value.push(newRipple)

  // Remove ripple after animation completes
  setTimeout(() => {
    const index = ripples.value.findIndex(r => r.id === newRipple.id)
    if (index > -1) {
      ripples.value.splice(index, 1)
    }
  }, 600)
}

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return
  emit('click', event)
}
</script>

<style scoped>
.md-button {
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #eaddff;
  --md-sys-color-on-primary-container: #21005d;
  --md-sys-color-surface: #fef7ff;
  --md-sys-color-on-surface: #1d1b20;
  --md-sys-color-outline: #79747e;
  --md-sys-color-secondary-container: #e8def8;
  --md-sys-color-on-secondary-container: #1d192b;
  
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 0 24px;
  border: 1px solid transparent;
  border-radius: 20px;
  background-color: transparent;
  color: var(--md-sys-color-primary);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  overflow: hidden;
}

/* Variant styles */
.md-button--filled {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.md-button--filled:hover:not(:disabled) {
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
}

.md-button--outlined {
  border-color: var(--md-sys-color-outline);
  color: var(--md-sys-color-primary);
}

.md-button--outlined:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}

.md-button--text {
  color: var(--md-sys-color-primary);
  padding: 0 12px;
}

.md-button--text:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}

.md-button--elevated {
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-primary);
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
}

.md-button--elevated:hover:not(:disabled) {
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15);
}

.md-button--tonal {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.md-button--tonal:hover:not(:disabled) {
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
}

.md-button--fab {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  padding: 0;
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
}

.md-button--fab:hover:not(:disabled) {
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15);
}

/* Size variants */
.md-button--small {
  height: 32px;
  padding: 0 16px;
  font-size: 12px;
}

.md-button--small.md-button--fab {
  width: 40px;
  height: 40px;
  border-radius: 12px;
}

.md-button--large {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
}

.md-button--large.md-button--fab {
  width: 96px;
  height: 96px;
  border-radius: 28px;
}

/* States */
.md-button:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.md-button:active:not(:disabled) {
  transform: scale(0.98);
}

.md-button:disabled,
.md-button--disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.md-button--loading {
  pointer-events: none;
}

/* Icon and label */
.md-button__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}

.md-button--fab .md-button__icon {
  width: 24px;
  height: 24px;
}

.md-button__label {
  flex: 1;
  text-align: center;
}

.md-button--icon-only .md-button__label {
  display: none;
}

.md-button__loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.md-button__spinner {
  width: 16px;
  height: 16px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .md-button {
    --md-sys-color-primary: #d0bcff;
    --md-sys-color-on-primary: #381e72;
    --md-sys-color-primary-container: #4f378b;
    --md-sys-color-on-primary-container: #eaddff;
    --md-sys-color-surface: #141218;
    --md-sys-color-on-surface: #e6e0e9;
    --md-sys-color-outline: #938f99;
    --md-sys-color-secondary-container: #4f378b;
    --md-sys-color-on-secondary-container: #eaddff;
  }
}

/* Ripple effects */
.md-button__ripple-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  border-radius: inherit;
}

.md-button__ripple {
  position: absolute;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.12;
  transform: scale(0);
  animation: ripple var(--animation-duration, 600ms) cubic-bezier(0.4, 0, 0.2, 1) forwards;
  pointer-events: none;
}

@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 0.12;
  }
  50% {
    opacity: 0.08;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* State layer for modern interactions */
.md-button__state-layer {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-color: currentColor;
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.md-button:hover:not(:disabled) .md-button__state-layer {
  opacity: 0.08;
}

.md-button:focus-visible:not(:disabled) .md-button__state-layer {
  opacity: 0.12;
}

.md-button:active:not(:disabled) .md-button__state-layer {
  opacity: 0.16;
}

/* Enhanced button interactions */
.md-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.md-button:active:not(:disabled) {
  transform: scale(0.98) translateY(0);
}

.md-button--filled:hover:not(:disabled) {
  box-shadow: 
    0px 2px 4px 0px rgba(0, 0, 0, 0.3), 
    0px 1px 6px 2px rgba(0, 0, 0, 0.15);
}

.md-button--elevated:hover:not(:disabled) {
  box-shadow: 
    0px 2px 4px 0px rgba(0, 0, 0, 0.3), 
    0px 4px 8px 3px rgba(0, 0, 0, 0.15);
}

.md-button--fab:hover:not(:disabled) {
  box-shadow: 
    0px 2px 4px 0px rgba(0, 0, 0, 0.3), 
    0px 4px 8px 3px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px) scale(1.02);
}

/* Enhanced loading state */
.md-button--loading .md-button__icon,
.md-button--loading .md-button__label {
  opacity: 0;
}

.md-button--loading .md-button__loading {
  position: absolute;
}

/* Icon animations */
.md-button__icon {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.md-button:hover:not(:disabled) .md-button__icon {
  transform: scale(1.1);
}

.md-button:active:not(:disabled) .md-button__icon {
  transform: scale(0.95);
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .md-button,
  .md-button__ripple,
  .md-button__state-layer,
  .md-button__icon {
    animation: none;
    transition: none;
  }
  
  .md-button:hover:not(:disabled),
  .md-button:active:not(:disabled) {
    transform: none;
  }
}

/* Fallback for browsers that don't support color-mix */
@supports not (background-color: color-mix(in srgb, red 50%, blue)) {
  .md-button--outlined:hover:not(:disabled) {
    background-color: rgba(103, 80, 164, 0.08);
  }
  
  .md-button--text:hover:not(:disabled) {
    background-color: rgba(103, 80, 164, 0.08);
  }
}
</style>
