import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
}

export function ThemeToggle({ size = 'icon', variant = 'ghost' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </Button>
  );
}
