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