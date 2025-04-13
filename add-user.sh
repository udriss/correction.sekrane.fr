#!/bin/bash

# Navigate to project directory
cd "$(dirname "$0")"

# Make sure dependencies are installed
if [ ! -d "node_modules/bcrypt" ] || [ ! -d "node_modules/mysql2" ] || [ ! -d "node_modules/dotenv" ]; then
  echo "Installing dependencies..."
  npm install bcrypt mysql2 dotenv
fi

# Set environment variables directly if needed
export DB_HOST=$(grep DB_HOST .env | cut -d '=' -f2- | tr -d "'")
export DB_USER=$(grep DB_USER .env | cut -d '=' -f2- | tr -d "'")
export DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2- | tr -d "'")
export DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2- | tr -d "'")

echo "Using database config:"
echo "Host: $DB_HOST"
echo "User: $DB_USER"
echo "Database: $DB_NAME"

# Run the script
node scripts/create-user.js "$1" "$2" "$3"
