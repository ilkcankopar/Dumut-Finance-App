# Dumut AI Voice Assistant and NLP Microservice

This directory contains the Python-based microservice responsible for handling voice processing, natural language processing (NLP), Speech-to-Text (STT), Text-to-Speech (TTS), and automated financial advice for the Dumut ecosystem.

---

## Architecture and Core Modules

*   **FastAPI:** Asynchronous, high-performance web framework used to expose endpoints.
*   **Google Gemini (generative-ai):** Large Language Model integration for extracting structured transaction details (amount, category, type) from unstructured user statements, analyzing monthly budgets, and drafting personalized savings tips.
*   **Groq Whisper (groq):** Low-latency Speech-to-Text (STT) inference interface used to transcribe voice commands.
*   **Text-to-Speech (TTS) Pipeline:** Sentezleme operations for reading response texts back to the user via ElevenLabs and Google Translate TTS APIs.

---

## Setup and Installation

### Prerequisites
*   Python 3.10 or higher
*   Google Gemini API Key (Google AI Studio)
*   Groq API Key (Groq Cloud)

### Steps

1.  **Initialize Virtual Environment:**
    ```bash
    python -m venv venv
    ```

2.  **Activate Virtual Environment:**
    *   **macOS / Linux:**
        ```bash
        source venv/bin/activate
        ```
    *   **Windows:**
        ```bash
        venv\Scripts\activate
        ```

3.  **Install Library Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    Create or edit the `.env` file in the root of this module:
    ```env
    GOOGLE_API_KEY=your-gemini-api-key
    GROQ_API_KEY=your-groq-api-key
    PORT=8000
    ```

5.  **Launch the Microservice:**
    ```bash
    uvicorn ai.main:app --host 0.0.0.0 --port 8000 --reload
    ```
    *   Access the interactive Swagger UI documentation at `http://localhost:8000/docs`.

---

## API Endpoint Details

### POST /api/v1/ses-isle
*   **Description:** Processes raw audio binaries, executes transcription via Whisper, maps extracted statements to financial actions, validates warnings against user budget contexts, and outputs audio responses.
*   **Payload (Multipart):**
    *   `ses_dosyasi`: Audio file stream (audio/webm or audio/m4a formats)
    *   `kontekst_json` (Optional): Stringified JSON object containing user budget balances
    *   `dil_kodu`: Language code string (defaults to "tr-TR")

### POST /api/v1/metin-isle
*   **Description:** Performs the NLP transaction extraction pipeline using text strings.
*   **Payload (Form-Data):**
    *   `metin`: Statement string (e.g., "Log a shopping expense of 350 liras")
    *   `kontekst_json` (Optional): Stringified JSON containing user balances

### POST /api/v1/seslendir
*   **Description:** Directly processes a text string and outputs a synthesized `audio/mpeg` stream.
*   **Payload (JSON):**
    ```json
    {
      "metin": "Your transaction has been successfully recorded."
    }
    ```
