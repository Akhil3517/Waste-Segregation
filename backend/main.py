from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
import base64
import json
import os
import time
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Initialize Flask App ---
app = Flask(__name__)
CORS(app)

# --- MongoDB Configuration ---
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "smart_waste_segregation")

# Initialize MongoDB variables
client = None
db = None
requests_collection = None

def connect_mongodb():
    global client, db, requests_collection
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Test the connection
        client.admin.command('ping')
        db = client[DB_NAME]
        requests_collection = db.requests
        print("✅ MongoDB connected successfully")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("💡 Make sure MongoDB is installed and running")
        client = None
        db = None
        requests_collection = None
        return False

# Try to connect to MongoDB
connect_mongodb()

# --- Configuration ---
# It's highly recommended to set your API key as an environment variable
# for security.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") # Leave empty if not using a key
if not GEMINI_API_KEY:
    print("⚠️ WARNING: GEMINI_API_KEY environment variable not set.")
else:
    print("✅ GEMINI_API_KEY is configured and ready to use.")

# Gemini API URL
GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"


# --- YouTube API Integration for Video Suggestions ---
def get_youtube_suggestions(item_name):
    """Get YouTube video suggestions using YouTube Data API"""
    
    # YouTube API Key - you'll need to get this from Google Cloud Console
    YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
    
    if not YOUTUBE_API_KEY:
        print("⚠️ WARNING: YOUTUBE_API_KEY environment variable not set.")
        return get_fallback_suggestions(item_name)
    
    try:
        # Create search query for upcycling videos
        search_query = f"DIY upcycling {item_name} craft tutorial"
        
        # YouTube Data API v3 search endpoint
        search_url = "https://www.googleapis.com/youtube/v3/search"
        search_params = {
            'part': 'snippet',
            'q': search_query,
            'type': 'video',
            'videoDuration': 'medium',  # 4-20 minutes
            'videoDefinition': 'high',
            'order': 'relevance',
            'maxResults': 5,
            'key': YOUTUBE_API_KEY
        }
        
        response = requests.get(search_url, params=search_params)
        response.raise_for_status()
        
        search_results = response.json()
        
        if 'items' not in search_results or not search_results['items']:
            return get_fallback_suggestions(item_name)
        
        # Get video details for the found videos
        video_ids = [item['id']['videoId'] for item in search_results['items']]
        videos_url = "https://www.googleapis.com/youtube/v3/videos"
        videos_params = {
            'part': 'snippet,contentDetails,statistics',
            'id': ','.join(video_ids),
            'key': YOUTUBE_API_KEY
        }
        
        videos_response = requests.get(videos_url, params=videos_params)
        videos_response.raise_for_status()
        videos_data = videos_response.json()
        
        # Process and format the videos
        suggestions = []
        for video in videos_data.get('items', []):
            # Format duration (PT4M32S -> 4:32)
            duration = video['contentDetails']['duration']
            duration = duration.replace('PT', '').replace('H', ':').replace('M', ':').replace('S', '')
            if duration.startswith(':'):
                duration = '0' + duration
            
            # Format view count
            view_count = int(video['statistics'].get('viewCount', 0))
            if view_count >= 1000000:
                views = f"{view_count // 1000000}M"
            elif view_count >= 1000:
                views = f"{view_count // 1000}K"
            else:
                views = str(view_count)
            
            # Determine difficulty based on duration
            duration_minutes = int(duration.split(':')[0]) if ':' in duration else 0
            if duration_minutes <= 5:
                difficulty = "Easy"
            elif duration_minutes <= 15:
                difficulty = "Medium"
            else:
                difficulty = "Hard"
            
            suggestions.append({
                "title": video['snippet']['title'],
                "url": f"https://www.youtube.com/watch?v={video['id']}",
                "duration": duration,
                "difficulty": difficulty,
                "views": views,
                "thumbnail": video['snippet']['thumbnails']['medium']['url'],
                "channel": video['snippet']['channelTitle']
            })
        
        return suggestions
        
    except requests.exceptions.RequestException as e:
        print(f"❌ YouTube API Error: {e}")
        return get_fallback_suggestions(item_name)
    except Exception as e:
        print(f"❌ Error processing YouTube API response: {e}")
        return get_fallback_suggestions(item_name)

def get_fallback_suggestions(item_name):
    """Fallback suggestions when YouTube API is not available"""
    return [
        {
            "title": f"DIY Upcycling with {item_name} - Creative Recycling",
            "url": f"https://www.youtube.com/results?search_query=DIY+upcycling+{item_name.replace(' ', '+')}",
            "duration": "10:00",
            "difficulty": "Medium",
            "views": "500K"
        },
        {
            "title": f"How to Recycle {item_name} - Easy Craft Tutorial",
            "url": f"https://www.youtube.com/results?search_query=recycle+{item_name.replace(' ', '+')}+craft",
            "duration": "8:30",
            "difficulty": "Easy",
            "views": "300K"
        }
    ]

