# Scam Message Detection

Hackathon Project - AI-powered scam detection system with frontend + backend + machine learning training pipeline

Introduction Document: [Lumos - Clarity_in_Digital_Trust](https://github.com/AndersonTsaiTW/HackTheSource_lumos/blob/main/Lumos_Clarity_in_Digital_Trust.pdf)

## Features

### Production API (For End Users)

- 📝 **Smart Parsing**: Extract URLs, phone numbers, and content from messages using Regex
- 🌐 **URL Detection**: Google Safe Browsing API to detect malicious links
- 📞 **Phone Lookup**: Twilio Lookup API to verify phone numbers and detect VoIP
- 🤖 **AI Analysis**: OpenAI GPT-4o-mini with 12 semantic features (urgency, threat level, impersonation type, etc.)
- 📸 **OCR Support**: Tesseract.js for extracting text from scam message images
- ⚡ **Parallel Processing**: Call three APIs simultaneously for fast response
- 🎨 **Risk Assessment**: Red warning (≥75), yellow caution (≥30), green safe (<30)
- 🌐 **Web Interface**: Modern responsive UI with dark/light mode
- 🤖 **ML Integration**: XGBoost model with 78.3% accuracy for enhanced scam detection

### XGBoost ML Model (Machine Learning)

- 🎯 **45 Features**: Comprehensive feature engineering from text, URL, phone, AI, and statistical analysis
- 🤖 **XGBoost Classifier**: Trained model with 78.3% accuracy and 0.938 ROC-AUC score
- 🔮 **Scam Probability**: Returns precise probability score (0-100%) for scam detection
- 🐍 **Python API Server**: Flask-based REST API for model inference
- 🔄 **Node.js Integration**: Easy integration with existing Node.js backend
- 📊 **Model Metrics**: Detailed performance metrics and feature importance visualization

### Training Data Collection (For ML Model)

- 🎯 **45 Feature Extraction**: Comprehensive feature engineering for XGBoost training
  - Text features (14): character count, word count, digit ratio, special chars, etc.
  - URL features (8): URL count, suspicious domains, HTTPS ratio, etc.
  - Phone features (7): phone count, VoIP detection, international format, etc.
  - AI features (12): urgency level, threat level, temptation level, impersonation type, emotion triggers, etc.
  - Statistical features (3): entropy, readability, complexity
- 📊 **CSV Export**: Automated training data generation to `training_data.csv`
- 🖼️ **Batch Processing**: Process 100+ images from `data_pics/fraud` and `data_pics/normal` folders
- 🔄 **API Integration**: Reuses production APIs (Google, Twilio, OpenAI) for consistent feature extraction

## Quick Start

### Prerequisites

- **Node.js**: v22.13.0 or higher
- **Python**: 3.10 - 3.12 (for ML model, Python 3.13 may have compatibility issues)
- **npm**: Comes with Node.js

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your API Keys:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
GOOGLE_SAFE_BROWSING_API_KEY=your_api_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
OPENAI_API_KEY=your_api_key_here
XGBOOST_API_URL=http://localhost:5000
```

### 3. Setup Python ML Model (XGBoost)

```bash
# Navigate to ML model directory
cd lumos_XGBoost

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Windows CMD:
.\.venv\Scripts\activate.bat
# macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Return to project root
cd ..
```

**Note:** If you encounter scikit-learn version warnings, the model will still work but was trained with version 1.7.2.

### 4. Start Services

**Option A: Start Both Services Simultaneously (Recommended)**

```bash
npm run start:all
```

This will start:
- Node.js API on `http://localhost:3000`
- Python ML API on `http://localhost:5000`

**Option B: Start Services Separately**

Terminal 1 - Python ML API:
```bash
cd lumos_XGBoost
.\.venv\Scripts\Activate.ps1  # Windows
python api_server.py
```

Terminal 2 - Node.js API:
```bash
npm run dev
```

### 5. Open Web Interface

Navigate to `http://localhost:3000` and open `test.html` in your browser.

### 6. Verify Installation

Check if both services are running:

```bash
# Check Node.js API
curl http://localhost:3000/api/analyze

# Check Python ML API
curl http://localhost:5000/health
```

Expected response from ML API:
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

## API Documentation

### Production Endpoints

#### POST /api/analyze

Analyze suspicious messages

**Request Body:**

```json
{
  "message": "Your package has arrived, please click http://suspicious-link.com for details. Contact: 0912345678"
}
```

**Response:**

```json
{
  "riskLevel": "red",
  "riskScore": 82,
  "evidence": [
    "🚨 The ML model detected strong scam patterns with 82% probability, indicating a significant risk",
    "⚠️ The message contains a high number of special characters (28), which can be a tactic used by scammers to create confusion",
    "⚠️ The average word length (4.67) is slightly unusual for legitimate messages, hinting at potential manipulation"
  ],
  "action": {
    "title": "🚨 High Risk Warning",
    "suggestions": [
      "Do not click any links in this message",
      "Do not call back or respond to the sender",
      "Block this sender immediately",
      "Report this message to the 165 anti-fraud hotline if necessary"
    ]
  }
}
```

**Note:** With XGBoost ML model integration, the response now includes AI-generated human-readable explanations. The `riskScore` prioritizes the ML model's prediction when available (70% weight), falling back to rule-based scoring if the ML service is unavailable.

#### POST /api/ocr

Extract text from image and analyze for scams

**Request:**

- Method: POST
- Content-Type: multipart/form-data
- Body: `image` file (JPG, PNG, GIF, WebP, TIFF, max 10MB)

**Response:**

```json
{
  "text": "Extracted text from image...",
  "riskScore": 85,
  "riskLevel": "red",
  "evidence": [...],
  "action": {...}
}
```

### Training Endpoints

#### POST /api/training/collect-training-data

Collect training data with 45 features for ML model

**Request Body:**

```json
{
  "image_path": "data_pics/fraud/scam_001.png",
  "ocr_text": "URGENT! Click http://phishing.com",
  "label": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Training data collected successfully",
  "features": {
    "char_count": 156,
    "word_count": 23,
    "url_count": 1,
    "phone_count": 1,
    "urgency_level": 8,
    "threat_level": 7
  },
  "label": 1
}
```

#### GET /api/training/training-stats

Get statistics about collected training data

**Response:**

```json
{
  "totalRows": 128,
  "features": 45,
  "lastUpdated": "2025-12-04T10:30:00.000Z"
}
```

## Project Structure

```text
.
├── src/                          # Production code
│   ├── index.js                  # Main server (unified)
│   ├── config.js                 # Environment variables
│   ├── routes/
│   │   └── analyze.js            # /api/analyze, /api/ocr
│   ├── services/
│   │   ├── parser.js             # Message parsing (URL, phone)
│   │   ├── safeBrowsing.js       # Google Safe Browsing API
│   │   ├── twilioLookup.js       # Twilio Lookup API
│   │   ├── openaiCheck.js        # OpenAI GPT-4o-mini (12 features)
│   │   └── ocrService.js         # Tesseract.js OCR
│   └── utils/
│       └── analyzer.js           # Risk score calculation
│
├── training/                     # ML training pipeline
│   ├── routes/
│   │   └── collectData.js        # /api/training/*
│   ├── services/
│   │   └── featureExtractor.js   # 45 feature extraction
│   ├── utils/
│   │   └── csvWriter.js          # CSV file management
│   └── scripts/
│       ├── test-collect.js       # Test single sample
│       └── scan-images.js        # Batch process images
│
├── data_pics/                    # Training images
│   ├── fraud/                    # 85 scam images
│   └── normal/                   # 43 normal images
│
├── lumos_XGBoost/                # ML Model (Python)
│   ├── api_server.py             # Flask API server
│   ├── train_model.py            # Model training script
│   ├── predict.py                # Prediction script
│   ├── scam_detector_model.pkl   # Trained XGBoost model
│   ├── feature_columns.json      # 45 feature definitions
│   ├── model_metrics.json        # Performance metrics
│   ├── requirements.txt          # Python dependencies
│   ├── nodejs_example.js         # Node.js integration example
│   └── README.md                 # Model documentation
│
├── test.html                     # Web UI
├── styles/                       # CSS files
├── scripts/                      # Frontend JS
└── training_data.csv             # Generated training data
```

## Tech Stack

### Backend & APIs

- **Runtime**: Node.js v22.13.0
- **Framework**: Express.js
- **HTTP Client**: Axios
- **AI**: OpenAI GPT-4o-mini
- **OCR**: Tesseract.js
- **APIs**: Google Safe Browsing v4, Twilio Lookup v2

### Machine Learning

- **Model**: XGBoost Classifier
- **Language**: Python 3.x
- **API Framework**: Flask + Flask-CORS
- **Libraries**: pandas, numpy, scikit-learn, xgboost, joblib
- **Accuracy**: 78.3% with 0.938 ROC-AUC

### Frontend

- **UI**: Vanilla HTML/CSS/JS with dark mode
- **Styling**: SCSS preprocessor

## Training Data Collection

### How to Collect Training Data

1. **Prepare images**: Place images in `data_pics/fraud/` (label=1) or `data_pics/normal/` (label=0)

2. **Start server**:

```bash
npm run dev
```

1. **Run batch processing** (in another terminal):

```bash
node training/scripts/scan-images.js
```

This will:

- Scan all images in `data_pics/fraud/` and `data_pics/normal/`
- Extract text using OCR
- Call Google, Twilio, and OpenAI APIs
- Extract 45 features
- Append to `training_data.csv`

### Feature List (45 Total)

**Text Features (14)**:

- char_count, word_count, digit_count, digit_ratio
- uppercase_ratio, special_char_count, exclamation_count
- question_count, has_urgent_keywords, suspicious_word_count
- max_word_length, avg_word_length, emoji_count, consecutive_caps

**URL Features (8)**:

- url_count, has_suspicious_tld, has_ip_address
- has_url_shortener, avg_url_length, has_https
- url_path_depth, subdomain_count

**Phone Features (7)**:

- phone_count, has_intl_code, is_voip
- is_mobile, is_valid_phone, phone_carrier_known, has_multiple_phones

**AI Features (12)**:

- urgency_level (0-10), threat_level (0-10), temptation_level (0-10)
- impersonation_type, action_requested, grammar_quality (0-10)
- emotion_triggers, credibility_score (0-10)
- ai_is_scam (0/1), ai_confidence (0-100), has_scam_keywords, keyword_count

**Statistical Features (3)**:

- text_entropy, readability_score, sentence_complexity

## XGBoost Model Usage

The XGBoost model is integrated into the main analysis pipeline and runs automatically when both services are started.

### Architecture

```
User Request → Node.js API (Port 3000)
                ↓
    Extract 45 Features (parser, APIs, AI)
                ↓
    Python ML API (Port 5000) → XGBoost Model
                ↓
    Scam Probability + Top Factors
                ↓
    AI Explainer (OpenAI) → Human-readable Report
                ↓
    JSON Response → Frontend
```

### Manual Setup (If Not Using `npm run start:all`)

1. **Navigate to the model directory**:

```bash
cd lumos_XGBoost
```

2. **Create and activate virtual environment**:

```bash
# Create venv
python -m venv .venv

# Activate (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Activate (macOS/Linux)
source .venv/bin/activate
```

3. **Install Python dependencies**:

```bash
pip install -r requirements.txt
```

**Common Issues:**
- If using Python 3.13, you may see scikit-learn version warnings (model trained with 1.7.2, runs with 1.6.1)
- The model will still work despite warnings
- For production, consider retraining with matching scikit-learn version

4. **Start the Flask API server**:

```bash
python api_server.py
```

The API will run on `http://localhost:5000`

### XGBoost API Endpoints

#### Health Check

```http
GET http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

#### Predict Scam Probability

```http
POST http://localhost:5000/predict
Content-Type: application/json

{
  "char_count": 156,
  "word_count": 23,
  "url_count": 1,
  "phone_count": 1,
  "urgency_level": 8,
  "threat_level": 7,
  ... (all 45 features)
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "is_scam": true,
    "scam_probability": 0.87,
    "normal_probability": 0.13,
    "confidence": "High",
    "prediction_label": "Scam",
    "top_scam_factors": [
      {
        "feature": "urgency_level",
        "value": 8.0,
        "importance": 0.085,
        "contribution_score": 0.68
      },
      {
        "feature": "url_is_shortened",
        "value": 1.0,
        "importance": 0.072,
        "contribution_score": 0.072
      }
    ]
  }
}
```

#### Get Model Information

```http
GET http://localhost:5000/model/info
```

### Integration Flow

The Node.js backend automatically:

1. ✅ Extracts 45 features using existing services
2. ✅ Calls XGBoost API at `http://localhost:5000/predict`
3. ✅ Receives scam probability and top contributing factors
4. ✅ Sends all data to OpenAI for human-readable explanation
5. ✅ Returns final report to frontend

**Graceful Degradation:** If XGBoost API is unavailable, the system automatically falls back to rule-based scoring.

For detailed integration documentation, see:
- `lumos_XGBoost/INTEGRATION_GUIDE.md` - Technical integration details
- `XGBOOST_INTEGRATION.md` - Architecture and workflow
- `TESTING_PROCEDURE.md` - Step-by-step testing guide

## Development Tips

- Use `nodemon` for development with auto-restart on file changes
- Keep API Keys secure, do not commit to Git
- Test API with Postman, curl, or the web interface (`test.html`)
- Training data is saved to `training_data.csv` (gitignored)
- Each API call costs money - be mindful when batch processing

## License

MIT
