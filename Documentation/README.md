# Intelligent Scholarship Allocator

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Streamlit](https://img.shields.io/badge/Streamlit-Dashboard-red)
![Scikit-Learn](https://img.shields.io/badge/ML-Ridge%20Regression-orange)
![License](https://img.shields.io/badge/License-MIT-green)

> **An AI-powered decision support system designed to automate, standardize, and de-bias university financial aid allocation.**

---

## Table of Contents
- [Problem Statement](#-problem-statement)
- [The Solution](#-the-solution)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Installation & Usage](#-installation--usage)
- [Model Performance](#-model-performance)
- [Future Roadmap](#-future-roadmap)

---

## Problem Statement
Universities face a "Trilemma of Allocation" when distributing limited scholarship funds:
1.  **Volume vs. Velocity:** Manually reviewing thousands of financial documents creates bottlenecks.
2.  **Complexity:** Balancing **Financial Need**, **Academic Merit**, and **Social Policy** (Reservations/Domicile) is mathematically complex for human reviewers.
3.  **Bias:** Different reviewers may weigh criteria differently, leading to inconsistent and unfair outcomes.

## The Solution
The **Intelligent Scholarship Allocator** is a Machine Learning pipeline that:
1.  **Synthesizes** applicant data (Income, Caste, Grades, Entrance Scores).
2.  **Predicts** a standardized **Priority Score (0-100)** using a trained Ridge Regression model.
3.  **Visualizes** the decision logic via an interactive Dashboard for admissions officers.

---

## Key Features

### 1. Instant Applicant Lookup
* Search for students by **Name** or **Application ID**.
* Instantly retrieve their profile and predicted scholarship tier.

### 2. "What-If" Analysis (Manual Mode)
* Admins can manually input student details to test eligibility scenarios.
* Real-time score calculation based on University Policy logic.

### 3. Fairness-First Logic
* **Need-Based:** Higher priority for lower-income families (Log-normal distribution handling).
* **Merit-Based:** Weighted rewards for high JEE/CET/12th scores.
* **Policy-Based:** Auto-adjustment for Caste Categories and State Domicile.

---

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Language** | Python 3.10+ |
| **Dashboard** | Streamlit |
| **Machine Learning** | Scikit-Learn (Ridge Regression) |
| **Data Processing** | Pandas, NumPy |
| **Visualization** | Matplotlib, Seaborn |
| **Version Control** | Git & GitHub |

---

## Project Architecture

```text
Scholarship-Predictor-System/
├── data_generation/
│   └── generator.py       # Script to create synthetic student data
├── notebooks/
│   ├── 1_preprocessing.ipynb  # Cleaning & Feature Engineering
│   ├── 2_eda.ipynb            # Exploratory Data Analysis
│   └── 3_model_training.ipynb # Ridge Regression Pipeline
├── models/
│   ├── scholarship_model.pkl  # Serialized Model + Preprocessor
├── app/
│   └── app.py             # Streamlit Dashboard Source Code
├── requirements.txt       # Dependencies
└── README.md              # Documentation

```

---

##  Installation & Usage

**Note:** Large dataset files are not uploaded to this repository. You must generate the data locally using the provided script.

### 1. Clone the Repository

```bash
git clone [https://github.com/YOUR_USERNAME/Scholarship-Predictor-System.git](https://github.com/rsp_45/Scholarship-Predictor-System.git)
cd Scholarship-Predictor-System

```

### 2. Install Dependencies

```bash
pip install -r requirements.txt

```

### 3. Generate Data

Run the generator to create the `raw_data.csv` file:

```bash
python data_generation/generator.py

```

*Output: `data_generation/raw_data.csv` created with 2,000 student records.*

### 4. Train the Model

(Optional) If you want to retrain the model from scratch:

```bash
# Run the notebooks in order, or use a script if available
# This will update models/scholarship_model.pkl

```

### 5. Launch Dashboard

```bash
python -m streamlit run app/app.py

```

*The app will open in your browser at `http://localhost:8501`.*

---

## Model Performance

We chose **Ridge Regression** over standard Linear Regression to handle multicollinearity between correlated academic scores (e.g., JEE and CET percentiles).

* **R² Score:** ~0.95 (Indicates excellent fit).
* **MAE (Mean Absolute Error):** ~1.2 points.
* **Why Ridge?** It penalizes extreme weights, ensuring the model remains stable and doesn't over-rely on a single exam score.

---

## Future Roadmap

* [ ] **SQL Integration:** Migrate from CSV to PostgreSQL for secure, persistent storage.
* [ ] **Advanced Models:** Implement **Random Forest** to capture non-linear policy rules.
* [ ] **Batch Processing:** Allow upload of bulk CSVs to score 500+ students at once.
* [ ] **Auth System:** Login for University Administrators.


---

> Built for the **Mid-Term Hackathon 2026**.
