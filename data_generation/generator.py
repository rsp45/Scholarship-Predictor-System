# FILE: data_generation/generator.py
import pandas as pd
import numpy as np
import os
import random

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

N_STUDENTS = 1000

print(f"Generating data for {N_STUDENTS} students...")

# --- 1. Generate IDs and Names ---
first_names = ["Aarav", "Vihaan", "Aditya", "Sai", "Rohan", "Priya", "Ananya", "Diya", "Isha", "Sneha", "Rahul", "Vikram", "Neha", "Pooja", "Karan", "Arjun"]
last_names = ["Patil", "Deshmukh", "Joshi", "Kulkarni", "Sharma", "Singh", "Yadav", "Pawar", "Sawant", "Gaikwad", "Chavan", "Shinde", "Kale", "More", "Rao"]

names = [f"{random.choice(first_names)} {random.choice(last_names)}" for _ in range(N_STUDENTS)]
app_ids = [f"APP-2025-{i:04d}" for i in range(1, N_STUDENTS + 1)]

# --- 2. Generate Features ---
data = {
    'Application_ID': app_ids,  # NEW
    'Applicant_Name': names,    # NEW
    
    # Financial
    'Family_Income': np.random.lognormal(mean=13.0, sigma=0.6, size=N_STUDENTS).clip(150000, 3000000).astype(int),
    
    # Social
    'Caste_Category': np.random.choice(['General', 'OBC', 'SC', 'ST'], size=N_STUDENTS, p=[0.50, 0.27, 0.15, 0.08]),
    'Domicile_Maharashtra': np.random.choice([1, 0], size=N_STUDENTS, p=[0.65, 0.35]),
    
    # Academic
    'Mh_CET_Percentile': np.random.uniform(40, 99.9, N_STUDENTS).round(2),
    'JEE_Percentile': np.random.uniform(40, 99.9, N_STUDENTS).round(2),
    'University_Test_Score': np.random.normal(65, 15, N_STUDENTS).clip(30, 100).round(1),
    '12th_Percentage': np.random.normal(75, 10, N_STUDENTS).clip(50, 99.9).round(1),
    'Extracurricular_Score': np.random.randint(0, 11, N_STUDENTS)
}

df = pd.DataFrame(data)

# --- 3. Calculate Logic (Target Variable) ---
# Normalize Income (Higher income = Lower need score)
income_score = 100 * np.exp(-df['Family_Income'] / 1000000)

# Merit Score
merit_score = (df['Mh_CET_Percentile'] + df['JEE_Percentile'] + df['12th_Percentage']) / 3

# Policy Bonus
policy_bonus = np.where(df['Caste_Category'] == 'General', 0, 
               np.where(df['Caste_Category'] == 'OBC', 5, 
               np.where(df['Caste_Category'] == 'SC', 10, 15)))
domicile_bonus = df['Domicile_Maharashtra'] * 5

# Final Calculation
raw_target = (income_score * 0.4) + (merit_score * 0.4) + policy_bonus + domicile_bonus + df['Extracurricular_Score']

# Add noise and Clip
df['Scholarship_Priority_Score'] = np.clip(raw_target + np.random.normal(0, 3, N_STUDENTS), 0, 100).round(1)

# --- 4. Save ---
# Save in the SAME folder as this script
current_dir = os.path.dirname(os.path.abspath(__file__))
save_path = os.path.join(current_dir, 'raw_data.csv')

df.to_csv(save_path, index=False)
print(f"SUCCESS: Data saved to {save_path}")
print(df.head())