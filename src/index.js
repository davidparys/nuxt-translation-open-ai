#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
var cli_js_1 = require("./cli/cli.js");
var path_1 = require("path");
var fs_1 = require("fs");
// Try to load environment variables from .env file in current directory
try {
    var envPath = path_1.default.resolve(process.cwd(), '.env');
    if (fs_1.default.existsSync(envPath)) {
        (0, dotenv_1.config)({ path: envPath });
    }
    else {
        (0, dotenv_1.config)(); // Default behavior
    }
}
catch (e) {
    console.warn('Warning: Unable to load .env file, using existing environment variables only.');
    (0, dotenv_1.config)(); // Still try the default
}
// Check for required API key
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
    console.error('Error: OPENAI_API_KEY environment variable is required but not found or empty.');
    console.error('Please set your OpenAI API key in your environment variables or .env file:');
    console.error('  export OPENAI_API_KEY="your-api-key-here"');
    console.error('  or add OPENAI_API_KEY=your-api-key-here to your .env file');
    process.exit(1);
}
// Initialize CLI
(0, cli_js_1.setupCli)();
