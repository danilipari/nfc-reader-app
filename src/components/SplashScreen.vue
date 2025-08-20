<template>
  <div class="splash-screen" :class="{ 'splash-fade-out': isFadingOut }">
    <!-- Background with animated gradient -->
    <div class="splash-background">
      <div class="gradient-overlay"></div>
      <div class="animated-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>

    <!-- Main content -->
    <div class="splash-content">
      <!-- Logo/Icon area -->
      <div class="logo-container">
        <div class="logo-circle">
          <ion-icon :icon="phonePortraitOutline" class="logo-icon"></ion-icon>
        </div>
        <div class="pulse-rings">
          <div class="pulse-ring ring-1"></div>
          <div class="pulse-ring ring-2"></div>
          <div class="pulse-ring ring-3"></div>
        </div>
      </div>

      <!-- App name and tagline -->
      <div class="text-content">
        <h1 class="app-title">
          <span class="title-word title-word-1">Dontouch</span>
          <span class="title-word title-word-2">Tags</span>
        </h1>
        <p class="app-subtitle">Gestione professionale dei tag NFC</p>
      </div>

      <!-- Loading indicator -->
      <div class="loading-section">
        <div class="loading-bar">
          <div class="loading-progress" :style="{ width: `${loadingProgress}%` }"></div>
        </div>
        <p class="loading-text">{{ loadingText }}</p>
      </div>
    </div>

    <!-- Floating particles -->
    <div class="particles">
      <div v-for="n in 20" :key="n" class="particle" :style="getParticleStyle()"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonIcon } from '@ionic/vue';
import { phonePortraitOutline } from 'ionicons/icons';

interface Props {
  duration?: number;
  showProgress?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  duration: 2000,
  showProgress: true
});

const emit = defineEmits<{
  complete: []
}>();

const loadingProgress = ref(0);
const isFadingOut = ref(false);
const loadingText = ref('Inizializzazione...');

const loadingSteps = [
  { progress: 20, text: 'Inizializzazione...' },
  { progress: 40, text: 'Caricamento componenti...' },
  { progress: 60, text: 'Configurazione NFC...' },
  { progress: 80, text: 'Preparazione interfaccia...' },
  { progress: 100, text: 'Completato!' }
];

const getParticleStyle = () => {
  const delay = Math.random() * 2;
  const duration = 3 + Math.random() * 4;
  const left = Math.random() * 100;
  const size = 2 + Math.random() * 3;
  
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    width: `${size}px`,
    height: `${size}px`
  };
};

const startLoadingAnimation = () => {
  if (!props.showProgress) {
    setTimeout(() => {
      completeSplash();
    }, props.duration);
    return;
  }

  // Animazione più veloce - 60% del tempo per il loading
  const loadingDuration = props.duration * 0.6;
  const stepDuration = loadingDuration / loadingSteps.length;
  
  loadingSteps.forEach((step, index) => {
    setTimeout(() => {
      loadingProgress.value = step.progress;
      loadingText.value = step.text;
      
      // Quando arriva al 100%, pausa per 1.5 secondi prima di completare
      if (index === loadingSteps.length - 1) {
        setTimeout(() => {
          completeSplash();
        }, 1500); // Pausa di 1.5 secondi quando completato
      }
    }, stepDuration * index);
  });
};

const completeSplash = () => {
  isFadingOut.value = true;
  
  setTimeout(() => {
    emit('complete');
  }, 800);
};

onMounted(() => {
  startLoadingAnimation();
});
</script>

<style scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: opacity 0.5s ease-out;
}

.splash-fade-out {
  opacity: 0;
}

/* Background */
.splash-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, 
    #6750a4 0%, 
    #7c4dff 25%, 
    #3f51b5 50%, 
    #2196f3 75%, 
    #03a9f4 100%);
  animation: gradientShift 8s ease-in-out infinite;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.05) 50%, 
    rgba(0, 0, 0, 0.1) 100%);
}

@keyframes gradientShift {
  0%, 100% {
    background: linear-gradient(135deg, 
      #6750a4 0%, 
      #7c4dff 25%, 
      #3f51b5 50%, 
      #2196f3 75%, 
      #03a9f4 100%);
  }
  50% {
    background: linear-gradient(135deg, 
      #03a9f4 0%, 
      #2196f3 25%, 
      #3f51b5 50%, 
      #7c4dff 75%, 
      #6750a4 100%);
  }
}

/* Animated shapes */
.animated-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.6;
  }
}

