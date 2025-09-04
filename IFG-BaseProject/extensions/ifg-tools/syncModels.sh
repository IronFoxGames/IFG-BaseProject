#!/bin/bash

# Updates the model typescript files for tooling that needs to reference them. 

# Create target directory if it doesn't exist
mkdir -p ./src/models/requirements
mkdir -p ./src/enums

# Copy files from source to destination
cp -R ../../assets/scripts/core/model/*.ts ./src/models/
cp -R ../../assets/scripts/core/enums/*.ts ./src/enums/
cp -R ../../assets/scripts/core/model/requirements/*.ts ./src/models/requirements

# TODO CSB: I introduced a dependency on a non-model class, but just delete for now until I fix. Not used by tooling
rm ./src/models/PropSwappedEventData.ts