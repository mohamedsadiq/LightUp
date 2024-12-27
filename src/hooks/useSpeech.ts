import { useState, useEffect } from 'react';

interface UseSpeechReturn {
  voicesLoaded: boolean;
  speakingId: string | null;
  handleSpeak: (text: string, id: string) => Promise<void>;
}

const stripHtml = (html: string) => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

export const useSpeech = (): UseSpeechReturn => {
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Chrome bug workaround
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 5000);

    return () => {
      clearInterval(keepAlive);
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = async (text: string, id: string) => {
    try {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }

      setSpeakingId(id);
      window.speechSynthesis.cancel();

      let voices = window.speechSynthesis.getVoices();
      
      if (voices.length === 0) {
        voices = await new Promise((resolve) => {
          const checkVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
              resolve(availableVoices);
            } else {
              setTimeout(checkVoices, 100);
            }
          };
          checkVoices();
        });
      }

      const preferredVoice = voices.find(voice => 
        voice.lang === 'en-US' && 
        (voice.name.includes('Samantha') || 
         voice.name.includes('Daniel') ||
         voice.name.includes('Karen') ||
         voice.name.includes('Alex'))
      ) || voices.find(voice => voice.lang === 'en-US') || voices[0];

      if (!preferredVoice) {
        throw new Error('No voice available');
      }

      const cleanText = stripHtml(text)
        .replace(/[*_~`]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.voice = preferredVoice;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setSpeakingId(id);
      };

      utterance.onend = () => {
        setSpeakingId(null);
      };

      utterance.onerror = () => {
        setSpeakingId(null);
      };

      window.speechSynthesis.speak(utterance);

      // Chrome bug workaround
      setTimeout(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 0);

    } catch (error) {
      setSpeakingId(null);
      window.speechSynthesis.cancel();
    }
  };

  return {
    voicesLoaded,
    speakingId,
    handleSpeak
  };
}; 