# GitHub Secrets Setup Guide

This guide helps you configure the required GitHub secrets for automated CI/CD deployment.

## Required Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, then add these secrets:

### 🔐 Hetzner Server Access

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `HETZNER_SERVER_HOST` | Your Hetzner server IP or hostname | `157.180.36.156` or `snel-bot` |
| `HETZNER_SERVER_USER` | SSH username for server access | `root` |
| `HETZNER_SSH_PRIVATE_KEY` | Private SSH key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

### 🌐 Netlify Deployment (Optional)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token | [Netlify User Settings → Personal Access Tokens](https://app.netlify.com/user/applications#personal-access-tokens) |
| `NETLIFY_SITE_ID` | Your Netlify site ID | Found in Site Settings → General → Site Information |

## 🔑 Setting up SSH Key

### 1. Generate SSH Key (if you don't have one)

```bash
# Generate a new SSH key specifically for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions@imperfect-breath" -f ~/.ssh/github_actions_key

# Or use RSA if ed25519 is not supported
ssh-keygen -t rsa -b 4096 -C "github-actions@imperfect-breath" -f ~/.ssh/github_actions_key
```

### 2. Add Public Key to Server

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_key.pub root@157.180.36.156

# Or manually add to authorized_keys
cat ~/.ssh/github_actions_key.pub | ssh root@157.180.36.156 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 3. Add Private Key to GitHub Secrets

```bash
# Display private key (copy this to GitHub secret)
cat ~/.ssh/github_actions_key
```

Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`) and paste it as the `HETZNER_SSH_PRIVATE_KEY` secret.

## 🧪 Testing the Setup

### 1. Test SSH Connection Locally

```bash
ssh -i ~/.ssh/github_actions_key root@157.180.36.156 "echo 'SSH connection successful'"
```

### 2. Trigger GitHub Actions

1. Push changes to the `main` branch
2. Or manually trigger the workflow:
   - Go to Actions tab in your GitHub repository
   - Select "Deploy Vision Service to Hetzner"
   - Click "Run workflow"

### 3. Monitor Deployment

- Check the Actions tab for deployment progress
- Look for green checkmarks indicating successful deployment
- Check logs if any step fails

## 🔧 Troubleshooting

### SSH Connection Issues

```bash
# Test SSH connection with verbose output
ssh -v -i ~/.ssh/github_actions_key root@157.180.36.156

# Check server SSH logs
ssh root@157.180.36.156 "sudo tail -f /var/log/auth.log"
```

### Permission Issues

```bash
# Fix SSH key permissions
chmod 600 ~/.ssh/github_actions_key
chmod 644 ~/.ssh/github_actions_key.pub

# Fix server authorized_keys permissions
ssh root@157.180.36.156 "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

### Deployment Verification

```bash
# Check if vision service is running
ssh root@157.180.36.156 "cd /opt/vision-service && sudo docker-compose ps"

# Test health endpoint
ssh root@157.180.36.156 "curl -f http://localhost:8001/health"
```

## 🚀 Next Steps

After setting up the secrets:

1. **Configure Hetzner Cloud Firewall**: Run `./scripts/setup-hetzner-firewall.sh`
2. **Test External Access**: `curl http://157.180.36.156:8001/health`
3. **Set up Nginx Reverse Proxy**: Deploy with nginx enabled
4. **Configure SSL**: Add SSL certificates for HTTPS

## 📋 Security Best Practices

- ✅ Use dedicated SSH keys for GitHub Actions
- ✅ Limit SSH key access to specific IP ranges if possible
- ✅ Regularly rotate SSH keys and access tokens
- ✅ Monitor deployment logs for suspicious activity
- ✅ Use least privilege principle for server access

## 🆘 Need Help?

If you encounter issues:

1. Check the GitHub Actions logs for detailed error messages
2. Verify all secrets are correctly set
3. Test SSH connection manually
4. Check server firewall and Docker status
5. Review the deployment script logs on the server