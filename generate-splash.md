# Creazione Splash Screen Nativo per Dontouch Tags Reader

## 🎯 Configurazione Completata

✅ **Capacitor Config** - Già configurato in `capacitor.config.ts`:
- Durata: 3 secondi
- Auto-hide: true
- Fade out: 300ms
- Background: #6750a4 (Material 3)
- Fullscreen e immersive
- Scale type: CENTER_CROP per Android

✅ **@capacitor/assets** - Tool installato per generare automaticamente tutte le risoluzioni

## 🎨 Step 1: Creare l'Immagine Master

Crea un file `resources/splash.png` (2732x2732px) con questo design:

### Design Specifications:
```
Background: Gradient radiale Material 3
├── Centro: #7c4dff (Purple 400)
├── Medio: #6750a4 (Primary)
└── Bordo: #3f51b5 (Indigo 500)

Logo Centrale:
├── Posizione: Centro esatto (1366, 1366)
├── Dimensioni: 400x400px
├── Background: Cerchio glassmorphism
│   ├── Fill: rgba(255,255,255,0.15)
│   ├── Border: 3px rgba(255,255,255,0.25)
│   └── Blur: 20px backdrop-filter
├── Icon: NFC/smartphone bianco
│   ├── Size: 180px
│   └── Drop shadow: 0 8px 16px rgba(0,0,0,0.3)

Typography:
├── "Dontouch" 
│   ├── Font: Roboto Light 120px
│   ├── Color: #ffffff
│   ├── Position: Under logo (+200px)
│   └── Letter-spacing: 4px
├── "Tags"
│   ├── Font: Roboto Medium 120px
│   ├── Color: #ffeb3b (Accent)
│   ├── Position: Same line, +20px spacing
│   └── Drop shadow: 0 4px 8px rgba(0,0,0,0.3)
└── "NFC Reader"
    ├── Font: Roboto Light 48px
    ├── Color: rgba(255,255,255,0.8)
    ├── Position: Under title (+120px)
    └── Letter-spacing: 2px

Decorative Elements:
├── 5-6 cerchi semi-trasparenti
├── Sizes: 60-150px random
├── Colors: rgba(255,255,255,0.05-0.12)
├── Positions: Scattered around logo
└── Blur: 10-30px
```

## 🚀 Step 2: Generare Tutte le Risoluzioni

```bash
# Naviga nella root del progetto
cd /path/to/nfc-reader-app

# Genera automaticamente splash screen per tutte le piattaforme
npx @capacitor/assets generate --splash resources/splash.png

# Output atteso:
# ✓ Generating splash screens
# ✓ android/app/src/main/res/drawable/splash.png
# ✓ android/app/src/main/res/drawable-port-ldpi/splash.png
# ✓ android/app/src/main/res/drawable-port-mdpi/splash.png
# ✓ android/app/src/main/res/drawable-port-hdpi/splash.png
# ✓ android/app/src/main/res/drawable-port-xhdpi/splash.png
# ✓ android/app/src/main/res/drawable-port-xxhdpi/splash.png
# ✓ android/app/src/main/res/drawable-port-xxxhdpi/splash.png
# ✓ android/app/src/main/res/drawable-land-ldpi/splash.png
# ✓ [... landscape versions ...]
# ✓ ios/App/App/Assets.xcassets/Splash.imageset/
```

## 📱 Step 3: Build e Test

```bash
# Build del progetto
npm run build

# Sync con piattaforme native
npx cap sync

# Test su Android (con splash nativo)
npx cap run android

# Test su iOS (con splash nativo)
npx cap run ios

# Per vedere il splash in debug
npx cap run android --livereload
```

## 🎨 Design Tool Alternative

Se non hai software di design, puoi usare:

### Online Tools:
- **Figma** (gratuito): Template splash screen
- **Canva**: Template mobile app splash
- **Adobe Express**: Template app loading screen

### Prompt per AI Tools:
```
Create a modern mobile app splash screen image, 2732x2732px:
- Background: Radial gradient from purple #7c4dff center to indigo #3f51b5 edges
- Center: Glassmorphism circle with white NFC/smartphone icon
- Text: "Dontouch Tags" in white Roboto font, "Tags" in yellow #ffeb3b
- Subtitle: "NFC Reader" below in smaller white text
- Add 5 floating semi-transparent white circles as decoration
- Material Design 3 style, professional, clean, modern
```

## 🔧 Troubleshooting

### Se il splash non appare:
```bash
# Clean build
npx cap clean
npm run build
npx cap sync
```

### Per modificare durata:
Modifica `capacitor.config.ts`:
```ts
SplashScreen: {
  launchShowDuration: 4000, // 4 secondi invece di 3
  // ... resto config
}
```

### Per splash diverso su dark mode:
Crea `resources/splash-dark.png` e aggiungi:
```ts
SplashScreen: {
  // ... config esistente
  darkBackgroundColor: "#1a1a1a",
  // Tool genererà automaticamente versioni dark
}
```

## 📋 Checklist Finale

- [ ] ✅ Capacitor config aggiornato
- [ ] ✅ @capacitor/assets installato  
- [ ] 🎨 Creare `resources/splash.png` (2732x2732px)
- [ ] 🚀 Eseguire `npx @capacitor/assets generate --splash resources/splash.png`
- [ ] 🔄 Eseguire `npm run build && npx cap sync`
- [ ] 📱 Test su dispositivo con `npx cap run android/ios`
- [ ] ✨ Ammirare il splash nativo!

## 🎯 Risultato Finale

Con questa configurazione otterrai:
1. **Splash Nativo** - Appare immediatamente all'apertura dell'app
2. **Design Coerente** - Stessi colori Material 3 dell'app
3. **Multi-Platform** - Funziona su Android e iOS
4. **Multi-Resolution** - Si adatta a tutti i device
5. **Transition Smooth** - Dalle schermate native al caricamento web interno
