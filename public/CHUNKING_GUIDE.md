# How to Add Your Tax Chunks

## Quick Start

Your chunks go in: `/src/data/tax-chunks.json`

## Chunk Format

```json
{
  "id": "unique_identifier",
  "title": "Brief descriptive title",
  "section": "Source section/page reference",
  "year": "Tax year or version",
  "source": "Original document name",
  "text": "The actual tax information..."
}
```

## Example: Converting a PDF to Chunks

Let's say you have an IRD guide PDF about APIT. Here's how to chunk it:

### Original PDF Content (Page 5):

```
APIT Calculation Method

Step 1: Determine Gross Employment Income
Gross employment income includes:
- Basic salary
- Allowances (transport, cost of living, etc.)
- Overtime payments
- Bonuses
- Commissions

Step 2: Deduct Qualifying Payments
You can deduct:
- EPF/ETF contributions
- Approved pension contributions
- Life insurance premiums (max Rs. 100,000 per year)

Step 3: Apply Tax Rates
Use the progressive tax rate schedule...
```

### How to Chunk It:

**Chunk 1: Employment Income Components**
```json
{
  "id": "apit_income_components",
  "title": "APIT - Gross Employment Income",
  "section": "IRD APIT Guide 2024 - Page 5",
  "year": "2024/25",
  "source": "IRD APIT Calculation Guide",
  "text": "Gross employment income for APIT calculation includes: basic salary, all allowances (such as transport allowance, cost of living allowance), overtime payments, bonuses, and commissions. All monetary benefits received from employment are considered when calculating the tax base."
}
```

**Chunk 2: Qualifying Deductions**
```json
{
  "id": "apit_deductions",
  "title": "APIT - Qualifying Payment Deductions",
  "section": "IRD APIT Guide 2024 - Page 5",
  "year": "2024/25",
  "source": "IRD APIT Calculation Guide",
  "text": "When calculating APIT, employers can deduct qualifying payments from gross income. These include: EPF and ETF contributions made by the employee, approved pension fund contributions, and life insurance premiums up to a maximum of Rs. 100,000 per year. These deductions reduce the taxable income before applying tax rates."
}
```

## Chunking Rules

### ✅ Good Chunks

1. **One Topic Per Chunk**
   - Each chunk focuses on a single concept
   - Don't mix APIT rates with VAT rules

2. **Standalone & Complete**
   - Reader should understand without seeing other chunks
   - Include enough context

3. **Right Size: 300-700 tokens**
   - Roughly 200-500 words
   - 2-4 paragraphs
   - Not too short, not too long

4. **Specific Metadata**
   - Exact page/section reference
   - Correct tax year
   - Proper source name

### ❌ Bad Chunks

1. **Too Short**
```json
{
  "text": "APIT is 6%"
}
// Missing context: 6% for which bracket?
```

2. **Too Long**
```json
{
  "text": "[Entire 5-page APIT guide pasted here]"
}
// Too much info, search won't be precise
```

3. **Multiple Topics**
```json
{
  "text": "APIT rates are... VAT registration is... Income tax deadlines..."
}
// Confusing - split into separate chunks
```

4. **Missing Context**
```json
{
  "text": "The threshold is Rs. 300 million"
}
// Threshold for what? APIT? VAT? Registration?
```

## What to Include in Your Knowledge Base

### Priority 1: Core Tax Info
- APIT rates and calculations
- VAT rates and thresholds
- Income tax brackets
- Filing deadlines
- Registration requirements

### Priority 2: Common Questions
- Deductions and exemptions
- Penalties and fines
- Payment methods
- Forms and documentation

### Priority 3: Examples & Scenarios
- Sample calculations
- Common situations
- Edge cases

## Source Document Checklist

Where to get Sri Lankan tax information:

- ✅ **Inland Revenue Department (IRD) website** - Official guides
- ✅ **Inland Revenue Act** - Legal text
- ✅ **IRD Circulars** - Updates and clarifications
- ✅ **Gazette notifications** - Tax rate changes
- ✅ **Official FAQs** - Common questions
- ❌ Random blogs (not authoritative)
- ❌ Old documents (check year)

## Workflow

1. **Collect Documents**
   - Download IRD PDFs
   - Save legal texts
   - Organize by topic

2. **Read & Identify Sections**
   - Mark topics: APIT, VAT, Income Tax, etc.
   - Find distinct concepts
   - Note important examples

3. **Create Chunks**
   - Copy relevant text
   - Rewrite for clarity (keep meaning)
   - Add metadata
   - Assign unique ID

4. **Add to JSON**
   - Paste into `tax-chunks.json`
   - Check JSON syntax
   - Save file

5. **Generate Embeddings**
   ```bash
   node src/scripts/setupKnowledge.js
   ```

6. **Test**
   - Start server
   - Ask questions
   - Verify answers use correct sources

## ID Naming Convention

Use descriptive prefixes:

- `apit_xxx` - APIT related
- `vat_xxx` - VAT related
- `income_tax_xxx` - Income tax
- `deadline_xxx` - Deadlines
- `form_xxx` - Forms and filing
- `deduction_xxx` - Deductions

Examples:
- `apit_rates_2024`
- `vat_registration_threshold`
- `income_tax_returns_individual`

## Testing Your Chunks

After adding chunks, test with specific questions:

```bash
# Start server
npm start

# In browser, ask:
"What are the APIT rates?"
"What is the VAT threshold?"
"When do I file my tax return?"
```

Check the console - you should see:
```
Found 3 relevant chunks (scores: 0.891, 0.847, 0.723)
```

If scores are low (<0.7), your chunks might need:
- More context
- Better wording
- Different splitting

## Example: Complete Tax Topic

Let's say you want to add complete APIT knowledge:

**Step 1: Identify Sub-Topics**
- What is APIT?
- Who pays APIT?
- APIT rates
- How to calculate
- Deductions allowed
- Payment deadlines
- Exemptions

**Step 2: Create 7 Chunks**

One chunk for each sub-topic (example shown earlier).

**Step 3: Add to JSON**

```json
[
  { "id": "apit_001", "title": "APIT Overview", ... },
  { "id": "apit_002", "title": "APIT Eligibility", ... },
  { "id": "apit_003", "title": "APIT Rates 2024/25", ... },
  ...
]
```

**Step 4: Generate Embeddings**

```bash
node src/scripts/setupKnowledge.js
```

**Step 5: Test**

Ask various APIT questions and verify responses.

## Need More Examples?

Check the 5 example chunks already in `tax-chunks.json`:
- APIT overview
- APIT rates
- Qualifying payments
- VAT threshold
- Filing deadlines

Use these as templates!

## Pro Tips

1. **Keep Original PDFs**
   - Reference them when users ask for sources
   - Verify accuracy

2. **Version Control**
   - Add tax year to each chunk
   - Update yearly
   - Keep old versions for historical queries

3. **Iterative Improvement**
   - Start with 20-30 chunks
   - See what questions fail
   - Add chunks to fill gaps

4. **Quality > Quantity**
   - 50 good chunks > 500 bad chunks
   - Focus on accuracy
   - Test thoroughly

## What's Next?

1. Add your first 10 chunks
2. Run setup script
3. Test with questions
4. Gradually expand to 50+ chunks
5. Cover all major tax topics

You're building a tax knowledge base from scratch. Take your time and be thorough!
