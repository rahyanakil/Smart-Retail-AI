import { useTheme } from '@/components/theme-provider';

export interface ChartColors {
  primary: string;
  primaryOpacity: number;
  grid: string;
  tick: string;
  barMuted: string;
}

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  return {
    primary: dark ? 'hsl(217.2 91.2% 59.8%)' : 'hsl(221.2 83.2% 53.3%)',
    primaryOpacity: dark ? 0.2 : 0.15,
    grid: dark ? 'hsl(217.2 32.6% 16%)' : 'hsl(214.3 31.8% 91.4%)',
    tick: dark ? 'hsl(215 20.2% 65.1%)' : 'hsl(215.4 16.3% 46.9%)',
    barMuted: dark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.18)',
  };
}
