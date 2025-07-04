#include <algorithm>
#include <limits.h>

#include <vector>
#include <cassert>

#include <tuple>

#include <unordered_map>
#include <map>
#include <cmath>
#include <set>
#include <regex>

#include <fstream>
#include <iostream>
#include <dirent.h>

#include <cstdlib>
#include <cstring>
#include <string>

#include <float.h>
#include <iomanip>
// #include "ProteinParser.cpp"

using namespace std;
typedef vector<string>         DnaVec;
typedef tuple<string, char, int, double>         fourple;
//UAG (normally a stop codon) codes for 'O'
vector<char> negativeAA  = {'D','E'};
vector<char> postiveAA   = {'K','R','H','O'}; //O is from Archae
vector<char> aromaticAA  = {'W','Y','F'};
vector<char> ringedAA    = {'W','Y','F','H','P'};
vector<char> polarAA     = {'S','T','N','C','Q','U'}; //U?
vector<char> aliphaticAA = {'L','I','M','V','A','P','I','G'};

vector<char> nucleotides  = {'A','C','G','T','U'};

vector<char> AminoAcids  = {'D', 'E', 'K', 'R', 'H', 'W', 'Y', 'F', 'P', 'S', 'T', 'N', 'C', 'Q', 'L', 'I', 'M', 'V', 'A', 'G'};
vector<char> AminoAcidsCatches ={'O','U'}; //UGA  for U
vector<char> extras      = {'B', 'Z', 'X'};

vector<char> typesAA = {'N','P','A','+','-'};//'R' Ringed

template <class T>
bool isMember(T target, vector<T> array){
    for(int i=0; i< array.size(); i++){
        if(target == array[i])
        return true;
    }
    return false;
}

bool isType(char AA){      return (isMember(AA, typesAA));      } 
bool isNegative(char AA){  return (isMember(AA, negativeAA));   } //-
bool isPostive(char AA){   return (isMember(AA, postiveAA));    } //+ 

bool isAromatic(char AA){  return (isMember(AA, aromaticAA));   } //A Aromatic
bool isRinged(char AA){    return (isMember(AA, ringedAA));     } //R Ringed
bool isPolar(char AA){     return (isMember(AA, polarAA));      } //P Polar
bool isAliphatic(char AA){ return (isMember(AA, aliphaticAA));  } //N Nonpolar

string isolateByType(string strand, vector<char> type){
    int psL = strand.length();
    string newStr;
    for(int i=0; i<psL; i++){
        if(isMember(strand[i],type)){
            newStr+=strand[i];
        }else{
            newStr+='0';
        }
    }
    return newStr; 
}

string isolateByTypeAlt(string strand, char T){
    int psL = strand.length();
    string newStr;
    for(int i=0; i<psL; i++){
        if(strand[i] == T){
            newStr+=strand[i];
        }else{
            newStr+='0';
        }   
    }
    return newStr; 
}

int greatestDigit(vector<double> doubles){
    int max=0;
    for(auto each : doubles){
        string eachStr = to_string(each);
        if(eachStr.length() > max){
            max = eachStr.length();
        }
    }
    return max;
}

int numDigit(double s){
    string S = to_string(s);
    return S.length();
}

int numDigit(int s){
    string S = to_string(s);
    return S.length();
}

int greatestDigit(vector<int> ints){
    int max=0;
    for(auto each : ints){
        int newInt = numDigit(each);
        if(newInt > max){
            max = newInt;
        }
    }
    return max;
}

int greatestDigit(vector<vector<int>> scoreVec){
    vector<int> t;
    for(auto scores: scoreVec){
        for(auto score: scores){
            t.push_back(score);
        }
    }
    return greatestDigit(t);
}

vector<int> extractDbls(vector<fourple> frples){

    vector<int> extInts;
    for(auto frpl : frples){
        extInts.push_back(get<3>(frpl));
    }
    return extInts;
}

template<class P>
vector<double> extractDbls(vector<pair<P,double>> pairs){
    vector<double> temp; 
    for(auto each : pairs){
        int p =each.second;
        temp.push_back(p);
    }
    return temp;
}

vector<int> extractInts(vector<fourple> frples){
    vector<int> extInts;
    for(auto frpl : frples){
        extInts.push_back(get<2>(frpl));
    }
    return extInts;
}

template<class P>
vector<int> extractInts(vector<pair<P,int>> pairs){
    vector<int> temp; 
    for(auto each : pairs){
        int p =each.second;
        temp.push_back(p);
    }
    return temp;
}

string getPadding(int i, int largestDigit){
    int p = numDigit(i);
    int pad = largestDigit - p;
    string padding="";
    for(int j=0; j< pad+1; j++){
        padding+=" ";
    }
    return padding;
}

string getPadding(double d, int largestDigit){
    int p = numDigit(d);
    int pad = largestDigit - p;
    string padding="";
    for(int j=0; j< pad+1; j++){
        padding+=" ";
    }
    return padding;
}

bool onlyContains(string proteinStrand, vector<char> array){
    int psL = proteinStrand.length();
    for(int i=0; i<psL; i++){
        if(!isMember(proteinStrand[i], array)){
            return false;
        }
    }
    return true;
}

