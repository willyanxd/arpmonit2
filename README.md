# ARP Network Monitoring System

A comprehensive network monitoring solution that uses ARP scanning to discover and track devices on your network. Built with React frontend and Node.js backend, designed to run on Rocky Linux 9.

## Features

### Frontend
- **Real-time Dashboard** - Monitor network activity, devices, and alerts
- **Job Management** - Create and configure ARP scanning jobs
- **Device Discovery** - Track authorized and unauthorized devices
- **Alert System** - Get notified of security events
- **Settings Management** - Configure system preferences

### Backend
- **ARP Scanning** - Uses `arp-scan` for network discovery
- **Job Scheduling** - Automated scanning with cron-like scheduling
- **Device Tracking** - Persistent device database with history
- **Alert Generation** - Configurable alerts for security events
- **RESTful API** - Complete API for frontend integration
- **Systemd Integration** - Runs as a system service

## Architecture

```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│   React Frontend│◄──────────────────►│  Node.js Backend│
│                 │                     │                 │
│ • Dashboard     │                     │ • Express Server│
│ • Job Manager   │                     │ • SQLite DB     │
│ • Device List   │                     │ • ARP Scanner   │
│ • Alert History │                     │ • Job Scheduler │
│ • Settings      │                     │ • Alert System  │
└─────────────────┘                     └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │   arp-scan      │
                                        │   (System Tool) │
                                        └─────────────────┘
```

## Installation

### Prerequisites

- Rocky Linux 9
- Node.js 16+ and npm
- Network interface access for scanning

### Backend Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd arp-monitoring-system
   ```

2. **Run the automated installation:**
   ```bash
   cd backend
   chmod +x install.sh
   ./install.sh
   ```

   This will:
   - Install system dependencies (Node.js, npm, arp-scan)
   - Set up the application in `/opt/arp-monitoring`
   - Create systemd service
   - Configure firewall and log rotation
   - Start the service

3. **Manual configuration (if needed):**
   ```bash
   sudo nano /opt/arp-monitoring/.env
   sudo systemctl restart arp-monitoring
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API endpoint:**
   ```bash
   cp .env.example .env
   # Edit .env to set VITE_API_URL to your backend server
   ```

3. **Development mode:**
   ```bash
   npm run dev
   ```

4. **Production build:**
   ```bash
   npm run build
   ```

## Configuration

### Backend Configuration

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

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### Frontend Configuration

Edit `.env`:

```env
VITE_API_URL=http://your-backend-server:3001/api
```

## Usage

### Creating a Monitoring Job

1. Navigate to the **Jobs** tab
2. Click **Create Job**
3. Configure:
   - **Name**: Descriptive name for the job
   - **Interfaces**: Network interfaces to scan (e.g., eth0, wlan0)
   - **Subnets**: IP ranges to scan (e.g., 192.168.1.0/24)
   - **Frequency**: How often to scan (in minutes)
   - **Authorized MACs**: List of known/authorized device MAC addresses
   - **Alert Configuration**: What events should trigger alerts

### Managing Devices

- View all discovered devices in the **Devices** tab
- Filter by authorized/unauthorized status
- Search by MAC, IP, vendor, or hostname
- Track device history and IP changes

### Monitoring Alerts

- View all alerts in the **History** tab
- Filter by severity level and acknowledgment status
- Acknowledge alerts to mark them as reviewed
- Clear old alerts to maintain system performance

## API Documentation

### Authentication
Currently, the API does not require authentication. In production, consider implementing API keys or OAuth.

### Endpoints

#### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/execute` - Execute job manually

#### Devices
- `GET /api/devices` - List all devices
- `GET /api/devices/:id` - Get device details
- `PATCH /api/devices/:id/authorize` - Update device authorization

#### Alerts
- `GET /api/alerts` - List alerts
- `PATCH /api/alerts/:id/acknowledge` - Acknowledge alert
- `DELETE /api/alerts` - Clear all alerts

#### Scans
- `GET /api/scans` - List scan results

## Service Management

```bash
# Check service status
sudo systemctl status arp-monitoring

# View logs
sudo journalctl -u arp-monitoring -f

# Restart service
sudo systemctl restart arp-monitoring

# Stop/start service
sudo systemctl stop arp-monitoring
sudo systemctl start arp-monitoring
```

## Security Considerations

### Network Permissions
The `arp-scan` tool requires raw socket access. The installation script handles this, but if you encounter permission issues:

```bash
sudo setcap cap_net_raw+ep /usr/bin/arp-scan
```

### Firewall Configuration
The installation script opens port 3001. To manually configure:

```bash
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### Service Security
- Runs as non-root user
- Rate limiting enabled
- Input validation on all endpoints
- Security headers via Helmet.js

## Troubleshooting

### Backend Issues

**Service won't start:**
```bash
sudo journalctl -u arp-monitoring -n 50
```

**Permission errors:**
```bash
sudo setcap cap_net_raw+ep /usr/bin/arp-scan
```

**Database issues:**
```bash
ls -la /opt/arp-monitoring/data/
```

### Frontend Issues

**API connection errors:**
- Check if backend is running: `curl http://localhost:3001/health`
- Verify VITE_API_URL in `.env`
- Check network connectivity

**Build errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
npm run dev  # Vite dev server with hot reload
```

### Running Both
```bash
# Terminal 1 - Backend
npm run backend:dev

# Terminal 2 - Frontend  
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs: `sudo journalctl -u arp-monitoring -f`
3. Open an issue on GitHub

## Roadmap

- [ ] Web-based configuration interface
- [ ] Email/SMS notifications
- [ ] Grafana dashboard integration
- [ ] Network topology visualization
- [ ] Advanced threat detection
- [ ] Multi-site monitoring
- [ ] API authentication
- [ ] Docker containerization