/* Main content */
.splash-content {
  position: relative;
  z-index: 10;
  text-align: center;
  color: white;
  max-width: 90%;
  animation: contentFadeIn 1s ease-out;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Logo container */
.logo-container {
  position: relative;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  animation: logoRotate 3s linear infinite;
}

.logo-icon {
  font-size: 48px;
  color: white;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

@keyframes logoRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Pulse rings */
.pulse-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: pulse 2s ease-out infinite;
}

.ring-1 {
  width: 140px;
  height: 140px;
  animation-delay: 0s;
}

.ring-2 {
  width: 180px;
  height: 180px;
  animation-delay: 0.7s;
}

.ring-3 {
  width: 220px;
  height: 220px;
  animation-delay: 1.4s;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.8);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.5);
  }
}

/* Text content */
.text-content {
  margin-bottom: 60px;
}

.app-title {
  font-size: 3rem;
  font-weight: 300;
  margin: 0 0 16px 0;
  letter-spacing: 2px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.title-word {
  display: inline-block;
  animation: slideInFromTop 1s ease-out forwards;
  opacity: 0;
  transform: translateY(-50px);
}

.title-word-1 {
  animation-delay: 0.3s;
}

.title-word-2 {
  animation-delay: 0.6s;
  font-weight: 500;
  color: #ffeb3b;
  margin-left: 0.5rem;
}

@keyframes slideInFromTop {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.app-subtitle {
  font-size: 1.2rem;
  font-weight: 300;
  margin: 0;
  opacity: 0.9;
  letter-spacing: 0.5px;
  animation: fadeInUp 1s ease-out 0.9s forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes fadeInUp {
  to {
    opacity: 0.9;
    transform: translateY(0);
  }
}

/* Loading section */
.loading-section {
  animation: fadeInUp 1s ease-out 1.2s forwards;
  opacity: 0;
  transform: translateY(20px);
}

.loading-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin: 0 auto 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.loading-progress {
  height: 100%;
  background: linear-gradient(90deg, 
    #ffeb3b 0%, 
    #ffc107 50%, 
    #ff9800 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 235, 59, 0.5);
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 235, 59, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 235, 59, 0.8);
  }
}

.loading-text {
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.8;
  font-weight: 300;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.loading-text:has(+ .loading-progress[style*="100%"]) {
  color: #4caf50;
  font-weight: 500;
  transform: scale(1.05);
}

/* Completamento - cambia colore della barra quando al 100% */
.loading-progress[style*="width: 100%"] {
  background: linear-gradient(90deg, 
    #4caf50 0%, 
    #8bc34a 50%, 
    #cddc39 100%) !important;
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.8) !important;
  animation: completePulse 0.8s ease-in-out infinite !important;
}

@keyframes completePulse {
  0%, 100% {
    box-shadow: 0 0 15px rgba(76, 175, 80, 0.8);
    transform: scaleX(1);
  }
  50% {
    box-shadow: 0 0 25px rgba(76, 175, 80, 1);
    transform: scaleX(1.02);
  }
}

/* Floating particles */
.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: particleFloat linear infinite;
}

@keyframes particleFloat {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .app-title {
    font-size: 2.5rem;
  }
  
  .app-subtitle {
    font-size: 1rem;
  }
  
  .logo-circle {
    width: 100px;
    height: 100px;
  }
  
  .logo-icon {
    font-size: 40px;
  }
  
  .loading-bar {
    width: 150px;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 2rem;
  }
  
  .logo-circle {
    width: 80px;
    height: 80px;
  }
  
  .logo-icon {
    font-size: 32px;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .logo-circle,
  .pulse-ring,
  .shape,
  .particle,
  .loading-progress {
    animation: none;
  }
  
  .splash-background {
    background: #6750a4;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .logo-circle {
    border-color: white;
    background: rgba(0, 0, 0, 0.8);
  }
  
  .loading-bar {
    background: rgba(0, 0, 0, 0.5);
  }
  
  .pulse-ring {
    border-color: white;
  }
}
</style>
