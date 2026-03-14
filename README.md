# Project Tejas — Intelligent Scholarship Allocator

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Streamlit](https://img.shields.io/badge/Streamlit-Dashboard-red)
![Scikit-Learn](https://img.shields.io/badge/ML-XGBoost%20%7C%20RandomForest-orange)
![SHAP](https://img.shields.io/badge/Explainability-SHAP-blueviolet)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey)
![License](https://img.shields.io/badge/License-MIT-green)

> **An ML-powered decision support system designed to automate, standardize, and de-bias university financial aid allocation.**

> ⚠️ **Note: This is currently a Beta testing version.**

---

## Table of Contents
- [Problem Statement](#-problem-statement)
- [The Solution](#-the-solution)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Installation & Usage](#-installation--usage)
- [Model Performance](#-model-performance)
- [Project Timeline](#project-timeline--retraining-schedule)

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

## Scholarship Criteria & Scoring Logic

The **Intelligent Scholarship Allocator** does not use random selection. It calculates a **Priority Score (0-100)** based on a transparent, weighted formula designed to balance **Financial Need**, **Academic Merit**, and **Social Inclusion**.

### 1. The "Fairness Formula"
The final score is a weighted aggregate of three pillars:

$$\text{Priority Score} = (0.4 \times \text{Need}) + (0.4 \times \text{Merit}) + (0.2 \times \text{Policy})$$

### 2. Component Breakdown

####  A. Financial Need (40%)
* **Objective:** Prioritize students from lower-income backgrounds.
* **Logic:** We use a **Log-Normal Decay** function.
    * Income < ₹2 Lakhs ➝ **Max Score (~100 points)**
    * Income > ₹20 Lakhs ➝ **Min Score (~0 points)**
* *Why?* This ensures that a student earning ₹3L vs ₹4L has a bigger score difference than a student earning ₹25L vs ₹26L.

####  B. Academic Merit (40%)
* **Objective:** Reward hard work and talent.
* **Logic:** Average percentile of three key exams:
    1.  **12th Grade Percentage**
    2.  **Mh-CET Percentile**
    3.  **JEE Mains Percentile**

####  C. Social Policy & Bonuses (20%)
* **Objective:** Adhere to government Affirmative Action mandates and University policies.
* **Bonuses Applied:**

| Criterion | Category | Bonus Points |
| :--- | :--- | :--- |
| **Caste Category** | General | +0 |
| | OBC (Other Backward Class) | +5 |
| | SC (Scheduled Caste) | +10 |
| | ST (Scheduled Tribe) | +15 |
| **Domicile** | Maharashtra State | +5 |
| **Extracurriculars** | Sports/Arts (0-10 Scale) | +1 to +10 |

---

### 3. Score Interpretation (The Output)
Once the model calculates the score, the applicant is classified into one of three tiers:

| Priority Score | Status | Recommendation |
| :--- | :--- | :--- |
| **80 - 100** |  **High Priority** | **Full Scholarship (100% Waiver)**. Highly recommended for immediate funding. |
| **50 - 79** |  **Medium Priority** | **Partial Aid (50% Waiver)**. Recommended if funds are available. |
| **0 - 49** | **Low Priority** | **No Aid**. The applicant does not meet the current financial/merit threshold. |

## Key Features

### 1. Instant Applicant Lookup
* Searchable dropdown of all applicants by **Name** or **Application ID**.
* Instantly retrieve their profile and predicted scholarship tier.
* Auto-fill form fields for quick re-scoring.

### 2. "What-If" Analysis (Manual Mode)
* Admins can manually input student details to test eligibility scenarios.
* Real-time score calculation based on University Policy logic.
* New applicants are automatically saved to the SQLite database.

### 3. SHAP Explainability
* Every prediction is accompanied by a **SHAP Waterfall Plot**.
* Decomposes the score into per-feature contributions (income impact, merit impact, etc.).
* Makes all allocation decisions fully transparent and auditable.

### 4. Batch Processing
* Drag-and-drop **CSV upload** to score hundreds of students at once.
* Plotly histogram visualization of score distributions.
* Downloadable results CSV with predicted Priority Scores.

### 5. Database Seeding & Persistence
* Synthetic data generator seeds **1,000 records directly into SQLite**.
* All dashboard interactions are persisted in `data/scholarship.db`.
* Full CRUD visibility via the Database Records tab.

### 6. Fairness-First Logic
* **Need-Based:** Higher priority for lower-income families (Log-normal distribution handling).
* **Merit-Based:** Weighted rewards for high JEE/CET/12th scores.
* **Policy-Based:** Auto-adjustment for Caste Categories and State Domicile.

---

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Language** | Python 3.10+, JavaScript/JSX |
| **Frontend** | React, Vite, Tailwind CSS, Recharts |
| **Backend API**| FastAPI, Uvicorn |
| **Machine Learning** | Scikit-Learn (RandomForest, Ridge), XGBoost, LightGBM |
| **Explainability** | SHAP (SHapley Additive exPlanations) |
| **Database** | SQLite (WAL mode) |
| **Data Processing** | Pandas, NumPy, Joblib |
| **Visualization** | Matplotlib, Seaborn, Plotly |
| **Version Control** | Git & GitHub |

---

## Project Architecture

```text
Scholarship-Predictor-System/
│
├── app/
│   ├── app.py                    # Streamlit Dashboard (5 tabs)
│   └── Banner.jpg                # Dashboard header banner
│
├── data/
│   └── scholarship.db            # SQLite database (seeded by generator)
│
├── data_generation/
│   └── generator.py              # Synthesizes 1,000 records → CSV + DB
│
├── src/
│   ├── __init__.py               # Package marker
│   ├── data_pipeline.py          # Preprocessing: load, split, scale, encode
│   ├── db_setup.py               # SQLite schema & initialization
│   ├── model_trainer.py          # Train RF + XGBoost, save best pipeline
│   └── test_lightgbm.py          # LightGBM experimental benchmark
│
├── models/
│   ├── scholarship_model.pkl     # Trained Pipeline (preprocessor + model)
│   ├── shap_explainer.pkl        # Pre-built SHAP TreeExplainer
│   ├── preprocessor.pkl          # Fitted ColumnTransformer
│   ├── X_train.npy / X_test.npy  # Processed feature arrays
│   └── y_train.npy / y_test.npy  # Target arrays
│
├── frontend/                     # Enterprise React App
│   ├── src/pages/                # Tejas UI Views (Decision Center, Admin, etc.)
│   └── package.json              # Frontend dependencies
│
├── backend/                      # FastAPI Backend Server
│   └── main.py                   # REST API exposing ML predict endpoint
│
├── notebooks/
│   ├── 1_preprocessing.ipynb     # EDA & cleaning exploration
│   ├── 2_eda.ipynb               # Exploratory Data Analysis
│   └── 3_model_training.ipynb    # Original model training notebook
│
├── Documentation/
│   └── requirements.txt          # Python dependencies
│
├── .gitignore                    # Excludes .csv, .pkl, .db, node_modules
└── README.md                     # This file
```

---

##  Installation & Usage

**Note:** Model artefacts (`.pkl`, `.npy`), datasets (`.csv`), and the database (`.db`) are **git-ignored**. You must generate them locally after cloning.

### 1. Clone the Repository

```bash
git clone https://github.com/rsp45/Scholarship-Predictor-System.git
cd Scholarship-Predictor-System
```

### 2. Install Dependencies

```bash
pip install -r Documentation/requirements.txt
```

### 3. Generate Data & Seed Database

Run the generator to create `raw_data.csv` **and** seed `data/scholarship.db` with 1,000 synthetic applicant records:

```bash
python data_generation/generator.py
```

### 4. Run the Data Pipeline

Preprocess features, fit the scaler/encoder, and save train/test arrays:

```bash
python -m src.data_pipeline
```

### 5. Train the Model

Train RandomForest + XGBoost, auto-select the best model, and generate the SHAP explainer:

```bash
python -m src.model_trainer
```

### 6. Launch Dashboard

```bash
python -m streamlit run app/app.py
```

*The app will open in your browser at `http://localhost:8501`.*

---

## Model Performance

We train **RandomForestRegressor** and **XGBRegressor** in parallel, then auto-select the winner based on R² and MAE on the held-out test set.

| Model | R² Score | MAE |
| :--- | :---: | :---: |
| RandomForest | ~0.95 | ~1.3 |
| XGBoost | ~0.96 | ~1.1 |
| LightGBM (experimental) | ~0.96 | ~1.1 |

The winning model is combined with the preprocessor into a single **Scikit-Learn Pipeline** and a **SHAP TreeExplainer** is saved alongside it for dashboard explainability.

---

## Project Timeline & Retraining Schedule

| Phase | Date Range | Tasks & Milestones | Retraining |
| :--- | :--- | :--- | :---: |
| **Phase 1:** Project Initiation & Base Setup | Feb 2 – Feb 13, 2026 | Requirement analysis, defining the applicant schema, and building the initial synthetic data generator (`generator.py`) to output raw CSVs. | - |
| Phase 1 Retraining | Feb 15, 2026 (Sun) | Train the initial Base ML Model on static synthetic data. | 🔄 Manual Base Training |
| **Phase 2:** Database Architecture & UI Setup | Feb 16 – Feb 24, 2026 | Initialize SQLite database (`scholarship.db`) and construct the basic Streamlit interface for viewing records. | - |
| Phase 2 Retraining | Feb 22, 2026 (Sun) | Model fine-tuning and initial integration tests with Streamlit. | 🔄 Manual Retraining |
| **Phase 3:** Data Seeding & Schema Mapping | Feb 25 – Feb 28, 2026 | Update `generator.py` to seed the SQLite database directly with 1,000 synthetic applicant records instead of just the CSV. Map Pandas DataFrame columns exactly to the SQLite schema. | - |
| Phase 3 Retraining | Mar 1, 2026 (Sun) | First Automated Pipeline Test: Train model on newly seeded database records. | ⚙️ Automated Retraining |
| **Phase 4:** Updation Pipeline Automation | Mar 2 – Mar 7, 2026 | Script the `data_pipeline.py` extraction process. Automate pulling fresh manual entries from SQLite to merge with `raw_data.csv`. Automate preprocessing. | - |
| Phase 4 Retraining | Mar 8, 2026 (Sun) | Weekly Model Retraining triggered via automated cron job/scheduler. | ⚙️ Automated Retraining |
| **Phase 5:** Streamlit Dashboard Integration | Mar 9 – Mar 14, 2026 | Build UI forms for manual applicant entry to feed directly into SQLite. Implement dynamic filtering, search, and priority score visualizers. | - |
| Phase 5 Retraining | Mar 15, 2026 (Sun) | Weekly Model Retraining on dataset expanded by manual UI entries. | ⚙️ Automated Retraining |
| **Phase 6:** Optimization & Testing | Mar 16 – Mar 21, 2026 | End-to-end testing of the ingestion-to-prediction loop. Optimize SQL query speeds for dashboard loading. Final UI/UX bug fixes. | - |
| Final Retraining | Mar 22, 2026 (Sun) | Final Pre-Submission Model Retraining for maximum accuracy. | ⚙️ Automated Retraining |
| **Phase 7:** Submission | Mar 23 – Mar 25, 2026 | Compile the final project report, detail the pipeline architecture, and prepare for the final Viva/Presentation. | 🏁 Complete |


---

> Built for the **Mid-Term Hackathon 2026**.
