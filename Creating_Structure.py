import os
import pathlib

# Define the exact structure you requested
structure = {
    "directories": [
        "data_generation",  # Folder 1: Generator + CSV
        "notebooks",        # Folder 2: Preprocessing, EDA, Training
        "models",           # Folder 3: Saved Models (.pkl)
        "app"               # Folder 4: Dashboard
    ],
    "files": {
        # 1. Data Generation Script
        "data_generation/generator.py": "# Code to generate raw data goes here",
        
        # 2. Notebooks for each stage
        "notebooks/1_preprocessing.ipynb": "", 
        "notebooks/2_eda.ipynb": "",
        "notebooks/3_model_training.ipynb": "",
        
        # 3. Dashboard App
        "app/app.py": "# Streamlit Dashboard code goes here",
        
        # 4. Requirements
        "requirements.txt": "pandas\nnumpy\nscikit-learn\nmatplotlib\nseaborn\nstreamlit\njoblib"
    }
}

def create_structure():
    base_path = pathlib.Path.cwd()
    print(f"Setting up clean project in: {base_path}")

    # Create Directories
    for folder in structure["directories"]:
        path = base_path / folder
        os.makedirs(path, exist_ok=True)
        print(f"   [DIR] Created: {folder}")

    # Create Files
    for file_path, content in structure["files"].items():
        full_path = base_path / file_path
        # Ensure parent exists
        full_path.parent.mkdir(parents=True, exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"   [FILE] Created: {file_path}")

    print("\nSetup Complete. You now have a clean modular structure.")

if __name__ == "__main__":
    create_structure()