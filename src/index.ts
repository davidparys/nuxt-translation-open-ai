#!/usr/bin/env node

import { config } from 'dotenv';
import { setupCli } from './cli/cli.js';
import path from 'path';
import fs from 'fs';

// Try to load environment variables from .env file in current directory
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        config({ path: envPath });
    } else {
        config(); // Default behavior
    }
} catch (e) {
    console.warn('Warning: Unable to load .env file, using existing environment variables only.');
    config(); // Still try the default
}

// Check for required API key
if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY not found in environment variables. You will need to provide it directly.');
}

// Initialize CLI
setupCli(); 