<template>
  <div :class="gridClasses">
    <div 
      v-for="(action, index) in actions" 
      :key="action.id || index"
      class="md-action-grid__item"
      :class="{ 'md-action-grid__item--disabled': action.disabled }"
    >
      <MaterialButton
        :variant="action.variant || 'outlined'"
        :size="action.size || 'medium'"
        :disabled="action.disabled || loading"
        :loading="action.loading"
        :aria-label="action.ariaLabel"
        @click="handleActionClick(action, index)"
      >
        <template v-if="action.icon" #icon>
          <ion-icon :icon="action.icon"></ion-icon>
        </template>
        {{ action.label }}
      </MaterialButton>
    </div>
    
    <div v-if="$slots.custom" class="md-action-grid__custom">
      <slot name="custom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import MaterialButton from './MaterialButton.vue'

export interface ActionItem {
  id?: string
  label: string
  icon?: string | object
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal' | 'fab'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  ariaLabel?: string
  action?: string | (() => void)
}

interface Props {
  actions: ActionItem[]
  columns?: 1 | 2 | 3 | 4 | '1' | '2' | '3' | '4' | 'auto'
  gap?: 'small' | 'medium' | 'large'
  alignment?: 'start' | 'center' | 'end' | 'stretch'
  loading?: boolean
  responsive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  columns: 'auto',
  gap: 'medium',
  alignment: 'stretch',
  loading: false,
  responsive: true
})

const emit = defineEmits<{
  action: [action: ActionItem, index: number]
}>()

const gridClasses = computed(() => [
  'md-action-grid',
  `md-action-grid--columns-${props.columns}`,
  `md-action-grid--gap-${props.gap}`,
  `md-action-grid--align-${props.alignment}`,
  {
    'md-action-grid--responsive': props.responsive,
    'md-action-grid--loading': props.loading
  }
])

const handleActionClick = (action: ActionItem, index: number) => {
  if (action.disabled || props.loading) return
  
  if (typeof action.action === 'function') {
    action.action()
  }
  
  emit('action', action, index)
}
</script>

<style scoped>
.md-action-grid {
  display: grid;
  width: 100%;
}

/* Column configurations */
.md-action-grid--columns-1 {
  grid-template-columns: 1fr;
}

.md-action-grid--columns-2 {
  grid-template-columns: repeat(2, 1fr);
}

.md-action-grid--columns-3 {
  grid-template-columns: repeat(3, 1fr);
}

.md-action-grid--columns-4 {
  grid-template-columns: repeat(4, 1fr);
}

.md-action-grid--columns-auto {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* Gap configurations */
.md-action-grid--gap-small {
  gap: 8px;
}

.md-action-grid--gap-medium {
  gap: 16px;
}

.md-action-grid--gap-large {
  gap: 24px;
}

/* Alignment configurations */
.md-action-grid--align-start {
  align-items: start;
}

.md-action-grid--align-center {
  align-items: center;
}

.md-action-grid--align-end {
  align-items: end;
}

.md-action-grid--align-stretch {
  align-items: stretch;
}

/* Grid item */
.md-action-grid__item {
  display: flex;
  width: 100%;
}

.md-action-grid__item .md-button {
  width: 100%;
  justify-content: center;
}

.md-action-grid__item--disabled {
  opacity: 0.38;
}

.md-action-grid__custom {
  display: contents;
}

/* Loading state */
.md-action-grid--loading .md-action-grid__item:not(:has(.md-button--loading)) {
  opacity: 0.6;
  pointer-events: none;
}

/* Responsive behavior */
.md-action-grid--responsive {
  /* Mobile first - single column */
  grid-template-columns: 1fr;
}

@media (min-width: 480px) {
  .md-action-grid--responsive.md-action-grid--columns-2,
  .md-action-grid--responsive.md-action-grid--columns-3,
  .md-action-grid--responsive.md-action-grid--columns-4,
  .md-action-grid--responsive.md-action-grid--columns-auto {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .md-action-grid--responsive.md-action-grid--columns-3,
  .md-action-grid--responsive.md-action-grid--columns-4,
  .md-action-grid--responsive.md-action-grid--columns-auto {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .md-action-grid--responsive.md-action-grid--columns-4 {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .md-action-grid--responsive.md-action-grid--columns-auto {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

/* Special layout for NFC actions */
.md-action-grid--nfc {
  grid-template-columns: 1fr;
  max-width: 400px;
  margin: 0 auto;
}

@media (min-width: 480px) {
  .md-action-grid--nfc {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* FAB grid special layout */
.md-action-grid:has(.md-button--fab) {
  grid-template-columns: repeat(auto-fit, 56px);
  justify-content: center;
  gap: 16px;
}

.md-action-grid:has(.md-button--fab) .md-action-grid__item {
  width: auto;
}
</style>