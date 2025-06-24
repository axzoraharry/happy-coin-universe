
FROM ubuntu:22.04

ENV LANG C.UTF-8
ENV DEBIAN_FRONTEND noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    git python3 python3-pip python3-venv \
    curl libffi-dev libssl-dev portaudio19-dev \
    espeak-ng build-essential pkg-config \
    jq pulseaudio-utils sox alsa-utils libatlas-base-dev \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/mycroft

# Clone Mycroft Core
RUN git clone https://github.com/MycroftAI/mycroft-core.git .

# Install Mycroft dependencies
RUN python3 -m pip install -r requirements.txt --break-system-packages

# Create a simple HTTP server for TTS streaming (placeholder)
COPY simple_tts_server.py /opt/mycroft/
RUN chmod +x /opt/mycroft/simple_tts_server.py

# Expose TTS streaming port
EXPOSE 8181

# Start simple TTS server (replace with actual Mycroft when ready)
CMD ["python3", "simple_tts_server.py"]
