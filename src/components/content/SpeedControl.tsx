import React from 'react';

interface SpeedControlProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export const SpeedControl = ({ speed, onSpeedChange }: SpeedControlProps) => {
  const speeds = [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 3, label: '3x' },
    { value: 5, label: '5x' },
    { value: 10, label: '10x' }
  ];

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
      <span className="text-sm text-neutral-600 dark:text-neutral-400">
        Speed:
      </span>
      <div className="flex gap-1">
        {speeds.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onSpeedChange(value)}
            className={`
              px-2 py-1 text-sm rounded-md transition-colors
              ${speed === value 
                ? 'bg-blue-500 text-white' 
                : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-blue-100 dark:hover:bg-neutral-600'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}; 