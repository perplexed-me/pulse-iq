#!/bin/bash

# Maven wrapper setup and validation script for CI/CD
echo "🔧 Setting up Maven wrapper for CI/CD..."

# Check if we're in the correct directory
if [ ! -f "pom.xml" ]; then
    echo "❌ pom.xml not found. Make sure you're in the Java service directory."
    exit 1
fi

# Check if Maven wrapper exists
if [ ! -f "mvnw" ]; then
    echo "❌ Maven wrapper (mvnw) not found. Generating..."
    
    # Try to generate Maven wrapper using system Maven
    if command -v mvn &> /dev/null; then
        mvn wrapper:wrapper -Dmaven=3.9.6
        echo "✅ Maven wrapper generated"
    else
        echo "❌ System Maven not available. Cannot generate wrapper."
        exit 1
    fi
fi

# Make sure Maven wrapper is executable
chmod +x mvnw
echo "✅ Maven wrapper is now executable"

# Check if wrapper properties exist
if [ ! -f ".mvn/wrapper/maven-wrapper.properties" ]; then
    echo "❌ Maven wrapper properties missing. Creating..."
    
    # Create .mvn directory if it doesn't exist
    mkdir -p .mvn/wrapper
    
    # Create maven-wrapper.properties file
    cat > .mvn/wrapper/maven-wrapper.properties << 'EOF'
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip
wrapperUrl=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar
EOF

    echo "✅ Maven wrapper properties created"
fi

# Test Maven wrapper
echo "🧪 Testing Maven wrapper..."
if ./mvnw --version > /dev/null 2>&1; then
    echo "✅ Maven wrapper is working correctly"
    ./mvnw --version
else
    echo "❌ Maven wrapper test failed"
    echo "Falling back to system Maven..."
    
    if command -v mvn &> /dev/null; then
        echo "✅ System Maven available"
        mvn --version
    else
        echo "❌ No Maven available (wrapper or system)"
        exit 1
    fi
fi

echo "🎉 Maven setup complete!"