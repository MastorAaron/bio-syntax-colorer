import json
import colorsys

neutralGrey = "#7F7F7F"

color = "#BFBFBF"
color = "#8F8F8F"
color = "#6B6B6B"
color = "#353535"
color = "#1A1A1A"

color = "#FFFFFF"
color = "#7F7F7F"
color = "#3F3F3F"
amt = .25



    
black = "#000000" 
white = "#FFFFFF"


"#7F7FFF"
"#3F3FBF"
"#00007F"

"#7F007F"
"#7F7F7F"
"#0000FF"

"#00FF7E"
"#007FBE"
"#0000FF"
"#3F00FF"
"#7E00FF"
 
"#7E00FF"
"#7F3F7F"
"#FF0000"
"#FF3F00"
"#FF7F00"
 
"#FF7F00"
"#FFBF00"
"#FFFF00"
"#7FFF3F"
"#00FF7E"

Gold    = "#FFD700"   # RGB(255, 215, 0)
Bronze  = "#CD7F32"   # RGB(205, 127, 50)
Silver  = "#C0C0C0"   # RGB(192, 192, 192)

RoyalPurple = "#7851A9"  # RGB(120, 81, 169)
Teal        = "#008080"  # RGB(0, 128, 128)
Maroon      = "#800000"  # RGB(128, 0, 0)

"#FF0000"
"#FFFF00"
"#00FF7E"

# Greens:
"#7FFFBE"
"#3FBF7E"
"#007F3F"

"#4CFFA4"
"#26D87E"
"#00B258"

# Greens:
"#005F2F"
"#003F1F"
"#001F0F"

# Greens:
"#3F9F6F"
"#7FBF9F"
"#BFDFCF"
  
def printColor(color, title=""):
    if title == "":
        print(f'"{color}"')
    else:
        print(f'{title} = "{color}"')
    
def printColors(bag, title="", subtitle=""):
    if title != "":
        print(f"#{title}:")
    for color in bag:
        printColor(color, subtitle)
    print()

# Load the existing palette
def loadColorRules(fileName):
    with open(fileName, 'r') as inputFile:
        colorRules = json.load(inputFile)
    return colorRules

# Helper: invert RGB (negative)
def invertHex(hexStr):
    hexStr = hexStr.lstrip('#')
    val = int(hexStr, 16)
    inv = 0xFFFFFF - val
    return f'#{inv:06X}'

def parseHexPair(pair): 
    return int(pair, 16) / 255.0; #hexidecimal base 16

def hexStrToRGB(hexStr):
    hexStr = hexStr.lstrip('#')
    if len(hexStr) != 6:
        raise ValueError(f"Invalid hex color: '{hexStr}'")
    return (
        parseHexPair(hexStr[0:2]),
        parseHexPair(hexStr[2:4]),
        parseHexPair(hexStr[4:6])
    )

# Helper: complementary via HSL hue shift (+0.5)
def complementaryHex(hexStr):
    r, g, b = hexStrToRGB(hexStr)
    # convert RGB to HLS (note: colorsys uses H, L, S)
    h, l, s = colorsys.rgb_to_hls(r, g, b) #Hue, Luminance, Saturation
    h2 = (h + 0.5) % 1.0
    r2, g2, b2 = colorsys.hls_to_rgb(h2, l, s)
    return rgbToHex(r2, g2, b2)

def channelToHex(pureColor):
    return "{:02X}".format(int(pureColor*255)) #always upper()

def rgbToHex(r, g, b):
    rHex = channelToHex(r)
    gHex = channelToHex(g)
    bHex = channelToHex(b)
       
    return f"#{rHex}{gHex}{bHex}"

def hlsToHex(h, l, s):
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    # Color: (HLS) Hue, Luminance and Intensity
        # Hue: name of color
        # Luminance: (Value): relative brightness or darness
        # Saturation: (Intensity) purity of color which determines brightness or dullness
    return rgbToHex(r, g, b)

