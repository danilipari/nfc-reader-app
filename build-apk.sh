#!/bin/bash

echo "Avvio build APK per NFC Reader App..."

# Verifica che siamo nella directory corretta
if [ ! -f "package.json" ]; then
    echo "Errore: esegui questo script dalla root del progetto"
    exit 1
fi

# 1. Build del progetto web
echo "Building progetto web..."
npm run build
if [ $? -ne 0 ]; then
    echo "Errore durante il build web"
    exit 1
fi

# 2. Sync con Capacitor
echo "Sincronizzazione con Capacitor..."
npx cap sync
if [ $? -ne 0 ]; then
    echo "Errore durante cap sync"
    exit 1\
fi

# 3. Build APK con Java 17
echo "Building APK..."
cd android

# Usa Java 17 (già configurato)
echo "Usando Java configurato in gradle.properties..."

java_version=$(java -version 2>&1 | head -n 1)
echo "Using Java: $java_version"

# Build APK
./gradlew assembleDebug
if [ $? -ne 0 ]; then
    echo "Errore durante il build APK"
    exit 1
fi

cd ..

# 5. Mostra risultato
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "APK creato con successo!"
    echo "Percorso: $APK_PATH"
    echo "Dimensione: $(du -h "$APK_PATH" | cut -f1)"
    echo ""
    echo "Per installare:"
    echo "   adb install $APK_PATH"
    echo ""
    echo "Oppure trasferisci il file APK sul telefono e installalo manualmente"
else
    echo "APK non trovato!"
    exit 1
fi