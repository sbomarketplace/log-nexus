import React, { useEffect, useState } from 'react';
import { getCredits, onCreditsChange, FREE_LIMIT } from '@/lib/credits';

export function AiCreditsPanel() {
  // AI is now unlimited - no need to show credits UI
  return null;
}