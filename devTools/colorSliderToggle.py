import os
import sys

SCHEMA_LINE = '"$schema": "vscode://schemas/color-theme",'

def toggleSchema(filePath):
    lines = readJSONLines(filePath)
    
    if hasSchema(lines):
        newLines = removeSchema(lines)
        print(f"Removed $schema from {filePath}")
    else:
       newLines = addSchema(lines)
       print(f"Added $schema to {filePath}")
       
    writeLines(filePath, newLines)
   
def hasSchema(lines):
    return any(SCHEMA_LINE in line for line in lines)

def removeSchema(lines):
    return [line for line in lines if SCHEMA_LINE not in line]
    
def addSchema(lines):
    newLines = []
    inserted = False
    for line in lines:
        newLines.append(line)
        if not inserted and line.strip() == "{":
            newLines.append(f'  {SCHEMA_LINE}\n')
            inserted = True
    return newLines

def writeLines(filePath, newLines):
    with open(filePath, 'w', encoding='utf-8') as file:
        file.writelines(newLines)       

def readJSONLines(filePath):
    with open(filePath, 'r', encoding="utf-8") as file:
        return file.readlines()
    

def batchToggle(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".json") and "-colors-" in file:
                toggleSchema(os.path.join(root, file))

def cleanPalletes(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".json") and "-colors-" in file:
                filePath = os.path.join(root, file)
                lines = readJSONLines(filePath)
                if hasSchema(lines):
                    newLines = removeSchema(lines)
                    writeLines(filePath,newLines)
                    print(f"Removed $schema from {filePath}")

if __name__ == "__main__":
    if len(sys.argv) >= 2:
        path = sys.argv[1]
        if "--remove-only" in sys.argv:
            cleanPalletes(path)
        else:
            batchToggle(path)
    else:
        print("Usage: python colorSliderToggle.py <directory> [--remove-only]")
# python colorSliderToggle.py ./palettes
