export const isRTL = (language: string): boolean => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language);
};

export const getTextDirection = (language: string): 'rtl' | 'ltr' => {
  return isRTL(language) ? 'rtl' : 'ltr';
}; 