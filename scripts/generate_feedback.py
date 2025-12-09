import pandas as pd
import random
import datetime

def generate_data(num_records=100):
    events = [
        "Tech Fest 2024", "Cultural Night", "AI Workshop", 
        "Career Fair", "Music Concert", "Hackathon"
    ]
    departments = ["CS", "IT", "Electronics", "Mechanical", "Civil", "Management"]
    years = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
    
    comments_positive = [
        "Amazing event! learned a lot.",
        "Great categorization and well managed.",
        "Really enjoyed the speakers.",
        "The food was delicious!",
        "Best event of the year!",
        "Everything was perfect."
    ]
    
    comments_neutral = [
        "It was okay.",
        "Good but could be better.",
        "Average experience.",
        "Not bad, but timing was off.",
        "Decent effort by the team."
    ]
    
    comments_negative = [
        "Very poorly organized.",
        "Waste of time.",
        "The venue was too hot.",
        "Speaker was inaudible.",
        "Boring and unengaging.",
        "Started very late."
    ]
    
    suggestions_list = [
        "Start on time next time.",
        "Provide water bottles.",
        "Better microphone needed.",
        "More hands-on activities.",
        "Keep the hall cooler.",
        "Send slides after the event.",
        "Invite more industry experts.",
        "No suggestions, it was good."
    ]
    
    data = []
    
    for _ in range(num_records):
        event = random.choice(events)
        dept = random.choice(departments)
        year = random.choice(years)
        
        # Correlate rating with comment somewhat
        rating_seed = random.random()
        if rating_seed > 0.7:
            rating = random.randint(4, 5)
            comment = random.choice(comments_positive)
            attend_again = "Yes"
        elif rating_seed > 0.3:
            rating = random.randint(2, 4)
            comment = random.choice(comments_neutral)
            attend_again = random.choice(["Yes", "No"])
        else:
            rating = random.randint(1, 2)
            comment = random.choice(comments_negative)
            attend_again = "No"
            
        timestamp = datetime.datetime(2024, random.randint(1, 12), random.randint(1, 28))
        
        data.append({
            "Timestamp": timestamp,
            "Event_Name": event,
            "Department": dept,
            "Year": year,
            "Rating": rating,
            "Comments": comment,
            "Suggestions": random.choice(suggestions_list),
            "Attend_Again": attend_again
        })
        
    df = pd.DataFrame(data)
    output_path = "d:/CampusLifeAnalysis/data/student_feedback.csv"
    df.to_csv(output_path, index=False)
    print(f"Generated {num_records} records to {output_path}")

if __name__ == "__main__":
    generate_data(200)
