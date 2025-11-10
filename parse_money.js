#!/usr/bin/env node
/**
 * Simple Budget Parser Script
 * Extracts numeric value from budget string and returns as integer
 */

/**
 * Parse a budget string to an integer value
 * 
 * @param {string} budgetString - Budget value string (e.g., "$1,234.56", "€1.234,56", "£1,000")
 * @returns {number} Integer value rounded (e.g., "$1,234.56" returns 1235)
 * @throws {Error} If the budget string is invalid or cannot be parsed
 * 
 * @example
 * parseBudget("$1,234.56")  // returns 1235
 * parseBudget("€1.234,56")  // returns 1235
 * parseBudget("£1,000")     // returns 1000
 * parseBudget("¥1,234")     // returns 1234
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

/**
 * Main function to demonstrate budget parsing.
 */
function main() {
    // Test cases
    const testCases = [
        "$1,234.56",
        "€1.234,56",
        "£1,000",
        "£1,000.00",
        "¥1,234",
        "$5.99",
        "€100",
        "1234.56",
        "₹1,23,456.78",
        "$-500.25",
        "USD 1,000.50",
        "50 EUR",
        "$0.99",
        "£10,000,000.00",
        "€1.234.567,89",
        "$1234",
    ];
    
    console.log("Simple Budget Parser");
    console.log("=".repeat(60));
    console.log("Converting budget strings to integer values\n");
    
    for (const testCase of testCases) {
        try {
            const result = parseBudget(testCase);
            console.log(`Input:  ${testCase.padEnd(20)} → Output: ${result}`);
        } catch (error) {
            console.log(`Input:  ${testCase.padEnd(20)} → Error: ${error.message}`);
        }
    }
    
    // Interactive mode
    console.log("\n" + "=".repeat(60));
    console.log("\nInteractive Mode (Ctrl+C to exit)");
    console.log("Enter budget values to parse:\n");
    
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.setPrompt("Budget value: ");
    rl.prompt();
    
    rl.on('line', (userInput) => {
        const trimmedInput = userInput.trim();
        
        if (trimmedInput) {
            try {
                const result = parseBudget(trimmedInput);
                console.log(`  → Parsed value: ${result}\n`);
            } catch (error) {
                console.log(`  ✗ Error: ${error.message}\n`);
            }
        }
        
        rl.prompt();
    });
    
    rl.on('close', () => {
        console.log("\n\nGoodbye!");
        process.exit(0);
    });
}

// Run main if this file is executed directly
if (require.main === module) {
    main();
}

// Export for use as a module
module.exports = { parseBudget };
