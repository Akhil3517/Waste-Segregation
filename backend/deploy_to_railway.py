#!/usr/bin/env python3
"""
Railway Deployment Helper Script
This script helps prepare your Flask backend for Railway deployment.
"""

import os
import subprocess
import sys

def check_git_status():
    """Check if we're in a git repository and if changes are committed"""
    print("🔍 Checking git status...")
    
    try:
        # Check if we're in a git repo
        result = subprocess.run(['git', 'status'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Not in a git repository. Please initialize git first:")
            print("git init")
            print("git add .")
            print("git commit -m 'Initial commit'")
            return False
        
        # Check if there are uncommitted changes
        result = subprocess.run(['git', 'diff', '--name-only'], capture_output=True, text=True)
        if result.stdout.strip():
            print("⚠️  You have uncommitted changes. Please commit them:")
            print("git add .")
            print("git commit -m 'Prepare for Railway deployment'")
            return False
        
        print("✅ Git repository is clean and ready for deployment")
        return True
        
    except Exception as e:
        print(f"❌ Error checking git status: {e}")
        return False

def check_railway_files():
    """Check if all necessary files exist for Railway deployment"""
    print("\n📋 Checking Railway deployment files...")
    
    required_files = [
        'main.py',
        'requirements.txt',
        'Procfile',
        'runtime.txt'
    ]
    
    all_good = True
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file}")
        else:
            print(f"❌ {file} - missing")
            all_good = False
    
    if all_good:
        print("\n✅ All Railway deployment files are ready!")
    else:
        print("\n❌ Some files are missing. Please create them first.")
    
    return all_good

def check_production_settings():
    """Check if main.py has production settings"""
    print("\n🔧 Checking production settings...")
    
    try:
        with open('main.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'os.environ.get(\'PORT\', 5000)' in content:
            print("✅ Production settings found in main.py")
            return True
        else:
            print("❌ Production settings not found in main.py")
            print("Please update main.py with:")
            print("port = int(os.environ.get('PORT', 5000))")
            print("app.run(debug=False, host='0.0.0.0', port=port)")
            return False
            
    except Exception as e:
        print(f"❌ Error reading main.py: {e}")
        return False

def show_deployment_steps():
    """Show the deployment steps"""
    print("\n🚂 Railway Deployment Steps:")
    print("=" * 50)
    print("1. Go to https://railway.app")
    print("2. Sign up/Login with GitHub")
    print("3. Click 'New Project'")
    print("4. Select 'Deploy from GitHub repo'")
    print("5. Choose your repository (smart-sort)")
    print("6. Select the backend folder")
    print("7. Click 'Deploy'")
    print("\n8. After deployment, go to your Railway dashboard")
    print("9. Add environment variables:")
    print("   - MONGODB_URI=mongodb://localhost:27017/")
    print("   - DB_NAME=smart_waste_segregation")
    print("   - GEMINI_API_KEY=your_key_here")
    print("   - YOUTUBE_API_KEY=your_key_here")
    print("\n10. Copy your Railway URL")
    print("11. Update your mobile app config")
    print("12. Build new APK")

def main():
    """Main deployment preparation function"""
    print("🚂 Railway Deployment Preparation")
    print("=" * 40)
    
    # Check if we're in the backend directory
    if not os.path.exists('main.py'):
        print("❌ Error: main.py not found. Please run this script from the backend directory.")
        return
    
    # Run all checks
    git_ready = check_git_status()
    files_ready = check_railway_files()
    production_ready = check_production_settings()
    
    print("\n" + "=" * 50)
    
    if git_ready and files_ready and production_ready:
        print("🎉 Everything is ready for Railway deployment!")
        show_deployment_steps()
    else:
        print("❌ Please fix the issues above before deploying to Railway.")
        print("\nQuick fixes:")
        if not git_ready:
            print("- Run: git add . && git commit -m 'Prepare for Railway'")
        if not files_ready:
            print("- Run: python prepare_for_deployment.py")
        if not production_ready:
            print("- Update main.py with production settings")

if __name__ == '__main__':
    main() 