# Skill: Semantic Matcher

## Description
Generates embeddings for text to enable semantic search and recommendation. Used to match user queries to the most relevant restaurants or services.

## Metadata
- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Provider**: HuggingFace Inference API
- **Task**: Feature Extraction (Embeddings)

## Output
384-dimensional float array (vector).

## Instructions
Input a text string. Return the embedding vector to be used for cosine similarity calculations.
