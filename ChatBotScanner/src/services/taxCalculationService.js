import { retrieveRelevantChunks } from '../rag/retrieve.js';
import { getCurrentAssessmentYearInfo } from '../utils/queryIntent.js';

const PRIMARY_TAX_CHART_DOCUMENT_ID = 'ird_tax_chart_2025_2026';
const MIN_VERIFIED_RATE_SCORE = 0.35;
const MIN_RELIEF_CONFIRMATION_SCORE = 0.25;

const CURRENT_RATE_SECTION_PATTERN = /Tax Rates for Resident and Non-Resident Individuals/i;
const PROGRESSIVE_RATE_TEXT_PATTERN = /Taxable income rates:/i;
const PERSONAL_RELIEF_PATTERN = /personal relief(?: for residents and non-resident citizens of Sri Lanka)? is Rs\.?\s*([\d,]+(?:\.\d+)?)/i;
const AGGREGATE_RELIEF_PATTERN = /aggregate relief including personal relief(?: for every resident individual)? (?:is|was) Rs\.?\s*([\d,]+(?:\.\d+)?)/i;
const BRACKET_PATTERN = /(first|next)\s+Rs\.?\s*([\d,]+(?:\.\d+)?)\s+at\s+(\d+(?:\.\d+)?)%/gi;
const BALANCE_RATE_PATTERN = /\bbalance(?: taxable income)?\s+at\s+(\d+(?:\.\d+)?)%/i;
const SCALE_PATTERN = '(million|thousand|lakh|m|k)\\b';

const CALCULATION_SIGNAL_PATTERNS = [
  /\bhow much tax\b/i,
  /\bneed to pay\b/i,
  /\btax payable\b/i,
  /\bcalculate\b/i,
  /\bwhat would .* tax\b/i,
  /\bif i earn\b/i,
  /\bif my income\b/i,
  /\bhow much would i pay\b/i,
  /\bowe\b/i
];

const FOLLOW_UP_SIGNAL_PATTERN = /\b(what about|how about|instead|then|so)\b/i;
const INCOME_CONTEXT_PATTERN = /\b(income tax|personal income tax|salary|income|earn|earning|monthly|annual|per month|per year)\b/i;
const UNSUPPORTED_SCOPE_PATTERN = /\b(vat|wht|withholding|corporate|company|partnership|dividend|gambling|betting|trust|ngo)\b/i;
const NON_RESIDENT_PATTERN = /\bnon-resident\b/i;
const MONTHLY_PATTERN = /\b(monthly|per month|a month|month)\b/i;
const ANNUAL_PATTERN = /\b(annual|annually|yearly|per year|a year)\b/i;

const formatCurrency = (value) => {
  const rounded = Math.round(value * 100) / 100;
  const hasDecimals = Math.abs(rounded % 1) > 0;

  return rounded.toLocaleString('en-LK', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
  });
};

const parseNumber = (value = '') => Number(String(value).replace(/,/g, ''));

const parseScaledAmount = (rawAmount, scale = '') => {
  const baseValue = parseNumber(rawAmount);
  const normalizedScale = String(scale || '').toLowerCase();

  if (!Number.isFinite(baseValue)) {
    return null;
  }

  if (normalizedScale === 'million' || normalizedScale === 'm') {
    return baseValue * 1_000_000;
  }

  if (normalizedScale === 'thousand' || normalizedScale === 'k') {
    return baseValue * 1_000;
  }

  if (normalizedScale === 'lakh') {
    return baseValue * 100_000;
  }

  return baseValue;
};

const normalizePeriod = (value = '') => {
  if (MONTHLY_PATTERN.test(value)) {
    return 'monthly';
  }

  if (ANNUAL_PATTERN.test(value)) {
    return 'annual';
  }

  return null;
};

