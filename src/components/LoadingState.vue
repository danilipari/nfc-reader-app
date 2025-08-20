<template>
  <div :class="loadingClasses" :role="role" :aria-live="ariaLive">
    <div class="md-loading__container">
      <!-- Spinner -->
      <div v-if="type === 'spinner'" class="md-loading__spinner">
        <svg 
          :class="spinnerClasses"
          viewBox="0 0 24 24"
        >
          <circle 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            stroke-width="2" 
            fill="none" 
            stroke-linecap="round" 
            stroke-dasharray="31.416" 
            stroke-dashoffset="31.416"
          >
            <animate 
              attributeName="stroke-dasharray" 
              dur="2s" 
              values="0 31.416;15.708 15.708;0 31.416" 
              repeatCount="indefinite"
            />
            <animate 
              attributeName="stroke-dashoffset" 
              dur="2s" 
              values="0;-15.708;-31.416" 
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>

      <!-- Skeleton loader -->
      <div v-else-if="type === 'skeleton'" class="md-loading__skeleton">
        <div class="md-skeleton__item md-skeleton__title"></div>
        <div class="md-skeleton__item md-skeleton__line"></div>
        <div class="md-skeleton__item md-skeleton__line md-skeleton__line--short"></div>
        <div v-if="showActions" class="md-skeleton__actions">
          <div class="md-skeleton__item md-skeleton__button"></div>
          <div class="md-skeleton__item md-skeleton__button"></div>
        </div>
      </div>

      <!-- Linear progress -->
      <div v-else-if="type === 'linear'" class="md-loading__linear">
        <div class="md-linear__track">
          <div class="md-linear__indicator" :style="progressStyle"></div>
        </div>
      </div>

      <!-- Dots loader -->
      <div v-else-if="type === 'dots'" class="md-loading__dots">
        <div class="md-dots__dot" v-for="i in 3" :key="i"></div>
      </div>

      <!-- Pulse loader -->
      <div v-else-if="type === 'pulse'" class="md-loading__pulse">
        <div class="md-pulse__circle"></div>
      </div>

      <!-- Custom slot -->
      <div v-if="$slots.custom" class="md-loading__custom">
        <slot name="custom" />
      </div>
    </div>

    <!-- Text content -->
    <div v-if="title || message || $slots.default" class="md-loading__content">
      <div v-if="title" class="md-loading__title">
        {{ title }}
      </div>
      <div v-if="message || $slots.default" class="md-loading__message">
        <slot>{{ message }}</slot>
      </div>
      <div v-if="progress !== undefined && showProgress" class="md-loading__progress-text">
        {{ Math.round(progress) }}%
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
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

const props = withDefaults(defineProps<Props>(), {
  type: 'spinner',
  size: 'medium',
  showProgress: false,
  showActions: false,
  variant: 'default',
  color: 'primary'
})

const loadingClasses = computed(() => [
  'md-loading',
  `md-loading--${props.type}`,
  `md-loading--${props.size}`,
  `md-loading--${props.variant}`,
  `md-loading--${props.color}`
])

const spinnerClasses = computed(() => [
  'md-loading__spinner-svg',
  `md-loading__spinner-svg--${props.size}`
])

const progressStyle = computed(() => {
  if (props.progress === undefined) return {}
  return {
    width: `${Math.max(0, Math.min(100, props.progress))}%`
  }
})

const role = computed(() => {
  return props.variant === 'overlay' ? 'dialog' : 'status'
})

const ariaLive = computed(() => {
  return props.type === 'linear' ? 'polite' : 'assertive'
})
</script>

<style scoped>
.md-loading {
  --md-sys-color-primary: #6750a4;
  --md-sys-color-secondary: #625b71;
  --md-sys-color-surface: #fef7ff;
  --md-sys-color-on-surface: #1d1b20;
  --md-sys-color-surface-variant: #e7e0ec;
  --md-sys-color-on-surface-variant: #49454f;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  color: var(--md-sys-color-on-surface);
}

/* Variant styles */
.md-loading--overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

