# Skill: Sentiment Analyzer

## Description
Analyzes community reviews and feedback to detect quality issues or trending satisfaction levels. Supports multi-lingual input (Hindi + English).

## Metadata
- **Model**: `cardiffnlp/twitter-xlm-roberta-base-sentiment`
- **Provider**: HuggingFace Inference API
- **Task**: Text Classification (Sentiment)

## Output Labels
- `positive`
- `negative`
- `neutral`

## Instructions
Input a review string or an array of review strings. Return the sentiment label and confidence score for each.