def blendColors(baseHex, blendHex, ratio=0.5):
    if baseHex == blendHex:
        return baseHex
    rA, gA, bA = hexStrToRGB(baseHex)
    rB, gB, bB = hexStrToRGB(blendHex)
    
    rNew = min(1.0, rA * (1-ratio) + rB * ratio)
    gNew = min(1.0, gA * (1-ratio) + gB * ratio)
    bNew = min(1.0, bA * (1-ratio) + bB * ratio)
    
    return rgbToHex(rNew, gNew, bNew) 
# '#{:02X}{:02X}{:02X}'.format(int(rNew*255), int(gNew*255), int(bNew*255))

def addWhite(hexStr,amt):
    return blendColors(hexStr, "#FFFFFF", amt)

def addBlack(hexStr,amt):
    return blendColors(hexStr, "#000000", amt)

def addRed(hexStr,amt):
    return blendColors(hexStr, "#FF0000", amt)

def addBlue(hexStr,amt):
    return blendColors(hexStr, "#0000FF", amt)

def addYellow(hexStr,amt):
    return blendColors(hexStr, "#FFFF00", amt)
    # "#RRGGBB"

# Build inverted and complementary palettes
def mapColorRule(colorRules, mappingRule):
    newColors = {'tokenColors': []}
    for rule in colorRules['tokenColors']:
        newRules = dict(rule)
        newRules['settings'] = dict(rule['settings'])
        newRules['settings']['foreground'] = mappingRule(rule['settings']['foreground'])
        newColors['tokenColors'].append(newRules)
    return newColors

def genTriad(hexStr): #Three equally spaced colors 
    r, g, b = hexStrToRGB(hexStr)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    h2 = (h + 1/3) % 1.0  # +120°
    h3 = (h + 2/3) % 1.0  # +240°

    color2 = hlsToHex(h2, l, s)
    color3 = hlsToHex(h3, l, s)
    
    return [hexStr, color2, color3]
    
def genTetrad(hexStr): #two sets of complementary colors
    r, g, b = hexStrToRGB(hexStr)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    
    h2 = (h + 1/4) % 1.0  # +90°
    h3 = (h + 2/4) % 1.0  # +180°
    h4 = (h + 3/4) % 1.0  # +270°

    color2 = hlsToHex(h2, l, s)
    color3 = hlsToHex(h3, l, s)
    color4 = hlsToHex(h4, l, s)
    
    return [hexStr, color2, color3, color4]

def genComples(hexStr):
    return [hexStr, complementaryHex(hexStr)]
    
    
def genSplitComple(hexStr):
    r, g, b = hexStrToRGB(hexStr)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    
    h2 = (h + 5/12) % 1.0  # +150°
    h3 = (h + 7/12) % 1.0  # +210°

    color2 = hlsToHex(h2, l, s)
    color3 = hlsToHex(h3, l, s)
    
    return [hexStr, color2, color3]
  
def genTertColors(primary,secondary):
    colors = []
    for prime in primary:
        for second in secondary:
            colors.append(blendColors(prime,second))
    printColors(colors)
    return colors

# Alterations:
def genTint(hexStr,amt):
    #Tint: Color plus white
    return addWhite(hexStr,amt)

def genTone(hexStr, amt):
    #Tone: Color plus Neutral Grey
    #Neutral Grey a balanced combo of Black and White
    return blendColors(hexStr, neutralGrey, amt)    
  
def genShade(hexStr,amt):
    #Shade: Color plus black
    return addBlack(hexStr,amt)    

def genTrio(hexStr,amt):
    Tint = genTint(hexStr,amt)
    Tone = genTone(hexStr,amt)
    Shade = genShade(hexStr,amt)
  
    return [Tint, Tone, Shade]  

def genPrimeTrio(hexStr,amt):
    redMix = addRed(hexStr,amt)
    yellMix = addYellow(hexStr,amt)
    blueMix = addBlue(hexStr,amt)
    return redMix, yellMix, blueMix

def hueDegree(hexStr):
    r, g, b = hexStrToRGB(hexStr)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return h * 360

#Warm Advancing Colors
def isWarm(hexStr):
    # Warm Colors ≈ 0°–90° and 300°–360° → Reds, Oranges, Yellows, Magentas
    hue = hueDegree(hexStr)
    return (hue >= 0 and hue < 90) or (hue >= 300 and hue < 360)

