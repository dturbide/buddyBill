import EmailVerificationClientBoundary from "@/components/email-verification-client-boundary"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// A fallback component for Suspense, matching the general structure
function EmailVerificationLoadingSkeleton() {
  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col">
      <header className="p-4 flex items-center border-b sticky top-0 bg-white z-10">
        <Skeleton className="h-6 w-2/3 mx-auto" /> {/* Placeholder for title */}
      </header>
      <div className="flex-grow overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-6">
        <Skeleton className="h-20 w-20 rounded-full" /> {/* Placeholder for icon */}
        <div className="space-y-2 w-full">
          <Skeleton className="h-8 w-3/4 mx-auto" /> {/* Placeholder for heading */}
          <Skeleton className="h-4 w-full mx-auto" /> {/* Placeholder for text line 1 */}
          <Skeleton className="h-4 w-5/6 mx-auto" /> {/* Placeholder for text line 2 */}
          <Skeleton className="h-4 w-4/5 mx-auto" /> {/* Placeholder for text line 3 */}
        </div>
        <div className="w-full space-y-3 pt-4">
          <Skeleton className="h-10 w-full" /> {/* Placeholder for button */}
          <Skeleton className="h-10 w-full" /> {/* Placeholder for button */}
          <Skeleton className="h-10 w-full" /> {/* Placeholder for button */}
        </div>
        <Skeleton className="h-3 w-full mt-4" /> {/* Placeholder for small text */}
      </div>
    </div>
  )
}

export default function EmailVerificationPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
      <Suspense fallback={<EmailVerificationLoadingSkeleton />}>
        <EmailVerificationClientBoundary />
      </Suspense>
    </div>
  )
}
