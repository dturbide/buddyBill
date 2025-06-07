import PaymentFormScreen from "@/components/payment-form-screen"
import { Suspense } from 'react'

function LoadingPayment() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Chargement du formulaire de paiement...</p>
      </div>
    </div>
  )
}

export default function AddPaymentPage() {
  return (
    <Suspense fallback={<LoadingPayment />}>
      <PaymentFormScreen />
    </Suspense>
  )
}
