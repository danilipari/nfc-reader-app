<template>
  <div :class="errorClasses" role="alert" aria-live="assertive">
    <div class="md-error__container">
      <!-- Icon -->
      <div class="md-error__icon">
        <slot name="icon">
          <!-- Different icons based on error type -->
          <svg v-if="type === 'network'" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM11 7h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
          </svg>
          <svg v-else-if="type === 'validation'" viewBox="0 0 24 24" width="24" height="24">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>
          </svg>
          <svg v-else-if="type === 'permission'" viewBox="0 0 24 24" width="24" height="24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
          </svg>
          <svg v-else-if="type === 'timeout'" viewBox="0 0 24 24" width="24" height="24">
            <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" fill="currentColor"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
          </svg>
        </slot>
      </div>

      <!-- Content -->
      <div class="md-error__content">
        <div v-if="title" class="md-error__title">
          {{ title }}
        </div>

        <div v-if="message || $slots.default" class="md-error__message">
          <slot>{{ message }}</slot>
        </div>

        <!-- Error details for debugging -->
        <details v-if="details || $slots.details" class="md-error__details">
          <summary class="md-error__details-summary">
            {{ detailsLabel }}
          </summary>
          <div class="md-error__details-content">
            <slot name="details">
              <pre v-if="details">{{ details }}</pre>
            </slot>
          </div>
        </details>

        <!-- Suggested actions -->
        <div v-if="suggestions && suggestions.length > 0" class="md-error__suggestions">
          <div class="md-error__suggestions-title">
            {{ suggestionsLabel }}
          </div>
          <ul class="md-error__suggestions-list">
            <li v-for="(suggestion, index) in suggestions" :key="index">
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="$slots.actions || retryable || dismissible" class="md-error__actions">
      <slot name="actions">
        <MaterialButton
          v-if="retryable"
          variant="filled"
          size="small"
          :loading="retrying"
          @click="handleRetry"
        >
          <template #icon>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
            </svg>
          </template>
          {{ retryLabel }}
        </MaterialButton>
        
        <MaterialButton
          v-if="dismissible"
          variant="text"
          size="small"
          @click="handleDismiss"
        >
          {{ dismissLabel }}
        </MaterialButton>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MaterialButton from './MaterialButton.vue'

interface Props {
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

const props = withDefaults(defineProps<Props>(), {
  type: 'general',
  retryable: false,
  dismissible: true,
  variant: 'card',
  severity: 'error',
  retryLabel: 'Riprova',
  dismissLabel: 'Chiudi',
  detailsLabel: 'Dettagli tecnici',
  suggestionsLabel: 'Possibili soluzioni:'
})

const emit = defineEmits<{
  retry: []
  dismiss: []
}>()

const retrying = ref(false)

const errorClasses = computed(() => [
  'md-error',
  `md-error--${props.type}`,
  `md-error--${props.variant}`,
  `md-error--${props.severity}`
])

const handleRetry = async () => {
  if (retrying.value) return
  
  retrying.value = true
  emit('retry')
  
  // Auto-reset retrying state after 3 seconds to prevent stuck state
  setTimeout(() => {
    retrying.value = false
  }, 3000)
}

const handleDismiss = () => {
  emit('dismiss')
}
</script>

<style scoped>
.md-error {
  --md-sys-color-error: #ba1a1a;
  --md-sys-color-on-error: #ffffff;
  --md-sys-color-error-container: #ffdad6;
  --md-sys-color-on-error-container: #410002;
  --md-sys-color-warning: #ff9800;
  --md-sys-color-info: #2196f3;
  --md-sys-color-surface: #fef7ff;
  --md-sys-color-on-surface: #1d1b20;
  --md-sys-color-outline: #79747e;
  
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  border: 1px solid transparent;
}

/* Variant styles */
.md-error--banner {
  border-radius: 0;
  border-bottom: 1px solid var(--md-sys-color-error);
}

.md-error--inline {
  background: transparent;
  padding: 8px 0;
  border: none;
}

.md-error--card {
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
}

/* Severity styles */
.md-error--warning {
  background-color: color-mix(in srgb, var(--md-sys-color-warning) 12%, var(--md-sys-color-surface));
  color: var(--md-sys-color-warning);
}

.md-error--info {
  background-color: color-mix(in srgb, var(--md-sys-color-info) 12%, var(--md-sys-color-surface));
  color: var(--md-sys-color-info);
}

/* Container */
.md-error__container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

/* Icon */
.md-error__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  color: currentColor;
}

/* Content */
.md-error__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.md-error__title {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  color: currentColor;
}

.md-error__message {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: currentColor;
  opacity: 0.9;
}

/* Error details */
.md-error__details {
  margin-top: 8px;
}

.md-error__details-summary {
  font-size: 14px;
  font-weight: 500;
  color: currentColor;
  cursor: pointer;
  padding: 8px 0;
  list-style: none;
  user-select: none;
}

.md-error__details-summary::-webkit-details-marker {
  display: none;
}

.md-error__details-summary::before {
  content: '▶';
  display: inline-block;
  margin-right: 8px;
  transition: transform 0.2s ease;
}

.md-error__details[open] .md-error__details-summary::before {
  transform: rotate(90deg);
}

.md-error__details-content {
  padding: 8px 16px;
  background-color: color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 8px;
  margin-top: 8px;
}

.md-error__details-content pre {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  color: currentColor;
  opacity: 0.8;
}

/* Suggestions */
.md-error__suggestions {
  margin-top: 8px;
}

.md-error__suggestions-title {
  font-size: 14px;
  font-weight: 500;
  color: currentColor;
  margin-bottom: 8px;
}

.md-error__suggestions-list {
  margin: 0;
  padding-left: 16px;
  color: currentColor;
  opacity: 0.9;
}

.md-error__suggestions-list li {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 4px;
}

/* Actions */
.md-error__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

/* Type-specific styles */
.md-error--nfc {
  background-color: color-mix(in srgb, var(--md-sys-color-warning) 12%, var(--md-sys-color-surface));
  color: var(--md-sys-color-warning);
}

.md-error--network {
  background-color: color-mix(in srgb, var(--md-sys-color-info) 12%, var(--md-sys-color-surface));
  color: var(--md-sys-color-info);
}

.md-error--permission {
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .md-error {
    --md-sys-color-error: #ffb4ab;
    --md-sys-color-on-error: #690005;
    --md-sys-color-error-container: #93000a;
    --md-sys-color-on-error-container: #ffdad6;
    --md-sys-color-surface: #141218;
    --md-sys-color-on-surface: #e6e0e9;
    --md-sys-color-outline: #938f99;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .md-error {
    gap: 12px;
  }
  
  .md-error__container {
    gap: 8px;
  }
  
  .md-error__actions {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
  
  .md-error__actions .md-button {
    width: 100%;
  }
}

/* Fallback for browsers that don't support color-mix */
@supports not (background-color: color-mix(in srgb, red 50%, blue)) {
  .md-error--warning {
    background-color: rgba(255, 152, 0, 0.12);
  }
  
  .md-error--info {
    background-color: rgba(33, 150, 243, 0.12);
  }
  
  .md-error--nfc {
    background-color: rgba(255, 152, 0, 0.12);
  }
  
  .md-error--network {
    background-color: rgba(33, 150, 243, 0.12);
  }
  
  .md-error__details-content {
    background-color: rgba(0, 0, 0, 0.08);
  }
}
</style>