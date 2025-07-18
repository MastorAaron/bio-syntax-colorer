export function capFront(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function capAll(arr : string[]): string[]{
   for (let i = 0; i < arr.length; i++) {
        arr[i] = capFront(arr[i]);
    }
    return arr;
}