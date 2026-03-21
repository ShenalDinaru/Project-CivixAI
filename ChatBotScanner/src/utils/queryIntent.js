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

export const analyzeQueryIntent = (query = '', conversationHistory = []) => {
  const recentUserMessages = Array.isArray(conversationHistory)
    ? conversationHistory
        .filter((item) => item?.role === 'user' && typeof item.content === 'string')
        .slice(-3)
        .map((item) => item.content)
    : [];
  const currentYear = new Date().getFullYear();
  const normalizedQuery = String(query).trim();
  const lowerQuery = normalizedQuery.toLowerCase();
  const recentContext = recentUserMessages.join('\n');
  const lowerRecentContext = recentContext.toLowerCase();

  const mentionsCurrentInfo = CURRENT_INFO_PATTERNS.some((pattern) => pattern.test(normalizedQuery));
  const hasHistoricalKeyword = HISTORICAL_INFO_PATTERNS.some((pattern) => pattern.test(normalizedQuery));
  const hasHistoricalPeriod = HISTORICAL_PERIOD_PATTERNS.some((pattern) => pattern.test(normalizedQuery));
  const referencesUploadedDocuments = DOCUMENT_PATTERNS.some((pattern) => pattern.test(normalizedQuery));
  const contextMentionsCurrentInfo = CURRENT_INFO_PATTERNS.some((pattern) => pattern.test(recentContext));
  const contextHasHistoricalKeyword = HISTORICAL_INFO_PATTERNS.some((pattern) => pattern.test(recentContext));
  const contextHasHistoricalPeriod = HISTORICAL_PERIOD_PATTERNS.some((pattern) => pattern.test(recentContext));

  const yearMatches = Array.from(lowerQuery.matchAll(/\b(20\d{2})\b/g), (match) => Number(match[1]));
  const contextYearMatches = Array.from(lowerRecentContext.matchAll(/\b(20\d{2})\b/g), (match) => Number(match[1]));
  const hasPastYearReference = yearMatches.some((year) => year < currentYear);
  const contextHasPastYearReference = contextYearMatches.some((year) => year < currentYear);
  const hasExplicitTemporalIntent = mentionsCurrentInfo || hasHistoricalKeyword || hasHistoricalPeriod || hasPastYearReference;
  const inheritsHistoricalContext = !hasExplicitTemporalIntent &&
    (contextHasHistoricalKeyword || contextHasHistoricalPeriod || contextHasPastYearReference);

  const requestsHistoricalInfo = hasHistoricalKeyword ||
    (!mentionsCurrentInfo && (hasHistoricalPeriod || hasPastYearReference || inheritsHistoricalContext));

  return {
    mentionsCurrentInfo,
    contextMentionsCurrentInfo,
    referencesUploadedDocuments,
    inheritsHistoricalContext,
    requestsHistoricalInfo,
    wantsLatestInfo: !requestsHistoricalInfo || (!hasExplicitTemporalIntent && contextMentionsCurrentInfo)
  };
};

export const OFFICIAL_TAX_SOURCE_DOMAINS = [
  'ird.gov.lk',
  'www.ird.gov.lk',
  'documents.gov.lk',
  'parliament.lk',
  'www.parliament.lk'
];
