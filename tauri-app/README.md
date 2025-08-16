# MD Planner Desktop App

This is the desktop version of MD Planner built with Tauri 2. It wraps the existing web application to provide a native desktop experience.

## Prerequisites

- [Rust](https://rustup.rs/) (for Tauri) - **Required for desktop app**
- [Node.js](https://nodejs.org/) (for npm dependencies)
- [Deno](https://deno.land/) (for the web server)

**Important**: After installing Rust, make sure to source the environment:
```bash
source ~/.cargo/env
```

## Development

1. **Start the development server:**
   ```bash
   ./start-desktop.sh
   ```
   
   Or manually:
   ```bash
   # Terminal 1: Start the web server
   cd ..
   deno run --allow-net --allow-read --allow-write main.ts
   
   # Terminal 2: Start the desktop app
   npm run dev
   ```

2. **Build for production:**
   ```bash
   npm run build
   ```

## How it works

- The Tauri app connects to the Deno web server running on `http://localhost:8003`
- All the existing web app functionality is preserved
- The desktop app provides a native window wrapper around the web interface
- No changes are made to the original web application

## Features

- Native desktop window with proper window controls
- Responsive design that adapts to desktop screen sizes
- Same functionality as the web version
- Native desktop integration (file system access, notifications, etc.)

## Scripts

- `npm run dev` - Start the desktop app in development mode
- `npm run build` - Build the desktop app for production
- `npm run start-web` - Start only the web server
- `./start-desktop.sh` - Start both web server and desktop app

## Configuration

The Tauri configuration is in `src-tauri/tauri.conf.json`. Key settings:

- **Window size**: 1200x800 with minimum 800x600
- **Dev URL**: http://localhost:8003 (connects to Deno server)
- **Build output**: Uses the existing `../src/static` directory
- **Icons**: Uses the project logos from `../docs/`