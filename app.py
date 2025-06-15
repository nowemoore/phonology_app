
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
from backend.script import find_minimum_features, find_phonemes_by_features, get_all_features

app = Flask(__name__)
CORS(app)

PHONEME_CSV = 'backend/ft.csv'

# Serve the main HTML file
@app.route('/')
def index():
    return send_from_directory('docs', 'index.html')

# Serve static files (CSS, JS)
@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('docs', filename) 

@app.route('/phonemes')
def get_phonemes():
    try:
        df = pd.read_csv(PHONEME_CSV, encoding='utf-8')
        phonemes = df.iloc[:, 0].tolist()
        return jsonify(phonemes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/features')
def get_features():
    try:
        features = get_all_features(PHONEME_CSV)
        return jsonify(features)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/find-by-features', methods=['POST'])
def find_by_features():
    try:
        data = request.get_json()
        alphabet = data.get('alphabet', [])
        feature_specs = data.get('features', [])  # List of [feature_name, value] pairs
        
        matching_phonemes = find_phonemes_by_features(alphabet, feature_specs, PHONEME_CSV)
        return jsonify({'matching_phonemes': matching_phonemes})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        alphabet = data.get('alphabet', [])
        targets = data.get('targets', [])
        result = find_minimum_features(alphabet, targets, PHONEME_CSV)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/phonemes-with-types')
def get_phonemes_with_types():
    try:
        df = pd.read_csv(PHONEME_CSV, encoding='utf-8')
        # Assuming first column is phoneme, second column is type
        phonemes_with_types = []
        for _, row in df.iterrows():
            phonemes_with_types.append({
                'phoneme': row.iloc[0],  # First column (phoneme)
                'type': row.iloc[1]      # Second column (type)
            })
        return jsonify(phonemes_with_types)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
