#!/bin/bash

# This script helps with deploying to Render.com

echo "Preparing for deployment to Render.com..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
fi

# Add all files to git
echo "Adding files to git..."
git add .

# Commit changes
echo "Committing changes..."
read -p "Enter commit message: " commit_message
git commit -m "$commit_message"

# Check if remote origin exists
if ! git remote | grep -q "^origin$"; then
    echo "Remote 'origin' not found."
    read -p "Enter your GitHub repository URL: " repo_url
    git remote add origin "$repo_url"
fi

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main || git push -u origin master

echo "Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Go to Render.com and create a new Web Service"
echo "2. Connect your GitHub repository"
echo "3. Select 'Docker' as the environment"
echo "4. Configure the environment variables as listed in README.md"
echo "5. Deploy the service"
echo ""
echo "Environment variables to set on Render.com:"
echo "- DATABASE_URL"
echo "- DATABASE_USERNAME"
echo "- DATABASE_PASSWORD"
echo "- JWT_SECRET"
echo "- JWT_EXPIRATION_MS"
echo "- STRIPE_SECRET_KEY"
echo "- STRIPE_PUBLIC_KEY"