#Cool Receding Colors
def isCool(hexStr):
    # Cool Colors ≈ 90°–300° → Greens, Cyans, Blues, Purples
    hue = hueDegree(hexStr)
    return (90 <= hue < 300)

def isNeutral(hexStr):
    r,g,b = hexStrToRGB(hexStr)
    return abs(r-g) <.01 and abs(g-b) < .01

# 1° Colors: Red, Yellow, Blue cannot be made by mixing colors
Red     = "#FF0000"
Yellow  = "#FFFF00"
Blue    = "#0000FF"

# 2° Colors: Orange, Green, Purple made by mixing 2 1° colors
Orange = "#FF7F00"
Green  = "#00FF7E"
Purple = "#7E00FF"
altPurple = "#7F007F"

# 3° Colors: 6 Colors made from mixing one 1° color with one 2° color
RedOrange = "#FF3F00"#Red+Orange
"#7F7F3F"#Red+Green
"#BE007F"#Red+Purple

YellowOrange = "#FFBF00"#Yellow+Orange
YellowGreen  = "#7FFF3F"#Yellow+Green
"#BE7F7F"#Yellow+Purple

RedViolet = "#7F3F7F" #Blue+Red
BlueGreen = "#007FBE"#Blue+Green
BlueViolet ="#3F00FF"##Blue+Purple



ColorMap = [
    ("Blue",Blue),("Blue-Violet",BlueViolet),
    ("Purple",Purple),("Red-Violet",RedViolet),
    ("Red",Red),("Red-Orange",RedOrange),
    ("Orange",Orange),("Yellow-Orange",YellowOrange),
    ("Yellow",Yellow),("Yellow-Green",YellowGreen),
    ("Green",Green),("Blue-Green",BlueGreen)
    ]

wheelStrs = ["Blue","Blue Violet","Purple","Red-Violet","Red","Red-Orange",
              "Orange","Yellow-Orange","Yellow","Yellow-Green","Green","Blue-Green"]

def colorWheelIndex(colorName: str):
    for i, (name, _) in enumerate(ColorMap):
        if name == colorName:
            return i
    raise ValueError(f"Color name '{colorName}' not found in ColorMap")

def genAnalogousColors(color):
    # Analogous Colors: Using colors that are adjacent to each color on the color wheel.
    # Use at least 2 - 5 colors

    palette = []
    cwSize = len(ColorMap)
    i = colorWheelIndex(color)
    for j in range(i-2,i+2+1): #5 colors in palette
        palette.append(ColorMap[j%cwSize][1])
    return palette

def removeToken(str,token):
    return str.strip(token)

def CompAndInvertPalettes(inPath = "fasta-colors-cold.json"):
    # Save to new JSON files
    colorRules = loadColorRules(inPath)
    inverted = mapColorRule(colorRules, mappingRule=invertHex)
    complementary = mapColorRule(colorRules, mappingRule=complementaryHex)

    pathName=inPath.strip(".json")
    inv_path = pathName+"-inverted.json"
    comp_path = pathName+"-complementary.json"
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
    
def incremtByColor(baseColor,colorFunct =addBlack,title=""):
    colors = []
    for i in range(1, 4):
        amt = i * 0.25
        colors.append(f'{colorFunct(baseColor, amt)}')
    printColors(colors,title)
    
def removeFromList(colorList, color):
    return [each for each in colorList if each != color]
    
