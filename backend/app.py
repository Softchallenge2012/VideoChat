import os
import json
import tempfile
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

import re
# import whisperx
# import torch
# import transformers

import whisper

from google import genai
from moviepy import VideoFileClip
from PIL import Image

from langchain_google_genai import ChatGoogleGenerativeAI
import os
llm = ChatGoogleGenerativeAI(
    model="gemma-4-26b-a4b-it",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.1,
    max_output_tokens=4096
)


app = Flask(__name__, static_folder="../frontend/build", static_url_path="/")
CORS(app)

UPLOAD_FOLDER = tempfile.mkdtemp()
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


@app.route("/api/upload", methods=["POST"])
def upload_video():
    if "video" not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    video_file = request.files["video"]
    if video_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filename = video_file.filename
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    video_file.save(filepath)

    # Generate a mock transcript since we don't have actual audio processing here
    # In production, integrate Whisper or similar
    # ftrans = open('./static/transcript.txt','r')
    # transcript = '\n'.join(ftrans.readlines()) 
    transcript = generate_transcript(filepath, filename)
    print(transcript)
    return jsonify({
        "success": True,
        "filepath": filepath,
        "filename": filename,
        "transcript": transcript
    })

def analyze_video_frame(video_path, timestamp):
    # 1. Extract the frame using MoviePy
    # print(f"Extracting frame at {timestamp}...")
    clip = VideoFileClip(video_path)
    frame_array = clip.get_frame(timestamp)
    clip.close()
    
    # 2. Convert the NumPy array (RGB) to a PIL Image
    img = Image.fromarray(frame_array)
    
    # 3. Initialize the Gemini Client
    # This automatically picks up the GEMINI_API_KEY environment variable
    client = genai.Client()
    
    # 4. Prompt the model with the image
    # print("Analyzing frame with Gemini...")
    response = client.models.generate_content(
        model='gemma-4-26b-a4b-it', #'gemini-2.5-flash',
        contents=[
            img, 
            "Describe what is happening in this video frame in detail. "
            "Who is in it, what is the setting, and what tone does the scene convey?"
        ]
    )
    
    # Print the explanation
    # print("\n--- Frame Analysis ---")
    return response.text

def timestamps_extraction(text):

	# Matches one or more digits, a literal dot, one or more digits, and 's'
	pattern = r'\d+\.\d+s'

	timestamps = re.findall(pattern, text)
	return timestamps


def generate_transcript(filepath, filename):
    """
    Generate transcript from video file.
    In production: use OpenAI Whisper or similar ASR.
    For demo: uses Claude to generate a realistic placeholder.
    """
    transcript = ''
    try:

        # 1. Load the model (options: 'tiny', 'base', 'small', 'medium', 'large')
        model = whisper.load_model("base")

        # 2. Transcribe the audio/video file
        if filepath.find(filename) >-1:
            audio_path = filepath
        else:
            audio_path = os.path.join(filepath, filename)


        result = model.transcribe(audio_path)

        # 3. Print the full text transcript        

        # 4. Optional: Print detailed segments with timestamps
        lines = []
        for segment in result["segments"]:
            start = segment["start"]
            end = segment["end"]
            text = segment["text"]
            lines.append(f"[{start:.2f}s - {end:.2f}s]: {text}")
        transcript = "\n".join(lines)


        return transcript
    except Exception as e:
        return f"[00:00:00] Transcript extraction in progress...\n[00:00:05] Video '{filename}' has been uploaded successfully.\n[00:00:10] Please note: For accurate transcription, integrate an ASR service like OpenAI Whisper.\n\nError details: {str(e)}"


@app.route("/api/query", methods=["POST"])
def query_video():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    query = data.get("query", "")
    transcript = data.get("transcript", "")
    chat_history = data.get("history", [])
    role = data.get("role", "manager")
    filepath = data.get("filepath", "")
    filename = data.get("filename", "")

    print(f"Received query: {query}")
    print(f"Received role: {role}")
    print(f"Received filepath: {filepath}, filename: {filename}")

    if not query:
        return jsonify({"error": "No query provided"}), 400

    try:
        system_prompt = f"""
        You are a helpful  {role}.
        You help understand and query video content based on transcripts.

        The video transcript is:
        ---
        {transcript if transcript else "No transcript available yet. Please upload a video first."}
        ---

        Answer questions about the video content based on this transcript. Be concise, helpful, and reference specific parts of the transcript when relevant. If no transcript is available, guide the user to upload a video first."""

        messages = []
        for msg in chat_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": query})

        full_prompt = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": messages}
            ]
        response = llm.invoke(full_prompt)
        
        respond_text = ""
        thinking_str = ''
        text_str = ''
        for match in re.finditer(r"['\"]type['\"]\s*:\s*['\"]([\w]*)['\"]", str(response.content)):
            type_value = match.group(1)
            if type_value == 'thinking':
                pattern = rf'[\"|\']thinking[\"|\']\s*:\s*[\"|\']([\s\S]*)[\"|\']'
            else:
                pattern = rf'[\"|\']text[\"|\']\s*:\s*[\"|\']([\s\S]*)[\"|\']'
            match_type_value = re.search(pattern, str(response.content))

            if match_type_value:
                text_value = match_type_value.group(1)
            if type_value == 'thinking':
                thinking_str += text_value + '\n'

            if type_value == 'text':
                text_str += text_value + '\n'
        respond_text = text_str
        
        timestamps = timestamps_extraction(text_str)
        for t in timestamps:
            try:
                timestamp_float = float(t[:-1])  # Remove the 's' and convert to float
                hours_val = timestamp_float // 3600
                minutes_val = (timestamp_float % 3600) // 60
                seconds_val = timestamp_float % 60

                timestamp_str = f"{hours_val:02.0f}:{minutes_val:02.0f}:{seconds_val:02.0f}"
                frame_analysis = analyze_video_frame(filepath, timestamp_str)
                respond_text = respond_text.replace(t, f"{t} [Frame Analysis: {frame_analysis}]")
            except Exception as e:
                respond_text += f"\n[Error analyzing frame at {t}]: {str(e)}\n"

        full_prompt = [
            {"role": "system", "content": system_prompt + "Also use the additional details from the movie scenes to make the explanation more detailed:" + respond_text},
            {"role": "user", "content": messages}
            ]
        response = llm.invoke(full_prompt)
        
        respond_text = ""
        thinking_str = ''
        text_str = ''
        for match in re.finditer(r"['\"]type['\"]\s*:\s*['\"]([\w]*)['\"]", str(response.content)):
            type_value = match.group(1)
            if type_value == 'thinking':
                pattern = rf'[\"|\']thinking[\"|\']\s*:\s*[\"|\']([\s\S]*)[\"|\']'
            else:
                pattern = rf'[\"|\']text[\"|\']\s*:\s*[\"|\']([\s\S]*)[\"|\']'
            match_type_value = re.search(pattern, str(response.content))

            if match_type_value:
                text_value = match_type_value.group(1)
            if type_value == 'thinking':
                thinking_str += text_value + '\n'

            if type_value == 'text':
                text_str += text_value + '\n'

        answer = text_str
        return jsonify({"success": True, "answer": answer})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/video/<filename>")
def serve_video(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
