/**
 * n8n Code Node - Monetary Value Parser
 * 
 * This script parses monetary values from input.Answers.Budget with currency symbols 
 * and thousand separators, returning the value as an integer (in minor units like cents).
 * 
 * Expected input structure: 
 *   - $input.item.json.Answers.Budget
 * 
 * Output:
 *   - budgetOriginal: The original budget string
 *   - budgetParsed: Integer value in minor units (cents)
 *   - budgetFormatted: Formatted as decimal (e.g., "1234.56")
 *   - parseError: Error message if parsing fails (null if successful)
 */

// Parse a monetary string to an integer value in minor units (cents/pence/etc.)
function parseMoney(moneyString) {
    if (typeof moneyString !== 'string') {
        throw new Error('Input must be a string');
    }

    // Trim whitespace
    const trimmed = moneyString.trim();
    
    if (!trimmed) {
        throw new Error('Empty money string');
    }

    // Remove currency symbols (common ones)
    const withoutCurrency = trimmed.replace(/^[$€£¥₹₽₱₩₪₴₦Rr₨₵₲₸₺₼₾₿¢฿₡₢₣₤₥₧₨₪₫₭₮₯₰₱₲₳₴₵₶₷₸₹₺₻₼₽₾₿﷼﹩＄￠￡￥￦]/g, '');
    
    // Remove any remaining currency codes (like USD, EUR, GBP at start or end)
    const withoutCode = withoutCurrency.replace(/^[A-Z]{3}\s*/i, '').replace(/\s*[A-Z]{3}$/i, '');
    
    // Remove any remaining text/currency names
    const cleanedText = withoutCode.trim();
    
    // Detect decimal separator by finding the last occurrence of . or ,
    const lastDotIndex = cleanedText.lastIndexOf('.');
    const lastCommaIndex = cleanedText.lastIndexOf(',');
    
    let decimalSeparator = '.';
    let thousandSeparator = ',';
    
    // Determine which is decimal separator based on position
    if (lastCommaIndex > lastDotIndex) {
        // Comma comes after dot, so comma is decimal separator (e.g., "1.234,56")
        decimalSeparator = ',';
        thousandSeparator = '.';
    } else if (lastDotIndex > lastCommaIndex) {
        // Dot comes after comma, so dot is decimal separator (e.g., "1,234.56")
        decimalSeparator = '.';
        thousandSeparator = ',';
    } else if (lastDotIndex === -1 && lastCommaIndex === -1) {
        // No separators at all
        decimalSeparator = null;
        thousandSeparator = null;
    } else if (lastDotIndex !== -1 && lastCommaIndex === -1) {
        // Only dots - check if it's thousands or decimal
        const afterLastDot = cleanedText.substring(lastDotIndex + 1);
        if (afterLastDot.length === 2) {
            // Likely decimal (e.g., "1234.56")
            decimalSeparator = '.';
            thousandSeparator = ',';
        } else if (afterLastDot.length === 3) {
            // Likely thousands (e.g., "1.234")
            decimalSeparator = null;
            thousandSeparator = '.';
        }
    } else if (lastCommaIndex !== -1 && lastDotIndex === -1) {
        // Only commas - check if it's thousands or decimal
        const afterLastComma = cleanedText.substring(lastCommaIndex + 1);
        if (afterLastComma.length === 2) {
            // Likely decimal (e.g., "1234,56")
            decimalSeparator = ',';
            thousandSeparator = '.';
        } else if (afterLastComma.length === 3) {
            // Likely thousands (e.g., "1,234")
            decimalSeparator = null;
            thousandSeparator = ',';
        }
    }
    
    let integerPart = '';
    let decimalPart = '';
    
    if (decimalSeparator && cleanedText.includes(decimalSeparator)) {
        const parts = cleanedText.split(decimalSeparator);
        integerPart = parts[0];
        decimalPart = parts.slice(1).join(''); // In case there are multiple separators
    } else {
        integerPart = cleanedText;
        decimalPart = '00';
    }
    
    // Remove thousand separators from integer part
    if (thousandSeparator) {
        integerPart = integerPart.replace(new RegExp('\\' + thousandSeparator, 'g'), '');
    }
    
    // Remove any spaces
    integerPart = integerPart.replace(/\s/g, '');
    decimalPart = decimalPart.replace(/\s/g, '');
    
    // Handle negative values
    const isNegative = integerPart.includes('-') || integerPart.includes('(');
    integerPart = integerPart.replace(/[-\(\)]/g, '');
    
    // Validate that we only have digits left
    if (!/^\d*$/.test(integerPart)) {
        throw new Error(`Invalid characters in integer part: ${moneyString}`);
    }
    
    if (!/^\d*$/.test(decimalPart)) {
        throw new Error(`Invalid characters in decimal part: ${moneyString}`);
    }
    
    // Default to 0 if empty
    if (!integerPart) {
        integerPart = '0';
    }
    
    // Ensure decimal part is exactly 2 digits (pad or truncate)
    if (!decimalPart || decimalPart === '') {
        decimalPart = '00';
    } else if (decimalPart.length === 1) {
        decimalPart = decimalPart + '0';
    } else if (decimalPart.length > 2) {
        // Round if more than 2 decimal places
        const extraDigits = decimalPart.substring(2);
        decimalPart = decimalPart.substring(0, 2);
        if (parseInt(extraDigits[0]) >= 5) {
            // Round up
            let decimalValue = parseInt(decimalPart) + 1;
            if (decimalValue >= 100) {
                integerPart = (parseInt(integerPart) + 1).toString();
                decimalPart = '00';
            } else {
                decimalPart = decimalValue.toString().padStart(2, '0');
            }
        }
    }
    
    // Combine integer and decimal parts
    const result = parseInt(integerPart + decimalPart);
    
    return isNegative ? -result : result;
}

// Main n8n code execution
// Access the input data from the previous node
const inputData = $input.item.json;

// Get the Budget value from Answers
const budgetString = inputData.Answers?.Budget;

// Initialize output object
let output = {
    ...inputData, // Preserve all original data
    budgetOriginal: budgetString,
    budgetParsed: null,
    budgetFormatted: null,
    parseError: null
};

// Try to parse the budget
if (budgetString) {
    try {
        const parsedValue = parseMoney(budgetString);
        
        // Convert back to formatted decimal string
        const dollars = Math.floor(Math.abs(parsedValue) / 100);
        const cents = Math.abs(parsedValue) % 100;
        const sign = parsedValue < 0 ? '-' : '';
        const formatted = `${sign}${dollars}.${cents.toString().padStart(2, '0')}`;
        
        output.budgetParsed = parsedValue;
        output.budgetFormatted = formatted;
    } catch (error) {
        output.parseError = error.message;
    }
} else {
    output.parseError = 'Budget field is missing or empty';
}

// Return the output (n8n expects return value in this format)
return output;