const extractAmountFromText = (text = '') => {
  const patterns = [
    new RegExp(`(?:earn|earning|income|salary|remuneration|wage|get|make|made|paid)[^\\d]{0,25}(?:rs\\.?|lkr)?\\s*([\\d,]+(?:\\.\\d+)?)(?:\\s*${SCALE_PATTERN})?\\s*(monthly|per month|a month|month|annual|annually|yearly|per year|a year)?`, 'i'),
    new RegExp(`(?:rs\\.?|lkr)\\s*([\\d,]+(?:\\.\\d+)?)(?:\\s*${SCALE_PATTERN})?\\s*(monthly|per month|a month|month|annual|annually|yearly|per year|a year)?`, 'i'),
    new RegExp(`\\b([\\d]{2,3}(?:,\\d{3})+|\\d{5,}(?:\\.\\d+)?)\\b(?:\\s*${SCALE_PATTERN})?\\s*(monthly|per month|a month|month|annual|annually|yearly|per year|a year)?`, 'i')
  ];

  for (const pattern of patterns) {
    const match = String(text).match(pattern);

    if (!match) {
      continue;
    }

    const amount = parseScaledAmount(match[1], match[2]);
    const period = normalizePeriod(match[3] || '');

    if (Number.isFinite(amount) && amount >= 10_000) {
      return { amount, period };
    }
  }

  return null;
};

const extractCalculationRequest = (query = '', conversationHistory = []) => {
  const normalizedQuery = String(query).trim();
  const recentUserContext = Array.isArray(conversationHistory)
    ? conversationHistory
        .filter((item) => item?.role === 'user' && typeof item.content === 'string')
        .slice(-3)
        .map((item) => item.content)
        .join(' ')
    : '';
  const combinedContext = `${recentUserContext}\n${normalizedQuery}`;
  const hasCalculationSignal = CALCULATION_SIGNAL_PATTERNS.some((pattern) => pattern.test(normalizedQuery)) ||
    (/\d/.test(normalizedQuery) && (
      FOLLOW_UP_SIGNAL_PATTERN.test(normalizedQuery) ||
      normalizePeriod(normalizedQuery) ||
      /\b(pay|tax|earn|income|salary)\b/i.test(normalizedQuery)
    ));
  const hasIncomeContext = INCOME_CONTEXT_PATTERN.test(combinedContext);

  if (!hasCalculationSignal || !hasIncomeContext) {
    return null;
  }

  if (UNSUPPORTED_SCOPE_PATTERN.test(combinedContext)) {
    return {
      recognized: true,
      unsupportedReason: 'This deterministic calculator currently covers only resident-individual personal income tax on employment income.'
    };
  }

  const queryAmount = extractAmountFromText(normalizedQuery);
  const inferredFromContext = FOLLOW_UP_SIGNAL_PATTERN.test(normalizedQuery) ? extractAmountFromText(recentUserContext) : null;
  const amount = queryAmount?.amount ?? inferredFromContext?.amount ?? null;
  const period = queryAmount?.period ||
    normalizePeriod(normalizedQuery) ||
    inferredFromContext?.period ||
    normalizePeriod(recentUserContext);

  return {
    recognized: true,
    amount,
    period,
    residentStatus: NON_RESIDENT_PATTERN.test(combinedContext) ? 'non_resident' : 'resident'
  };
};

const mergeUniqueChunks = (...chunkGroups) => {
  const uniqueChunks = new Map();

  chunkGroups.flat().filter(Boolean).forEach((chunk) => {
    const key = chunk.chunk_id || chunk.id;

    if (!key) {
      return;
    }

    if (!uniqueChunks.has(key)) {
      uniqueChunks.set(key, chunk);
      return;
    }

    const existingChunk = uniqueChunks.get(key);
    const existingScore = existingChunk?.score ?? -Infinity;
    const nextScore = chunk?.score ?? -Infinity;

    if (nextScore > existingScore) {
      uniqueChunks.set(key, chunk);
    }
  });

  return Array.from(uniqueChunks.values());
};

const isCurrentResidentRateChunk = (chunk) =>
  CURRENT_RATE_SECTION_PATTERN.test(chunk?.section || '') &&
  PROGRESSIVE_RATE_TEXT_PATTERN.test(chunk?.text || '');

