'use client';

import type { ReactNode } from 'react';
import { Component } from 'react';

type ThreeErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  label?: string;
};

type ThreeErrorBoundaryState = {
  hasError: boolean;
  message: string | null;
};

export class ThreeErrorBoundary extends Component<
  ThreeErrorBoundaryProps,
  ThreeErrorBoundaryState
> {
  state: ThreeErrorBoundaryState = { hasError: false, message: null };

  static getDerivedStateFromError(error: unknown): ThreeErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error(`[three] Render error${this.props.label ? ` (${this.props.label})` : ''}:`, error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return this.props.fallback;
  }
}