def createPalette(baseColor):
    tetrad = genTetrad(baseColor)
    A = tetrad[0]  # base
    G = tetrad[1]  # +90°
    C = tetrad[2]  # +180° (complement)
    T = tetrad[3]  # +270°
    printColor(A,'A')
    printColor(C,'C')
    tetrad = removeFromList(tetrad, A)
    tetrad = removeFromList(tetrad, C)
    if len(tetrad) >= 2:
        G = tetrad[0]
        printColor(G,'G')
        T = tetrad[1]
        printColor(T,'T')
        U = addWhite(T,1/12)
    else:
        raise ValueError("Not enough colors in tetrad after removing base and complement.")
    
    R = blendColors(A,G)
    Y = blendColors(T,C)
    
    W = blendColors(A,T)
    S = blendColors(G,C)
    
    B = blendColors(S,T)
    D = blendColors(R,T)
    H = blendColors(W,C)
    V = blendColors(W,G)
    
    M = blendColors(A,C)
    K = complementaryHex(M)
    
    N = blendColors(M,K)
    
    return [
        A, C, G, T, U,
        R,Y,
        N,
        M, K, S, W, 
        B, D, H, V
    ]
    
    
    
    
    

# main# main# main# main# main# main# main# main# main# main# main# main# main# main# main
# primaryColors = [Red, Yellow, Blue]
# secondaryColors = [Orange, Green, Purple]
# tertiaryColors = []
 
color = "#BFBFBF"
color = "#8F8F8F"
color = "#6B6B6B"
color = "#353535"
color = "#1A1A1A"

color = "#FFFFFF"
color = "#7F7F7F"
color = "#3F3F3F"
amt = .25
    
black = "#000000" 
white = "#FFFFFF"

# printColor(blendColors(Red, Yellow),"Orange")
# printColor(blendColors(Yellow, Blue),"Green")
# printColor(blendColors(Red, Blue),"Purple")

# printColors(genTriad(Orange))

# genTertColors(primaryColors,secondaryColors)

# neutralGrey = blendColors("#000000", "#FFFFFF", 0.5)
# printColor(neutralGrey,"neutralGrey")  # Should yield "#7F7F7F"

# print()
# printColors(genTrio(Blue,.5))
# printColors(genPrimeTrio(Blue,.5))

"#7F7FFF"
"#3F3FBF"
"#00007F"

"#7F007F"
"#7F7F7F"
"#0000FF"

print("Palatte:")
# printColors(genAnalogousColors("Blue"),"Palatte")
"#00FF7E"
"#007FBE"
"#0000FF"
"#3F00FF"
"#7E00FF"
# printColors(genAnalogousColors("Red"),"Palatte")
"#7E00FF"
"#7F3F7F"
"#FF0000"
"#FF3F00"
"#FF7F00"
# printColors(genAnalogousColors("Yellow"),"Palatte")
"#FF7F00"
"#FFBF00"
"#FFFF00"
"#7FFF3F"
"#00FF7E"

Bronze  = "#CD7F32"   # RGB(205, 127, 50)
Silver  = "#C0C0C0"   # RGB(192, 192, 192)
Gold    = "#FFD700"   # RGB(255, 215, 0)

Maroon      = "#800000"  # RGB(128, 0, 0)
Teal        = "#008080"  # RGB(0, 128, 128)
RoyalPurple = "#7851A9"  # RGB(120, 81, 169)

Blue        = "#0000FF"
RoyalPurple = "#7851A9"  # RGB(120, 81, 169)
Gold        = "#FFD700"   # RGB(255, 215, 0)


# printColors([Red,Yellow,Green],"RYG")
"#FF0000"
"#FFFF00"
"#00FF7E"

# printColors(genTrio(Green,.3),"Greens")
# Greens:
"#7FFFBE"
"#3FBF7E"
"#007F3F"

"#4CFFA4"
"#26D87E"
"#00B258"

# Greens:
"#005F2F"
"#003F1F"
"#001F0F"

# incremtByColor("#007F3F",addWhite,"Greens")

# Greens:
"#3F9F6F"
"#7FBF9F"
"#BFDFCF"

#Nukes#Nukes#Nukes#Nukes#Nukes#Nukes#Nukes#Nukes#Nukes#Nukes#Nukes#Nukes
nucleotides  = ['A','C','G','T','U']
#             #5
extendedNukes = [
    'R','Y','B','D','V','N','M','K',
] #8


# print(len(extendedNukes))
#Aminos#Aminos#Aminos#Aminos#Aminos#Aminos#Aminos#Aminos#Aminos#Aminos#Aminos#Aminos
AminoAcids  = [
    'D', 'E', 
    'K', 'R', 
    'H', 'P', 'W', 'Y', 'F', 
    'S', 'T', 'N', 'C', 'Q',
    'L', 'I', 'M', 'V', 'A', 'G'
]

