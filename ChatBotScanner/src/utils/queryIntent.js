const CURRENT_INFO_PATTERNS = [
  /\blatest\b/i,
  /\bcurrent\b/i,
  /\bcurrently\b/i,
  /\bnow\b/i,
  /\btoday\b/i,
  /\bup[\s-]?to[\s-]?date\b/i,
  /\bnewest\b/i,
  /\bmost recent\b/i,
  /\brecent changes?\b/i
];

const HISTORICAL_INFO_PATTERNS = [
  /\bold\b/i,
  /\bolder\b/i,
  /\bhistorical\b/i,
  /\bhistoric\b/i,
  /\bprevious\b/i,
  /\bpast\b/i,
  /\bformer\b/i,
  /\bused to\b/i,
  /\bwhat was\b/i,
  /\bas of\b/i,
  /\bbefore\b/i,
  /\bprior to\b/i,
  /\bback in\b/i,
  /\bat the time\b/i
];

const HISTORICAL_PERIOD_PATTERNS = [
  /\b(?:year of assessment|y\/a|ya)\s*(20\d{2}(?:[/-]\d{2,4})?)\b/i,
  /\b(?:as of|for|in|during|before|prior to|back in|under)\s+(20\d{2}(?:[/-]\d{2,4})?)\b/i
];

const ASSESSMENT_YEAR_LABEL_PATTERN = /\b(20\d{2}[/-](?:20\d{2}|\d{2}))\b(?![-/]\d)/gi;

const DOCUMENT_PATTERNS = [
  /\bthis document\b/i,
  /\bmy document\b/i,
  /\buploaded\b/i,
  /\bupload\b/i,
  /\battachment\b/i,
  /\battached\b/i,
  /\bfile\b/i,
  /\bpdf\b/i,
  /\bscan(?:ned)?\b/i,
  /\bimage\b/i,
  /\baccording to (?:the|my|this) document\b/i
];

export const normalizeAssessmentYearLabel = (value = '') => {
  const match = String(value).match(/\b(20\d{2})[/-](20\d{2}|\d{2})\b(?![-/]\d)/i);

  if (!match) {
    return null;
  }

  const startYear = Number(match[1]);
  const rawEndYear = match[2];
  const endYear = rawEndYear.length === 2
    ? Number(`${String(startYear).slice(0, 2)}${rawEndYear}`)
    : Number(rawEndYear);

  return `${startYear}/${endYear}`;
};

export const getCurrentAssessmentYearInfo = (date = new Date()) => {
  const currentDate = date instanceof Date ? date : new Date(date);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;

  return {
    startYear,
    endYear,
    label: `${startYear}/${endYear}`
  };
};

const extractAssessmentYearLabels = (text = '') => {
  const labels = Array.from(String(text).matchAll(ASSESSMENT_YEAR_LABEL_PATTERN), (match) =>
    normalizeAssessmentYearLabel(match[1])
  ).filter(Boolean);

  return [...new Set(labels)];
};

const stripAssessmentYearLabels = (text = '') => String(text).replace(ASSESSMENT_YEAR_LABEL_PATTERN, ' ');