string PropertyChecker(string proteinStrand, bool printKey=false){
    int psL = proteinStrand.length();
    string newStr;
    for(int i=0; i<psL; i++){
             if(isAliphatic(proteinStrand[i])){
            newStr+='N'; //Nonpolar
        //}else if(isRinged(proteinStrand[i])){
            // newStr+='R'; //Ringed
        }else if(isAromatic(proteinStrand[i])){
           newStr+='A'; //aromatic
        }else if(isPostive(proteinStrand[i])){
            newStr+='+';
        }else if(isNegative(proteinStrand[i])){
            newStr+='-';
        }else if(isPolar(proteinStrand[i])){
            newStr+='P';
        }else{
            newStr+='0';
        }
    }if(printKey){
        cout << "When " << endl;
        cout << "(+) is Positive" << endl;
        cout << "(-) is Negative" << endl;
        cout << "(A) is Aromatic" << endl;
        cout << "(N) is Nonpolar " << endl;
        cout << "(P) is Polar" << endl;
    }
    return newStr; 
}

DnaVec PropertyForVec(DnaVec container){
    DnaVec newContainer;
    for(auto eachSeq: container){
        newContainer.push_back(PropertyChecker(eachSeq));
    }
    return newContainer;
}

string VecToStr(DnaVec seqs){
    string newStr;
    for (auto seq : seqs){
        newStr+=seq;
    }
    return newStr;
}

string AliphaticStr(string Bools){
    string newStr;
    for (int i=0; i< Bools.length(); i++){
        if(Bools[i]=='1'){
          newStr+= 'A';
        }else{
          newStr+= Bools[i];   
        }
    }
    return newStr;
}

string makePercent(double fraction){
    double percent = fraction*100.0;
    string str= to_string(percent) + "%";
    return str;
}

void printMatrix(map<char,int> container, string TITLE){
    cout << TITLE << ": " << endl;

    for (auto iter: container){
        cout << iter.first << " " << iter.second << endl; 
    }
    cout << endl;   
}

template<class P>
void printVec(vector<P> container, string TITLE="", char d='\n', bool toFile=false){
    if(toFile){
         std::ofstream out("aminoData.txt", std::ios::app);
         out << TITLE << ": " << endl;
        cout << TITLE << ": " << endl;

    for (auto iter: container){
         out << iter << d; 
        cout << iter << d; 
    }
     out << endl; 
    cout << endl; 
    }else{
         cout << TITLE << ": " << endl;

    for (auto iter: container){
        cout << iter << d; 
    }
    cout << endl;   
    }
}

void printComp(vector<pair<string,double>> pairs, string TITLE){
    cout << TITLE << endl;
    int largest = greatestDigit(extractDbls(pairs));
    for(auto each : pairs){
        string pad = getPadding(each.second,largest);
        cout << each.first <<":\t"<< pad <<makePercent(each.second) <<endl;
    }
}

void printPairs(vector<pair<char,int>> pairs, string TITLE, bool toFile=false){
    if(toFile){
        std::ofstream out("aminoData.txt", std::ios::app);
        out << TITLE << endl;
        for(auto each : pairs){
            out << each.first <<" "<<each.second <<endl;
        } 
    }
    cout << TITLE << endl;

    int largestDigit =greatestDigit(extractInts(pairs));

    for(auto each : pairs){
        int j = each.second;
        string padding = getPadding(j,largestDigit);
        cout << each.first <<":\t"<< padding<< j <<endl;
    }
}

void printPairs(vector<pair<string,int>> pairs, string TITLE, bool toFile=false){
    if(toFile){
        std::ofstream out("aminoData.txt", std::ios::app);
        out << TITLE << endl;
        for(auto each : pairs){
            out << each.first <<" "<<each.second <<endl;
        } 
    }

    int largestDigit =greatestDigit(extractInts(pairs));

    cout << TITLE << endl;
    for(auto each : pairs){
        int j = each.second;
        string padding = getPadding(j,largestDigit);
        cout << each.first <<":\t"<< padding<< j <<endl;
    }
}

void printPairs(vector<pair<string,double>> pairs, string TITLE, bool toFile=false){
    if(toFile){
        std::ofstream out("aminoData.txt", std::ios::app);
        out << TITLE << endl;
        for(auto each : pairs){
            out << each.first <<" "<<each.second <<endl;
        }
    }
    cout << TITLE << endl;
    for(auto each : pairs){
        cout << each.first <<" "<<each.second <<endl;
    }
}

void printPairs(vector<pair<int,double>> pairs, string TITLE, bool toFile=false){
    if(toFile){
        std::ofstream out("aminoData.txt", std::ios::app);
        out << TITLE << endl;
        for(auto each : pairs){
            out << each.first <<" "<<each.second <<endl;
        }
    }      
    cout << TITLE << endl;
    for(auto each : pairs){
        cout << each.first <<" "<<each.second <<endl;
    }
}

string parseProperties(char A, bool FullWord=false){
    string abr;
    switch (A)    {
        case 'A':  abr = (FullWord)? "Aromatic"    : "Aro";         break;
        case 'N':  abr = (FullWord)? "Nonpolar"    : "Non";         break;
        case 'P':  abr = (FullWord)? "Polar"       : "Pol";         break;
        case '-':  abr = (FullWord)? "Negative"    : "Neg";         break;
        case '+':  abr = (FullWord)? "Positive"    : "Pos";         break;

        default:          abr+= "?";                                break;//Error
    }
    return abr;
}

