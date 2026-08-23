import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/presentation/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

// Last-resort catch for uncaught render errors anywhere in the route tree.
// React unmounts the whole app on an uncaught error otherwise, leaving a
// blank screen with no way to recover short of the user manually reloading.
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled error in component tree', error, errorInfo)
  }

  handleReload = () => {
    window.location.assign('/')
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-svh items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>
                <h1>Something went wrong</h1>
              </CardTitle>
              <CardDescription>
                An unexpected error occurred. Please reload the page and try
                again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={this.handleReload}>Reload</Button>
            </CardContent>
          </Card>
        </main>
      )
    }

    return this.props.children
  }
}