def get_fallback_detection():
    """Fallback detection when Gemini API is unavailable"""
    return [
        {
            "name": "Waste Item (API Limited)",
            "confidence": 75,
            "location": "center",
            "isReusable": True,
            "binDescription": "General waste bin or local recycling facility",
            "tips": ["API quota reached - this is a fallback detection", "Check local recycling guidelines", "Rinse before recycling"]
        }
    ]

def get_specific_disposal_info_with_gemini(item_name):
    """Get specific disposal information using Gemini AI"""
    try:
        print(f"🤖 Getting disposal info for: {item_name}")
        print(f"🤖 Gemini URL: {GEMINI_URL}")
        print(f"🤖 API Key available: {'Yes' if GEMINI_API_KEY else 'No'}")
        
        prompt = f"""
        You are a waste management expert. For the specific waste item "{item_name}", provide a SHORT disposal method (1-2 lines maximum).

        CRITICAL: Keep it concise and specific to this exact item.

        EXAMPLES BY ITEM TYPE:
        - For "banana peel": "Green waste bin or home composting system"
        - For "plastic bottle": "Blue recycling bin or plastic bottle bank"
        - For "medicine": "Household Hazardous Waste facility"
        - For "battery": "Battery recycling collection point"
        - For "glass bottle": "Glass recycling bin or bottle bank"
        - For "paper": "Paper recycling bin"
        - For "electronics": "E-waste recycling facility"
        - For "food waste": "Green waste bin or composting"
        - For "aluminum can": "Metal recycling bin"
        - For "cardboard": "Paper recycling bin"

        For "{item_name}", provide a SHORT disposal method (1-2 lines only).
        Respond with ONLY the disposal method, nothing else.
        """
        
        response = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            headers={'Content-Type': 'application/json'},
            json={
                'contents': [{
                    'parts': [{'text': prompt}]
                }]
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"🔍 Full Gemini response: {json.dumps(result, indent=2)}")
            if 'candidates' in result and len(result['candidates']) > 0:
                content = result['candidates'][0]['content']['parts'][0]['text']
                print(f"✅ Gemini disposal response: {content.strip()}")
                return content.strip()
            else:
                print(f"❌ No candidates in Gemini response: {result}")
        else:
            print(f"❌ Gemini API error: {response.status_code} - {response.text}")
        
        return "General waste bin or local recycling facility"
    except Exception as e:
        print(f"Error getting disposal info from Gemini: {e}")
        return "General waste bin or local recycling facility"

def get_specific_eco_tips_with_gemini(item_name):
    """Get specific eco tips using Gemini AI"""
    try:
        print(f"🌿 Getting eco tips for: {item_name}")
        prompt = f"""
        You are an environmental expert. For the specific waste item "{item_name}", provide 2-3 SHORT eco tips (1 line each).

        CRITICAL: Keep tips concise and specific to this exact item.

        EXAMPLES BY ITEM TYPE:
        - For "banana peel": ["Use as natural fertilizer for plants", "Add to compost bin for organic waste"]
        - For "plastic bottle": ["Rinse thoroughly before recycling", "Remove cap and recycle separately"]
        - For "medicine": ["Do not flush down toilet", "Check pharmacy for disposal programs"]
        - For "battery": ["Never throw in regular trash", "Use battery recycling points"]
        - For "glass bottle": ["Rinse before recycling", "Remove labels and caps"]
        - For "paper": ["Keep clean and dry", "Remove plastic attachments"]
        - For "electronics": ["Donate if working", "Use e-waste facilities"]

        For "{item_name}", provide 2-3 SHORT eco tips (1 line each).
        Respond with ONLY a JSON array like: ["tip 1", "tip 2"]
        """
        
        response = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            headers={'Content-Type': 'application/json'},
            json={
                'contents': [{
                    'parts': [{'text': prompt}]
                }]
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"🔍 Full Gemini eco tips response: {json.dumps(result, indent=2)}")
            if 'candidates' in result and len(result['candidates']) > 0:
                content = result['candidates'][0]['content']['parts'][0]['text']
                print(f"✅ Gemini eco tips response: {content.strip()}")
                try:
                    # Clean the content - remove any markdown formatting
                    cleaned_content = content.strip()
                    if cleaned_content.startswith('```json'):
                        cleaned_content = cleaned_content.replace('```json', '').replace('```', '').strip()
                    elif cleaned_content.startswith('```'):
                        cleaned_content = cleaned_content.replace('```', '').strip()
                    
                    # Try to parse as JSON array
                    tips = json.loads(cleaned_content)
                    if isinstance(tips, list) and len(tips) >= 2:
                        print(f"✅ Parsed eco tips: {tips[:3]}")
                        return tips[:3]
                except Exception as parse_error:
                    print(f"⚠️ JSON parsing failed: {parse_error}")
                    # If not JSON, split by lines and take first 3
                    lines = content.strip().split('\n')
                    tips = [line.strip() for line in lines if line.strip() and not line.strip().startswith('```')][:3]
                    if tips:
                        print(f"✅ Parsed eco tips from lines: {tips}")
                        return tips
            else:
                print(f"❌ No candidates in Gemini eco tips response: {result}")
        else:
            print(f"❌ Gemini eco tips API error: {response.status_code} - {response.text}")
        
        return [
            "Clean the item before recycling",
            "Check local recycling guidelines",
            "Separate different materials"
        ]
    except Exception as e:
        print(f"Error getting eco tips from Gemini: {e}")
        return [
            "Clean the item before recycling",
            "Check local recycling guidelines",
            "Separate different materials"
        ]

