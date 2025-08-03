#!/usr/bin/env python3
"""
Deployment Preparation Script for Smart Waste Sort Backend
This script helps prepare your Flask backend for cloud deployment.
"""

import os
import subprocess
import sys

def check_file_exists(filename):
    """Check if a file exists"""
    return os.path.exists(filename)

def create_requirements_txt():
    """Create requirements.txt if it doesn't exist"""
    if not check_file_exists('requirements.txt'):
        print("📦 Creating requirements.txt...")
        try:
            result = subprocess.run([sys.executable, '-m', 'pip', 'freeze'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                with open('requirements.txt', 'w') as f:
                    f.write(result.stdout)
                print("✅ requirements.txt created successfully")
            else:
                print("❌ Failed to create requirements.txt")
        except Exception as e:
            print(f"❌ Error creating requirements.txt: {e}")
    else:
        print("✅ requirements.txt already exists")

def create_procfile():
    """Create Procfile for Heroku deployment"""
    if not check_file_exists('Procfile'):
        print("📄 Creating Procfile...")
        try:
            with open('Procfile', 'w') as f:
                f.write('web: python main.py\n')
            print("✅ Procfile created successfully")
        except Exception as e:
            print(f"❌ Error creating Procfile: {e}")
    else:
        print("✅ Procfile already exists")

def update_main_py():
    """Update main.py for production deployment"""
    print("🔧 Checking main.py for production settings...")
    
    try:
        with open('main.py', 'r') as f:
            content = f.read()
        
        # Check if production settings are already added
        if 'os.environ.get(\'PORT\', 5000)' in content:
            print("✅ main.py already has production settings")
            return
        
        # Add production settings
        if 'if __name__ == \'__main__\':' in content:
            # Replace the existing run line
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if 'if __name__ == \'__main__\':' in line:
                    # Add import os at the top if not present
                    if 'import os' not in content:
                        lines.insert(0, 'import os')
                    
                    # Find the app.run line and replace it
                    for j in range(i, len(lines)):
                        if 'app.run(' in lines[j]:
                            lines[j] = '    port = int(os.environ.get(\'PORT\', 5000))'
                            lines.insert(j + 1, '    app.run(host=\'0.0.0.0\', port=port, debug=False)')
                            break
                    break
            
            # Write back the updated content
            with open('main.py', 'w') as f:
                f.write('\n'.join(lines))
            print("✅ main.py updated with production settings")
        else:
            print("⚠️  Could not find main block in main.py - please add manually:")
            print("if __name__ == '__main__':")
            print("    port = int(os.environ.get('PORT', 5000))")
            print("    app.run(host='0.0.0.0', port=port, debug=False)")
    
    except Exception as e:
        print(f"❌ Error updating main.py: {e}")

def create_runtime_txt():
    """Create runtime.txt to specify Python version"""
    if not check_file_exists('runtime.txt'):
        print("🐍 Creating runtime.txt...")
        try:
            # Get current Python version
            version = f"{sys.version_info.major}.{sys.version_info.minor}"
            with open('runtime.txt', 'w') as f:
                f.write(f'python-{version}\n')
            print(f"✅ runtime.txt created with Python {version}")
        except Exception as e:
            print(f"❌ Error creating runtime.txt: {e}")
    else:
        print("✅ runtime.txt already exists")

def check_cors():
    """Check if CORS is properly configured"""
    print("🌐 Checking CORS configuration...")
    
    try:
        with open('main.py', 'r') as f:
            content = f.read()
        
        if 'flask_cors' in content or 'CORS(' in content:
            print("✅ CORS appears to be configured")
        else:
            print("⚠️  CORS not found - you may need to add:")
            print("from flask_cors import CORS")
            print("CORS(app)")
    except Exception as e:
        print(f"❌ Error checking CORS: {e}")

def create_gitignore():
    """Create .gitignore if it doesn't exist"""
    if not check_file_exists('.gitignore'):
        print("🚫 Creating .gitignore...")
        try:
            with open('.gitignore', 'w') as f:
                f.write("""# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Environment variables
.env
.env.local

# Uploads (if you want to exclude them)
uploads/
""")
            print("✅ .gitignore created successfully")
        except Exception as e:
            print(f"❌ Error creating .gitignore: {e}")
    else:
        print("✅ .gitignore already exists")

def main():
    """Main deployment preparation function"""
    print("🚀 Preparing backend for deployment...\n")
    
    # Check if we're in the backend directory
    if not check_file_exists('main.py'):
        print("❌ Error: main.py not found. Please run this script from the backend directory.")
        return
    
    # Run all preparation steps
    create_requirements_txt()
    create_procfile()
    update_main_py()
    create_runtime_txt()
    check_cors()
    create_gitignore()
    
    print("\n🎉 Deployment preparation complete!")
    print("\n📋 Next steps:")
    print("1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli")
    print("2. Run: heroku login")
    print("3. Run: heroku create your-app-name")
    print("4. Run: git add . && git commit -m 'Deploy backend'")
    print("5. Run: git push heroku main")
    print("6. Get your URL: heroku info")
    print("7. Update your mobile app config with the new URL")

if __name__ == '__main__':
    main() 