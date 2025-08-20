<template>
  <div :class="heroClasses" @dblclick="$emit('dblclick')">
    <div class="md-hero__background">
      <div class="md-hero__gradient"></div>
      <div v-if="showPattern" class="md-hero__pattern"></div>
      <div class="md-hero__shimmer"></div>
    </div>
    
    <div class="md-hero__content">
      <div v-if="$slots.icon || icon" class="md-hero__icon">
        <div class="md-hero__icon-background"></div>
        <slot name="icon">
          <ion-icon v-if="icon" :icon="icon" class="md-hero__icon-svg"></ion-icon>
        </slot>
      </div>
      
      <div class="md-hero__text">
        <h1 v-if="title" class="md-hero__title">
          {{ title }}
        </h1>
        
        <div v-if="description || $slots.description" class="md-hero__description">
          <slot name="description">{{ description }}</slot>
        </div>
      </div>
      
      <div v-if="$slots.actions" class="md-hero__actions">
        <slot name="actions" />
      </div>
    </div>
    
    <!-- Floating elements for visual appeal -->
    <div class="md-hero__floating-elements">
      <div class="md-hero__floating-circle md-hero__floating-circle--1"></div>
      <div class="md-hero__floating-circle md-hero__floating-circle--2"></div>
      <div class="md-hero__floating-circle md-hero__floating-circle--3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'

interface Props {
  title?: string
  description?: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'surface' | 'gradient'
  size?: 'compact' | 'medium' | 'large'
  showPattern?: boolean
  centered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  showPattern: true,
  centered: true
})

defineEmits<{
  dblclick: []
}>()

const heroClasses = computed(() => [
  'md-hero',
  `md-hero--${props.variant}`,
  `md-hero--${props.size}`,
  {
    'md-hero--centered': props.centered,
    'md-hero--pattern': props.showPattern
  }
])
</script>

<style scoped>
.md-hero {
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #eaddff;
  --md-sys-color-on-primary-container: #21005d;
  --md-sys-color-surface: #fef7ff;
  --md-sys-color-on-surface: #1d1b20;
  --md-sys-color-secondary-container: #e8def8;
  --md-sys-color-on-secondary-container: #1d192b;
  
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  overflow: hidden;
  border-radius: 24px;
  margin-bottom: 24px;
}

.md-hero__background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.md-hero__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    var(--md-sys-color-primary) 0%, 
    color-mix(in srgb, var(--md-sys-color-primary) 80%, var(--md-sys-color-primary-container)) 100%);
}

.md-hero__pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px, 30px 30px;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(10px, -10px) rotate(1deg); }
  66% { transform: translate(-5px, 5px) rotate(-1deg); }
}

.md-hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 32px 24px;
  color: var(--md-sys-color-on-primary);
}

.md-hero__shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, 
    transparent 30%, 
    rgba(255, 255, 255, 0.1) 50%, 
    transparent 70%);
  background-size: 200% 200%;
  animation: shimmer 8s ease-in-out infinite;
  opacity: 0.6;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
}