const parseReliefAmount = (text = '') => {
  const directMatch = String(text).match(PERSONAL_RELIEF_PATTERN);

  if (directMatch) {
    return parseNumber(directMatch[1]);
  }

  const aggregateMatch = String(text).match(AGGREGATE_RELIEF_PATTERN);
  return aggregateMatch ? parseNumber(aggregateMatch[1]) : null;
};

const parseRateBrackets = (text = '') => {
  const brackets = [];
  const normalizedText = String(text);

  for (const match of normalizedText.matchAll(BRACKET_PATTERN)) {
    brackets.push({
      type: match[1].toLowerCase(),
      amount: parseNumber(match[2]),
      rate: Number(match[3]) / 100
    });
  }

  const balanceMatch = normalizedText.match(BALANCE_RATE_PATTERN);

  if (balanceMatch) {
    brackets.push({
      type: 'balance',
      amount: null,
      rate: Number(balanceMatch[1]) / 100
    });
  }

  return brackets.filter((bracket) => Number.isFinite(bracket.rate));
};

const getChunkAssessmentYear = (chunk) => {
  const yearText = String(chunk?.year || '');
  const match = yearText.match(/\b(20\d{2}[/-](?:20\d{2}|\d{2}))\b/);

  if (!match) {
    return null;
  }

  const [label] = match;
  const parts = label.split(/[/-]/);
  const startYear = Number(parts[0]);
  const rawEndYear = parts[1];
  const endYear = rawEndYear.length === 2
    ? Number(`${String(startYear).slice(0, 2)}${rawEndYear}`)
    : Number(rawEndYear);

  return `${startYear}/${endYear}`;
};

const selectBestRateChunk = (chunks = [], targetAssessmentYear) => {
  const candidates = chunks
    .filter(isCurrentResidentRateChunk)
    .map((chunk) => ({
      chunk,
      assessmentYear: getChunkAssessmentYear(chunk),
      relief: parseReliefAmount(chunk.text),
      brackets: parseRateBrackets(chunk.text),
      score: chunk.score ?? 0
    }))
    .filter((candidate) => Number.isFinite(candidate.relief) && candidate.brackets.length >= 2)
    .sort((left, right) => {
      const yearMatchDiff =
        Number(right.assessmentYear === targetAssessmentYear) - Number(left.assessmentYear === targetAssessmentYear);

      if (yearMatchDiff !== 0) {
        return yearMatchDiff;
      }

      return (right.score ?? 0) - (left.score ?? 0);
    });

  return candidates[0] || null;
};

const selectReliefConfirmationChunk = (chunks = [], targetAssessmentYear) => {
  const candidates = chunks
    .map((chunk) => ({
      chunk,
      assessmentYear: getChunkAssessmentYear(chunk),
      relief: parseReliefAmount(chunk.text),
      score: chunk.score ?? 0
    }))
    .filter((candidate) => Number.isFinite(candidate.relief))
    .sort((left, right) => {
      const yearMatchDiff =
        Number(right.assessmentYear === targetAssessmentYear) - Number(left.assessmentYear === targetAssessmentYear);

      if (yearMatchDiff !== 0) {
        return yearMatchDiff;
      }

      return (right.score ?? 0) - (left.score ?? 0);
    });

  return candidates[0] || null;
};

const calculateProgressiveTax = (taxableIncome, brackets = []) => {
  let remainingIncome = Math.max(0, taxableIncome);
  let totalTax = 0;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) {
      break;
    }

    if (bracket.type === 'balance' || !Number.isFinite(bracket.amount)) {
      totalTax += remainingIncome * bracket.rate;
      remainingIncome = 0;
      break;
    }

    const amountInBracket = Math.min(remainingIncome, bracket.amount);
    totalTax += amountInBracket * bracket.rate;
    remainingIncome -= amountInBracket;
  }

  return Math.round(totalTax * 100) / 100;
};

