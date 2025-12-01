#!/bin/bash

# Saharam Express Auto-Deploy Script
# This script automates the deployment process to Vercel

set -e

echo "🚀 Starting Saharam Express deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
echo "📋 Checking prerequisites..."

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed${NC}"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Node.js/npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Check if Vercel CLI is available via npx
if ! npx vercel --version &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not available. Please install Node.js${NC}"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not in a git repository. Please run this from your project root.${NC}"
    exit 1
fi

# Check if there are uncommitted changes
if [[ `git status --porcelain` ]]; then
    echo "💾 Committing latest changes..."
    git add .
    git commit -m "Deploy: Auto-commit before deployment $(date)"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin develop

echo -e "${BLUE}🎯 Ready to deploy to Vercel!${NC}"
echo
echo "Next steps:"
echo "1. Run: vercel"
echo "2. Follow the prompts to link your project"
echo "3. Set up environment variables in Vercel dashboard"
echo "4. Deploy!"
echo

# Ask if user wants to continue with Vercel deployment
read -p "Continue with Vercel deployment? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting Vercel deployment..."

    # Run vercel deploy
    npx vercel --prod

    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo
    echo "📋 Don't forget to:"
    echo "1. Set up your Supabase database"
    echo "2. Configure environment variables in Vercel"
    echo "3. Test your live deployment"

else
    echo "⏸️  Deployment paused. Run 'npx vercel' when ready to deploy."
fi