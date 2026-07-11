import type { AIModel } from './types';

export interface AIModelInfo {
  id: AIModel;
  label: string;
  tagline: string;
  detail: string;
  recommended?: boolean;
}

// Free-tier-eligible Gemini models only — Pro-series models left the free tier in
// April 2026, so they're deliberately excluded here rather than offered and failing
// for every user who hasn't enabled billing.
//
// gemini-2.5-flash and gemini-2.5-flash-lite were removed 2026-07: Google retired
// that generation for new API keys/accounts (verified live — they now 404 with
// "no longer available to new users" while still 200/429ing for older keys). Stick
// to non-preview, non-alias model IDs here — "-latest" aliases can silently swap the
// underlying model between requests, which is a bad fit for a reproducible verdict.
export const AI_MODELS: AIModelInfo[] = [
  {
    id: 'gemini-3.5-flash',
    label: 'Gemini 3.5 Flash',
    tagline: 'Recommended · best reasoning',
    detail: 'Strongest steelman/falsifier analysis of the three. Free tier available.',
    recommended: true,
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    tagline: 'Reliable workhorse',
    detail: 'Long-established, stable GA model. Free tier available.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash-Lite',
    tagline: 'Fastest · lightest',
    detail: 'Fastest responses among the three, lowest cost per request. Free tier available.',
  },
];

export const DEFAULT_AI_MODEL: AIModel = 'gemini-3.5-flash';

export function isKnownAIModel(value: string): value is AIModel {
  return AI_MODELS.some((m) => m.id === value);
}
