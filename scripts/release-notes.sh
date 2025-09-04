#!/bin/bash

# Custom release notes script for metalsmith-sectioned-blog-pagination
# Generates clean, formatted release notes for GitHub releases

LATEST_TAG=$1
PREVIOUS_TAG=$(git describe --tags --abbrev=0 ${LATEST_TAG}^ 2>/dev/null)

echo "## What's Changed"
echo ""

# Get commits between tags
if [ -z "$PREVIOUS_TAG" ]; then
    # First release
    echo "🎉 Initial release of metalsmith-sectioned-blog-pagination"
    echo ""
    echo "### Features"
    git log --pretty=format:"- %s" --grep="^feat:" ${LATEST_TAG}
else
    # Subsequent releases
    
    # Features
    FEATURES=$(git log ${PREVIOUS_TAG}..${LATEST_TAG} --pretty=format:"- %s" --grep="^feat:")
    if [ ! -z "$FEATURES" ]; then
        echo "### ✨ Features"
        echo "$FEATURES"
        echo ""
    fi
    
    # Bug fixes
    FIXES=$(git log ${PREVIOUS_TAG}..${LATEST_TAG} --pretty=format:"- %s" --grep="^fix:")
    if [ ! -z "$FIXES" ]; then
        echo "### 🐛 Bug Fixes"
        echo "$FIXES"
        echo ""
    fi
    
    # Performance improvements
    PERF=$(git log ${PREVIOUS_TAG}..${LATEST_TAG} --pretty=format:"- %s" --grep="^perf:")
    if [ ! -z "$PERF" ]; then
        echo "### ⚡ Performance"
        echo "$PERF"
        echo ""
    fi
    
    # Documentation
    DOCS=$(git log ${PREVIOUS_TAG}..${LATEST_TAG} --pretty=format:"- %s" --grep="^docs:")
    if [ ! -z "$DOCS" ]; then
        echo "### 📚 Documentation"
        echo "$DOCS"
        echo ""
    fi
    
    # Breaking changes
    BREAKING=$(git log ${PREVIOUS_TAG}..${LATEST_TAG} --pretty=format:"%B" | grep -i "BREAKING CHANGE:")
    if [ ! -z "$BREAKING" ]; then
        echo "### 💥 Breaking Changes"
        echo "$BREAKING"
        echo ""
    fi
fi

echo "---"
echo ""
echo "**Full Changelog**: https://github.com/wernerglinka/metalsmith-sectioned-blog-pagination/compare/${PREVIOUS_TAG}...${LATEST_TAG}"