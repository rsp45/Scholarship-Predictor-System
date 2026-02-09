import streamlit as st
import pandas as pd
import numpy as np
import joblib
import os
import matplotlib.pyplot as plt
import seaborn as sns


# 1. SETUP & CONFIGURATION

st.set_page_config(
    page_title="Scholarship Priority System",
    page_icon="🎓",
    layout="wide"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .metric-card {background-color: #f0f2f6; padding: 20px; border-radius: 10px; border-left: 5px solid #4CAF50;}
    .timeline-box {background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin-bottom: 10px;}
</style>
""", unsafe_allow_html=True)

# Dynamic Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'scholarship_model.pkl')
DATA_PATH = os.path.join(BASE_DIR, 'data_generation', 'raw_data.csv')


# 2. LOAD RESOURCES (Cached)

@st.cache_resource
def load_resources():
    try:
        pipeline = joblib.load(MODEL_PATH)
    except FileNotFoundError:
        st.error("❌ Model not found. Please run '3_model_training.ipynb'.")
        return None, None

    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        st.error("❌ Data not found. Please run 'generator.py'.")
        return None, None
        
    return pipeline, df

pipeline, df_students = load_resources()


# 3. HELPER FUNCTIONS

def predict_score(input_df):
    try:
        prediction = pipeline.predict(input_df)[0]
        score = np.clip(prediction, 0, 100)
        
        if score >= 80:
            tier = "High Priority (Full Scholarship)"
            color = "green"
        elif score >= 50:
            tier = "Medium Priority (Partial Aid)"
            color = "orange"
        else:
            tier = "Low Priority (No Aid)"
            color = "red"
            
        return score, tier, color
    except Exception as e:
        return 0, f"Error: {e}", "gray"

def plot_distribution(current_score, population_scores):
    """Plots the student's position relative to the population."""
    fig, ax = plt.subplots(figsize=(8, 3))
    sns.kdeplot(population_scores, fill=True, color="#3b82f6", alpha=0.3, ax=ax)
    
    # Add vertical line for current student
    ax.axvline(current_score, color='red', linestyle='--', linewidth=2, label='Current Applicant')
    ax.text(current_score + 2, 0.005, f'You: {current_score:.1f}', color='red', fontweight='bold')
    
    ax.set_title("Applicant Position in Population", fontsize=10)
    ax.set_xlabel("Priority Score")
    ax.set_yticks([]) # Hide y-axis
    ax.set_xlim(0, 100)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    
    return fig


# 4. SIDEBAR (Input Controls)

with st.sidebar:
    st.header("🎛️ Input Parameters")
    st.info("Adjust values to simulate a student profile.")
    
    income = st.number_input("Annual Family Income (₹)", 0, 5000000, 450000, step=10000)
    caste = st.selectbox("Caste Category", ['General', 'OBC', 'SC', 'ST'])
    domicile = st.radio("Domicile State", ["Maharashtra", "Other"], horizontal=True)
    is_maharashtra = 1 if domicile == "Maharashtra" else 0
    
    st.divider()
    st.subheader("Academic Merit")
    hsc = st.slider("12th Grade %", 40.0, 100.0, 75.0)
    cet = st.slider("Mh-CET Percentile", 0.0, 100.0, 80.0)
    jee = st.slider("JEE Mains Percentile", 0.0, 100.0, 70.0)
    uni = st.slider("University Test Score", 0.0, 100.0, 65.0)
    extra = st.slider("Extracurriculars (0-10)", 0, 10, 5)


# 5. MAIN DASHBOARD UI

st.title("🎓 Intelligent Scholarship Allocator")

# Create Tabs
tab1, tab2, tab3 = st.tabs(["📝 Prediction Dashboard", "ℹ️ Criteria & Legend", "📅 Project Timeline"])

# --- TAB 1: PREDICTION ---
with tab1:
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("Prediction Result")
        
        # Prepare Input
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
        
        # Predict
        if st.button("🚀 Calculate Priority Score", type="primary"):
            score, tier, color = predict_score(input_data)
            
            # Display Score Card
            st.markdown(f"""
            <div class="metric-card" style="border-left: 5px solid {color};">
                <h2 style="margin:0; color:{color};">{score:.2f} / 100</h2>
                <h4 style="margin:0;">{tier}</h4>
            </div>
            """, unsafe_allow_html=True)
            
            # Plot Distribution
            st.divider()
            if df_students is not None:
                st.write("### 📊 Market Position")
                st.caption("How this student compares to all other applicants:")
                fig = plot_distribution(score, df_students['Scholarship_Priority_Score'])
                st.pyplot(fig)
        else:
            st.info("👈 Adjust parameters in the sidebar and click Calculate.")

    with col2:
        st.subheader("🔍 Database Lookup")
        if df_students is not None:
            student_list = [f"{row['Applicant_Name']} ({row['Application_ID']})" for _, row in df_students.iterrows()]
            search_selection = st.selectbox("Quick Search", student_list)
            
            if st.button("Load Student"):
                sel_id = search_selection.split('(')[-1].replace(')', '')
                student_row = df_students[df_students['Application_ID'] == sel_id].iloc[0]
                
                # Show quick stats
                st.write(f"**Name:** {student_row['Applicant_Name']}")
                st.write(f"**Income:** ₹{student_row['Family_Income']:,}")
                st.write(f"**CET:** {student_row['Mh_CET_Percentile']}%")
                
                # Auto-predict for them
                model_input = pd.DataFrame([student_row])[[
                    'Family_Income', 'Caste_Category', 'Domicile_Maharashtra', 
                    'Mh_CET_Percentile', 'JEE_Percentile', 'University_Test_Score', 
                    '12th_Percentage', 'Extracurricular_Score'
                ]]
                s, t, c = predict_score(model_input)
                st.markdown(f"**Predicted:** :{c}[{s:.1f}]")

# --- TAB 2: CRITERIA & LEGEND ---
with tab2:
    c1, c2 = st.columns(2)
    
    with c1:
        st.header("⚖️ Scoring Criteria")
        st.markdown("""
        The Algorithm calculates priority based on 3 pillars:
        
        **1. 💰 Financial Need (40%)**
        * Prioritizes lower-income families.
        * Uses Log-Normal decay (poorer = much higher score).
        
        **2. 🏆 Academic Merit (40%)**
        * Average of 12th Grade, CET, and JEE scores.
        * Rewards hard work and consistency.
        
        **3. 📜 Social Policy (20%)**
        * **Caste:** Bonuses for SC/ST/OBC (Govt Norms).
        * **Domicile:** Bonus for State Residents.
        """)
        
    with c2:
        st.header("🚦 Score Legend")
        st.markdown("""
        | Score Range | Tier | Action |
        | :--- | :--- | :--- |
        | **80 - 100** | 🟢 **High Priority** | **Full Scholarship** (100% Waiver) |
        | **50 - 79** | 🟠 **Medium Priority** | **Partial Aid** (50% Waiver) |
        | **0 - 49** | 🔴 **Low Priority** | **No Aid** Recommended |
        """)

# --- TAB 3: TIMELINE ---
with tab3:
    st.header("📅 Project Roadmap")
    
    st.markdown("### **Phase 1: Midterm (Current Status)**")
    st.success("✅ **Feb 2026:** Developed Ridge Regression Model, Synthetic Data Generator, and Streamlit Dashboard.")
    
    st.markdown("### **Phase 2: End-Term Goals**")
    st.warning("🚧 **April 2026:** Integration of **SQL Database** for persistent storage and **Random Forest** model for better accuracy.")
    
    st.markdown("### **Phase 3: Maintenance**")
    st.info("🛠️ **July 2026:** Annual model retraining with new admission cycle data and policy parameter updates.")