.md-loading--inline {
  position: relative;
  padding: 16px;
  background: transparent;
}

/* Color variants */
.md-loading--primary {
  color: var(--md-sys-color-primary);
}

.md-loading--secondary {
  color: var(--md-sys-color-secondary);
}

.md-loading--surface {
  color: var(--md-sys-color-on-surface-variant);
}

/* Container */
.md-loading__container {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Spinner */
.md-loading__spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.md-loading__spinner-svg {
  color: currentColor;
}

.md-loading__spinner-svg--small {
  width: 20px;
  height: 20px;
}

.md-loading__spinner-svg--medium {
  width: 32px;
  height: 32px;
}

.md-loading__spinner-svg--large {
  width: 48px;
  height: 48px;
}

/* Skeleton loader */
.md-loading__skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.md-skeleton__item {
  background: linear-gradient(
    90deg,
    var(--md-sys-color-surface-variant) 0%,
    rgba(255, 255, 255, 0.8) 50%,
    var(--md-sys-color-surface-variant) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

.md-skeleton__title {
  height: 24px;
  width: 60%;
}

.md-skeleton__line {
  height: 16px;
  width: 100%;
}

.md-skeleton__line--short {
  width: 70%;
}

.md-skeleton__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.md-skeleton__button {
  height: 32px;
  width: 80px;
  border-radius: 16px;
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Linear progress */
.md-loading__linear {
  width: 100%;
  max-width: 400px;
}

.md-linear__track {
  width: 100%;
  height: 4px;
  background-color: color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.md-linear__indicator {
  height: 100%;
  background-color: currentColor;
  border-radius: 2px;
  transition: width 0.3s cubic-bezier(0.2, 0, 0, 1);
}

/* Indeterminate linear progress */
.md-loading--linear:not(:has(.md-linear__indicator[style*="width"])) .md-linear__indicator {
  width: 30%;
  animation: linear-indeterminate 2s ease-in-out infinite;
}

@keyframes linear-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(400%);
  }
}

/* Dots loader */
.md-loading__dots {
  display: flex;
  gap: 8px;
  align-items: center;
}

.md-dots__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
  animation: dots-bounce 1.4s ease-in-out infinite;
}

.md-dots__dot:nth-child(2) {
  animation-delay: 0.2s;
}

.md-dots__dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dots-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Pulse loader */
.md-loading__pulse {
  display: flex;
  align-items: center;
  justify-content: center;
}

.md-pulse__circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse-scale 1.5s ease-in-out infinite;
}

.md-loading--small .md-pulse__circle {
  width: 24px;
  height: 24px;
}

.md-loading--large .md-pulse__circle {
  width: 64px;
  height: 64px;
}

@keyframes pulse-scale {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Content */
.md-loading__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.md-loading__title {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: currentColor;
}

.md-loading__message {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  color: currentColor;
  opacity: 0.8;
}

.md-loading__progress-text {
  font-family: monospace;
  font-size: 12px;
  color: currentColor;
  font-weight: 600;
}

/* Size variants */
.md-loading--small {
  padding: 16px;
  gap: 12px;
}

.md-loading--small .md-loading__title {
  font-size: 14px;
}

.md-loading--small .md-loading__message {
  font-size: 12px;
}

.md-loading--large {
  padding: 32px;
  gap: 24px;
}

.md-loading--large .md-loading__title {
  font-size: 18px;
}

.md-loading--large .md-loading__message {
  font-size: 16px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .md-loading {
    --md-sys-color-primary: #d0bcff;
    --md-sys-color-secondary: #ccc2dc;
    --md-sys-color-surface: #141218;
    --md-sys-color-on-surface: #e6e0e9;
    --md-sys-color-surface-variant: #49454f;
    --md-sys-color-on-surface-variant: #cac4d0;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .md-loading__spinner svg circle animate,
  .md-skeleton__item,
  .md-linear__indicator,
  .md-dots__dot,
  .md-pulse__circle {
    animation: none;
  }
  
  .md-skeleton__item {
    background: var(--md-sys-color-surface-variant);
  }
}
</style>