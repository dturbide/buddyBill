"use client"

import { useSearchParams } from "next/navigation"
import EmailVerificationScreen from "@/components/email-verification-screen"
import { Skeleton } from "@/components/ui/skeleton" // For consistency if needed

// This component acts as the boundary that uses client-side hooks like useSearchParams
// and then passes data as props to the actual screen component.

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

export default function EmailVerificationClientBoundary() {
  const searchParams = useSearchParams()
  const emailFromParams = searchParams.get("email")

  // You could also have a more specific loading state here if searchParams are not immediately available,
  // but Suspense on the page level should handle the initial load.
  if (searchParams === null) {
    // Or some other check if params are not ready
    return <EmailVerificationLoadingSkeleton />
  }

  return <EmailVerificationScreen emailFromParams={emailFromParams} />
}
