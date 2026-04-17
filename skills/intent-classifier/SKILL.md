# Skill: Intent Classifier

## Description
Understands the user's intent when they interact with the platform. Maps natural language queries to discrete system actions.

## Metadata
- **Model**: `bitext/Mistral-7B-Restaurants`
- **Provider**: HuggingFace Inference API
- **Task**: Zero-shot Classification

## Intent Categories
- `find_restaurant`
- `check_menu_price`
- `book_group_deal`
- `view_community_spending`
- `report_quality_issue`
- `find_home_service`

## Instructions
Classify the user's query into one of the predefined categories. Return the label with the highest confidence.
