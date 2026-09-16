import React from 'react';
import { Input } from '../../common/Input';
import type { ConfigFormProps } from '../configForm';

export const PomodoroConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  return (
    <div className="space-y-4">
      <Input
        label="Focus Duration (Minutes)"
        type="number"
        min="1"
        max="120"
        value={config.focusDurationMinutes || 25}
        onChange={(e) => setConfig({ ...config, focusDurationMinutes: parseInt(e.target.value) || 25 })}
      />
      <Input
        label="Short Break Duration (Minutes)"
        type="number"
        min="1"
        max="30"
        value={config.shortBreakDurationMinutes || 5}
        onChange={(e) => setConfig({ ...config, shortBreakDurationMinutes: parseInt(e.target.value) || 5 })}
      />
      <Input
        label="Long Break Duration (Minutes)"
        type="number"
        min="1"
        max="60"
        value={config.longBreakDurationMinutes || 15}
        onChange={(e) => setConfig({ ...config, longBreakDurationMinutes: parseInt(e.target.value) || 15 })}
      />
    </div>
  );
};
