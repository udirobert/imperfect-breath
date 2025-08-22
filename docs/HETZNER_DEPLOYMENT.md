# 🚀 Hetzner Server Deployment Guide

Complete guide for deploying the Vision Service on your Hetzner server for optimal performance and cost-effectiveness.

## 🎯 **Why Hetzner?**

✅ **Cost-Effective**: ~€30/month vs $200+/month for cloud AI services  
✅ **Performance**: Dedicated resources, no cold starts  
✅ **Control**: Full control over models and processing  
✅ **Privacy**: User video data stays on your infrastructure  
✅ **Scalability**: Handle 10+ concurrent sessions easily  

## 📋 **Server Requirements**

### **Minimum Specifications**
- **CPU**: 2 vCPU cores
- **RAM**: 4GB 
- **Storage**: 20GB SSD
- **Network**: 100 Mbps

### **Recommended Specifications** 
- **CPU**: 4 vCPU cores (or 2 dedicated cores)
- **RAM**: 8GB
- **Storage**: 40GB SSD
- **Network**: 1 Gbps

**Recommended Hetzner Instances:**
- **CX31**: 2 vCPU, 8GB RAM, 80GB SSD (~€13/month)
- **CX41**: 4 vCPU, 16GB RAM, 160GB SSD (~€26/month) ⭐ **Best Choice**
- **CCX33**: 4 dedicated cores, 32GB RAM (~€57/month) - For high load

## ⚡ **Quick Setup (5 Minutes)**

### **Step 1: Configure Environment Variables**

```bash
# Set your Hetzner server details
export HETZNER_SERVER_HOST="your-server-ip-or-domain.com"
export HETZNER_SERVER_USER="root"
```

### **Step 2: Deploy to Hetzner**

```bash
cd backend/vision-service
chmod +x deploy-hetzner.sh
./deploy-hetzner.sh
```

That's it! The script will:
- ✅ Upload all necessary files
- ✅ Install Docker & Docker Compose
- ✅ Download AI models (1.5GB total)
- ✅ Start the vision service
- ✅ Set up auto-restart on reboot
- ✅ Run health checks

## 🔧 **Manual Deployment (If Needed)**

### **Step 1: Prepare Your Server**

```bash
# SSH into your Hetzner server
ssh root@your-server.com

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create deployment directory
mkdir -p /opt/vision-service
cd /opt/vision-service
```

### **Step 2: Upload Files**

From your local machine:

```bash
# Create package
cd backend/vision-service
tar -czf vision-service.tar.gz *.py *.txt *.yml Dockerfile

# Upload to server  
scp vision-service.tar.gz root@your-server.com:/opt/vision-service/

# Extract on server
ssh root@your-server.com "cd /opt/vision-service && tar -xzf vision-service.tar.gz"
```

### **Step 3: Start Services**

```bash
# On your server
cd /opt/vision-service
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

## 🔍 **Verification & Testing**

### **Check Service Health**

```bash
# Health check
curl http://your-server.com:8001/health

# Expected response:
{
  "status": "healthy",
  "models_loaded": true,
  "active_sessions": 0,
  "max_sessions": 10,
  "timestamp": 1701234567.89
}
```

### **Test Vision Processing**

```bash
# Start a session
curl -X POST http://your-server.com:8001/vision/start \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session",
    "features": {
      "detect_face": true,
      "analyze_posture": true,
      "track_breathing": true
    }
  }'

# List active sessions
curl http://your-server.com:8001/vision/sessions
```

## 📱 **Frontend Configuration**

Update your frontend environment variables:

```env
# .env or .env.production
VITE_VISION_SERVICE_URL=http://your-server.com:8001
VITE_VISION_ENABLE_BACKEND=true
VITE_VISION_ENABLE_FALLBACK=true
VITE_VISION_TARGET_FPS=2
```

## 📊 **Performance Optimization**

### **Resource Monitoring**

```bash
# Monitor resource usage
docker stats

# Check disk usage
df -h

# Monitor system resources
htop
```

### **Scaling Configuration**

Edit `docker-compose.yml` for your load:

```yaml
services:
  vision-service:
    environment:
      - MAX_CONCURRENT_SESSIONS=20  # Increase for more users
    deploy:
      resources:
        limits:
          memory: 4G    # Increase for better performance
          cpus: '2.0'   # Use more CPU cores
