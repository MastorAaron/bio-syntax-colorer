export function capFront(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function capAll(arr: string[]): string[] {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].includes(" ")) {
            arr[i] = arr[i]
                .split(" ")
                .map(capFront)
                .join(" ");
        } else {
            arr[i] = capFront(arr[i]);
        }
    }
    return arr;
}

export function collapseAll(arr: string[]): string[] {
    return arr.map(str => collapseLower(str));
}


export function collapseLower(str: string): string {
    return str.replace(/\s+/g, "").toLowerCase();
}
