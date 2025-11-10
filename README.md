# Budget Normalizer

Monetary value parser that converts currency strings to integers. Available in two versions: standalone Node.js script and n8n code node.

## Features

- Removes common currency symbols ($, €, £, ¥, ₹, etc.)
- Handles thousand separators (commas or dots)
- Auto-detects decimal separator (. or ,)
- Supports various international formats
- Returns values in minor units (cents/pence)
- Handles negative values

## Supported Formats

- US format: `$1,234.56` → 123456
- European format: `€1.234,56` → 123456
- No decimals: `£1,000` → 100000
- Negative: `$-500.25` or `$(500.25)` → -50025
- Currency codes: `USD 1,000.50` → 100050

## Files

### 1. `parse_money.js` - Standalone Node.js Script

A command-line tool for parsing monetary values.

**Usage:**

```bash
# Run test cases and interactive mode
node parse_money.js

# Use as a module
const { parseMoney } = require('./parse_money.js');
const cents = parseMoney("$1,234.56"); // returns 123456
```

**Function:**
```javascript
parseMoney(moneyString)
// Returns: integer value in minor units
```

### 2. `n8n_parse_money.js` - n8n Code Node

Adapted for use in n8n workflows.

**Setup in n8n:**

1. Add a **Code** node to your workflow
2. Set the language to **JavaScript**
3. Copy the entire contents of `n8n_parse_money.js` into the code editor
4. Ensure your input data has the structure: `Answers.Budget`

**Input Structure:**

```json
{
  "Answers": {
    "Budget": "$1,234.56"
  }
}
```

**Output Structure:**

```json
{
  "Answers": {
    "Budget": "$1,234.56"
  },
  "budgetOriginal": "$1,234.56",
  "budgetParsed": 123456,
  "budgetFormatted": "1234.56",
  "parseError": null
}
```

**Output Fields:**

- `budgetOriginal`: The original budget string from input
- `budgetParsed`: Integer value in minor units (cents) - use this for calculations
- `budgetFormatted`: Formatted as decimal string (e.g., "1234.56")
- `parseError`: Error message if parsing fails, `null` if successful

**Error Handling:**

If parsing fails, the output will contain:
```json
{
  "budgetOriginal": "invalid value",
  "budgetParsed": null,
  "budgetFormatted": null,
  "parseError": "Error message describing the issue"
}
```

## Examples

### Standalone Script

```javascript
const { parseMoney } = require('./parse_money.js');

parseMoney("$1,234.56");     // 123456
parseMoney("€1.234,56");     // 123456
parseMoney("£1,000");        // 100000
parseMoney("¥1,234");        // 123400
parseMoney("₹1,23,456.78");  // 12345678
parseMoney("$-500.25");      // -50025
```

### n8n Code Node

The n8n version automatically processes `$input.item.json.Answers.Budget` and adds the parsed results to the output.

**Example Workflow:**
1. **Webhook/Form** node captures user input with budget field
2. **Code** node (this script) parses the budget value
3. **Set** node or **Database** node uses `budgetParsed` for storage/calculations

## License

MIT