const formatRateSchedule = (brackets = []) => brackets
  .map((bracket) => {
    if (bracket.type === 'balance' || !Number.isFinite(bracket.amount)) {
      return `balance at ${Math.round(bracket.rate * 100)}%`;
    }

    return `${bracket.type} Rs. ${formatCurrency(bracket.amount)} at ${Math.round(bracket.rate * 100)}%`;
  })
  .join('; ');

const buildDeterministicResponse = (content, supportingChunks = [], metadata = {}) => ({
  content,
  model: 'deterministic/resident-income-tax-calculator',
  usage: null,
  webSearch: { used: false, sources: [] },
  calculator: {
    used: true,
    ...metadata
  },
  supportingChunks
});

export const attemptDeterministicTaxCalculation = async (
  userMessage,
  conversationHistory = [],
  intent = {},
  initialChunks = []
) => {
  const calculationRequest = extractCalculationRequest(userMessage, conversationHistory);

  if (!calculationRequest?.recognized) {
    return { handled: false };
  }

  if (calculationRequest.unsupportedReason) {
    return {
      handled: true,
      relevantChunks: initialChunks,
      response: buildDeterministicResponse(
        `${calculationRequest.unsupportedReason} I’m not going to guess a number for this request.`,
        initialChunks,
        { verified: false, reason: 'unsupported_scope' }
      )
    };
  }

  if (calculationRequest.residentStatus !== 'resident') {
    return {
      handled: true,
      relevantChunks: initialChunks,
      response: buildDeterministicResponse(
        'I can only run the deterministic calculator safely for resident-individual employment income right now. Non-resident treatment can change the relief position, so I’m not going to guess.',
        initialChunks,
        { verified: false, reason: 'unsupported_residency' }
      )
    };
  }

  if (!Number.isFinite(calculationRequest.amount)) {
    return {
      handled: true,
      relevantChunks: initialChunks,
      response: buildDeterministicResponse(
        'I can calculate this deterministically, but I need your income amount first. Share the amount and whether it is **monthly** or **annual**.',
        initialChunks,
        { verified: false, reason: 'missing_amount' }
      )
    };
  }

  if (!calculationRequest.period) {
    return {
      handled: true,
      relevantChunks: initialChunks,
      response: buildDeterministicResponse(
        `I found the income amount as **Rs. ${formatCurrency(calculationRequest.amount)}**, but I still need to know whether that is **monthly** or **annual** before I calculate the tax.`,
        initialChunks,
        { verified: false, reason: 'missing_period' }
      )
    };
  }

  const currentAssessmentYear = getCurrentAssessmentYearInfo().label;
  const targetAssessmentYear = intent.requestedAssessmentYear || currentAssessmentYear;

  if (intent.requestsHistoricalInfo && targetAssessmentYear !== currentAssessmentYear) {
    return {
      handled: true,
      relevantChunks: initialChunks,
      response: buildDeterministicResponse(
        `I can verify and calculate the current **${currentAssessmentYear}** resident-individual schedule, but I do not have a deterministic slab schedule verified in the KB for **${targetAssessmentYear}**. I’m not going to guess for that period.`,
        initialChunks,
        { verified: false, reason: 'unsupported_historical_period' }
      )
    };
  }

  let rateChunks = mergeUniqueChunks(initialChunks);
  let selectedRateChunk = selectBestRateChunk(rateChunks, targetAssessmentYear);

  if (!selectedRateChunk ||
      selectedRateChunk.assessmentYear !== targetAssessmentYear ||
      (selectedRateChunk.score ?? 0) < MIN_VERIFIED_RATE_SCORE) {
    const rateRetrievalQuery = `Year of Assessment ${targetAssessmentYear} resident individual personal relief progressive income slabs taxable income rates`;
    rateChunks = mergeUniqueChunks(
      rateChunks,
      await retrieveRelevantChunks(rateRetrievalQuery, 5, {
        preferLatest: targetAssessmentYear === currentAssessmentYear,
        primaryDocumentId: PRIMARY_TAX_CHART_DOCUMENT_ID,
        minScore: 0.3
      })
    );
    selectedRateChunk = selectBestRateChunk(rateChunks, targetAssessmentYear);
  }

  if (!selectedRateChunk ||
      selectedRateChunk.assessmentYear !== targetAssessmentYear ||
      (selectedRateChunk.score ?? 0) < MIN_VERIFIED_RATE_SCORE) {
    return {
      handled: true,
      relevantChunks: rateChunks,
      response: buildDeterministicResponse(
        'I could not verify the exact resident-individual rate schedule strongly enough from the knowledge base for this calculation, so I’m not going to guess a tax amount.',
        rateChunks,
        { verified: false, reason: 'low_confidence_rate_lookup' }
      )
    };
  }

  let reliefChunks = mergeUniqueChunks(rateChunks);
  let reliefConfirmation = selectReliefConfirmationChunk(reliefChunks, targetAssessmentYear);

  if (!reliefConfirmation ||
      reliefConfirmation.assessmentYear !== targetAssessmentYear ||
      (reliefConfirmation.score ?? 0) < MIN_RELIEF_CONFIRMATION_SCORE) {
    const reliefRetrievalQuery = `Year of Assessment ${targetAssessmentYear} aggregate relief including personal relief resident individual`;
    reliefChunks = mergeUniqueChunks(
      reliefChunks,
      await retrieveRelevantChunks(reliefRetrievalQuery, 4, {
        preferLatest: targetAssessmentYear === currentAssessmentYear,
        minScore: 0.2
      })
    );
    reliefConfirmation = selectReliefConfirmationChunk(reliefChunks, targetAssessmentYear);
  }

  if (reliefConfirmation &&
      reliefConfirmation.assessmentYear === targetAssessmentYear &&
      (reliefConfirmation.score ?? 0) >= MIN_RELIEF_CONFIRMATION_SCORE &&
      reliefConfirmation.relief !== selectedRateChunk.relief) {
    return {
      handled: true,
      relevantChunks: reliefChunks,
      response: buildDeterministicResponse(
        'The retrieved knowledge-base sources disagree on the applicable personal relief for this calculation, so I’m not going to guess a number.',
        reliefChunks,
        { verified: false, reason: 'conflicting_relief_values' }
      )
    };
  }

  const annualIncome = calculationRequest.period === 'monthly'
    ? calculationRequest.amount * 12
    : calculationRequest.amount;
  const personalRelief = selectedRateChunk.relief;
  const taxableIncome = Math.max(0, annualIncome - personalRelief);
  const annualTax = calculateProgressiveTax(taxableIncome, selectedRateChunk.brackets);
  const monthlyEquivalent = annualTax / 12;
  const supportingChunks = mergeUniqueChunks(
    [selectedRateChunk.chunk],
    reliefConfirmation ? [reliefConfirmation.chunk] : []
  );
  const responseContent = `Based on the verified **Year of Assessment ${targetAssessmentYear}** resident-individual schedule in the knowledge base, and assuming this is **employment income only** with no extra deductions beyond the standard personal relief:

1. **Annual income:** Rs. ${formatCurrency(annualIncome)}
2. **Personal relief:** Rs. ${formatCurrency(personalRelief)}
3. **Taxable income:** Rs. ${formatCurrency(taxableIncome)}
4. **Income tax payable:** Rs. ${formatCurrency(annualTax)} per year
5. **Monthly equivalent:** Rs. ${formatCurrency(monthlyEquivalent)} per month

Verified rate schedule used: ${formatRateSchedule(selectedRateChunk.brackets)}.

If your situation includes **rent relief**, **solar relief**, **non-resident treatment**, or **other income sources**, the final figure can change.`;

  return {
    handled: true,
    relevantChunks: supportingChunks,
    response: buildDeterministicResponse(responseContent, supportingChunks, {
      verified: true,
      assessmentYear: targetAssessmentYear,
      annualIncome,
      annualTax
    })
  };
};
