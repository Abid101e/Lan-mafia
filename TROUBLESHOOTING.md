# 🔧 LAN Mafia Hotspot Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### **1. Host Server Won't Start**

**Problem:** "Failed to start server" error

**Solutions:**
- ✅ Turn ON mobile hotspot first
- ✅ Make sure hotspot is active and has password
- ✅ Check if port 3000 is available
- ✅ Restart the app and try again

**Debug Steps:**
```bash
# Check if server is running
curl http://192.168.43.1:3000/health

# Check server logs
node server/hostServer.js
```

### **2. Players Can't Connect**

**Problem:** "Connection failed" when joining

**Solutions:**
- ✅ Connect to host's hotspot first
- ✅ Use correct IP: `192.168.43.1`
- ✅ Make sure host server is running
- ✅ Check if firewall blocks connections

**Debug Steps:**
```bash
# Test connection from player device
node test-server.js

# Check network connectivity
ping 192.168.43.1
```

### **3. Players Don't Appear in List**

**Problem:** Host shows "WAITING FOR PLAYERS TO CONNECT"

**Solutions:**
- ✅ Players must connect to hotspot first
- ✅ Players must use correct IP address
- ✅ Host must start server before players join
- ✅ Check server console for connection logs

**Debug Steps:**
```bash
# Check server status
curl http://192.168.43.1:3000/debug

# Check connected players
curl http://192.168.43.1:3000/health
```

### **4. Game Won't Start**

**Problem:** "LAUNCH SIMULATION" button disabled

**Solutions:**
- ✅ Need at least 4 players connected
- ✅ All players must be on same network
- ✅ Host must be the first player
- ✅ Wait for all connections to stabilize

### **5. Connection Drops**

**Problem:** Players get disconnected during game

**Solutions:**
- ✅ Keep hotspot active
- ✅ Don't switch WiFi networks
- ✅ Keep devices close to host
- ✅ Check battery levels

## 🔍 **Step-by-Step Debugging**

### **For Host:**

1. **Check Hotspot Status**
   ```
   Settings → Network → Hotspot & Tethering
   Make sure "Mobile Hotspot" is ON
   ```

2. **Start Server**
   ```
   Open LAN Mafia app
   Enter name → "⚡ INITIATE HOST"
   Tap "INITIALIZE SERVER"
   Should show "HOTSPOT SERVER ACTIVE"
   ```

3. **Verify Server Running**
   ```
   Open browser on host device
   Go to: http://192.168.43.1:3000/health
   Should show: {"status":"ok","players":1}
   ```

### **For Players:**

1. **Connect to Hotspot**
   ```
   WiFi Settings → Find host's hotspot
   Enter password → Connect
   ```

2. **Join Game**
   ```
   Open LAN Mafia app
   Enter name → "🔌 CONNECT TO NETWORK"
   Enter IP: 192.168.43.1
   Tap "ESTABLISH CONNECTION"
   ```

3. **Verify Connection**
   ```
   Should see "HOTSPOT CONNECTED!"
   Host should see player in list
   ```

## 🛠️ **Advanced Troubleshooting**

### **Check Network Configuration**

```bash
# On host device
ipconfig /all  # Windows
ifconfig       # Mac/Linux

# Look for hotspot IP (usually 192.168.43.1)
```

### **Test Server Manually**

```bash
# Start server manually
cd Lan-mafia
node server/hostServer.js

# Should see:
# "LAN Mafia server running on port 3000"
# "Local IP: 192.168.43.1"
```

### **Check Firewall Settings**

- Windows: Allow Node.js through firewall
- Android: Allow LAN Mafia app network access
- iOS: Check app permissions

### **Alternative IP Addresses**

If `192.168.43.1` doesn't work, try:
- `192.168.1.1`
- `10.0.0.1`
- `172.20.10.1`

## 📱 **Device-Specific Issues**

### **Android Host:**
- Enable "Mobile Hotspot" in settings
- Set hotspot password
- Allow app network permissions

### **iOS Host:**
- Enable "Personal Hotspot" in settings
- Share hotspot password
- Keep screen on during hosting

### **Windows Host:**
- Use mobile hotspot feature
- Or use USB tethering
- Check Windows Defender firewall

## 🎯 **Quick Fix Checklist**

**Before Starting:**
- [ ] Hotspot is ON
- [ ] Password is shared
- [ ] All devices connected to hotspot
- [ ] Host starts server first
- [ ] Players use correct IP

**If Issues Persist:**
- [ ] Restart all devices
- [ ] Clear app cache
- [ ] Try different IP address
- [ ] Check network permissions
- [ ] Update app to latest version

## 🆘 **Still Having Issues?**

1. **Check Console Logs**
   - Host: Look at server console output
   - Players: Check app logs

2. **Test Network**
   - Try pinging host IP
   - Check if port 3000 is open

3. **Alternative Setup**
   - Use USB tethering instead of hotspot
   - Try different network configuration

4. **Contact Support**
   - Share error messages
   - Include device information
   - Describe exact steps taken

---

**🎮 Happy Gaming! If you're still stuck, try the test script: `node test-server.js`** 