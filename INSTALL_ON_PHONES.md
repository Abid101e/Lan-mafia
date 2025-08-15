# 📱 How to Install LAN Mafia on Your Phones

## 🚀 Easiest Method: Expo Go (Recommended)

### Step 1: Install Expo Go
1. **Phone 1**: Go to Google Play Store → Search "Expo Go" → Install
2. **Phone 2**: Go to Google Play Store → Search "Expo Go" → Install

### Step 2: Start the Development Server
The server is already running! You should see a QR code in your terminal.

### Step 3: Connect Your Phones
1. **Phone 1**: Open Expo Go → Scan QR code → App loads automatically
2. **Phone 2**: Open Expo Go → Scan QR code → App loads automatically

### Step 4: Play the Game
1. **Host Phone**: Tap "Host Game" → Start Server → Start Game
2. **Other Phone**: Tap "Join Game" → Enter Host IP → Wait for start

## 🔧 Alternative Method: Build APK

### Option 1: EAS Build (Cloud)
```bash
# Login to Expo (create free account)
eas login

# Build APK
eas build --platform android --profile preview
```

### Option 2: Local Build (Advanced)
```bash
# Install Android Studio
# Configure Android SDK
# Run build commands
```

## 📋 Requirements

### For Expo Go Method:
- ✅ Both phones on same WiFi network
- ✅ Expo Go app installed
- ✅ Development server running

### For APK Method:
- ✅ Expo account (free)
- ✅ Or Android Studio (advanced)

## 🎮 Quick Test

1. **Start Server**: `npm start` (already running)
2. **Install Expo Go** on both phones
3. **Scan QR Code** with both phones
4. **Test Game**: Host on one phone, join on other

## 🔗 Network Setup

### Find Host IP:
- Host phone shows IP in the app
- Or use `ipconfig` (Windows) / `ifconfig` (Mac/Linux)

### Connect Phones:
- Both phones must be on same WiFi network
- Or use host phone's hotspot

## 🎯 Ready to Play!

Your LAN Mafia game is now ready to install on your phones using Expo Go!

**Next Steps:**
1. Install Expo Go on both phones
2. Scan the QR code from the terminal
3. Start playing!

---

**🎉 Enjoy your offline multiplayer LAN Mafia game!** 