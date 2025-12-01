
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