string parseAminosCatches(char A, bool FullWord=false){
    string amino; 
    switch (A)    {
      case 'O':    amino= (FullWord)? "Pyrrolysine "     : "Pyl";         break;
      case 'U':    amino= (FullWord)? "Selenocysteine "  : "Sec";         break;
    //   case 'τ':    amino= (FullWord)? "Taurine "         : "Tau";         break;

      default:     amino+= "?";                                     break;//Error
    }
    return amino;
}

string parseAminos(char A, bool FullWord=false){
    string amino;
    switch (A)    {
      case 'L':    amino= (FullWord)? "Leucine"    : "Leu";         break;
      case 'I':    amino= (FullWord)? "Isoleucine" : "Ile";         break;
      case 'M':    amino= (FullWord)? "Methionine" : "Met";         break;
      case 'V':    amino= (FullWord)? "Valine"     : "Val";         break;
      case 'A':    amino= (FullWord)? "Alanine"    : "Ala";         break;
      case 'P':    amino= (FullWord)? "Proline"    : "Pro";         break;
      case 'G':    amino= (FullWord)? "Glycine"    : "Gly";         break;
      
      case 'S':    amino= (FullWord)? "Serine"     : "Ser";         break;
      case 'T':    amino= (FullWord)? "Threonine"  : "Thr";         break;
      case 'N':    amino= (FullWord)? "Asparagine" : "Asn";         break;
      case 'C':    amino= (FullWord)? "Cysteine"   : "Cys";         break;
      case 'Q':    amino= (FullWord)? "Glutamine"  : "Gln";         break;
      
      case 'W':    amino= (FullWord)? "Tryptophan" : "Trp";         break;
      case 'Y':    amino= (FullWord)? "Tyrosine"   : "Tyr";         break;
      case 'F':    amino= (FullWord)? "Phenolalanine" :"Phe";       break;
      //case "-Stop":   protein+= "-Stop";
      case 'K':    amino= (FullWord)? "Lysine"     : "Lys";         break;
      case 'R':    amino= (FullWord)? "Arginine"   : "Arg";         break;
      case 'H':    amino= (FullWord)? "Histidine"  : "His";         break;
      
      case 'D':    amino+= (FullWord)? "Aspartate" : "Asp";         break;
      case 'E':    amino+= (FullWord)? "Glutamate" : "Glu";         break;
      default:     amino+= parseAminosCatches(A,FullWord);          break;//Error
    }
    return amino;
}

string parseNukes(char A, bool FullWord=false){
    string amino;
    switch (A)    {
      case 'A':    amino= (FullWord)? "Adenine"    : "Ade";         break;
      case 'C':    amino= (FullWord)? "Cytosine"   : "Cyt";         break;
      case 'G':    amino= (FullWord)? "Guanine"    : "Gua";         break;
      case 'T':    amino= (FullWord)? "Thymine"    : "Thy";         break;
      case 'U':    amino= (FullWord)? "Uracil"     : "Ura  ";       break;

      case 'R':    amino= (FullWord)? "Purine"     : "Pur";         break;
      case 'Y':    amino= (FullWord)? "Pyrimidine" : "Pyr";         break;

      case 'B':    amino= (FullWord)? "Not A"      : "NoA";         break;
      case 'D':    amino= (FullWord)? "Not C"      : "NoC";         break;
      case 'H':    amino= (FullWord)? "Not G"      : "NoG";         break;
      case 'V':    amino= (FullWord)? "Not U or T" : "NoUT";        break;

      case 'N':    amino= (FullWord)? "Any"        : "Any";         break;
      case 'M':    amino= (FullWord)? "Amino"      : "A/C";         break;
      case 'K':    amino= (FullWord)? "Keto"       : "G/T/U";       break;


      default:     amino+= parseAminos(A,FullWord);          break;//Error
    }
}

vector<pair<string,int>> formatFreq(vector<pair<char,int>> freqAminos, bool FullWord=false){
    vector<pair<string,int>> newFreq;

    for(auto each : freqAminos){
        char eachChar = each.first;
        int eachFreq  = each.second;
        string chain = parseAminos(eachChar, FullWord);
        newFreq.push_back(make_pair(chain,eachFreq));
    }

    return newFreq;
}

int sumVec(vector<int> HiddenVec ){
   int all; 
    for(auto each : HiddenVec){
        all += each;
    }
    return all;
}

double returnPercent(int i, int total){
    return (i / static_cast<double>(total));
}

vector<pair<string,double>> genAminoComp(vector<pair<string,int>> newFreq, int total){
    vector<pair<string,double>> comp; 
    for(auto each : newFreq){
        double percent = each.second / static_cast<double>(total);
        comp.push_back(make_pair(each.first,percent));
    }
    return comp;
}

