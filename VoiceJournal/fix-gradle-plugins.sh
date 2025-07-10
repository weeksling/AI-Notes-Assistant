#!/bin/bash

# Fix all gradle files that use the missing expo-module-gradle-plugin
echo "Fixing gradle plugin issues..."

for file in $(find node_modules -name "build.gradle" -exec grep -l "expo-module-gradle-plugin" {} \;); do
    echo "Fixing $file"
    cp "$file" "$file.backup"
    
    # Create a new build.gradle without the plugin
    cat > "$file" << 'EOF'
apply plugin: 'com.android.library'

def expoModulesCorePlugin = new File(project(":expo-modules-core").projectDir.absolutePath, "ExpoModulesCorePlugin.gradle")
apply from: expoModulesCorePlugin
applyKotlinExpoModulesCorePlugin()
useCoreDependencies()
useDefaultAndroidSdkVersions()

group = "host.exp.exponent"

android {
  namespace "expo.modules.${project.name.replace('-', '')}"
  defaultConfig {
    versionCode 1
    versionName "1.0.0"
  }
  buildTypes {
    release {
      minifyEnabled false
    }
  }
}

dependencies {
  implementation 'com.facebook.react:react-native:+'
}
EOF
done

echo "Fixed all gradle plugin issues!"