```

## 🔒 **Security Configuration**

### **Firewall Setup**

```bash
# Install UFW
apt install ufw

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 8001/tcp  # Vision service
ufw enable
```

### **SSL/HTTPS Setup (Optional)**

```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal
systemctl enable certbot.timer
```

### **Production Security Checklist**

- [ ] Change default SSH port
- [ ] Disable root login via SSH
- [ ] Set up SSH key authentication
- [ ] Configure fail2ban
- [ ] Regular security updates
- [ ] Monitor access logs

## 📈 **Monitoring & Maintenance**

### **Service Management**

```bash
# Start service
systemctl start vision-service

# Stop service  
systemctl stop vision-service

# Restart service
systemctl restart vision-service

# View service status
systemctl status vision-service

# View logs
journalctl -u vision-service -f
```

### **Docker Management**

```bash
# View logs
docker-compose logs -f

# Restart containers
docker-compose restart

# Update and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Clean up old images
docker system prune -f
```

### **Model Updates**

```bash
# Force model re-download
docker-compose exec vision-service rm -rf /app/models/*
docker-compose restart
```

## 💾 **Backup Strategy**

### **What to Backup**
- Service configuration files
- Environment variables
- SSL certificates
- Application logs (optional)

```bash
# Create backup
tar -czf vision-service-backup-$(date +%Y%m%d).tar.gz \
  /opt/vision-service \
  /etc/systemd/system/vision-service.service

# Store backup securely (external storage)
```

## 🚨 **Troubleshooting**

### **Common Issues**

**Service won't start:**
```bash
# Check Docker status
systemctl status docker

# Check logs
docker-compose logs vision-service

# Restart everything
systemctl restart docker
systemctl restart vision-service
```

**Models not loading:**
```bash
# Check disk space
df -h

# Re-download models
docker-compose exec vision-service rm -rf /app/models
docker-compose restart
```

**High memory usage:**
```bash
# Reduce concurrent sessions
# Edit docker-compose.yml:
# MAX_CONCURRENT_SESSIONS=5

# Restart service
docker-compose up -d
```

**Port 8001 blocked:**
```bash
# Check firewall
ufw status

# Allow port
ufw allow 8001/tcp
```

## 📞 **Support & Maintenance**

### **Health Monitoring Script**

Create `/opt/health-check.sh`:

```bash
#!/bin/bash
HEALTH_URL="http://localhost:8001/health"
LOG_FILE="/var/log/vision-service-health.log"

if curl -f $HEALTH_URL > /dev/null 2>&1; then
    echo "$(date): Service healthy" >> $LOG_FILE
else
    echo "$(date): Service unhealthy - restarting" >> $LOG_FILE
    systemctl restart vision-service
fi
```

Add to crontab:
```bash
# Run health check every 5 minutes
*/5 * * * * /opt/health-check.sh
```

## 💰 **Cost Optimization**

### **Monthly Costs (Estimate)**

- **Hetzner CX41**: €26/month
- **Domain**: €10/year
- **SSL Certificate**: Free (Let's Encrypt)
- **Total**: ~€27/month

**Comparison with Cloud AI:**
- **Google Vision API**: ~$200/month for 10,000 requests
- **AWS Rekognition**: ~$150/month for 10,000 requests
- **Your Solution**: €27/month for unlimited requests ✨

### **Cost Savings Tips**

1. **Use Snapshots**: Create server snapshots for quick deployment
2. **Monitor Usage**: Set up alerts for resource usage
3. **Optimize Images**: Use smaller Docker base images
4. **Scale Down**: Reduce resources during low usage periods

## 🎉 **You're All Set!**

Your vision service is now running on Hetzner with:

✅ **Reliable Processing**: No cold starts or timeouts  
✅ **Cost-Effective**: 10x cheaper than cloud AI services  
✅ **High Performance**: Dedicated resources for your users  
✅ **Privacy-First**: User data never leaves your server  
✅ **Scalable**: Easy to handle more concurrent users  

**Next Steps:**
1. Update your frontend environment variables
2. Test the full integration 
3. Monitor performance and adjust as needed
4. Set up monitoring and backups

**Support:** Check the logs with `docker-compose logs -f` if you encounter any issues!
