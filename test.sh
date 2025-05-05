#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building project...${NC}"
npm run build

# Test with mock mode first
echo -e "${BLUE}Running translator in mock mode...${NC}"
node dist/index.js --root ./example --mock

echo -e "${YELLOW}Mock translation completed.${NC}"

# If there's an OpenAI API key in the .env file, offer to test with real API
if grep -q "OPENAI_API_KEY=.*" .env && ! grep -q "OPENAI_API_KEY=your_openai_api_key_here" .env; then
  echo -e "${YELLOW}Found OpenAI API key. Would you like to test with the real API? (y/n)${NC}"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${BLUE}Running translator with real OpenAI API...${NC}"
    node dist/index.js --root ./example
  else
    echo -e "${YELLOW}Skipping real API test.${NC}"
  fi
else
  echo -e "${YELLOW}No valid OpenAI API key found in .env file. Skipping real API test.${NC}"
fi

echo -e "${GREEN}Test completed!${NC}"
echo "Check the example/locales directory for the generated translation files." 