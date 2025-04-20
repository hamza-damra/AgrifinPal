#!/bin/bash
echo "Loading environment variables from .env file..."

export $(grep -v '^#' .env | xargs)

echo "Environment variables loaded successfully."
