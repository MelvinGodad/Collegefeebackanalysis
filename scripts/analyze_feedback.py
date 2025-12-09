import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from textblob import TextBlob
import os
import json
import numpy as np

# Ensure output directory exists
os.makedirs('d:/CampusLifeAnalysis/output', exist_ok=True)
os.makedirs('d:/CampusLifeAnalysis/data', exist_ok=True)

def analyze_sentiment(text):
    if not isinstance(text, str):
        return 0
    return TextBlob(text).sentiment.polarity

def get_sentiment_category(polarity):
    if polarity > 0.1:
        return 'Positive'
    elif polarity < -0.1:
        return 'Negative'
    else:
        return 'Neutral'

# Keyword-based classifier
def classify_feedback(text):
    text = text.lower()
    if any(word in text for word in ['speaker', 'inaudible', 'talk', 'content']):
        return 'Speaker Quality'
    elif any(word in text for word in ['venue', 'hot', 'cold', 'seats', 'ac', 'location']):
        return 'Venue & Logistics'
    elif any(word in text for word in ['time', 'late', 'schedule', 'long']):
        return 'Time Management'
    elif any(word in text for word in ['food', 'categorization', 'managed', 'organized', 'effort']):
        return 'Organization'
    else:
        return 'General'

def main():
    # Load Data
    input_path = "d:/CampusLifeAnalysis/data/student_feedback.csv"
    try:
        df = pd.read_csv(input_path)
    except FileNotFoundError:
        print(f"Error: {input_path} not found. Run generate_feedback.py first.")
        return

    print("Data loaded successfully.")
    
    # 1. Sentiment Analysis
    df['Polarity'] = df['Comments'].apply(analyze_sentiment)
    df['Sentiment'] = df['Polarity'].apply(get_sentiment_category)
    
    # 2. Feedback Classification
    df['Category'] = df['Comments'].apply(classify_feedback)

    # 3. Satisfaction Score (Rating normalized to 0-1 + Polarity) / 2
    # Rating 1-5 -> 0-1: (Rating - 1) / 4
    df['Satisfaction_Score'] = ((df['Rating'] - 1) / 4 + df['Polarity']) / 2 * 100 # Scaled to percentage roughly
    
    # Save processed CSV
    df.to_csv("d:/CampusLifeAnalysis/output/processed_feedback.csv", index=False)
    
    # --- Generate JSON for Dashboard ---
    
    # Overall Metrics
    total_responses = len(df)
    avg_rating = round(df['Rating'].mean(), 2)
    top_event = df.groupby('Event_Name')['Rating'].mean().idxmax()
    avg_satisfaction = round(df['Satisfaction_Score'].mean(), 1)
    
    # Chart Data 1: Ratings Dist
    ratings_dist = df['Rating'].value_counts().sort_index().to_dict()
    
    # Chart Data 2: Sentiment Dist
    sentiment_dist = df['Sentiment'].value_counts().to_dict()
    
    # Chart Data 3: Avg Rating by Event
    event_ratings = df.groupby('Event_Name')['Rating'].mean().sort_values(ascending=False).to_dict()
    
    # Chart Data 4: Avg Satisfaction by Dept
    dept_satisfaction = df.groupby('Department')['Satisfaction_Score'].mean().sort_values(ascending=False).to_dict()

    # Chart Data 5: Feedback Categories
    category_counts = df['Category'].value_counts().to_dict()
    
    # Chart Data 6: Word Cloud Keywords (Simple Frequency)
    # Combining all comments
    all_text = " ".join(df['Comments'].dropna().astype(str)).lower()
    # Very basic "word cloud" data - top 20 words (excluding stops would be better but keeping simple without nltk)
    words = all_text.split()
    from collections import Counter
    # Removing common stopwords manually for simplicity since nltk might not be present
    stopwords = set(['the', 'was', 'and', 'to', 'a', 'of', 'in', 'it', 'is', 'for', 'but', 'not', 'very', 'by'])
    filtered_words = [w.strip(".,!") for w in words if w.strip(".,!") not in stopwords and len(w) > 3]
    word_freq = dict(Counter(filtered_words).most_common(30))

    dashboard_data = {
        "metrics": {
            "total_responses": total_responses,
            "avg_rating": avg_rating,
            "top_event": top_event,
            "avg_satisfaction": avg_satisfaction
        },
        "charts": {
            "ratings_dist": ratings_dist,
            "sentiment_dist": sentiment_dist,
            "event_ratings": event_ratings,
            "dept_satisfaction": dept_satisfaction,
            "category_counts": category_counts,
            "word_cloud": word_freq
        },
        "raw_data": df[['Event_Name', 'Department', 'Year', 'Rating', 'Sentiment', 'Category', 'Comments']].to_dict(orient='records')
    }
    
    with open('d:/CampusLifeAnalysis/data/dashboard_data.js', 'w') as f:
        json_str = json.dumps(dashboard_data, indent=4)
        f.write(f"window.dashboardData = {json_str};")
        
    print("Analysis complete. Data exported to d:/CampusLifeAnalysis/data/dashboard_data.js")

    # Keep static plots for report functionality? OR removing them since we are moving to dashboard.
    # The user manual "report" might still use them. I'll minimalize image generation to save time if they prefer the dashboard.
    # Leaving image generation out as per new "Professional Dashboard" focus, relying on JSON.

if __name__ == "__main__":
    main()
