import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background text-foreground">
        <div className="max-w-[420px] w-full text-center">
          <div className="font-plex text-[24px] font-semibold tracking-[-0.02em] mb-2">
            Something broke.
          </div>
          <p className="font-mono-plex text-[13px] text-muted-foreground mb-6 leading-[1.6]">
            Clerk hit an unexpected error. Reloading usually fixes it. If it
            keeps happening, your tasks are still safe in the cloud.
          </p>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
            className="rounded-full bg-foreground text-background font-plex text-[14px] font-medium px-6 py-3 hover:opacity-90 transition-opacity"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
