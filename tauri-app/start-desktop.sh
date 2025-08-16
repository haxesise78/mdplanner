#!/bin/bash

# Script to start the MD Planner desktop app
# This starts the Deno web server and then opens the Tauri desktop app

echo "Starting MD Planner Desktop App..."

# Source Rust environment
source ~/.cargo/env

# Start the Deno web server in the background
echo "Starting web server..."
cd ..
deno run --allow-net --allow-read --allow-write main.ts &
WEB_SERVER_PID=$!

# Wait a moment for the web server to start
sleep 3

# Start the Tauri desktop app
echo "Starting desktop app..."
cd tauri-app
npm run dev

# Clean up: kill the web server when the desktop app closes
echo "Cleaning up..."
kill $WEB_SERVER_PID 2>/dev/null