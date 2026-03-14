# FILE: src/visualizations.py
# ===========================================================================
# Plotly visualization component library for the Scholarship Predictor EDA.
# Each function accepts a pandas DataFrame and returns a plotly Figure.
# ===========================================================================

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go


def plot_3d_decision_landscape(df: pd.DataFrame) -> go.Figure:
    """
    3D scatter plot showing how Family Income and 12th Percentage
    relate to the Scholarship Priority Score, colored by Caste Category.
    """
    fig = px.scatter_3d(
        df,
        x="Family_Income",
        y="12th_Percentage",
        z="Scholarship_Priority_Score",
        color="Caste_Category",
        title="3D Decision Landscape — Income × Academics × Priority Score",
        labels={
            "Family_Income": "Family Income (₹)",
            "12th_Percentage": "12th Percentage",
            "Scholarship_Priority_Score": "Priority Score",
            "Caste_Category": "Caste Category",
        },
        opacity=0.7,
    )
    fig.update_layout(
        scene=dict(
            xaxis_title="Family Income (₹)",
            yaxis_title="12th Percentage",
            zaxis_title="Priority Score",
        ),
        margin=dict(l=0, r=0, b=0, t=40),
    )
    return fig


def plot_applicant_journey(df: pd.DataFrame) -> go.Figure:
    """
    Parallel coordinates plot tracing an applicant's journey through
    key numeric milestones to the final Priority Score.
    """
    fig = px.parallel_coordinates(
        df,
        dimensions=[
            "Family_Income",
            "10th_Percentage",
            "12th_Percentage",
            "Mh_CET_Percentile",
            "Scholarship_Priority_Score",
        ],
        color="Scholarship_Priority_Score",
        color_continuous_scale=px.colors.sequential.Viridis,
        title="Applicant Journey — Income → Academics → Priority Score",
        labels={
            "Family_Income": "Family Income (₹)",
            "10th_Percentage": "10th %",
            "12th_Percentage": "12th %",
            "Mh_CET_Percentile": "MH-CET Percentile",
            "Scholarship_Priority_Score": "Priority Score",
        },
    )
    return fig


def plot_demographic_sunburst(df: pd.DataFrame) -> go.Figure:
    """
    Sunburst chart showing the hierarchical breakdown of applicants
    by Caste Category → Gender → College Branch, colored by average
    Scholarship Priority Score.
    """
    fig = px.sunburst(
        df,
        path=["Caste_Category", "Gender", "College_Branch"],
        values=None,
        color="Scholarship_Priority_Score",
        color_continuous_scale=px.colors.sequential.RdBu,
        title="Demographic Sunburst — Caste × Gender × Branch",
    )
    fig.update_layout(margin=dict(l=0, r=0, b=0, t=40))
    return fig
