# Zepto Smart Grocery - AI Personal Chef Bot

AI-powered grocery delivery platform with an integrated Personal Chef Bot
that suggests recipes and auto-adds all ingredients to cart.

## Features

- Full e-commerce grocery store with 60+ products
- AI Personal Chef Bot with 45+ Indian recipes
- 1-click recipe to cart functionality
- Smart search with voice support
- Category filters and sorting
- Cart with quantity controls and localStorage persistence
- Coupon system (ZEPTO50, CHEF10, FIRST100)
- Minimum order progress bar for free delivery
- 3-step checkout flow (Address, Payment, Confirmation)
- Order tracking animation
- Confetti celebrations and sound effects
- Fully responsive design

## Tech Stack

- **Backend:** Python, Flask, LangChain
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **AI/LLM:** Mistral 7B (with smart fallback)
- **Storage:** localStorage for cart persistence

## Quick Start

```bash
cd backend
pip install flask flask-cors
python app.py