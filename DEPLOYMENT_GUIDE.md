### Step 1: Get Server IP Address

1. Open Command Prompt
2. Run:
   ```cmd
   ipconfig
   ```
3. Find your network adapter (usually "Ethernet adapter" or "Wireless LAN adapter")
4. Note the **IPv4 Address** (e.g., `192.168.1.100`)
5. This is your server IP - you'll use it for:
   - Database host (if MySQL is on same server, use `localhost` or `127.0.0.1`)
   - Frontend URL (e.g., `http://192.168.1.100:5000`)

### Step 2: Copy Files to Server

1. Copy the entire project folder to the server (e.g., `C:\prithvi-kiosk\`)
2. Or use these folders:
   - `C:\prithvi-kiosk\server\` - Backend files
   - `C:\prithvi-kiosk\client\` - Frontend files



### Step 4: Configure Environment Variables

### Step 6: Build Frontend

4. **Important:** The backend will serve files from `client/dist` folder

### Step 7: Seed Admin User (First Time Only)


### Step 9: Start Server with PM2

#### Start the Server

1. Navigate to server folder:
   ```cmd
   cd C:\prithvi-kiosk\server
   ```
2. Start with PM2:
   ```cmd
   pm2 start index.js --name prithvi-kiosk
   ```
3. Save PM2 configuration (so it auto-starts on reboot):
   ```cmd
   pm2 save
   ```
4. Setup PM2 to start on Windows boot:
   ```cmd
   pm2 startup
   ```
#### Check Server Status

```cmd
pm2 status
pm2 logs prithvi-kiosk
```

#### Useful PM2 Commands

```cmd
pm2 stop prithvi-kiosk      # Stop server
pm2 restart prithvi-kiosk   # Restart server
pm2 delete prithvi-kiosk    # Remove from PM2
pm2 logs prithvi-kiosk      # View logs
pm2 monit                   # Monitor resources
```

### Step 10: Configure Windows Firewall

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port `5000` → Next
6. Select "Allow the connection" → Next
7. Check all profiles (Domain, Private, Public) → Next
8. Name it "Prithvi Kiosk Server" → Finish

### Step 11: Test the Application

1. Open a browser on the server
2. Navigate to: `http://localhost:5000` or `http://YOUR_SERVER_IP:5000`
3. You should see the login page
4. Login with admin credentials (from seed script)

### Step 12: Access from Other Devices (LAN)

- From any device on the same network:
  - Open browser
  - Navigate to: `http://YOUR_SERVER_IP:5000`
  - Replace `YOUR_SERVER_IP` with the actual server IP



## Troubleshooting

### Server won't start

- Check if port 5000 is already in use:
  ```cmd
  netstat -ano | findstr :5000
  ```
- Check PM2 logs:
  ```cmd
  pm2 logs prithvi-kiosk
  ```


## Updating the Application

1. Stop the server:
   ```cmd
   pm2 stop prithvi-kiosk
   ```
2. Copy new files (overwrite existing)
3. Install new dependencies (if any):
   ```cmd
   cd C:\prithvi-kiosk\server
   npm install
   cd ..\client
   npm install
   ```
4. Rebuild frontend:
   ```cmd
   cd C:\prithvi-kiosk\client
   npm run build
   ```
5. Restart server:
   ```cmd
   cd C:\prithvi-kiosk\server
   pm2 restart prithvi-kiosk
   ```

