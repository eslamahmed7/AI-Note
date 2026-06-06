import React from 'react';
import toast from 'react-hot-toast';

export type AlarmTone = 'digital' | 'chime' | 'soothing' | 'retro' | 'pulse' | 'gentle' | 'urgent' | 'echo' | 'crystal';

export interface AlarmSettings {
  volume: number;
  tone: AlarmTone;
  loop: boolean;
}

export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
  volume: 0.8,
  tone: 'digital',
  loop: true,
};

let activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
let activeInterval: any = null;
let audioContextInstance: AudioContext | null = null;

// Play a premium single chime arpeggio (C6 -> E6 -> G6)
export function playNotificationSound(volume: number = 0.8) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Chord arpeggio: C6 = 1046.50 Hz, E6 = 1318.51 Hz, G6 = 1567.98 Hz
    const notes = [1046.50, 1318.51, 1567.98];
    const startTime = ctx.currentTime;
    
    notes.forEach((freq, index) => {
      const time = startTime + index * 0.08;
      const osc = oscHelper(ctx, freq, 'sine', time, volume * 0.3, 0.6); // Increased volume
      if (osc) activeOscillators.push(osc);
    });
  } catch (error) {
    console.error('Failed to play notification sound', error);
  }
}

function oscHelper(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  time: number,
  vol: number,
  duration: number
) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + duration);
    return { osc, gain };
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function stopAlarmSound() {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
  activeOscillators.forEach(({ osc, gain }) => {
    try {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    } catch (e) {
      // already stopped/disconnected
    }
  });
  activeOscillators = [];
}

export function startAlarmSound(volume: number = 0.8, tone: AlarmTone = 'digital') {
  stopAlarmSound(); // Clear any previous active alarms

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!audioContextInstance || audioContextInstance.state === 'closed') {
      audioContextInstance = new AudioContextClass();
    }
    const ctx = audioContextInstance;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const playTone = () => {
      const startTime = ctx.currentTime;
      
      if (tone === 'digital') {
        // Digital Alarm: double beep (A5)
          const frequencies = [440, 330, 440, 330, 440];
          frequencies.forEach((freq, index) => {
            const time = startTime + index * 0.15;
            const osc = oscHelper(ctx, freq, 'square', time, volume * 0.3, 0.1); // Increased volume
            if (osc) activeOscillators.push(osc);
          });
      } else if (tone === 'chime') {
        // Chime Alarm: C-major arpeggio (C6, E6, G6)
        const frequencies = [1046.50, 1318.51, 1567.98];
        frequencies.forEach((freq, index) => {
          const time = startTime + index * 0.08;
          const osc = oscHelper(ctx, freq, 'sine', time, volume * 0.5, 0.6); // Increased volume
          if (osc) activeOscillators.push(osc);
        });
      } else if (tone === 'soothing') {
        // Soothing sweep (triangle C5 -> C6 sweep)
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, startTime);
          osc.frequency.exponentialRampToValueAtTime(1046.50, startTime + 0.4);
          
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.1); // Increased volume
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + 0.8);
          
          activeOscillators.push({ osc, gain });
        } catch (e) {
          console.error(e);
        }
      } else if (tone === 'retro') {
        // Retro: bouncy retro sequence
        const notes = [600, 800, 1000, 1200];
        notes.forEach((freq, index) => {
          const osc = oscHelper(ctx, freq, 'triangle', startTime + index * 0.06, volume * 0.4, 0.15); // Increased volume
          if (osc) activeOscillators.push(osc);
        });
      } else if (tone === 'pulse') {
        // Pulse: pulsing alarm sound
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, startTime);
          osc.frequency.linearRampToValueAtTime(150, startTime + 0.3);
          
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.05); // Increased volume
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + 0.35);
          
          activeOscillators.push({ osc, gain });
        } catch (e) {
          console.error(e);
        }
      } else if (tone === 'gentle') {
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        frequencies.forEach((freq, index) => {
          const time = startTime + index * 0.2;
          const osc = oscHelper(ctx, freq, 'sine', time, volume * 0.4, 0.8);
          if (osc) activeOscillators.push(osc);
        });
      } else if (tone === 'urgent') {
        const frequencies = [880, 1046.50, 880, 1046.50];
        frequencies.forEach((freq, index) => {
          const time = startTime + index * 0.1;
          const osc = oscHelper(ctx, freq, 'sawtooth', time, volume * 0.3, 0.1);
          if (osc) activeOscillators.push(osc);
        });
      } else if (tone === 'echo') {
        const freq = 659.25; // E5
        [0, 0.3, 0.6].forEach((delay, index) => {
          const time = startTime + delay;
          const osc = oscHelper(ctx, freq, 'sine', time, volume * (0.4 / (index + 1)), 0.5);
          if (osc) activeOscillators.push(osc);
        });
      } else if (tone === 'crystal') {
        const frequencies = [1046.50, 1567.98, 2093.00]; // C6, G6, C7
        frequencies.forEach((freq, index) => {
          const time = startTime + index * 0.1;
          const osc = oscHelper(ctx, freq, 'sine', time, volume * 0.3, 1.0);
          if (osc) activeOscillators.push(osc);
        });
      }
    };

    playTone();
    activeInterval = setInterval(() => {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      playTone();
    }, 1500);
  } catch (error) {
    console.error('Failed to start alarm sound:', error);
  }
}

// Play a single-shot preview of any tone at the specified volume
export function playTonePreview(volume: number = 0.8, tone: AlarmTone = 'digital') {
  stopAlarmSound(); // Stop any looping alarms first

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const startTime = ctx.currentTime;
    
    if (tone === 'digital') {
      // Play a short preview beep
      oscHelper(ctx, 880, 'square', startTime, volume * 0.2, 0.25);
    } else if (tone === 'chime') {
      const frequencies = [1046.50, 1318.51, 1567.98];
      frequencies.forEach((freq, index) => {
        oscHelper(ctx, freq, 'sine', startTime + index * 0.08, volume * 0.15, 0.6);
      });
    } else if (tone === 'soothing') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, startTime);
      osc.frequency.exponentialRampToValueAtTime(1046.50, startTime + 0.4);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume * 0.2, startTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.8);
    } else if (tone === 'retro') {
      const notes = [600, 800, 1000, 1200];
      notes.forEach((freq, index) => {
        oscHelper(ctx, freq, 'triangle', startTime + index * 0.06, volume * 0.2, 0.15);
      });
    } else if (tone === 'pulse') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, startTime);
      osc.frequency.linearRampToValueAtTime(150, startTime + 0.3);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume * 0.25, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    }
  } catch (error) {
    console.error('Failed to play tone preview:', error);
  }
}

// Request permission for system notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('System notifications are not supported by this browser.');
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

// Show a system notification + toast
export function triggerNotification(title: string, body: string, isRTL: boolean = false) {
  // Show customized premium toast alert
  toast(
    () => (
      <div className={`flex flex-col gap-1 ${isRTL ? 'text-right' : 'text-left'}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        <span className="font-bold text-sm text-neutral-100">{title}</span>
        <span className="text-xs text-neutral-400">{body}</span>
      </div>
    ),
    {
      duration: 6000,
      icon: '🔔',
    }
  );
  
  // Show native system notification if permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'task-reminder',
      });
    } catch (e) {
      console.error('Failed to trigger native Notification:', e);
    }
  }
}
