#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
npm run ios:sync
mkdir -p release
# Simulator output is not an iPhone installation package.
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath release/ios-simulator CODE_SIGNING_ALLOWED=NO build
# Compile real-device architecture without claiming it is installable without signing.
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath release/ios-device CODE_SIGNING_ALLOWED=NO build
