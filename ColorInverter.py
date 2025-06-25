import json
import colorsys

# Load the existing palette
def loadColorRules():
    with open('fasta-colors.json', 'r') as inputFile:
        colorRules = json.load(inputFile)
    return colorRules

# Helper: invert RGB (negative)
def invertHex(hexStr):
    hexStr = hexStr.lstrip('#')
    val = int(hexStr, 16)
    inv = 0xFFFFFF - val
    return f'#{inv:06X}'

# Helper: complementary via HSL hue shift (+0.5)
def complementaryHex(hexStr):
    hexStr = hexStr.lstrip('#')
    r = int(hexStr[0:2], 16) / 255.0
    g = int(hexStr[2:4], 16) / 255.0
    b = int(hexStr[4:6], 16) / 255.0
    
    # convert RGB to HLS (note: colorsys uses H, L, S)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    h2 = (h + 0.5) % 1.0
    r2, g2, b2 = colorsys.hls_to_rgb(h2, l, s)
    return '#{:02X}{:02X}{:02X}'.format(int(r2*255), int(g2*255), int(b2*255))

# Build inverted and complementary palettes
def mapColorRule(colorRules, mappingRule):
    newColors = {'tokenColors': []}
    for rule in colorRules['tokenColors']:
        newRules = dict(rule)
        newRules['settings'] = dict(rule['settings'])
        newRules['settings']['foreground'] = mappingRule(rule['settings']['foreground'])
        newColors['tokenColors'].append(newRules)
    return newColors

# Save to new JSON files
colorRules = loadColorRules()
inverted = mapColorRule(colorRules, mappingRule=invertHex)
complementary = mapColorRule(colorRules, mappingRule=complementaryHex)

inv_path = 'fasta-colors-inverted.json'
comp_path = 'fasta-colors-complementary.json'
with open(inv_path, 'w') as outFile:
    json.dump(inverted, outFile, indent=2)
    
with open(comp_path, 'w') as outFile:
    json.dump(complementary, outFile, indent=2)

# Show a preview of the first three entries from each
print("Inverted palette sample:")
for r in inverted['tokenColors'][:3]:
    print(r)
print("\nComplementary palette sample:")
for r in complementary['tokenColors'][:3]:
    print(r)

print(f"\nFiles written:\n - {inv_path}\n - {comp_path}")