void printFullComp(vector<fourple> fullComp){
    vector<fourple> temp;
    cout << "Amino acid Composition:" <<endl;
    vector<int> extInt = extractInts(fullComp);
    int largestDigit = greatestDigit(extInt);
    for(auto each : fullComp){
        if((get<1>(each)== 'U') || (get<1>(each)== 'O')){
            temp.push_back(each);
            continue;
        }

        string abr     = get<0>(each);
        char c         = get<1>(each);
        int num        = get<2>(each);
        double percent = get<3>(each);
        cout << abr << "  ";
        cout << "("<< c << ")" << "  ";
        string pad = getPadding(num,largestDigit);
        cout << pad <<num << "  \t";
        cout << makePercent(percent);
        cout << endl;   
        }
        
    for(auto each : temp){
        string abr     = get<0>(each);
        char c         = get<1>(each);
        int num        = get<2>(each);
        double percent = get<3>(each);
        cout << abr << "  ";
        cout << "("<< c << ")" << "  ";
        string pad = getPadding(num,largestDigit);
        cout << pad <<num << "  \t";
        cout << makePercent(percent);
        cout << endl;   
    }
}

bool isProperties(string DnaORProt){
    for(char each : DnaORProt){
        if(!isMember(each,typesAA) /*&& each != '-'*/){
            return false;
        }
    }
    return true;
}

bool isAminos(string DnaORProt){
    for(char each : DnaORProt){
        if(!isMember(each,AminoAcids) && each != '-'){
            return false;
        }
    }
    return true;
}

bool isAminoCatch(string DnaORProt){
    for(char each : DnaORProt){
        if(!isMember(each,AminoAcidsCatches) && each != '-'){
            return false;
        }
    }
    return true;
}

bool isNukes(string DnaORProt){
    for(char each : DnaORProt){
        if(!isMember(each,nucleotides)  && each != '-'){
            return false;
        }
    }
    return true;
}

char deterType(string PropORProt){
    if(isProperties(PropORProt)){    return 'P';
    }else if((isAminos(PropORProt) || isAminoCatch(PropORProt)) ){  return 'A';
    }else if(isNukes(PropORProt) ){  return 'N';                    //Issues here since Nukes look like a subset of Amino Acids despite my attempts to fix it
    }else{                           return 'T';
    }
}

string enuType(char T){
    switch(T){
        case 'P': return  "isProperties";
        case 'A': return  "isAminos or isAminoCatch" ; 
        case 'N': return  "isNukes"; 
        case 'T': return "Default Type";
    }
}


void deterParse(string PropORProt){ ///NEEDS TESTING
    char t = deterType(PropORProt);
    for(auto each: PropORProt){
        switch(t){
            case 'P':
                parseProperties(each);  return;
            case 'A':
                parseAminos(each);      return;
            case 'N':
                parseNukes(each);       return;
                
        }
    }

}

vector<fourple> genFullComp(vector<pair<char,int>> freqs, int total, char T='d'){
    for(auto each : freqs){
        if(T=='d'){
            T = deterType({each.first});
        }
        // cout << "Type Determined was: "<<  enuType(T) <<endl;
    }
    vector<fourple> vec;
    for(auto eachFreq : freqs){
        fourple frple;
        char c = eachFreq.first;
        string abr = (T == 'A') ? parseAminos(c) : parseProperties(c); //May cause issues with Amino acids
        int i = eachFreq.second;
        double percent = returnPercent(i,total);
        
        get<0>(frple) = abr;
        get<1>(frple) = c;
        get<2>(frple) = i;
        get<3>(frple) = percent;
        
        vec.push_back(frple);
    }
    sort(vec.begin(),vec.end());
    printFullComp(vec);
    return vec;
} 

void InitializeFreqMap(map<char,int>& freqMap, char T){
    if(T == 'A'){
        for(auto each : AminoAcidsCatches){
            freqMap[each]=0;
        }for(auto each : AminoAcids){
            freqMap[each]=0;
        }
    }else if(T == 'P'){
        for(auto each : typesAA){
            freqMap[each]=0;
        }
    }else if(T == 'N'){
        for(auto each : nucleotides){
            freqMap[each]=0;
        }
    }else{
        return;
    }
}

void removeStop(string& str){
    string stop = "-Stop";
    int sL = str.length();
    int stL =stop.length();
    int len = sL - stL;
    str = str.substr(0,len);
}

vector<pair<char,int>> CalcFreq(string proteinStrand, string Title="Freq Matrix", char T ='d'){
    int psL = proteinStrand.length();
    vector<pair<char,int>> freqVec;

    map<char,int> freqMap;
    if(T=='d'){
        T = deterType(proteinStrand);
    }
    // cout << "Type Determined was: "<<  enuType(T) <<endl;

    InitializeFreqMap(freqMap,T);
    for(int i=0; i<psL; i++){
        freqMap[proteinStrand[i]]++;
    }

    vector<pair<char,int>> temp;
    for(auto each : freqMap){
         if((each.first== 'U') || (each.first== 'O')){
            temp.push_back(make_pair(each.first,each.second));
            continue;
        }

        pair<char,int> freq;
        freq.first = each.first;
        freq.second = each.second;
        freqVec.push_back(freq);
    }
    for(auto each : temp){
        freqVec.push_back(each);
    }

    printPairs(freqVec,Title);
    return freqVec;
    freqMap.clear();
}

vector<vector<pair<char,int>>> CalcEachFreq(DnaVec container){
    vector<vector<pair<char,int>>> newContainer;
    
    for(auto eachSeq : container){
        newContainer.push_back(CalcFreq(eachSeq));
    }
    return newContainer;
}

