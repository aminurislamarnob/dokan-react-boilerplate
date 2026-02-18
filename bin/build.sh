#!/usr/bin/env bash

# Exit if any command fails.
set -e

# Change to the expected directory.
cd "$(dirname "$0")"
cd ..
DIR=$(pwd)
BUILD_DIR="$DIR/build/dokan-react-boilerplate"

# Extract plugin version from dokan-react-boilerplate.php
VERSION=$(grep -E '^[[:space:]]*\* Version:' "$DIR/dokan-react-boilerplate.php" | head -n1 | sed -E 's/.*Version:[[:space:]]*([^[:space:]]+).*/\1/')
if [ -z "$VERSION" ]; then
    error "Could not determine version from dokan-react-boilerplate.php"
    exit 1
fi



# Enable nicer messaging for build status.
BLUE_BOLD='\033[1;34m'
GREEN_BOLD='\033[1;32m'
RED_BOLD='\033[1;31m'
YELLOW_BOLD='\033[1;33m'
COLOR_RESET='\033[0m'

error() {
    echo -e "\n${RED_BOLD}$1${COLOR_RESET}\n"
}
status() {
    echo -e "\n${BLUE_BOLD}$1${COLOR_RESET}\n"
}
success() {
    echo -e "\n${GREEN_BOLD}$1${COLOR_RESET}\n"
}
warning() {
    echo -e "\n${YELLOW_BOLD}$1${COLOR_RESET}\n"
}

status "💃 Time to build the Dokan React Boilerplate ZIP file 🕺"

# remove the build directory if exists and create one
rm -rf "$DIR/build"
mkdir -p "$BUILD_DIR"

# Run the build.


status "Generating build... 👷‍♀️"

# Copy all files
status "Copying files... ✌️"
FILES=(dokan-react-boilerplate.php readme.txt dist includes templates assets languages composer.json composer.lock)

for file in ${FILES[@]}; do
    if [ -f "$file" ] || [ -d "$file" ]; then
        cp -R $file $BUILD_DIR
    fi
done

# Install composer dependencies
status "Installing dependencies... 📦"
cd $BUILD_DIR
composer install --optimize-autoloader --no-dev -q

# Remove composer files
rm composer.json composer.lock

# go one up, to the build dir
status "Creating archive... 🎁"
cd ..
zip -r -q dokan-react-boilerplate-${VERSION}.zip dokan-react-boilerplate

# remove the source directory
rm -rf dokan-react-boilerplate

success "Done. You've built Dokan React Boilerplate! 🎉 "
echo -e "\n${BLUE_BOLD}File Path${COLOR_RESET}: ${YELLOW_BOLD}$(pwd)/dokan-react-boilerplate-${VERSION}.zip${COLOR_RESET} \n"
