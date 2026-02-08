@echo off
REM Android Development Environment Setup
REM Run this before developing Android apps

echo Setting up Android development environment...

REM Set Android SDK path (adjust if installed elsewhere)
set ANDROID_SDK_ROOT=C:\Users\%USERNAME%\AppData\Local\Android\Sdk

REM Add to PATH
set PATH=%ANDROID_SDK_ROOT%\platform-tools;%PATH%
set PATH=%ANDROID_SDK_ROOT%\tools;%PATH%
set PATH=%ANDROID_SDK_ROOT%\tools\bin;%PATH%

echo Android SDK Root: %ANDROID_SDK_ROOT%
echo.
echo Environment setup complete!
echo You can now run: npx cap run android
echo.
cmd /k