char itoc(int t){     return static_cast<char>(t); }

string Positions(string PropertyStr, char C){
    string newStr;
    for (int i=0; i< PropertyStr.length(); i++){
        if(PropertyStr[i]== C){
            newStr += to_string(i);
            newStr += ',';
            // newStr.push_back(itoc(i));

        }
    }
    if (!newStr.empty()) {
        newStr.pop_back();
    }
    return newStr;
}

string PositionsPerType(string PropertyStr, vector<char> PropType){
    string newStr; 
    for(auto type : PropType){
        cout << type << ":" <<endl; 
        cout << Positions(PropertyStr, type) <<endl;
        cout <<endl;
        newStr+type+":";
        newStr+=Positions(PropertyStr, type);
        newStr+='\n';
    }
    return newStr;
}

/*
int hammingDistance(const string& A, const string& B, bool difLen=false){
    int longestLeng = A.length();
    if(!difLen){
        if(A.length() != B.length()){
            cout << "Error: Strings must be of equal length. " << endl;
            return -1;
        }
    }else{
        if (A.length() < B.length()){
            longestLeng = B.length();
        }
    }
    int d = 0;  
    for (int i=0; i< longestLeng; i++){
        if(A[i] != B[i]){
            d++;
        }
    }
    return d;
}
*/

vector<string> Compare(string A, string B){
    vector<string> differs;
    int longestLeng = max(A.length(), B.length());
    int shorterLeng = min(A.length(), B.length());
       
    for (int i=0; i< longestLeng; i++){
        string newStr;
        if(A[i] != B[i]){
            if(A.length() > B.length() && i > shorterLeng){
                newStr += A[i];
                newStr += " != ";
                newStr += " ";
                newStr += " at pos: " + to_string(i);
                differs.push_back(newStr);
            }else if(A.length() < B.length() && i > shorterLeng){
                newStr += " ";
                newStr += " != ";
                newStr += B[i];
                newStr += " at pos: " + to_string(i);
                differs.push_back(newStr);
            }else{
                newStr += A[i];
                newStr += " != ";
                newStr += B[i];
                newStr += " at pos: " + to_string(i);
                differs.push_back(newStr);
            }   
        }
    }
    cout << "number Differences: "<<  differs.size() <<endl;

    if (A.length() != B.length()){
        int lengthDif = A.length() - B.length();
        cout << "length difference: "<<  abs(lengthDif) <<endl;
        cout << "length first strand: " <<  A.length() <<endl;
        // cout << "short: " <<  shorterLeng  <<endl;
        // cout << "long: " <<  longestLeng  <<endl;
        cout << "length second strand: "<<  B.length() <<endl;
    }
    return differs;
}

void comparePair(vector<pair<char,int>> A, vector<pair<char,int>> B, vector<pair<char,int>> C, vector<pair<char,int>> D, vector<pair<char,int>> E){
    for(auto pairA : A){
        for(auto pairB : B){
            for(auto pairC : C){
                for(auto pairD : D){
                    for(auto pairE : E){
                        if(pairA.first == pairB.first && pairA.first == pairC.first && pairA.first == pairD.first&& pairA.first == pairE.first){
                            cout << pairA.first << ": " << pairA.second << " \t " << pairB.second<< " \t " << pairC.second <<" \t " << pairD.second <<" \t " << pairE.second <<endl;
                        }
                    }
                }
            }
        } 
    }
}

void comparePair(vector<pair<char,int>> A, vector<pair<char,int>> B, vector<pair<char,int>> C){
    for(auto pairA : A){
        for(auto pairB : B){
            for(auto pairC : C){
                if(pairA.first == pairB.first && pairA.first == pairC.first){
                cout << pairA.first << ": " << pairA.second << " \t " << pairB.second<< " \t " << pairC.second <<endl;
                }
            }
        } 
    }
}

void comparePair(vector<pair<int,double>> A, vector<pair<int,double>> B, vector<pair<int,double>> C){
    for(auto pairA : A){
        for(auto pairB : B){
            for(auto pairC : C){
                if(pairA.first == pairB.first == pairC.first){                                                              //1,1,1
                    cout << pairA.first << ": " << pairA.second << " \t " << pairB.second<< " \t " << pairC.second <<endl;  
                
                
                }else if(pairA.first == pairB.first && pairA.first != pairC.first){  //A=B , B!=C, A!=C                     //1,1,0
                    cout << pairA.first << ": " << pairA.second << " \t " << pairB.second<< " \t " << "0" <<endl;
                
                
                }else if(pairA.first != pairB.first && pairA.first == pairC.first){ //A!=B , B!=C, A==C                     //1,0,1
                    cout << pairA.first << ": " << pairA.second << " \t " << "0"<< " \t " << pairC.second <<endl;
                
                
                }else if(pairA.first != pairB.first && pairB.first == pairC.first){ //A!=B , B!=C, A==C                     //0,1,1
                    cout << pairA.first << ": " << "0" << " \t " << pairB.second<< " \t " << pairC.second <<endl;
                }else{
                    cerr<< "else"<<endl;
                } 
            }
        } 
    }
}


