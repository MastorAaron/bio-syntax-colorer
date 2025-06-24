import json
import colorsys

# Load the existing palette
with open('/mnt/data/fasta-colors.json', 'r') as f:
    data = json.load(f)

# Helper: invert RGB (negative)
def invert_hex(hexstr):
    hexstr = hexstr.lstrip('#')
    val = int(hexstr, 16)
    inv = 0xFFFFFF - val
    return f'#{inv:06X}'

# Helper: complementary via HSL hue shift (+0.5)
def complementary_hex(hexstr):
    hexstr = hexstr.lstrip('#')
    r = int(hexstr[0:2], 16) / 255.0
    g = int(hexstr[2:4], 16) / 255.0
    b = int(hexstr[4:6], 16) / 255.0
    # convert RGB to HLS (note: colorsys uses H, L, S)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    h2 = (h + 0.5) % 1.0
    r2, g2, b2 = colorsys.hls_to_rgb(h2, l, s)
    return '#{:02X}{:02X}{:02X}'.format(int(r2*255), int(g2*255), int(b2*255))

# Build inverted and complementary palettes
inverted = {'tokenColors': []}
complementary = {'tokenColors': []}

for rule in data['tokenColors']:
    new_rule_inv = dict(rule)
    new_rule_inv['settings'] = dict(rule['settings'])
    new_rule_inv['settings']['foreground'] = invert_hex(rule['settings']['foreground'])
    inverted['tokenColors'].append(new_rule_inv)

    new_rule_comp = dict(rule)
    new_rule_comp['settings'] = dict(rule['settings'])
    new_rule_comp['settings']['foreground'] = complementary_hex(rule['settings']['foreground'])
    complementary['tokenColors'].append(new_rule_comp)

# Save to new JSON files
inv_path = '/mnt/data/fasta-colors-inverted.json'
comp_path = '/mnt/data/fasta-colors-complementary.json'
with open(inv_path, 'w') as f:
    json.dump(inverted, f, indent=2)
with open(comp_path, 'w') as f:
    json.dump(complementary, f, indent=2)

# Show a preview of the first three entries from each
print("Inverted palette sample:")
for r in inverted['tokenColors'][:3]:
    print(r)
print("\nComplementary palette sample:")
for r in complementary['tokenColors'][:3]:
    print(r)

print(f"\nFiles written:\n - {inv_path}\n - {comp_path}")
