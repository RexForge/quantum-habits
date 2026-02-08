import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                    <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
                    <p className="text-sm mb-2">{this.state.error && this.state.error.toString()}</p>
                    <details className="text-xs opacity-75">
                        <summary>Stack Trace</summary>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-bold transition-colors"
                    >
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