# --- The Main Detection Function using Gemini API ---
def detect_waste_from_image_gemini(image_bytes):
    if not GEMINI_API_KEY:
        return {"error": "Gemini API key is not configured on the server."}

    # 1. Encode the image to Base64
    base64_image = base64.b64encode(image_bytes).decode('utf-8')

    # 2. Note: We removed the schema-based approach since gemini-1.5-flash doesn't support it
    # The prompt now includes explicit JSON formatting instructions

    # 3. Create the prompt for the Gemini API
    prompt = (
        "Analyze this image and identify ALL visible waste items. "
        "For each waste item you can see, identify the item, estimate your confidence (0-100), "
        "provide its specific disposal method (be detailed and specific), 2-3 helpful disposal tips, describe its location in the image, "
        "and determine if it's reusable for crafting (true/false). "
        "Respond with ONLY a valid JSON array containing ALL waste items visible in the image (up to 5 items maximum). "
        "Each item should have: name, confidence (number), binDescription, tips (array), location (string), and isReusable (boolean). "
        "IMPORTANT: For binDescription, you MUST be very specific and detailed. DO NOT use generic terms like 'Recycling Bin'. Instead use specific descriptions like: "
        "- For medicine/pills: 'Household Hazardous Waste or designated pharmaceutical waste disposal' "
        "- For plastic bottles: 'Blue recycling bin for plastics or plastic bottle bank' "
        "- For electronics: 'Special electronics recycling facility or e-waste collection point' "
        "- For glass: 'Glass recycling bin or bottle bank for glass containers' "
        "- For batteries: 'Battery recycling collection point or hazardous waste facility' "
        "- For paper: 'Paper recycling bin or mixed paper collection' "
        "- For organic waste: 'Green waste bin for organic materials or compost bin' "
        "Example format: [{\"name\": \"Medicine blister pack\", \"confidence\": 90, \"binDescription\": \"Household Hazardous Waste or designated pharmaceutical waste disposal\", \"tips\": [\"Do not flush medication down the toilet\", \"Check with your local pharmacy for proper disposal\"], \"location\": \"center\", \"isReusable\": false}]. "
        "Include location descriptions like 'top left', 'center', 'bottom right', etc."
    )

    # 4. Construct the payload for the Gemini API request
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": base64_image
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "topK": 1,
            "topP": 1,
            "maxOutputTokens": 2048
        }
    }

    # 5. Make the API call with retry logic
    max_retries = 3
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            api_url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            print(f"🔍 Making API call to: {api_url} (attempt {attempt + 1}/{max_retries})")
            print(f"🔑 Using API key: {GEMINI_API_KEY[:10]}...")
            
            response = requests.post(
                api_url,
                headers={'Content-Type': 'application/json'},
                data=json.dumps(payload),
                timeout=30  # Add timeout
            )
            
            print(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 503:
                print(f"❌ Service overloaded (503). Attempt {attempt + 1}/{max_retries}")
                if attempt < max_retries - 1:
                    print(f"⏳ Waiting {retry_delay} seconds before retry...")
                    import time
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                    continue
                else:
                    print("🔄 Gemini API overloaded, using fallback detection...")
                    return get_fallback_detection()
            
            if response.status_code == 429:
                print(f"❌ API quota exceeded (429). Attempt {attempt + 1}/{max_retries}")
                print("🔄 Using fallback detection due to quota limit...")
                return get_fallback_detection()
            
            if response.status_code != 200:
                print(f"❌ Error response: {response.text}")
                if attempt < max_retries - 1:
                    print(f"⏳ Retrying in {retry_delay} seconds...")
                    import time
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                else:
                    print("🔄 API call failed, using fallback detection...")
                    return get_fallback_detection()
            
            # 6. Extract and parse the content from the response
            try:
                result = response.json()

                if 'candidates' in result and result['candidates']:
                    content_part = result['candidates'][0]['content']['parts'][0]
                    # Clean the response text to remove markdown code blocks
                    response_text = content_part['text']
                    # Remove markdown code blocks if present
                    if response_text.startswith('```json'):
                        response_text = response_text.replace('```json', '').replace('```', '').strip()
                    elif response_text.startswith('```'):
                        response_text = response_text.replace('```', '').strip()
                    
                    # Parse the cleaned JSON
                    detections = json.loads(response_text)
                    
                    # Check if no items were detected
                    if not detections or len(detections) == 0:
                        return {"message": "No waste detected in the image"}
                    
                    # Process each detection
                    processed_detections = []
                    for item in detections:
                        # Capitalize the name for better display
                        item['name'] = item['name'].capitalize()

                        # Add a unique ID for each detection
                        item['id'] = len(processed_detections) + 1
                        
                        # Ensure confidence is within bounds
                        if 'confidence' in item:
                            item['confidence'] = max(0, min(100, item['confidence']))
                        
                        # ALWAYS replace disposal info with specific info (force it)
                        if 'binDescription' in item:
                            print(f"🔍 Original binDescription: {item['binDescription']}")
                            print(f"🔍 Item name: {item['name']}")
                            new_disposal = get_specific_disposal_info_with_gemini(item['name'])
                            print(f"✅ New disposal from Gemini: {new_disposal}")
                            item['binDescription'] = new_disposal
                            print(f"✅ Updated binDescription: {item['binDescription']}")
                        
                        # ALWAYS replace eco tips with specific tips (force it)
                        if 'tips' in item:
                            print(f"🔍 Original tips: {item['tips']}")
                            print(f"🔍 Item name: {item['name']}")
                            new_tips = get_specific_eco_tips_with_gemini(item['name'])
                            print(f"✅ New tips from Gemini: {new_tips}")
                            item['tips'] = new_tips
                            print(f"✅ Updated tips: {item['tips']}")
                        
                        # Don't add YouTube suggestions here - they will be fetched separately
                        
                        processed_detections.append(item)
                    
                    print(f"📱 FINAL DATA BEING SENT TO MOBILE: {json.dumps(processed_detections, indent=2)}")
                    return processed_detections
                else:
                    # Handle cases where the API returns no candidates (e.g., safety blocks)
                    return {"error": "Analysis failed. The image might violate safety policies or could not be processed."}

            except (KeyError, IndexError, json.JSONDecodeError) as e:
                print(f"❌ Error parsing Gemini response: {e}")
                print(f"Raw response: {result}")
                if attempt < max_retries - 1:
                    print(f"⏳ Retrying in {retry_delay} seconds...")
                    import time
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                else:
                    print("🔄 Using fallback detection...")
                    return get_fallback_detection()
            
            break  # Success, exit retry loop
            
        except requests.exceptions.Timeout:
            print(f"❌ Request timeout on attempt {attempt + 1}")
            if attempt < max_retries - 1:
                print(f"⏳ Retrying in {retry_delay} seconds...")
                import time
                time.sleep(retry_delay)
                retry_delay *= 2
                continue
            else:
                return {"error": "Request timed out. Please try again."}
    
    # If we get here, all retries failed
    print("🔄 All retries failed, using fallback detection...")
    return get_fallback_detection()


# --- API Endpoint ---
@app.route('/api/detect', methods=['POST'])
def detect_waste_endpoint():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']
    image_bytes = file.read()
    
    # Call the new Gemini-based detection function
    analysis_result = detect_waste_from_image_gemini(image_bytes)

    if isinstance(analysis_result, dict) and "error" in analysis_result:
        return jsonify(analysis_result), 500

    # Check if no waste was detected
    if isinstance(analysis_result, dict) and "message" in analysis_result:
        return jsonify(analysis_result), 200

    # Add summary information for multiple detections
    reusable_items = [item for item in analysis_result if item.get('isReusable', False)]
    
    response_data = {
        "detections": analysis_result,
        "total_items": len(analysis_result),
        "reusable_items": len(reusable_items),
        "summary": {
            "total_items": len(analysis_result),
            "high_confidence_items": len([item for item in analysis_result if item.get('confidence', 0) >= 80]),
            "medium_confidence_items": len([item for item in analysis_result if 50 <= item.get('confidence', 0) < 80]),
            "low_confidence_items": len([item for item in analysis_result if item.get('confidence', 0) < 50]),
            "reusable_items": len(reusable_items)
        }
    }

    return jsonify(response_data)

# --- Mobile App Specific Endpoints ---

@app.route('/api/mobile/detect', methods=['POST'])
def mobile_detect_waste_endpoint():
    """Mobile-optimized waste detection endpoint"""
    try:
        print("📱 MOBILE DETECT ENDPOINT CALLED")
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files['image']
        image_bytes = file.read()
        print(f"📱 Image received, size: {len(image_bytes)} bytes")
        
        # Call the detection function
        analysis_result = detect_waste_from_image_gemini(image_bytes)

        if isinstance(analysis_result, dict) and "error" in analysis_result:
            return jsonify(analysis_result), 500

        if isinstance(analysis_result, dict) and "message" in analysis_result:
            return jsonify(analysis_result), 200

        # Process for mobile app
        reusable_items = [item for item in analysis_result if item.get('isReusable', False)]
        
        # The analysis_result already contains binDescription and tips from Gemini
        # No need to add additional mobile_tips
        
        response_data = {
            "success": True,
            "detections": analysis_result,
            "total_items": len(analysis_result),
            "reusable_items": len(reusable_items),
            "timestamp": datetime.utcnow().isoformat()
        }

        print(f"📱 SENDING TO MOBILE: {json.dumps(response_data, indent=2)}")
        return jsonify(response_data)

    except Exception as e:
        print(f"❌ Mobile detection error: {e}")
        return jsonify({"error": "Detection failed", "details": str(e)}), 500

@app.route('/api/mobile/report-garbage', methods=['POST'])
def mobile_report_garbage_endpoint():
    """Mobile-optimized garbage reporting endpoint"""
    try:
        # Handle both form data and JSON data
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Form data (with image file)
            if 'image' not in request.files:
                return jsonify({"error": "No image provided"}), 400
            
            file = request.files['image']
            if file.filename == '':
                return jsonify({"error": "No image selected"}), 400
            
            # Get form data
            description = request.form.get('description', '')
            location = request.form.get('location', '')
            latitude = request.form.get('latitude', '')
            longitude = request.form.get('longitude', '')
            
        else:
            # JSON data (for testing without image)
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            description = data.get('description', '')
            location = data.get('location', '')
            latitude = data.get('latitude', '')
            longitude = data.get('longitude', '')
            file = None
        
        # Validate required fields
        if not description.strip():
            return jsonify({"error": "Description is required"}), 400
        
        if not location.strip() and (not latitude or not longitude):
            return jsonify({"error": "Location information is required"}), 400
        
        # Store image in MongoDB if provided
        image_data = None
        image_filename = None
        if file:
            # Read image data as binary
            image_data = file.read()
            image_filename = file.filename
            print(f"📸 Image stored in MongoDB: {image_filename} ({len(image_data)} bytes)")
        
        # Create report data
        report_data = {
            "type": "Garbage Report",
            "location": location or f"{latitude}, {longitude}",
            "latitude": float(latitude) if latitude else None,
            "longitude": float(longitude) if longitude else None,
            "description": description,
            "submittedBy": "Mobile App User",
            "image_filename": image_filename,
            "image_data": image_data,  # Store binary image data directly in MongoDB
            "status": "pending",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "source": "mobile_app"
        }
        
        # Save to database
        if requests_collection is not None:
            result = requests_collection.insert_one(report_data)
            report_data["_id"] = str(result.inserted_id)
            
            return jsonify({
                "success": True,
                "message": "Garbage report submitted successfully!",
                "report_id": str(result.inserted_id),
                "report": {
                    "id": str(result.inserted_id),
                    "type": report_data["type"],
                    "location": report_data["location"],
                    "description": report_data["description"],
                    "status": report_data["status"],
                    "createdAt": report_data["createdAt"].isoformat(),
                    "has_image": image_data is not None
                }
            }), 200
        else:
            # Fallback to file storage (for development)
            import json
            import uuid
            
            report_data["id"] = str(uuid.uuid4())
            report_data["createdAt"] = report_data["createdAt"].isoformat()
            report_data["updatedAt"] = report_data["updatedAt"].isoformat()
            
            # Remove binary data for JSON storage
            report_data.pop("image_data", None)
            
            reports_file = "reports.json"
            try:
                existing_reports = []
                if os.path.exists(reports_file):
                    with open(reports_file, 'r') as f:
                        existing_reports = json.load(f)
                
                existing_reports.append(report_data)
                
                with open(reports_file, 'w') as f:
                    json.dump(existing_reports, f, indent=2)
                
                return jsonify({
                    "success": True,
                    "message": "Garbage report submitted successfully! (File storage)",
                    "report_id": report_data["id"],
                    "report": report_data
                }), 200
            except Exception as file_error:
                print(f"❌ Error saving to file: {file_error}")
                return jsonify({"error": "Failed to save report"}), 500
        
    except Exception as e:
        print(f"❌ Mobile report error: {e}")
        return jsonify({"error": "Failed to submit report", "details": str(e)}), 500

@app.route('/api/mobile/dashboard', methods=['GET'])
def mobile_dashboard_endpoint():
    """Mobile-optimized dashboard data endpoint"""
    try:
        if requests_collection is not None:
            # Get statistics
            total_count = requests_collection.count_documents({})
            pending_count = requests_collection.count_documents({"status": "pending"})
            approved_count = requests_collection.count_documents({"status": "approved"})
            rejected_count = requests_collection.count_documents({"status": "rejected"})
            
            # Get recent reports (last 10)
            recent_reports = list(requests_collection.find().sort("createdAt", -1).limit(10))
            
            # Convert ObjectId to string
            for req in recent_reports:
                req["_id"] = str(req["_id"])
                req["createdAt"] = req["createdAt"].isoformat()
                req["updatedAt"] = req["updatedAt"].isoformat()
            
            return jsonify({
                "success": True,
                "stats": {
                    "total": total_count,
                    "pending": pending_count,
                    "approved": approved_count,
                    "rejected": rejected_count
                },
                "recent_reports": recent_reports
            }), 200
        else:
            # Fallback to file storage
            import json
            reports_file = "reports.json"
            
            if os.path.exists(reports_file):
                with open(reports_file, 'r') as f:
                    reports_list = json.load(f)
                
                total_count = len(reports_list)
                pending_count = len([r for r in reports_list if r.get("status") == "pending"])
                approved_count = len([r for r in reports_list if r.get("status") == "approved"])
                rejected_count = len([r for r in reports_list if r.get("status") == "rejected"])
                
                # Get recent reports
                recent_reports = sorted(reports_list, key=lambda x: x.get("createdAt", ""), reverse=True)[:10]
                
                return jsonify({
                    "success": True,
                    "stats": {
                        "total": total_count,
                        "pending": pending_count,
                        "approved": approved_count,
                        "rejected": rejected_count
                    },
                    "recent_reports": recent_reports
                }), 200
            else:
                return jsonify({
                    "success": True,
                    "stats": {
                        "total": 0,
                        "pending": 0,
                        "approved": 0,
                        "rejected": 0
                    },
                    "recent_reports": []
                }), 200
        
    except Exception as e:
        print(f"❌ Mobile dashboard error: {e}")
        return jsonify({"error": "Failed to fetch dashboard data"}), 500

@app.route('/api/mobile/update-status', methods=['PUT'])
def mobile_update_status_endpoint():
    """Mobile-optimized status update endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        report_id = data.get('report_id')
        new_status = data.get('status')
        
        if not report_id:
            return jsonify({"error": "Report ID is required"}), 400
        
        if new_status not in ['pending', 'approved', 'rejected']:
            return jsonify({"error": "Invalid status"}), 400
        
        if requests_collection is not None:
            # Update in MongoDB
            result = requests_collection.update_one(
                {"_id": ObjectId(report_id)},
                {
                    "$set": {
                        "status": new_status,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            if result.matched_count == 0:
                return jsonify({"error": "Report not found"}), 404
            
            return jsonify({
                "success": True,
                "message": f"Report {new_status} successfully",
                "report_id": report_id,
                "status": new_status
            }), 200
        else:
            # Fallback to file storage
            import json
            reports_file = "reports.json"
            
            if not os.path.exists(reports_file):
                return jsonify({"error": "Report not found"}), 404
            
            with open(reports_file, 'r') as f:
                reports_list = json.load(f)
            
            # Find and update the report
            report_found = False
            for req in reports_list:
                if req.get("_id") == report_id or req.get("id") == report_id:
                    req["status"] = new_status
                    req["updatedAt"] = datetime.utcnow().isoformat()
                    report_found = True
                    break
            
            if not report_found:
                return jsonify({"error": "Report not found"}), 404
            
            # Save back to file
            with open(reports_file, 'w') as f:
                json.dump(reports_list, f, indent=2)
            
            return jsonify({
                "success": True,
                "message": f"Report {new_status} successfully",
                "report_id": report_id,
                "status": new_status
            }), 200
        
    except Exception as e:
        print(f"❌ Mobile status update error: {e}")
        return jsonify({"error": "Failed to update status"}), 500

# --- Health Check Endpoint for Mobile App ---
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for mobile app"""
    try:
        # Check MongoDB connection
        db_status = "connected" if requests_collection is not None else "disconnected"
        
        # Check uploads directory
        uploads_dir = "uploads"
        uploads_status = "exists" if os.path.exists(uploads_dir) else "missing"
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": db_status,
            "uploads_directory": uploads_status,
            "version": "1.0.0"
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500

# --- Existing endpoints with improvements ---
@app.route('/api/report-garbage', methods=['POST'])
def report_garbage_endpoint():
    """Endpoint to report garbage with image and location"""
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400
    
    try:
        # Get form data
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')
        description = request.form.get('description', '')
        location_address = request.form.get('location_address', '')
        
        if not latitude or not longitude:
            return jsonify({"error": "Location coordinates required"}), 400
        
        # Save image to local storage (you can modify this to use cloud storage)
        timestamp = int(time.time())
        filename = f"garbage_report_{timestamp}_{file.filename}"
        upload_folder = "uploads"
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        # Store report in MongoDB (or fallback to file storage)
        if requests_collection is not None:
            report_data = {
                "type": "Garbage Report",
                "location": location_address or f"{latitude}, {longitude}",
                "latitude": float(latitude),
                "longitude": float(longitude),
                "description": description,
                "submittedBy": "Anonymous User",
                "image": filename,
                "imagePath": file_path,
                "status": "pending",
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            result = requests_collection.insert_one(report_data)
            report_data["_id"] = str(result.inserted_id)
            
            print(f"🗑️ Garbage report saved to MongoDB: {report_data}")
            
            return jsonify({
                "message": "Garbage report submitted successfully! Municipal authorities have been notified.",
                "report": report_data
            }), 200
        else:
            # Fallback: Save to a simple JSON file for testing
            import json
            import uuid
            
            report_data = {
                "id": str(uuid.uuid4()),
                "type": "Garbage Report",
                "location": location_address or f"{latitude}, {longitude}",
                "latitude": float(latitude),
                "longitude": float(longitude),
                "description": description,
                "submittedBy": "Anonymous User",
                "image": filename,
                "imagePath": file_path,
                "status": "pending",
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat()
            }
            
            # Save to a JSON file
            reports_file = "reports.json"
            try:
                existing_reports = []
                if os.path.exists(reports_file):
                    with open(reports_file, 'r') as f:
                        existing_reports = json.load(f)
                
                existing_reports.append(report_data)
                
                with open(reports_file, 'w') as f:
                    json.dump(existing_reports, f, indent=2)
                
                print(f"🗑️ Garbage report saved to file (MongoDB not available): {report_data}")
                
                return jsonify({
                    "message": "Garbage report submitted successfully! Municipal authorities have been notified. (Using file storage - MongoDB not available)",
                    "report": report_data
                }), 200
            except Exception as file_error:
                print(f"❌ Error saving to file: {file_error}")
                return jsonify({"error": "Failed to save report"}), 500
        
    except Exception as e:
        print(f"❌ Error processing garbage report: {e}")
        return jsonify({"error": "Failed to process report"}), 500

@app.route('/api/youtube-suggestions', methods=['POST'])
def youtube_suggestions_endpoint():
    """Endpoint to get YouTube video suggestions for reusable items"""
    try:
        # Get the list of reusable items from the request
        data = request.get_json()
        if not data or 'items' not in data:
            return jsonify({"error": "No items provided"}), 400
        
        items = data['items']
        if not isinstance(items, list):
            return jsonify({"error": "Items must be a list"}), 400
        
        # Get YouTube suggestions for each item
        suggestions = {}
        for item_name in items:
            suggestions[item_name] = get_youtube_suggestions(item_name)
        
        return jsonify({
            "suggestions": suggestions
        })
        
    except Exception as e:
        print(f"Error in youtube_suggestions_endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/gemini-classify', methods=['POST'])
def gemini_classification_endpoint():
    """Use Gemini AI to classify detected items as waste or useful objects"""
    try:
        data = request.get_json()
        items = data.get('items', [])
        
        if not items:
            return jsonify({'error': 'No items provided'}), 400
        
        if not GEMINI_API_KEY:
            # Fallback: classify based on common patterns
            classified_items = []
            for item in items:
                item_name = item.get('name', '').lower()
                confidence = item.get('confidence', 0)
                
                # Simple fallback classification
                useful_keywords = ['phone', 'laptop', 'computer', 'book', 'chair', 'table', 'clothing', 'shoes']
                waste_keywords = ['bottle', 'can', 'wrapper', 'packaging', 'trash', 'garbage', 'broken', 'damaged']
                
                is_waste = any(keyword in item_name for keyword in waste_keywords)
                is_useful = any(keyword in item_name for keyword in useful_keywords)
                
                if is_waste and not is_useful:
                    classification = True  # is_waste
                elif is_useful and not is_waste:
                    classification = False  # not waste
                else:
                    # Default to waste if uncertain
                    classification = True
                
                classified_items.append({
                    'name': item.get('name'),
                    'confidence': confidence,
                    'is_waste': classification,
                    'reasoning': f"Fallback classification based on keywords"
                })
            
            return jsonify({
                'success': True,
                'classified_items': classified_items
            })
        
        # Use Gemini AI for intelligent classification
        prompt = f"""
        You are a waste classification expert. Analyze the following detected objects and determine if they are actual waste (items that should be disposed of or recycled) or useful objects (items that are still functional and valuable).

        Detected items: {json.dumps(items, indent=2)}

        For each item, respond with a JSON object containing:
        - name: the item name
        - confidence: the original confidence score
        - is_waste: true if it's actual waste, false if it's a useful object
        - reasoning: brief explanation of your classification

        Consider:
        - Waste: bottles, cans, wrappers, broken items, expired food, disposable items
        - Useful objects: phones, laptops, books, furniture, clothing, tools, electronics

        Return only the JSON array of classified items.
        """
        
        # Call Gemini API
        headers = {
            "Content-Type": "application/json",
        }
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        }
        
        response = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and result['candidates']:
                content = result['candidates'][0]['content']['parts'][0]['text']
                
                # Extract JSON from Gemini response
                try:
                    # Find JSON array in the response
                    start_idx = content.find('[')
                    end_idx = content.rfind(']') + 1
                    if start_idx != -1 and end_idx != 0:
                        json_str = content[start_idx:end_idx]
                        classified_items = json.loads(json_str)
                        
                        return jsonify({
                            'success': True,
                            'classified_items': classified_items
                        })
                    else:
                        raise ValueError("No JSON array found in response")
                        
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"Error parsing Gemini response: {e}")
                    print(f"Raw response: {content}")
                    # Fallback to simple classification
                    return gemini_classification_endpoint()
            else:
                print("No candidates in Gemini response")
                return gemini_classification_endpoint()
        else:
            print(f"Gemini API error: {response.status_code} - {response.text}")
            return gemini_classification_endpoint()
            
    except Exception as e:
        print(f"Error in Gemini classification endpoint: {e}")
        return jsonify({'error': 'Failed to classify items'}), 500

@app.route('/api/requests', methods=['GET'])
def get_all_requests():
    """Get all garbage reports for municipal dashboard"""
    try:
        if requests_collection is not None:
            # Get all requests from MongoDB, ordered by creation date (newest first)
            requests_list = list(requests_collection.find().sort("createdAt", -1))
            
            # Convert ObjectId to string for JSON serialization
            for req in requests_list:
                req["_id"] = str(req["_id"])
                req["createdAt"] = req["createdAt"].isoformat()
                req["updatedAt"] = req["updatedAt"].isoformat()
            
            return jsonify({"requests": requests_list}), 200
        else:
            # Fallback: Read from JSON file
            import json
            reports_file = "reports.json"
            
            if os.path.exists(reports_file):
                with open(reports_file, 'r') as f:
                    requests_list = json.load(f)
                # Sort by creation date (newest first)
                requests_list.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
            else:
                requests_list = []
            
            return jsonify({"requests": requests_list}), 200
        
    except Exception as e:
        print(f"❌ Error fetching requests: {e}")
        return jsonify({"error": "Failed to fetch requests"}), 500

@app.route('/api/requests/<request_id>/status', methods=['PUT'])
def update_request_status(request_id):
    """Update the status of a garbage report (approve/reject)"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['pending', 'approved', 'rejected']:
            return jsonify({"error": "Invalid status"}), 400
        
        if requests_collection is not None:
            # Update in MongoDB
            result = requests_collection.update_one(
                {"_id": ObjectId(request_id)},
                {
                    "$set": {
                        "status": new_status,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            if result.matched_count == 0:
                return jsonify({"error": "Request not found"}), 404
            
            return jsonify({"message": f"Request {new_status} successfully"}), 200
        else:
            # Fallback: Update in JSON file
            import json
            reports_file = "reports.json"
            
            if not os.path.exists(reports_file):
                return jsonify({"error": "Request not found"}), 404
            
            with open(reports_file, 'r') as f:
                requests_list = json.load(f)
            
            # Find and update the request
            request_found = False
            for req in requests_list:
                if req.get("id") == request_id:
                    req["status"] = new_status
                    req["updatedAt"] = datetime.utcnow().isoformat()
                    request_found = True
                    break
            
            if not request_found:
                return jsonify({"error": "Request not found"}), 404
            
            # Save back to file
            with open(reports_file, 'w') as f:
                json.dump(requests_list, f, indent=2)
            
            return jsonify({"message": f"Request {new_status} successfully"}), 200
        
    except Exception as e:
        print(f"❌ Error updating request status: {e}")
        return jsonify({"error": "Failed to update request status"}), 500

@app.route('/api/requests/stats', methods=['GET'])
def get_request_stats():
    """Get statistics for municipal dashboard"""
    try:
        if not requests_collection:
            return jsonify({"error": "Database connection failed"}), 500
        
        # Count requests by status
        pending_count = requests_collection.count_documents({"status": "pending"})
        approved_count = requests_collection.count_documents({"status": "approved"})
        rejected_count = requests_collection.count_documents({"status": "rejected"})
        total_count = requests_collection.count_documents({})
        
        stats = {
            "pending": pending_count,
            "approved": approved_count,
            "rejected": rejected_count,
            "total": total_count
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        print(f"❌ Error fetching stats: {e}")
        return jsonify({"error": "Failed to fetch stats"}), 500

@app.route('/api/requests/<request_id>/image', methods=['GET'])
def get_request_image(request_id):
    """Get the image for a specific request from MongoDB"""
    try:
        if requests_collection is not None:
            # Find the request in MongoDB
            request_data = requests_collection.find_one({"_id": ObjectId(request_id)})
            if not request_data:
                return jsonify({"error": "Request not found"}), 404
            
            # Get image data from MongoDB
            image_data = request_data.get("image_data")
            if not image_data:
                return jsonify({"error": "No image associated with this report"}), 404
            
            # Create response with image data
            from io import BytesIO
            from flask import Response
            
            # Determine content type based on filename
            filename = request_data.get("image_filename", "")
            if filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
                content_type = 'image/jpeg'
            elif filename.lower().endswith('.png'):
                content_type = 'image/png'
            else:
                content_type = 'image/jpeg'  # Default
            
            print(f"📸 Serving image from MongoDB: {filename} ({len(image_data)} bytes)")
            
            # Return image data directly
            return Response(image_data, mimetype=content_type)
            
        else:
            # Fallback: Find the request in JSON file (for development)
            import json
            reports_file = "reports.json"
            
            if not os.path.exists(reports_file):
                return jsonify({"error": "Request not found"}), 404
            
            with open(reports_file, 'r') as f:
                requests_list = json.load(f)
            
            request_data = None
            for req in requests_list:
                if req.get("id") == request_id:
                    request_data = req
                    break
            
            if not request_data:
                return jsonify({"error": "Request not found"}), 404
            
            # Check for image field (could be 'image' or 'imagePath')
            image_filename = request_data.get("image") or request_data.get("imagePath")
            
            if not image_filename:
                return jsonify({"error": "No image associated with this report"}), 404
            
            # Construct the full path to the image
            upload_folder = "uploads"
            image_path = os.path.join(upload_folder, image_filename)
            
            if not os.path.exists(image_path):
                return jsonify({
                    "error": f"Image file not found: {image_filename}",
                    "message": "Image may have been lost during deployment. This is a known issue with Railway's ephemeral file system."
                }), 404
            
            # Return the image file
            return send_file(image_path, mimetype='image/*')
        
    except Exception as e:
        print(f"❌ Error fetching image: {e}")
        return jsonify({"error": "Failed to fetch image"}), 500

# --- Run the Server ---
if __name__ == '__main__':
    # For production, consider using a proper WSGI server like Gunicorn or Waitress
    # host='0.0.0.0' allows connections from all interfaces (needed for mobile devices)
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
