'use client';

import type { ReactNode } from 'react';
import { Component } from 'react';

type SceneErrorBoundaryProps = {
  children: ReactNode;
};

type SceneErrorBoundaryState = {
  hasError: boolean;
  message: string | null;
};

export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { hasError: false, message: null };

  static getDerivedStateFromError(error: unknown): SceneErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('3D scene crashed:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
          <div className="text-sm font-medium text-zinc-100">
            The 3D scene crashed
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Try reloading the page. If the problem persists, check the console
            for details.
          </div>
          {this.state.message ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-300">
              {this.state.message}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

