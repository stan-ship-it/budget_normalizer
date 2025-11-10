#!/usr/bin/env node
/**
 * Monetary Value Parser Script
 * 
 * This script parses monetary values with currency symbols and thousand separators,
 * returning the value as an integer (in minor units like cents).
 */

/**
 * Parse a monetary string to an integer value in minor units (cents/pence/etc.)
 * 
 * @param {string} moneyString - Monetary value string (e.g., "$1,234.56", "€1.234,56", "£1,000")
 * @returns {number} Integer value in minor units (e.g., "$1,234.56" returns 123456)
 * @throws {Error} If the money string is invalid or cannot be parsed
 * 
 * @example
 * parseMoney("$1,234.56")  // returns 123456
 * parseMoney("€1.234,56")  // returns 123456
 * parseMoney("£1,000")     // returns 100000
 * parseMoney("¥1,234")     // returns 1234 (yen has no minor units)
 */
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
    // This includes: $, €, £, ¥, ₹, ₽, ₱, ₩, ₪, ₴, ₦, R, kr, zł, and more
    const withoutCurrency = trimmed.replace(/^[$€£¥₹₽₱₩₪₴₦Rr₨₵₲₸₺₼₾₿¢฿₡₢₣₤₥₧₨₪₫₭₮₯₰₱₲₳₴₵₶₷₸₹₺₻₼₽₾₿﷼﹩＄￠￡￥￦]/g, '');
    
    // Remove any remaining currency codes (like USD, EUR, GBP at start or end)
    const withoutCode = withoutCurrency.replace(/^[A-Z]{3}\s*/i, '').replace(/\s*[A-Z]{3}$/i, '');
    
    // Remove any remaining text/currency names
    const cleanedText = withoutCode.trim();
    
    // Detect decimal separator by finding the last occurrence of . or ,
    // The last separator is likely the decimal separator
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

/**
 * Main function to demonstrate money parsing.
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
        "$(500.25)",
        "USD 1,000.50",
        "50 EUR",
        "$0.99",
        "£10,000,000.00",
        "€1.234.567,89",
        "$1234",
    ];
    
    console.log("Monetary Value Parser");
    console.log("=".repeat(60));
    console.log("Converting monetary strings to integer values (in cents)\n");
    
    for (const testCase of testCases) {
        try {
            const result = parseMoney(testCase);
            console.log(`Input:  ${testCase.padEnd(20)} → Output: ${result}`);
        } catch (error) {
            console.log(`Input:  ${testCase.padEnd(20)} → Error: ${error.message}`);
        }
    }
    
    // Interactive mode
    console.log("\n" + "=".repeat(60));
    console.log("\nInteractive Mode (Ctrl+C to exit)");
    console.log("Enter monetary values to parse:\n");
    
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.setPrompt("Money value: ");
    rl.prompt();
    
    rl.on('line', (userInput) => {
        const trimmedInput = userInput.trim();
        
        if (trimmedInput) {
            try {
                const result = parseMoney(trimmedInput);
                console.log(`  → Parsed value: ${result} (in minor units/cents)`);
                
                // Also show it formatted back
                const dollars = Math.floor(Math.abs(result) / 100);
                const cents = Math.abs(result) % 100;
                const sign = result < 0 ? '-' : '';
                console.log(`  → Equivalent:   ${sign}${dollars}.${cents.toString().padStart(2, '0')}\n`);
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
module.exports = { parseMoney };
