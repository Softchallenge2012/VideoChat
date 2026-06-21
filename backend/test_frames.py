# import env  # Make sure your GEMINI_API_KEY is set in your environment
from google import genai
from moviepy import VideoFileClip
from PIL import Image

def analyze_video_frame(video_path, timestamp):
    # 1. Extract the frame using MoviePy
    print(f"Extracting frame at {timestamp}...")
    clip = VideoFileClip(video_path)
    frame_array = clip.get_frame(timestamp)
    clip.close()
    
    # 2. Convert the NumPy array (RGB) to a PIL Image
    img = Image.fromarray(frame_array)
    
    # 3. Initialize the Gemini Client
    # This automatically picks up the GEMINI_API_KEY environment variable
    client = genai.Client()
    
    # 4. Prompt the model with the image
    print("Analyzing frame with Gemini...")
    response = client.models.generate_content(
        model='gemma-4-26b-a4b-it', #'gemini-2.5-flash',
        contents=[
            img, 
            "Describe what is happening in this video frame in detail. "
            "Who is in it, what is the setting, and what tone does the scene convey?"
        ]
    )
    
    # Print the explanation
    print("\n--- Frame Analysis ---")
    print(response.text)

def timestamps_extraction(text):
	import re

	# Matches one or more digits, a literal dot, one or more digits, and 's'
	pattern = r'\d+\.\d+s'

	timestamps = re.findall(pattern, text)
	return timestamps

if __name__ == "__main__":
	video_path  = 'video_normed.mp4'
	# t = '20.00s'
	# timestamp_float = float(t[:-1])  # Remove the 's' and convert to float
	# hours_val = timestamp_float // 3600
	# minutes_val = (timestamp_float % 3600) // 60
	# seconds_val = timestamp_float % 60

	# timestamp_str = f"{hours_val:02.0f}:{minutes_val:02.0f}:{seconds_val:02.0f}"
	# print(timestamp_str)            
	# analyze_video_frame(video_path, timestamp)

	text = """Based on the transcript, the video appears to be a dramatic scene involving political maneuvering and an investigation. The main plot points include:

	* **Media Strategy:** Planning a press conference for 12 o'clock [0.00s] and strategizing how to handle the first question [2.00s].
	* **Investigation:** Looking into a report regarding "Tino" and a previous conviction involving probation [16.00s - 22.00s].
	* **A Risky Move:** Deciding to head to a boy's apartment at 515 South Fifth Street [39.00s - 41.00s]"""

	timestamps_extraction(text)