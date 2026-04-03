import { useEffect } from 'react';

/**
 * Sets the document title for the current page.
 * Automatically appends the brand suffix.
 * @param {string} title - Page-specific title
 */
export default function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — LearnAI` : 'LearnAI — AI-Powered Personalized Learning Platform';
    return () => { document.title = prev; };
  }, [title]);
}
