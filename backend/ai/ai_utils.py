import google.generativeai as genai
from django.conf import settings

# Configure the Gemini API client
genai.configure(api_key=settings.GEMINI_API_KEY)


def get_gemini_model():
    """Initializes and returns the Gemini Pro model."""
    return genai.GenerativeModel("gemini-1.5-flash-latest")


def generate_text_from_prompt(prompt_text):
    """
    Generates text content from a given prompt using the Gemini model.
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured in settings.")

    try:
        model = get_gemini_model()
        response = model.generate_content(prompt_text)
        return response.text
    except Exception as e:
        # Handle potential API errors gracefully
        print(f"Error calling Gemini API: {e}")
        return None