// string Remove(string ori, string rem){
//     int last = ori.length()-rem.length();
//     int rL = rem.length();
//     string newStr;
//     for(int i=0; i< last; i++){
//         if(ori.substr(i,rL) == rem){
//             i+=(rL-1);
//         }else{
//             newStr+=ori[i];
//         }
//     }
//     return newStr;
// }

string Remove(const string& ori, const string& rem) {
    string modifiedStr = ori;  
    string newStr;
    size_t pos = modifiedStr.find(rem);

    while (pos != string::npos) {
        newStr += modifiedStr.substr(0, pos);  // Append characters before 'rem'
        modifiedStr.erase(0, pos + rem.length());  // Erase 'rem' and characters following it
        pos = modifiedStr.find(rem);  // Find the next occurrence of 'rem'
    }

    // Append the remaining characters after the last occurrence of 'rem'
    newStr += modifiedStr;

    return newStr;
}


string boolToStr(bool W){return W ? "Yes":"No"; }

//vector<pair<string,int>> <- vector<pair<char,int>> 
vector<pair<string,int>> pairsCharToStr(vector<pair<char,int>> chars){
    vector<pair<string,int>> newVec; 
    for(auto each : chars){
        char P = each.first;
        string p;
        p = P;
        // string p = to_string(P);
        int i = each.second;
        auto pair = make_pair(p,i);
        newVec.push_back(pair);
    }
    return newVec;

}

bool isScoreType(const string& line){
    return line.find("# Matrix:") != string::npos;
}

bool isScoreLine(const string& line){
    return line.find("# Score:") != string::npos;
}

string captureName(string fileName){
    regex pattern("Seq[1-3] with Seq[1-3]");
    smatch match; 

    if(regex_search(fileName, match, pattern)){
        return match.str();
    }else{
        return "";
    }
}

string captureMatrix(string fileName){
    regex pattern("BLOSUM[0-9][0-9]{1,2}");
    regex pattern2("PAM[0-9][0-9]{1,2}");
    smatch match; 

    if(regex_search(fileName, match, pattern)){
        return match.str();
    }else if(regex_search(fileName, match, pattern2)){
        return match.str();
    }else{
        return "";
    }
}

string captureScore(string fileName){
    regex pattern("Score: ");
    smatch match; 

    if (regex_search(fileName, match, pattern)) {
        // The substring after capturing the word
        string afterMatch = match.suffix();
        
        // Find the position of the next non-whitespace character
        size_t posAfterWhitespace = afterMatch.find_first_not_of(" \t");

        if (posAfterWhitespace != string::npos) {
            return afterMatch.substr(posAfterWhitespace);
        } else {
            return ""; // Return an empty string if no non-whitespace characters are found
        }
    } else {
        return ""; // Return an empty string if no match is found
    }
}

string processLine(const string& fileName){
    ifstream in(fileName);
    if(!in.is_open()){
        cerr << "file didn't open" <<endl;
    }
    string line;
    string score;
    string comparision;
    string name = captureName(fileName);
  
    while(getline(in,line)){
        if(isScoreLine(line)){
            score = line.substr(1);
        }else if(isScoreType(line)){
            comparision = line.substr(11);
        }
    }
    string newStr = name + " "+ comparision + score;
    in.close();
    return newStr;
}

map<string, vector <pair<string, double>>> data;  
void parseLines(vector<string> lines){
    for (auto line : lines){
        string name   = captureName(line);
        string matrix = captureMatrix(line);
        double score  = stod(captureScore(line));
        pair<string, double> typeAndScore;

        typeAndScore.first = matrix;
        typeAndScore.second = score;
        data[name].push_back(typeAndScore);
    }
}

vector<pair<string, double>> segmentData(vector<pair<string, double>> lines, string Mat){
    int mL = Mat.length();
    vector<pair<string, double>> newStuff;
    for (auto line : lines){
        if(line.first.substr(0,mL) == Mat){
        pair<string, double> newPair;
            string newLine = Remove(line.first, Mat);
            newPair.first = newLine;
            newPair.second = line.second;
            newStuff.push_back(newPair);
        }
    }
    return newStuff;
}

vector<pair<int, double>> convertData(vector<pair<string, double>> lines, string Mat){
   vector<pair<string, double>>segLines = segmentData(lines, Mat);
    vector<pair<int, double>> newStuff;
    pair<int, double> newPair;
        for(auto line : segLines){
            int i = stoi(line.first);
            newPair.first=i;
            newPair.second=line.second;
            newStuff.push_back(newPair);
        }
    return newStuff;
}

vector<int> separateMatNum(vector<pair<int, double>> vec){
    vector<int> matInts;
    for(auto each : vec){
        matInts.push_back(each.first);
    }
    // sort(matInts.begin(),matInts.end());
    return matInts;
}

vector<double> separateScores(vector<pair<int, double>> vec){
    vector<double> scores;
    for(auto each : vec){
        scores.push_back(each.second);
    }
    // sort(scores.begin(),scores.end());
    return scores;
}