export const analyzeQueryIntent = (query = '', conversationHistory = []) => {
  const recentUserMessages = Array.isArray(conversationHistory)
    ? conversationHistory
        .filter((item) => item?.role === 'user' && typeof item.content === 'string')
        .slice(-3)
        .map((item) => item.content)
    : [];
  const currentAssessmentYear = getCurrentAssessmentYearInfo();
  const currentYear = new Date().getFullYear();
  const normalizedQuery = String(query).trim();
  const lowerQuery = normalizedQuery.toLowerCase();
  const recentContext = recentUserMessages.join('\n');
  const lowerRecentContext = recentContext.toLowerCase();
  const queryAssessmentYears = extractAssessmentYearLabels(normalizedQuery);
  const contextAssessmentYears = extractAssessmentYearLabels(recentContext);
  const requestedAssessmentYear = queryAssessmentYears[0] || contextAssessmentYears[0] || null;
  const referencesCurrentAssessmentYear = requestedAssessmentYear === currentAssessmentYear.label;

  const mentionsCurrentInfo = CURRENT_INFO_PATTERNS.some((pattern) => pattern.test(normalizedQuery));
  const hasHistoricalKeyword = HISTORICAL_INFO_PATTERNS.some((pattern) => pattern.test(normalizedQuery));
  const hasHistoricalPeriod = HISTORICAL_PERIOD_PATTERNS.some((pattern) => pattern.test(normalizedQuery));
  const referencesUploadedDocuments = DOCUMENT_PATTERNS.some((pattern) => pattern.test(normalizedQuery));
  const contextMentionsCurrentInfo = CURRENT_INFO_PATTERNS.some((pattern) => pattern.test(recentContext));
  const contextHasHistoricalKeyword = HISTORICAL_INFO_PATTERNS.some((pattern) => pattern.test(recentContext));
  const contextHasHistoricalPeriod = HISTORICAL_PERIOD_PATTERNS.some((pattern) => pattern.test(recentContext));
  const hasNonCurrentHistoricalPeriod = hasHistoricalPeriod && !referencesCurrentAssessmentYear;
  const contextHasNonCurrentHistoricalPeriod = contextHasHistoricalPeriod &&
    !contextAssessmentYears.includes(currentAssessmentYear.label);

  const standaloneQueryYears = stripAssessmentYearLabels(lowerQuery);
  const standaloneContextYears = stripAssessmentYearLabels(lowerRecentContext);
  const yearMatches = Array.from(standaloneQueryYears.matchAll(/\b(20\d{2})\b/g), (match) => Number(match[1]));
  const contextYearMatches = Array.from(standaloneContextYears.matchAll(/\b(20\d{2})\b/g), (match) => Number(match[1]));
  const hasPastYearReference = yearMatches.some((year) => year < currentYear);
  const contextHasPastYearReference = contextYearMatches.some((year) => year < currentYear);
  const referencesHistoricalAssessmentYear = Boolean(requestedAssessmentYear) && !referencesCurrentAssessmentYear;
  const hasExplicitTemporalIntent = mentionsCurrentInfo ||
    hasHistoricalKeyword ||
    hasNonCurrentHistoricalPeriod ||
    hasPastYearReference ||
    Boolean(requestedAssessmentYear);
  const inheritsHistoricalContext = !hasExplicitTemporalIntent &&
    (contextHasHistoricalKeyword || contextHasNonCurrentHistoricalPeriod || contextHasPastYearReference);

  const requestsHistoricalInfo = hasHistoricalKeyword ||
    (!mentionsCurrentInfo && (
      referencesHistoricalAssessmentYear ||
      hasNonCurrentHistoricalPeriod ||
      hasPastYearReference ||
      inheritsHistoricalContext
    ));

  return {
    mentionsCurrentInfo,
    contextMentionsCurrentInfo,
    referencesUploadedDocuments,
    inheritsHistoricalContext,
    requestedAssessmentYear,
    currentAssessmentYear: currentAssessmentYear.label,
    requestsHistoricalInfo,
    wantsLatestInfo: referencesCurrentAssessmentYear ||
      !requestsHistoricalInfo ||
      (!hasExplicitTemporalIntent && contextMentionsCurrentInfo)
  };
};

export const OFFICIAL_CIVIC_SOURCE_DOMAINS = [
  'gov.lk',
  'www.gov.lk',
  'ird.gov.lk',
  'www.ird.gov.lk',
  'dmt.gov.lk',
  'www.dmt.gov.lk',
  'documents.gov.lk',
  'parliament.lk',
  'www.parliament.lk'
];

export const OFFICIAL_TAX_SOURCE_DOMAINS = OFFICIAL_CIVIC_SOURCE_DOMAINS;
