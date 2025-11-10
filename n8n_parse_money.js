/**
 * n8n Code Node - Simple Budget Parser
 * Extracts numeric value from budget string and returns as integer
 */

function parseBudget(budgetString) {
    if (typeof budgetString !== 'string' || !budgetString.trim()) {
        throw new Error('Invalid budget string');
    }
    
    // Remove everything except digits, dots, commas, and minus sign
    let cleaned = budgetString.replace(/[^\d.,-]/g, '');
    
    // Remove thousand separators (dots or commas depending on context)
    // If there are multiple separators, remove all but the last one
    const dotCount = (cleaned.match(/\./g) || []).length;
    const commaCount = (cleaned.match(/,/g) || []).length;
    
    // Determine what's the decimal separator (if any)
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    
    if (lastComma > lastDot) {
        // Comma is decimal separator (European format: 1.300,50)
        const afterComma = cleaned.substring(lastComma + 1);
        if (afterComma.length <= 2) {
            // It's a decimal separator
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
            // It's a thousand separator
            cleaned = cleaned.replace(/,/g, '');
        }
    } else if (lastDot > lastComma) {
        // Dot is decimal separator (US format: 1,300.50)
        const afterDot = cleaned.substring(lastDot + 1);
        if (afterDot.length <= 2) {
            // It's a decimal separator
            cleaned = cleaned.replace(/,/g, '');
        } else {
            // It's a thousand separator
            cleaned = cleaned.replace(/\./g, '');
        }
    } else if (lastComma !== -1) {
        // Only comma exists
        const afterComma = cleaned.substring(lastComma + 1);
        if (afterComma.length <= 2) {
            cleaned = cleaned.replace(',', '.');
        } else {
            cleaned = cleaned.replace(/,/g, '');
        }
    } else if (lastDot !== -1) {
        // Only dot exists
        const afterDot = cleaned.substring(lastDot + 1);
        if (afterDot.length > 2) {
            cleaned = cleaned.replace(/\./g, '');
        }
    }
    
    // Parse as float and round to integer
    const value = parseFloat(cleaned);
    
    if (isNaN(value)) {
        throw new Error('Could not parse budget value');
    }
    
    return Math.round(value);
}

// Main execution
const inputData = $input.item.json;
const budgetString = inputData.Answers?.Budget;

let output = {
    ...inputData,
    budget_int: null,
    parseError: null
};

if (budgetString) {
    try {
        output.budget_int = parseBudget(budgetString);
    } catch (error) {
        output.parseError = error.message;
    }
} else {
    output.parseError = 'Budget field is missing or empty';
}

return output;
