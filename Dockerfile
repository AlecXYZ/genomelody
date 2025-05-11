# Minimal Debian based Python image
FROM python:3.12-slim

# Enviroment variables - PYTHONDONTWRITEBYTECODE - no __pycache__ - PYTHONUNBUFFERED - print log instantly
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Main workspace
WORKDIR /app

# Install dependencies - FluidSynth - remove cached packages
RUN apt-get update && \
    apt-get install -y fluidsynth && \
    rm -rf /var/lib/apt/lists/*

# Copy filesystem
COPY web ./web
COPY soundfont ./soundfont
COPY processors ./processors
COPY mappings ./mappings
COPY converters ./converters
COPY gui_controllers.py .
COPY main.py .

# Copy the requirements and install them - do not cache tehm
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 8000 - used for connection
EXPOSE 8000

# Run main.py
CMD ["python", "main.py"]