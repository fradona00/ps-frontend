"use client"

import { useState } from "react"
import PaymentForm from "./PaymentForm"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { CheckCircle } from "lucide-react"

export default function PaymentWrapper({ bookingData, onBookingComplete, onCancel, loadFunction }) {
  const [paymentStatus, setPaymentStatus] = useState("pending") // pending, processing, success, error
  const [paymentResult, setPaymentResult] = useState(null)

  const handlePaymentSuccess = async (paymentIntent) => {
    setPaymentStatus("success")
    setPaymentResult(paymentIntent)

    // Qui puoi chiamare l'API per confermare la prenotazione
    try {
      // Esempio di chiamata per confermare la prenotazione
      // const response = await request({
      //   url: "/api/bookings/confirm",
      //   method: "POST",
      //   body: {
      //     paymentIntentId: paymentIntent.id,
      //     bookingData: bookingData,
      //   },
      //   loadFunction,
      // })

      onBookingComplete && onBookingComplete(paymentIntent)
    } catch (error) {
      console.error("Errore nella conferma della prenotazione:", error)
    }
  }

  const handlePaymentError = (error) => {
    setPaymentStatus("error")
    console.error("Errore nel pagamento:", error)
  }

  if (paymentStatus === "success") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Pagamento completato!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">La tua prenotazione è stata confermata con successo.</p>
            <div className="bg-green-50 p-3 rounded-md text-sm">
              <p>
                <strong>ID Transazione:</strong> {paymentResult?.id}
              </p>
              <p>
                <strong>Importo:</strong> €{(paymentResult?.amount / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <PaymentForm
      bookingData={bookingData}
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentError={handlePaymentError}
      onCancel={onCancel}
      loadFunction={loadFunction}
    />
  )
}
