import React from 'react';
import { Music } from 'lucide-react';

export default function NoteCounterHUD({ count, userPlan = 'free' }) {
  // Calculate display value based on user plan
  const displayCount = userPlan === 'premium' 
    ? count // Premium users see cumulative count
    : Math.max(0, 5000 - count); // Free users see countdown from 5000

  // Format the count to always have 5 digits with leading zeros
  const formattedCount = String(displayCount).padStart(5, '0');

  // Color coding based on plan and remaining notes
  const getCounterColor = () => {
    if (userPlan === 'premium') {
      return 'text-purple-300'; // Purple for premium users
    } else {
      // Color coding for free users based on remaining notes
      if (displayCount <= 0) return 'text-red-300'; // Red when locked out
      if (displayCount <= 500) return 'text-orange-300'; // Orange when getting low
      return 'text-cyan-300'; // Default cyan for free users
    }
  };

  const getGlowColor = () => {
    if (userPlan === 'premium') {
      return 'rgba(196, 181, 253, 0.5)'; // Purple glow for premium
    } else {
      if (displayCount <= 0) return 'rgba(252, 165, 165, 0.5)'; // Red glow when locked out
      if (displayCount <= 500) return 'rgba(253, 186, 116, 0.5)'; // Orange glow when low
      return 'rgba(0, 255, 255, 0.5)'; // Cyan glow for free users
    }
  };

  return (
    <div className="absolute top-8 left-6 flex items-center gap-1.5 pointer-events-none p-2">
      <Music 
        className={`w-3.5 h-3.5 ${userPlan === 'premium' ? 'text-purple-400' : 'text-cyan-400'}`}
        style={{ filter: `drop-shadow(0 0 3px ${getGlowColor()})` }}
      />
      <p
        className={`font-mono text-sm ${getCounterColor()} tracking-wider`}
        style={{ textShadow: `0 0 4px ${getGlowColor()}` }}
      >
        {formattedCount}
      </p>
      {userPlan === 'free' && (
        <span className="text-xs text-slate-400 ml-1">
          {displayCount > 0 ? 'left' : 'limit'}
        </span>
      )}
    </div>
  );
}