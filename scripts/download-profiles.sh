#!/bin/bash

# Simple script to download profile images for examples
set -e

# Create profiles directory
mkdir -p public/profiles

# Function to download and resize image
download_and_resize() {
    local npub=$1
    local name=$2
    local url=$3
    
    echo "Processing $name..."
    
    # Create safe filename
    local filename=$(echo "$npub" | sed 's/[^a-zA-Z0-9]/_/g')
    local output_path="public/profiles/${filename}.jpg"
    
    # Download and resize
    curl -s -L -o "$output_path" "$url" && \
    convert "$output_path" -resize 80x80^ -gravity center -extent 80x80 "$output_path" && \
    echo "✓ $name" || echo "✗ $name (failed)"
}

# Download known profile images
echo "Downloading profile images..."

# Add a few known profile images (you can add more as needed)
download_and_resize "npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n" "No Solutions" "https://pbs.twimg.com/profile_images/1644561568/dergigi_400x400.jpg"
download_and_resize "npub1guh5grefa7vkay4ps6udxg8lrqxg2kgr3qh9n4gduxut64nfxq0q9y6hjy" "Marty Bent" "https://pbs.twimg.com/profile_images/1644561568/dergigi_400x400.jpg"

echo "Done!"
