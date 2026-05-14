'use client';

import { useState, useEffect } from 'react';

export type PdfAction = {
  id: string;
  type: 'merge' | 'split' | 'pdf-to-image' | 'image-to-pdf';
  filename: string;
  timestamp: number;
  dataUrl?: string; // Optional: To allow re-downloading if small enough, but usually LocalStorage is size limited (5MB)
};

export function usePdfSessionLimit(isPro: boolean = false) {
  const [actions, setActions] = useState<PdfAction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const MAX_ACTIONS = isPro ? Infinity : 5;

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pdf-actions');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        if (Array.isArray(parsed)) {
          // Filter history to only last 3 days and ensure data is valid
          const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
          const recentActions = parsed.filter(action => 
            action && 
            typeof action === 'object' && 
            typeof action.type === 'string' &&
            typeof action.timestamp === 'number' &&
            action.timestamp > threeDaysAgo
          );
          
          // eslint-disable-next-line react-hooks/exhaustive-deps
          setActions(recentActions as PdfAction[]);
          
          if (parsed.length !== recentActions.length) {
            localStorage.setItem('pdf-actions', JSON.stringify(recentActions));
          }
        } else {
          localStorage.removeItem('pdf-actions');
        }
      }
    } catch (e) {
      console.error('Failed to parse pdf-actions from local storage', e);
    }
    setIsLoaded(true);
  }, []);

  const addAction = (action: Omit<PdfAction, 'id' | 'timestamp'>) => {
    if (!isPro && actions.length >= 5) {
      throw new Error(`Limit reached: Free users can only perform 5 actions. Upgrade to Pro for unlimited!`);
    }

    const newAction: PdfAction = {
      ...action,
      id: Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
    };

    const newActions = [newAction, ...actions];
    setActions(newActions);
    try {
      localStorage.setItem('pdf-actions', JSON.stringify(newActions));
    } catch (e) {
      console.error('Failed to save pdf-action to local storage', e);
    }
    return newAction;
  };

  const clearHistory = () => {
    setActions([]);
    localStorage.removeItem('pdf-actions');
  };

  const canPerformAction = actions.length < MAX_ACTIONS;
  const actionsRemaining = Math.max(0, MAX_ACTIONS - actions.length);

  return {
    actions,
    addAction,
    clearHistory,
    canPerformAction,
    actionsRemaining,
    maxActions: MAX_ACTIONS,
    isLoaded
  };
}
