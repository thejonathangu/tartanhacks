FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    jq \
    && rm -rf /var/lib/apt/lists/*
