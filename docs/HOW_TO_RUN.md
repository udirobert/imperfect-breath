# How to Run the Setup Scripts

The scripts included in this project are **shell scripts** that need to be executed directly, not with Node.js.

## Correct Ways to Run the Scripts

### Option 1: Run directly (recommended)

```bash
./setup-and-run.sh
```

### Option 2: Using bash explicitly

```bash
bash setup-and-run.sh
```

### Option 3: Using sh explicitly

```bash
sh setup-and-run.sh
```

## Common Errors

### Error: Unknown file extension ".sh"

If you see this error:

```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".sh"
```

It means you're trying to run the script with Node.js. Don't use:

- ❌ `node setup-and-run.sh`
- ❌ `npx setup-and-run.sh`

### Error: Permission denied

If you see this error:

```
bash: ./setup-and-run.sh: Permission denied
```

You need to make the script executable:

```bash
chmod +x setup-and-run.sh
```

## Quick Start Guide

1. Make all scripts executable:

   ```bash
   chmod +x *.sh
   ```

2. Run the setup script:

   ```bash
   ./setup-and-run.sh
   ```

3. In a new terminal, start the frontend:
   ```bash
   npm run dev
   ```
