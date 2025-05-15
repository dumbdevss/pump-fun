export function conditionalFixed(num: number, decimalPlaces = 6) {
    // Convert to string to analyze decimal places
    const strNum = num.toString();

    // Check if it has a decimal point
    if (strNum.includes('.')) {
        const decimals = strNum.split('.')[1].length;

        // Only apply toFixed if it has more decimal places than specified
        if (decimals > decimalPlaces) {
            return num.toFixed(decimalPlaces);
        }
    }

    // Otherwise return the original number (as string to match toFixed behavior)
    return strNum;
}