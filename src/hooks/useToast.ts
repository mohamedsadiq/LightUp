import { useState, useEffect } from 'react';

interface Toast {
  message: string;
  visible: boolean;
}

interface UseToastReturn {
  toast: Toast;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useToast = (duration: number = 2000): UseToastReturn => {
  const [toast, setToast] = useState<Toast>({
    message: '',
    visible: false
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (toast.visible) {
      timeoutId = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, duration);
    }
    return () => clearTimeout(timeoutId);
  }, [toast.visible, duration]);

  const showToast = (message: string) => {
    setToast({
      message,
      visible: true
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  return {
    toast,
    showToast,
    hideToast
  };
}; 