void isolateData(vector<string> lines, bool toFile =false){
    printVec(lines, "Processed Lines", '\n', toFile);
    parseLines(lines);

    string combo1 = "Seq1 with Seq2";
    string combo2 = "Seq1 with Seq3";
    string combo3 = "Seq2 with Seq3";

    vector<string> combos = {combo1,combo2,combo3};
    vector<string> mats  = {"BLOSUM", "PAM"};

    for(auto combo: combos){
        for(auto mat: mats){
            vector <pair<string, double>> vecCombo = data[combo];
            printPairs(vecCombo, combo,toFile);

            vector<pair<int, double>> convNewVecCombo = convertData(vecCombo, mat);
            printPairs(convNewVecCombo, combo+ "\n" + mat, toFile);

            printVec(separateMatNum(convNewVecCombo), mat, '\n', toFile);
            printVec(separateScores(convNewVecCombo), "Scores", '\n', toFile);
        }
    }
}

void parseFolders(bool toFile =true){
    string folder1 = R"(C:\Users\aaron\Downloads\Biocomputing\HW 4 Assignment\Question 1\Seq 1 with Seq 2)";
    string folder2 = R"(C:\Users\aaron\Downloads\Biocomputing\HW 4 Assignment\Question 1\Seq 1 with Seq 3)";
    string folder3 = R"(C:\Users\aaron\Downloads\Biocomputing\HW 4 Assignment\Question 1\Seq 2 with Seq 3)";

    vector<string> folders = {folder1, folder2, folder3};
    vector<string> procLines;

    for(auto folderPathIter : folders){
        cout << folderPathIter <<endl;
        cout << "Reached point A" << endl;

        const char* folderPath = folderPathIter.c_str();
        DIR* dir = opendir(folderPath);
        if(dir){ cout << "Reached point Dir" << endl;
            dirent* entry;
            int i=0;
            while ((entry = readdir(dir)) != nullptr) {
                if (string(entry->d_name).find(".txt") != string::npos) {
                    cout << "Reached point Reg" << endl;
                    string filePath = string(folderPath) + R"(/)"  + entry->d_name;
                    cout << "File path: " << filePath << endl;
                    procLines.push_back(processLine(filePath));
                }
                i++;
            }   
            closedir(dir);  // Move this line outside the while loop
            cout << "Reached point Dir Closed" << endl;
            cout << i <<" files" <<endl;
        }else {
            cerr << "Error opening directory." << endl;
        }
    }
    isolateData(procLines,toFile);
}

