import { Theme, useMediaQuery } from '@material-ui/core';

/**
 * true when viewport width is below the "sm" breakpoint (≈ phones).
 */
export function useIsMobile(): boolean {
  return useMediaQuery((theme: Theme) => theme.breakpoints.down('xs'));
}

/**
 * true when viewport width is below the "md" breakpoint (≈ phones + small tablets).
 * Use this for layout decisions that should also collapse on tablets in portrait mode.
 */
export function useIsCompact(): boolean {
  return useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
}

/**
 * true when viewport width is "md" and above (≈ desktop/laptop).
 */
export function useIsDesktop(): boolean {
  return useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
}
