import { useState, useEffect } from 'react';

function formatTime(ms) {
  if (ms <= 0) {
    return { hours: '00', minutes: '00', seconds: '00', expired: true };
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return { hours, minutes, seconds, expired: false };
}

function CountdownTimer({ targetAt, label, expiredLabel, expiredText }) {
  const [remaining, setRemaining] = useState(() => {
    const target = targetAt instanceof Date ? targetAt : new Date(targetAt);
    return formatTime(target.getTime() - Date.now());
  });

  useEffect(() => {
    const target = targetAt instanceof Date ? targetAt : new Date(targetAt);

    const tick = () => {
      setRemaining(formatTime(target.getTime() - Date.now()));
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [targetAt]);

  if (remaining.expired) {
    return (
      <div className="countdown countdown--expired">
        <p className="countdown-label">{expiredLabel || 'Terminé'}</p>
        {expiredText && <p className="countdown-expired-text">{expiredText}</p>}
      </div>
    );
  }

  return (
    <div className="countdown">
      <p className="countdown-label">{label}</p>
      <div className="countdown-digits">
        <div className="countdown-unit">
          <span className="countdown-value">{remaining.hours}</span>
          <span className="countdown-name">h</span>
        </div>
        <span className="countdown-separator">:</span>
        <div className="countdown-unit">
          <span className="countdown-value">{remaining.minutes}</span>
          <span className="countdown-name">min</span>
        </div>
        <span className="countdown-separator">:</span>
        <div className="countdown-unit">
          <span className="countdown-value">{remaining.seconds}</span>
          <span className="countdown-name">sec</span>
        </div>
      </div>
    </div>
  );
}

export default CountdownTimer;