int main(){
    // DnaVec seqV1 = {"MVLSGEDKSNIKAAWGKIGGHGAEYGAEALERMFASFPTTKTYFPHFDVSHGSAQVKGHGKKVADALANA",
    //                 "AGHLDDLPGALSALSDLHAHKLRVDPVNFKLLSHCLLVTLASHHPADFTPAVHASLDKFLASVSTVLTSK",
    //                 "YR"};
    // string seq1 = VecToStr(seqV1);

    // DnaVec seqV2 = {"MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLG",
    //                 "AFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVAN",
    //                 "ALAHKYH"};
    // string seq2 = VecToStr(seqV2); 
    
    // DnaVec seqV3 = {"MVHLTDAEKAAVSCLWGKVNSDEVGGEALGRLLVVYPWTQRYFDSFGDLSSASAIMGNAKVKAHGKKVIT"
    //                 "AFNDGLNHLDSLKGTFASLSELHCDKLHVDPENFRLLGNMIVIVLGHHLGKDFTPAAQAAFQKVVAGVAT",
    //                 "ALAHKYH"};



    // string Human         = "YLTKILHVFHGLLPGFLVKMSGDLLELALKLPHVDYIEEDS";
    // string Gorilla       = "YLTKILHVFHGLLPGFLVKMSGDLLELALKLPHVDYIEEDS";
    // string RhesusMacaque = "YLTKILHVFHHLLPGFLVKMSGDLLELALKLPHVDYIEEDS";
    // string Chimpanzee    = "YLTKILHVFHGLLPGFLVKMSGDLLELALKLPHVDYIEEDS";
    // string Mouse         = "YVIKVLHIFYDLFPGFLVKMSSDLLGLALKLPHVEYIEEDS";
    // string Rat           = "YVIKVLHVFYDLFPGFLVKMSSDLLGLALKLPHVEYIEEDS";

    //SerineConservation
    // DnaVec inhibitor19   = {Human, Gorilla, RhesusMacaque, Chimpanzee, Mouse, Rat};

    // string seq3 = VecToStr(seqV3);

    // DnaVec inhibitor19Properties = PropertyForVec(inhibitor19);
    // printVec(inhibitor19Properties, "inhibitor19Properties", '\n');

    //string seq1Conv = PropertyChecker(seq1);
    //string seq2Conv = PropertyChecker(seq2);
    //string seq3Conv = PropertyChecker(seq3);

    //cout << seq1Conv <<endl<<endl;
    //cout << seq2Conv <<endl<<endl;
    //cout << seq3Conv <<endl<<endl;

    //parseFolders(false);

//    vector<vector<pair<char,int>>> EachFreq = CalcEachFreq(inhibitor19Properties);

   //vector<pair<char,int>> freq1 = CalcFreq(VecToStr(seqV1));
   //vector<pair<char,int>> freq2 = CalcFreq(VecToStr(seqV2));
   //vector<pair<char,int>> freq3 = CalcFreq(VecToStr(seqV3));
   //cout << seq1Conv <<endl<<endl;

    //comparePair(freq1,freq2, freq3);
   // comparePair(EachFreq[0],EachFreq[1],EachFreq[2],EachFreq[3],EachFreq[4]);

//    vector<pair<char,int>> freq1P = CalcFreq(seq1Conv);
//    vector<pair<char,int>> freq2P = CalcFreq(seq2Conv);
//    vector<pair<char,int>> freq3P = CalcFreq(seq3Conv);
//    comparePair(freq1P,freq2P, freq3P);

    // cout << PositionsPerType(seq1,aliphaticAA) <<endl;

    // cout << isolateByType(seq1,aliphaticAA) <<endl<<endl;
    // cout << isolateByType(seq1,polarAA)     <<endl<<endl;
    // cout << isolateByType(seq1,negativeAA)  <<endl<<endl;
    // cout << isolateByType(seq1,postiveAA)   <<endl<<endl;
    // cout << isolateByType(seq1,aromaticAA)  <<endl<<endl;
    // cout << isolateByType(seq1,ringedAA)    <<endl<<endl;
    // cout << isolateByType(seq2,ringedAA)    <<endl<<endl;
    // cout << Remove( isolateByType(seq1,ringedAA),"0" )   <<endl;
    // cout << Remove( isolateByType(seq2,ringedAA),"0" )   <<endl;
    // cout << Remove( isolateByType(seq3,ringedAA),"0" )   <<endl;

    // cout << isolateByType(seq1,'A')  << endl;

    // vector<string> difSeq1Seq2 = Compare(seq1Conv,seq2Conv); 
    // printVec(difSeq1Seq2,"Difference of Sequence 1, Sequence 2",'\n');
    // vector<string> difSeq1Seq3 = Compare(seq1Conv,seq3Conv); 
    // printVec(difSeq1Seq3,"Difference of Sequence 1, Sequence 3",'\n');
    // vector<string> difSeq2Seq3 = Compare(seq2Conv,seq3Conv); 
    // printVec(difSeq2Seq3,"Difference of Sequence 2, Sequence 3",'\n');
// /*
    string line;
    ifstream inDNA("RNRDNA.fasta");
    string RNRDNA;
    while(getline(inDNA,line)){
        RNRDNA+=line;
    }
    ifstream inAA("RNRAminos.fasta");
    string RNRAminos;
      while(getline(inAA,line)){
        RNRAminos+=line;
    }
string propertiesRNR = PropertyChecker(RNRAminos);
cout << "PropertyChecker for RNRAminos" <<endl<< propertiesRNR <<endl;
vector<pair<char,int>> freqAminos     = CalcFreq({RNRAminos}, "RNRAminos");
vector<pair<char,int>> freqProperties = CalcFreq({propertiesRNR}, "RNRAminos");
printPairs(freqAminos,"Frequency of Each Amino Acid");
//  cout << isolateByType(RNRAminos,aliphaticAA) <<endl<<endl;
//  cout << isolateByType(seq1,aliphaticAA) <<endl<<endl;
cout << "Number of Amino Acids: " << RNRAminos.length()<<endl;

vector<pair<char,int>> freqDNA = CalcFreq(RNRDNA, "Nucleotide Composition",'N');
string RNRDNAtoAminos =setAminos(RNRDNA);
cout << RNRDNAtoAminos<<endl;

cout << hammingDistance(RNRDNAtoAminos,RNRAminos,true) <<endl;
Compare(RNRDNAtoAminos,RNRAminos);

vector<pair<string,int>> newFreq = formatFreq(freqAminos);
vector<pair<string,double>> AminoComposition = genAminoComp(newFreq,RNRAminos.length());
printComp(AminoComposition,"Amino Composition");
vector<pair<string,double>> PropertyComposition = genAminoComp(pairsCharToStr(freqProperties),RNRAminos.length());
auto fullComposition = genFullComp(freqAminos, RNRAminos.length());
auto fullPropertyComposition = genFullComp(freqProperties, RNRAminos.length());
printComp(PropertyComposition,"PropertyComposition");
printPairs(newFreq,"Frequency of Each Amino Acid");
string test = "MLSLRVPLAPITDPQQLQLSPLKGLSLVDKENTPPALSGTRVLASKTARRIFQEPTEPKTKAAAPGVEDEPLLRENPRRFVIFPIEYHDIWQMYKKAEASFWTAEEVDLSKDIQHWESLKPEERYFMSHVLAFFAASDGMVNENLVERFSQEVQITEARCFYGFQIAMENMHSEMYSLLIDTYMKDPKEREFLFNAIETMPCVKKKADWALRWIGDKEATYGERVVAFAAVEGIFFSGSFASMFWLKKRGLMPGLTFSNELISRDEGLHCDFACLMFKHLVHKPSEERVREMIINAVRMEQEFLTEALPVKLIGMNCTLMKQYIEFVADRLMLELGFSKVFRVENPFDFMENISLEGKTNFFEKRVGEYQRMGVMSSPTENSFTLDADF";
removeStop(RNRDNAtoAminos);
vector<string> eachDif = Compare(RNRAminos,RNRDNAtoAminos);

printVec(eachDif,"eachDif");

//cout << "RNRAminos: "<< RNRAminos <<endl;

// */
    return 0;
}


// Taurine Tau τ

