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
  --md-elevation-level0: none;
  --md-elevation-level1: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
  --md-elevation-level2: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15);
  
  --md-sys-color-surface: #fef7ff;
  --md-sys-color-surface-variant: #e7e0ec;
  --md-sys-color-outline: #79747e;
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-surface: #1d1b20;
  
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background-color: var(--md-sys-color-surface);
  box-shadow: var(--md-elevation-level1);
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
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
  box-shadow: var(--md-elevation-level2);
  transform: translateY(-1px);
}

.md-card--clickable:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.md-card--clickable.md-card--pressed {
  transform: scale(0.98);
}

.md-card--disabled {
  opacity: 0.38;
  cursor: not-allowed;
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
    --md-sys-color-surface-variant: #49454f;
    --md-sys-color-outline: #938f99;
    --md-sys-color-on-surface: #e6e0e9;
  }
}
</style>