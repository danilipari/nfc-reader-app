<template>
  <div :class="statusClasses" :role="role" :aria-live="ariaLive">
    <div class="md-status__icon">
      <slot name="icon">
        <svg v-if="status === 'success'" viewBox="0 0 24 24" width="24" height="24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
        </svg>
        <svg v-else-if="status === 'error'" viewBox="0 0 24 24" width="24" height="24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        </svg>
        <svg v-else-if="status === 'warning'" viewBox="0 0 24 24" width="24" height="24">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>
        </svg>
        <svg v-else-if="status === 'info'" viewBox="0 0 24 24" width="24" height="24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
        </svg>
        <div v-else-if="status === 'loading'" class="md-status__spinner">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
          </circle>
          </svg>
        </div>
        <svg v-else viewBox="0 0 24 24" width="24" height="24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2v-6h2v6z" fill="currentColor"/>
        </svg>
      </slot>
    </div>
    
    <div class="md-status__content">
      <div v-if="title" class="md-status__title">
        {{ title }}
      </div>
      
      <div v-if="message || $slots.default" class="md-status__message">
        <slot>{{ message }}</slot>
      </div>
      
      <div v-if="details && details.length > 0" class="md-status__details">
        <div 
          v-for="(detail, index) in details" 
          :key="index" 
          class="md-status__detail"
        >
          <span class="md-status__detail-label">{{ detail.label }}:</span>
          <span class="md-status__detail-value">{{ detail.value }}</span>
        </div>
      </div>
      
      <div v-if="$slots.actions" class="md-status__actions">
        <slot name="actions" />
      </div>
    </div>
    
    <button
      v-if="dismissible"
      class="md-status__dismiss"
      :aria-label="dismissLabel"
      @click="handleDismiss"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface StatusDetail {
  label: string
  value: string
}

interface Props {
  status?: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'neutral'
  title?: string
  message?: string
  details?: StatusDetail[]
  dismissible?: boolean
  dismissLabel?: string
  variant?: 'banner' | 'card' | 'inline'
}

const props = withDefaults(defineProps<Props>(), {
  status: 'neutral',
  dismissible: false,
  dismissLabel: 'Dismiss',
  variant: 'card'
})

const emit = defineEmits<{
  dismiss: []
}>()

const statusClasses = computed(() => [
  'md-status',
  `md-status--${props.status}`,
  `md-status--${props.variant}`
])

const role = computed(() => {
  switch (props.status) {
    case 'error':
    case 'warning':
      return 'alert'
    case 'info':
    case 'success':
      return 'status'
    default:
      return 'status'
  }
})

const ariaLive = computed(() => {
  switch (props.status) {
    case 'error':
    case 'warning':
      return 'assertive'
    case 'info':
    case 'success':
      return 'polite'
    default:
      return 'off'
  }
})

const handleDismiss = () => {
  emit('dismiss')
}
</script>

<style scoped>
.md-status {
  --md-sys-color-surface-container: #f3eff4;
  --md-sys-color-on-surface: #1d1b20;
  --md-sys-color-on-surface-variant: #49454f;
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary-container: #21005d;
  --md-sys-color-primary-container: #eaddff;
  --md-sys-color-error: #ba1a1a;
  --md-sys-color-on-error-container: #410002;
  --md-sys-color-error-container: #ffdad6;
  --md-sys-color-warning: #ff9800;
  --md-sys-color-info: #2196f3;
  --md-sys-color-success: #00c853;
  
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background-color: var(--md-sys-color-surface-container);
  position: relative;
}

/* Variant styles */
.md-status--banner {
  border-radius: 0;
  border-bottom: 1px solid rgba(121, 116, 126, 0.2);
}

.md-status--inline {
  background: transparent;
  padding: 8px 0;
}

/* Status color variations */
.md-status--success {
  background-color: color-mix(in srgb, var(--md-sys-color-success) 12%, var(--md-sys-color-surface-container));
  color: var(--md-sys-color-success);
}

.md-status--error {
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.md-status--warning {
  background-color: color-mix(in srgb, var(--md-sys-color-warning) 12%, var(--md-sys-color-surface-container));
  color: var(--md-sys-color-warning);
}

.md-status--info {
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.md-status--loading {
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-primary);
}

.md-status--neutral {
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
}

/* Elements */
.md-status__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  margin-top: 2px;
}

.md-status__spinner svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.md-status__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.md-status__title {
  color: currentColor;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  margin: 0;
}

.md-status__message {
  color: currentColor;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.8;
}

.md-status__details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.md-status__detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 8px;
  font-size: 14px;
}

.md-status__detail-label {
  font-weight: 500;
  color: currentColor;
  opacity: 0.9;
}

.md-status__detail-value {
  font-family: monospace;
  color: currentColor;
  word-break: break-all;
}

.md-status__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.md-status__dismiss {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: currentColor;
  cursor: pointer;
  transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1);
  opacity: 0.7;
}

.md-status__dismiss:hover {
  background-color: color-mix(in srgb, currentColor 12%, transparent);
  opacity: 1;
}

.md-status__dismiss:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.md-status__dismiss:active {
  background-color: color-mix(in srgb, currentColor 16%, transparent);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .md-status {
    --md-sys-color-surface-container: #211f26;
    --md-sys-color-on-surface: #e6e0e9;
    --md-sys-color-on-surface-variant: #cac4d0;
    --md-sys-color-primary: #d0bcff;
    --md-sys-color-on-primary-container: #eaddff;
    --md-sys-color-primary-container: #4f378b;
    --md-sys-color-error: #ffb4ab;
    --md-sys-color-on-error-container: #ffdad6;
    --md-sys-color-error-container: #93000a;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .md-status {
    gap: 12px;
  }
  
  .md-status__actions {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Fallback for browsers that don't support color-mix */
@supports not (background-color: color-mix(in srgb, red 50%, blue)) {
  .md-status--success {
    background-color: rgba(0, 200, 83, 0.12);
  }
  
  .md-status--warning {
    background-color: rgba(255, 152, 0, 0.12);
  }
  
  .md-status__detail {
    background-color: rgba(0, 0, 0, 0.08);
  }
  
  .md-status__dismiss:hover {
    background-color: rgba(0, 0, 0, 0.12);
  }
}
</style>