extendedNukes = [
    'J','B',
] #8


ambigLetters = [
    'A', 'C', 'G', 'T', 'U', 
    'R', 'Y',
    
    'V', 
'N','M', 'K',
    'D', 
]
            # 20
AminoAcidsCatches = ['O','U'] #UGA  for U
            #2
negativeAA  = ['D','E']
            #2
postiveAA   = ['K','R','H','O'] #O is from Archae
            #3-4
aromaticAA  = ['W','Y','F']
            #3
ringedAA    = ['W','Y','F','H','P']
            #5
polarAA     = ['S','T','N','C','Q','U'] #U?
            #5-6
aliphaticAA = ['L','I','M','V','A','P','I','G']
            #8 NonPolar

ambigLetters = [
    'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Y'
]

print(len(ambigLetters))

extras      = ['B', 'Z', 'X']
typesAA = ['N','P','A','+','-']#'R' Ringed

def printList(bag, d=" ",token=False):
    for i in range(len(bag)):
        each = bag[i]
        if i < len(bag)-1:
            printToken(each,d) if token else print(each,end=d)
        else:
            printToken(each) if token else print(each)
    print()
    
def printToken(token,d='\n'):
    print(f"'{token}'",end=d)

ambigLetters = []
allAminos = AminoAcids
allAminos.extend(AminoAcidsCatches)
allAminos.sort()

print("allAminos = [" )
printList(allAminos," ")
print("]" )

for each in allAminos:
    if each in nucleotides or each in extendedNukes:
        print(each, "added")
        ambigLetters.append(each)
ambigLetters.sort()  

print("ambigLetters = [" )
printList(ambigLetters,", ")
print("]" )
print("len ambig:",len(ambigLetters))

"#FF0000"
"#4192FF"

# CompAndInvertPalettes(inPath = "fasta-colors-warm.json")

# A Red
# C Blue
# G Yellow OR Black
# T Green

# Sanger
    # A Green
    # C Blue
    # G Black
    # T Red

printList(typesAA,'\n')
printColors(createPalette(baseColor="#FF0000"))

"#FF0000"
"#00FEFF"
"#FF0000"
"#7FFF00"
"#89FF15"

"#FF0000"
"#FF0000"
"#7F7F7F"
"#7F7F7F"
"#7F7F7F"
"#7F7F7F"
"#BF7F00"
"#7FBF3F"
"#BF7F00"
"#5FBE7F"
"#DF3F00"

"#4192FF"
"#FFAD41"
"#4192FF"
"#FF41F0"
"#FF50F1"

"#4192FF"
"#4192FF"
"#9F9F9F"
"#A09FA0"
"#9FA09F"
"#A09FA0"
"#A069F7"
"#CF70C8"
"#A069F7"
"#CF8B9C"
"#707DFB"


printColors(genTetrad("#FF0000"),"Tetrad")
"#FF0000"
"#7FFF00"
"#00FEFF"
"#7F00FF"

A = "#FF0000"
C = "#00FEFF"
G = "#7FFF00"
T = "#7F00FF"
"#FF0000"
"#00FEFF"
"#7FFF00"
"#7F00FF"
"#8915FF"
"#BF7F00"
"#3F7FFF"
"#7F7F7F"
"#7F7F7F"
"#7F7F7F"
"#3FFE7F"
"#BF007F"
"#5F7FBF"
"#9F3F7F"
"#5F7FBF"
"#9F7F3F"

# Tetrad:
"#FF0000"
"#7FFF00"
"#00FEFF"
"#7F00FF"

NeonYellow  = "#FFFF33"
NeonGreen   = "#39FF14"
NeonBlue    = "#1F51FF"
NeonMagneta = "#FF00FF"

Neons = [NeonYellow, NeonGreen, NeonBlue, NeonMagneta]


"#D4D4D4"
"#57606C"

DARK_FG  = "#D4D4D4";
LIGHT_FG = "#57606C";