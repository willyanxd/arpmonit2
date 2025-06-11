#!/bin/bash

# ARP Monitoring System Installation Script for Rocky Linux 9
# This script installs and configures the ARP monitoring backend

set -e

echo "=== ARP Monitoring System Installation ==="
echo "Installing on Rocky Linux 9..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "This script should not be run as root for security reasons."
   echo "Please run as a regular user with sudo privileges."
   exit 1
fi

# Update system
echo "Updating system packages..."
sudo dnf update -y

# Install required packages
echo "Installing required packages..."
sudo dnf install -y epel-release
sudo dnf install -y nodejs npm arp-scan git

# Verify arp-scan installation
if ! command -v arp-scan &> /dev/null; then
    echo "Error: arp-scan could not be installed or found"
    exit 1
fi

echo "arp-scan version: $(arp-scan --version | head -n1)"

# Create application directory
APP_DIR="/opt/arp-monitoring"
echo "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy application files
echo "Copying application files..."
cp -r backend/* $APP_DIR/

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd $APP_DIR
npm install

# Create data and logs directories
mkdir -p data logs

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file. Please review and update the configuration."
fi

# Create systemd service
echo "Creating systemd service..."
sudo tee /etc/systemd/system/arp-monitoring.service > /dev/null <<EOF
[Unit]
Description=ARP Network Monitoring Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR

[Install]
WantedBy=multi-user.target
EOF

# Set up log rotation
echo "Setting up log rotation..."
sudo tee /etc/logrotate.d/arp-monitoring > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

# Configure firewall (if firewalld is running)
if systemctl is-active --quiet firewalld; then
    echo "Configuring firewall..."
    sudo firewall-cmd --permanent --add-port=3001/tcp
    sudo firewall-cmd --reload
fi

# Set appropriate permissions
echo "Setting permissions..."
chmod +x $APP_DIR/src/server.js

# Enable and start service
echo "Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable arp-monitoring
sudo systemctl start arp-monitoring

# Check service status
echo "Checking service status..."
sleep 3
if systemctl is-active --quiet arp-monitoring; then
    echo "✅ ARP Monitoring service is running successfully!"
    echo "Service status:"
    sudo systemctl status arp-monitoring --no-pager -l
else
    echo "❌ Service failed to start. Checking logs..."
    sudo journalctl -u arp-monitoring --no-pager -l
    exit 1
fi

echo ""
echo "=== Installation Complete ==="
echo "The ARP Monitoring backend is now installed and running."
echo ""
echo "Configuration:"
echo "  - Application directory: $APP_DIR"
echo "  - Configuration file: $APP_DIR/.env"
echo "  - Service name: arp-monitoring"
echo "  - Default port: 3001"
echo ""
echo "Useful commands:"
echo "  - Check status: sudo systemctl status arp-monitoring"
echo "  - View logs: sudo journalctl -u arp-monitoring -f"
echo "  - Restart service: sudo systemctl restart arp-monitoring"
echo "  - Edit config: nano $APP_DIR/.env (then restart service)"
echo ""
echo "Next steps:"
echo "1. Review and update the configuration in $APP_DIR/.env"
echo "2. Restart the service if you made configuration changes"
echo "3. Configure your frontend to connect to this backend"
echo "4. Test the API at http://your-server:3001/health"
echo ""
echo "Note: Make sure arp-scan has the necessary permissions to scan your network."
echo "You may need to run: sudo setcap cap_net_raw+ep /usr/bin/arp-scan"
EOF

chmod +x backend/install.sh