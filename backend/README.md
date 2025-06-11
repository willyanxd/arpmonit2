# ARP Monitoring Backend

A Node.js backend service for ARP network monitoring using `arp-scan` on Rocky Linux 9.

## Features

- Real-time ARP network scanning using `arp-scan`
- Job scheduling and management
- Device discovery and tracking
- Alert system for unauthorized devices
- SQLite database for data persistence
- RESTful API for frontend integration
- Systemd service integration
- Comprehensive logging

## Requirements

- Rocky Linux 9
- Node.js 16+ and npm
- `arp-scan` package
- Network interface access for scanning

## Installation

### Automated Installation

Run the installation script as a regular user with sudo privileges:

```bash
chmod +x install.sh
./install.sh
```

### Manual Installation

1. **Install system dependencies:**
   ```bash
   sudo dnf update -y
   sudo dnf install -y epel-release
   sudo dnf install -y nodejs npm arp-scan
   ```

2. **Create application directory:**
   ```bash
   sudo mkdir -p /opt/arp-monitoring
   sudo chown $USER:$USER /opt/arp-monitoring
   ```

3. **Copy files and install dependencies:**
   ```bash
   cp -r backend/* /opt/arp-monitoring/
   cd /opt/arp-monitoring
   npm install
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up systemd service:**
   ```bash
   sudo cp arp-monitoring.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable arp-monitoring
   sudo systemctl start arp-monitoring
   ```

## Configuration

Edit `/opt/arp-monitoring/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database
DB_PATH=./data/arp_monitoring.db

# ARP Scan Configuration
DEFAULT_INTERFACE=eth0
DEFAULT_SUBNET=192.168.1.0/24
SCAN_TIMEOUT=30

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## API Endpoints

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/execute` - Execute job manually

### Devices
- `GET /api/devices` - List all devices
- `GET /api/devices/:id` - Get device details
- `PATCH /api/devices/:id/authorize` - Update device authorization

### Alerts
- `GET /api/alerts` - List alerts
- `PATCH /api/alerts/:id/acknowledge` - Acknowledge alert
- `DELETE /api/alerts` - Clear all alerts

### Scans
- `GET /api/scans` - List scan results

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## Service Management

```bash
# Check status
sudo systemctl status arp-monitoring

# Start/stop/restart
sudo systemctl start arp-monitoring
sudo systemctl stop arp-monitoring
sudo systemctl restart arp-monitoring

# View logs
sudo journalctl -u arp-monitoring -f

# Enable/disable auto-start
sudo systemctl enable arp-monitoring
sudo systemctl disable arp-monitoring
```

## Permissions

The `arp-scan` command requires raw socket access. If you encounter permission issues:

```bash
sudo setcap cap_net_raw+ep /usr/bin/arp-scan
```

## Security Considerations

- The service runs as a non-root user
- Rate limiting is enabled
- Input validation on all API endpoints
- Helmet.js for security headers
- Logs are rotated automatically

## Troubleshooting

### Service won't start
1. Check logs: `sudo journalctl -u arp-monitoring -n 50`
2. Verify Node.js installation: `node --version`
3. Check file permissions in `/opt/arp-monitoring`

### arp-scan not working
1. Verify installation: `which arp-scan`
2. Test manually: `sudo arp-scan -l`
3. Check network interface: `ip addr show`

### Database issues
1. Check SQLite file permissions in `data/` directory
2. Verify disk space: `df -h`

## Development

For development mode:

```bash
npm run dev
```

This uses nodemon for automatic restarts on file changes.

## Logging

Logs are written to:
- Console (systemd journal)
- File: `/opt/arp-monitoring/logs/app.log`

Log rotation is configured via logrotate.

## License

MIT License