import streamlit as st
import pandas as pd
import numpy as np
import joblib
import os

# ==========================================
# 1. SETUP & CONFIGURATION
# ==========================================
st.set_page_config(
    page_title="Scholarship Priority System",
    page_icon="🎓",
    layout="wide"
)

# Dynamic Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'scholarship_model.pkl')
DATA_PATH = os.path.join(BASE_DIR, 'data_generation', 'raw_data.csv')

# ==========================================
# 2. LOAD RESOURCES (Cached for Speed)
# ==========================================
@st.cache_resource
def load_resources():
    # Load Model
    try:
        pipeline = joblib.load(MODEL_PATH)
    except FileNotFoundError:
        st.error("❌ Model file not found. Please run '3_model_training.ipynb' first.")
        return None, None

    # Load Data (for Search functionality)
    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        st.error("❌ Data file not found. Please run 'generator.py' first.")
        return None, None
        
    return pipeline, df

pipeline, df_students = load_resources()

# ==========================================
# 3. HELPER: PREDICTION FUNCTION
# ==========================================
def predict_score(input_df):
    """
    Takes a single-row DataFrame with the 8 required features 
    and returns the Score + Status.
    """
    try:
        # Get raw prediction
        prediction = pipeline.predict(input_df)[0]
        score = np.clip(prediction, 0, 100)
        
        # Determine Status
        if score >= 80:
            status = "High Priority (Full Aid)"
            color = "green"
        elif score >= 50:
            status = "Medium Priority (Partial Aid)"
            color = "orange"
        else:
            status = "Low Priority (No Aid)"
            color = "red"
            
        return score, status, color
    except Exception as e:
        st.error(f"Prediction Error: {e}")
        return 0, "Error", "gray"

# ==========================================
# 4. DASHBOARD UI
# ==========================================
st.title("🎓 Intelligent Scholarship Allocator")
st.markdown("### ML-Powered Decision Support System")

# Create Tabs
tab1, tab2 = st.tabs(["📝 Manual Entry", "🔍 Search Applicant"])

# --------------------------------------------------------------------------
# TAB 1: MANUAL ENTRY (The "What-If" Scenario)
# --------------------------------------------------------------------------
with tab1:
    st.write("Enter student details manually to check eligibility.")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Financial & Social")
        income = st.number_input("Annual Family Income (₹)", min_value=0, value=450000, step=10000)
        caste = st.selectbox("Caste Category", ['General', 'OBC', 'SC', 'ST'])
        domicile = st.radio("Domicile State", ["Maharashtra", "Other"], horizontal=True)
        is_maharashtra = 1 if domicile == "Maharashtra" else 0
        
    with col2:
        st.subheader("Academic Merit")
        hsc = st.slider("12th Grade %", 40.0, 100.0, 75.0)
        cet = st.slider("Mh-CET Percentile", 0.0, 100.0, 80.0)
        jee = st.slider("JEE Mains Percentile", 0.0, 100.0, 70.0)
        uni = st.slider("University Entrance Score", 0.0, 100.0, 65.0)
        extra = st.number_input("Extracurricular Score (0-10)", 0, 10, 5)

    if st.button("🚀 Calculate Priority (Manual)", type="primary"):
        # Prepare Input Data (Must match training columns EXACTLY)
        input_data = pd.DataFrame({
            'Family_Income': [income],
            'Caste_Category': [caste],
            'Domicile_Maharashtra': [is_maharashtra],
            'Mh_CET_Percentile': [cet],
            'JEE_Percentile': [jee],
            'University_Test_Score': [uni],
            '12th_Percentage': [hsc],
            'Extracurricular_Score': [extra]
        })
        
        # Get Prediction
        score, status, color = predict_score(input_data)
        
        # Display
        st.divider()
        m1, m2 = st.columns([1, 2])
        with m1:
            st.metric("Predicted Score", f"{score:.2f} / 100")
        with m2:
            st.markdown(f"### Recommendation: :{color}[{status}]")

# --------------------------------------------------------------------------
# TAB 2: SEARCH APPLICANT (The "Database" Scenario)
# --------------------------------------------------------------------------
with tab2:
    if df_students is not None:
        st.write("Search for an existing student from the database.")
        
        # Search Box
        # We create a list of strings like "Aarav Patil (APP-2025-0001)" for easy searching
        student_list = [f"{row['Applicant_Name']} ({row['Application_ID']})" for _, row in df_students.iterrows()]
        selected_student_str = st.selectbox("Search by Name or ID", student_list)
        
        # Extract the Application ID from the string to find the row
        selected_id = selected_student_str.split('(')[-1].replace(')', '')
        
        if st.button("🔍 Fetch & Predict", type="secondary"):
            # 1. Find the Row in DataFrame
            student_row = df_students[df_students['Application_ID'] == selected_id].iloc[0]
            
            # 2. Display Student Profile
            st.divider()
            st.subheader(f"Profile: {student_row['Applicant_Name']}")
            
            info1, info2, info3 = st.columns(3)
            with info1:
                st.write(f"**ID:** {student_row['Application_ID']}")
                st.write(f"**Category:** {student_row['Caste_Category']}")
            with info2:
                st.write(f"**Income:** ₹{student_row['Family_Income']:,}")
                st.write(f"**Domicile:** {'Maharashtra' if student_row['Domicile_Maharashtra']==1 else 'Other'}")
            with info3:
                st.write(f"**12th %:** {student_row['12th_Percentage']}")
                st.write(f"**CET %:** {student_row['Mh_CET_Percentile']}")

            # 3. Prepare Data for Model (Filter only the 8 required columns)
            # The model will CRASH if we pass Name/ID, so we explicitly select features
            model_input = pd.DataFrame([student_row])[[
                'Family_Income', 'Caste_Category', 'Domicile_Maharashtra', 
                'Mh_CET_Percentile', 'JEE_Percentile', 'University_Test_Score', 
                '12th_Percentage', 'Extracurricular_Score'
            ]]
            
            # 4. Predict
            score, status, color = predict_score(model_input)
            
            # 5. Display Result
            st.success(f"### Priority Score: {score:.2f}")
            st.caption(f"Status: {status}")