.md-hero__icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.md-hero__icon:hover {
  transform: translateY(-2px) scale(1.05);
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.md-hero__icon-background {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.md-hero__icon:hover .md-hero__icon-background {
  opacity: 1;
}

.md-hero__icon-svg {
  position: relative;
  z-index: 1;
  font-size: 32px;
  color: currentColor;
  transition: transform 0.3s ease;
}

.md-hero__icon:hover .md-hero__icon-svg {
  transform: scale(1.1);
}

/* Floating elements for visual appeal */
.md-hero__floating-elements {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.md-hero__floating-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.md-hero__floating-circle--1 {
  width: 80px;
  height: 80px;
  top: 10%;
  right: 15%;
  animation: floatingSlow 15s ease-in-out infinite;
}

.md-hero__floating-circle--2 {
  width: 40px;
  height: 40px;
  bottom: 20%;
  left: 10%;
  animation: floatingMedium 12s ease-in-out infinite reverse;
}

.md-hero__floating-circle--3 {
  width: 60px;
  height: 60px;
  top: 60%;
  right: 8%;
  animation: floatingFast 18s ease-in-out infinite;
}

@keyframes floatingSlow {
  0%, 100% { 
    transform: translate(0, 0) rotate(0deg) scale(1); 
    opacity: 0.3;
  }
  33% { 
    transform: translate(15px, -20px) rotate(120deg) scale(1.1); 
    opacity: 0.6;
  }
  66% { 
    transform: translate(-10px, 10px) rotate(240deg) scale(0.9); 
    opacity: 0.4;
  }
}

@keyframes floatingMedium {
  0%, 100% { 
    transform: translate(0, 0) rotate(0deg) scale(1); 
    opacity: 0.4;
  }
  50% { 
    transform: translate(-20px, -15px) rotate(180deg) scale(1.2); 
    opacity: 0.7;
  }
}

@keyframes floatingFast {
  0%, 100% { 
    transform: translate(0, 0) rotate(0deg) scale(1); 
    opacity: 0.2;
  }
  25% { 
    transform: translate(10px, -25px) rotate(90deg) scale(1.1); 
    opacity: 0.5;
  }
  50% { 
    transform: translate(-15px, -10px) rotate(180deg) scale(0.8); 
    opacity: 0.3;
  }
  75% { 
    transform: translate(20px, 15px) rotate(270deg) scale(1.3); 
    opacity: 0.6;
  }
}

.md-hero__text {
  flex: 1;
  margin-bottom: 24px;
}

.md-hero__title {
  margin: 0 0 8px 0;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.25px;
  color: currentColor;
}

.md-hero__description {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.8;
  color: currentColor;
}

.md-hero__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Variant styles */
.md-hero--secondary .md-hero__gradient {
  background: linear-gradient(135deg, 
    var(--md-sys-color-secondary-container) 0%, 
    color-mix(in srgb, var(--md-sys-color-secondary-container) 90%, var(--md-sys-color-primary-container)) 100%);
}

.md-hero--secondary .md-hero__content {
  color: var(--md-sys-color-on-secondary-container);
}

.md-hero--surface .md-hero__gradient {
  background: var(--md-sys-color-surface);
  border: 1px solid rgba(121, 116, 126, 0.2);
}

.md-hero--surface .md-hero__content {
  color: var(--md-sys-color-on-surface);
}

.md-hero--gradient .md-hero__gradient {
  background: linear-gradient(135deg, 
    #667eea 0%, 
    #764ba2 50%, 
    #f093fb 100%);
}

/* Size variants */
.md-hero--compact {
  min-height: 140px;
}

.md-hero--compact .md-hero__content {
  padding: 20px;
}

.md-hero--compact .md-hero__title {
  font-size: 24px;
}

.md-hero--compact .md-hero__icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
}

.md-hero--compact .md-hero__icon-svg {
  font-size: 24px;
}

.md-hero--large {
  min-height: 300px;
}

.md-hero--large .md-hero__content {
  padding: 48px 32px;
}

.md-hero--large .md-hero__title {
  font-size: 40px;
}

.md-hero--large .md-hero__icon {
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
}

.md-hero--large .md-hero__icon-svg {
  font-size: 40px;
}

/* Centered alignment */
.md-hero--centered .md-hero__content {
  align-items: center;
  text-align: center;
}

.md-hero--centered .md-hero__actions {
  justify-content: center;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .md-hero {
    --md-sys-color-primary: #d0bcff;
    --md-sys-color-on-primary: #381e72;
    --md-sys-color-primary-container: #4f378b;
    --md-sys-color-on-primary-container: #eaddff;
    --md-sys-color-surface: #141218;
    --md-sys-color-on-surface: #e6e0e9;
    --md-sys-color-secondary-container: #4f378b;
    --md-sys-color-on-secondary-container: #eaddff;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .md-hero__content {
    padding: 24px 20px;
  }
  
  .md-hero__title {
    font-size: 28px;
  }
  
  .md-hero__actions {
    flex-direction: column;
  }
  
  .md-hero--large .md-hero__content {
    padding: 32px 24px;
  }
  
  .md-hero--large .md-hero__title {
    font-size: 32px;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .md-hero__pattern {
    animation: none;
  }
}

/* High contrast support */
@media (prefers-contrast: high) {
  .md-hero__gradient {
    border: 2px solid currentColor;
  }
  
  .md-hero__icon {
    border: 1px solid currentColor;
  }
}

/* Fallback for browsers that don't support color-mix */
@supports not (background-color: color-mix(in srgb, red 50%, blue)) {
  .md-hero--primary .md-hero__gradient {
    background: linear-gradient(135deg, var(--md-sys-color-primary) 0%, var(--md-sys-color-primary-container) 100%);
  }
  
  .md-hero--secondary .md-hero__gradient {
    background: linear-gradient(135deg, var(--md-sys-color-secondary-container) 0%, var(--md-sys-color-primary-container) 100%);
  }
}
</style>
