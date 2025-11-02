"use client"

import { useState, useEffect, useRef } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Separator } from "./ui/separator"
import { CreditCard, Lock, AlertCircle, Clock, Smartphone } from "lucide-react"
import Cookies from "js-cookie"
import { decodeJWT } from "../lib/jwtDecode"
import { request } from "../utils/request"

// Inizializza Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_your_key_here")

// Stili per Stripe Elements
const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSmoothing: "antialiased",
    },
    invalid: {
      color: "#9e2146",
      iconColor: "#9e2146",
    },
  },
  hidePostalCode: true,
}

// Form di pagamento unificato
function UnifiedPaymentForm({
  bookingData,
  reservationData,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  loadFunction,
}) {
  const stripe = useStripe()
  const elements = useElements()
  const paypalRef = useRef()

  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
  })

  const [timeLeft, setTimeLeft] = useState(10 * 60) // 10 minuti in secondi
  const [timerExpired, setTimerExpired] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("paypal") // "card", "googlepay", "applepay", "paypal"
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [isDigitalWalletProcessing, setIsDigitalWalletProcessing] = useState(false)
  const [canMakeGooglePayPayment, setCanMakeGooglePayPayment] = useState(false)
  const [canMakeApplePayPayment, setCanMakeApplePayPayment] = useState(false)
  const [paymentRequest, setPaymentRequest] = useState(null)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [paypalReady, setPaypalReady] = useState(false)
  const [paymentStarted, setPaymentStarted] = useState(false)

  // Valori sicuri con fallback
  const totalAmount = bookingData?.amount || 0
  const subtotal = bookingData?.subtotal || 0
  const courtName = bookingData?.courtName || "Campo selezionato"
  const bookingDate = bookingData?.date || new Date()
  const startTime = bookingData?.startTime || "00:00"
  const endTime = bookingData?.endTime || "01:00"
  const duration = bookingData?.duration || 60
  
  var bearer;

  useEffect(() => {
    const userData = Cookies.get("sessionCookie")
    if (userData) {
      try {
        const parsedData = JSON.parse(userData)
        const decodedToken = decodeJWT(parsedData.token)
        bearer = parsedData.token;
        if (decodedToken.payload) {
          setCustomerInfo({
            name: decodedToken.payload.name + " " + decodedToken.payload.surname || "",
            email: decodedToken.payload.email || "",
          })
        }
      } catch (error) {
        Cookies.remove("sessionCookie") // Rimuovi il cookie se c'è un errore
      }
    }
    window.addEventListener('unload', function () {
      const data = JSON.stringify({
        orderId: reservationData?.orderId,
        token:bearer
      });
      navigator.sendBeacon('/api/services/unloadOrder', data);
    });
  }, [])

  // Carica PayPal SDK
  useEffect(() => {
    const loadPayPalScript = () => {
      if (window.paypal) {
        setPaypalLoaded(true)
        return
      }

      const script = document.createElement("script")
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "YOUR_CLIENT_ID"}&currency=EUR&intent=authorize`
      script.async = true
      script.onload = () => {
        setPaypalLoaded(true)
      }
      script.onerror = () => {
        console.error("Errore nel caricamento di PayPal SDK")
      }
      document.body.appendChild(script)
    }

    loadPayPalScript()
  }, [])

  // Controlla la disponibilità di Google Pay e Apple Pay e inizializza PayPal
  useEffect(() => {
    const checkDigitalWallets = async () => {
      if (!stripe || !totalAmount) return

      try {
        // Crea il Payment Request
        const pr = stripe.paymentRequest({
          country: "IT",
          currency: "eur",
          total: {
            label: "Prenotazione Campo",
            amount: totalAmount,
          },
          requestPayerName: true,
          requestPayerEmail: true,
        })

        // Controlla la disponibilità
        const canMakePaymentResult = await pr.canMakePayment()

        if (canMakePaymentResult) {
          setCanMakeGooglePayPayment(canMakePaymentResult.googlePay || false)
          setCanMakeApplePayPayment(canMakePaymentResult.applePay || false)
          setPaymentRequest(pr) // Salva il payment request per uso successivo

          console.log("Digital wallets availability:", {
            googlePay: canMakePaymentResult.googlePay,
            applePay: canMakePaymentResult.applePay,
          })
        } else {
          console.log("No digital wallets available")
          setCanMakeGooglePayPayment(false)
          setCanMakeApplePayPayment(false)
        }
      } catch (error) {
        console.log("Errore nel controllo digital wallets:", error)
        setCanMakeGooglePayPayment(false)
        setCanMakeApplePayPayment(false)
      }

      // Inizializza PayPal se disponibile
      if (paypalLoaded && window.paypal &&  window.paypal.Buttons.instances.length == 0 && paypalRef.current && totalAmount > 0 && paymentMethod === "paypal") {
        try {
          if (!paymentStarted) {
            paypalRef.current.innerHTML = ""
          }

          window.paypal
            .Buttons({
              createOrder: (data, actions) => {
                if (!reservationData || !reservationData.orderId || !totalAmount) {
                  throw new Error("Dati di prenotazione non validi per PayPal")
                }
                setPaymentStarted(true);
                return actions.order.create({
                  purchase_units: [
                    {
                      amount: {
                        value: (totalAmount / 100).toFixed(2),
                        currency_code: "EUR",
                      },
                      description: `Prenotazione ${courtName} - ${bookingDate.toLocaleDateString("it-IT")}`,
                    },
                  ],
                  intent: "AUTHORIZE",
                })
              },
              onApprove: async (data, actions) => {
                try {
                  loadFunction(true)
                  setIsProcessing(true)
                  setPaypalLoaded(false)

                  const authorization = await actions.order.authorize()
                  setPaymentStarted(false);
                  const mockPaymentIntent = {
                    id: data.orderID,
                    status: "requires_capture",
                    payment_method: { type: "paypal" },
                    paypal: true,
                    metadata: {
                      paypal_authorization_id: authorization.purchase_units[0].payments.authorizations[0].id,
                      paypal_order_id: data.orderID,
                    },
                  }
                  onPaymentSuccess && onPaymentSuccess(mockPaymentIntent)
                } catch (error) {
                  console.error("Errore PayPal:", error)
                  setPaymentError(error.message || "Errore durante il pagamento PayPal")
                  alert("Errore durante il pagamento PayPal, riprova piu tardi.");
                  onPaymentError && onPaymentError(error)
                  loadFunction && loadFunction(false)
                } finally {
                  setIsProcessing(false)
                }
              },
              onError: (err) => {
                console.error("Errore PayPal:", err)
                setPaymentError("Errore durante il pagamento PayPal")
                alert("Errore durante il pagamento PayPal, riprova piu tardi.");
                onPaymentError && onPaymentError(err)
                loadFunction && loadFunction(false)
              },
              onCancel: (data) => {
                console.log("Pagamento PayPal annullato:", data)
                setPaymentError("Pagamento annullato")
                loadFunction && loadFunction(false)
              },
              style: {
                layout: "horizontal",
                color: "blue",
                shape: "rect",
                label: "pay",
                height: 45,
              },
            })
            .render(paypalRef.current)
            .then(() => {
              setPaypalReady(true)
            })
        } catch (error) {
          console.error("Errore nell'inizializzazione PayPal:", error)
        }
      }
    }

    checkDigitalWallets()
  }, [stripe, totalAmount, paypalLoaded, reservationData, onPaymentSuccess, onPaymentError, loadFunction])

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      setTimerExpired(true)
      onCancel && onCancel()
      onPaymentError && onPaymentError({ message: "Tempo scaduto per completare la transazione" })
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerExpired(true)
          onCancel && onCancel()
          onPaymentError && onPaymentError({ message: "Tempo scaduto per completare la transazione" })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onPaymentError])

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100)
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) {
      return `${mins} minuti`
    } else if (mins === 0) {
      return hours === 1 ? "1 ora" : `${hours} ore`
    } else {
      return `${hours}h ${mins}m`
    }
  }

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Gestione pagamento con carta di credito
  const handleCardPayment = async (event) => {
    event.preventDefault()

    if (!stripe || !elements || !reservationData?.clientSecret) {
      return
    }

    // Validazione form
    if (!customerInfo.name || !customerInfo.email) {
      setPaymentError("Nome completo e email sono obbligatori")
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    const cardElement = elements.getElement(CardElement)

    loadFunction && loadFunction(true)
    // Conferma il pagamento usando il clientSecret esistente (SENZA CAPTURE)
    const { error, paymentIntent } = await stripe.confirmCardPayment(reservationData.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: customerInfo.name,
          email: customerInfo.email,
        },
      },
    })

    if (error) {
      alert("Errore nel pagamento: " + error.message)
      console.error("Errore nel pagamento:", error)
      setPaymentError(error.message)
      onPaymentError && onPaymentError(error)
      setIsProcessing(false)
      loadFunction && loadFunction(false)
    } else if (paymentIntent.status === "requires_capture") {
      // Preautorizzazione riuscita - la capture verrà fatta dal backend
      console.log("Preautorizzazione completata con successo:", paymentIntent)
      onPaymentSuccess && onPaymentSuccess(paymentIntent)
    } else {
      console.error("Stato pagamento inaspettato:", paymentIntent.status)
      setPaymentError("Stato del pagamento non riconosciuto")
      setIsProcessing(false)
      loadFunction && loadFunction(false)
    }
  }

  // Gestione pagamento con Google Pay / Apple Pay
  const handleDigitalWalletPayment = async () => {
    if (!stripe || !reservationData?.clientSecret || !paymentRequest) {
      setPaymentError("Servizio di pagamento non disponibile")
      return
    }

    if (!customerInfo.name || !customerInfo.email) {
      setPaymentError("Nome completo e email sono obbligatori")
      return
    }

    // Verifica nuovamente la disponibilità prima di mostrare
    try {
      const canMakePaymentResult = await paymentRequest.canMakePayment()
      if (!canMakePaymentResult) {
        setPaymentError("Metodo di pagamento non disponibile su questo dispositivo")
        return
      }
    } catch (error) {
      console.error("Errore nella verifica disponibilità:", error)
      setPaymentError("Errore nella verifica del metodo di pagamento")
      return
    }

    setIsDigitalWalletProcessing(true)
    setPaymentError(null)
    loadFunction && loadFunction(true)

    // Aggiorna il totale nel payment request
    paymentRequest.update({
      total: {
        label: `Prenotazione - ${courtName}`,
        amount: totalAmount,
      },
    })

    // Rimuovi eventuali listener precedenti
    paymentRequest.off("paymentmethod")

    // Gestisce l'evento di pagamento
    paymentRequest.on("paymentmethod", async (ev) => {
      try {
        console.log("Payment method received:", ev.paymentMethod)

        // Conferma il pagamento con il metodo di pagamento digitale
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          reservationData.clientSecret,
          {
            payment_method: ev.paymentMethod.id,
          },
          { handleActions: false },
        )

        if (error) {
          console.error("Errore nella conferma pagamento:", error)
          ev.complete("fail")
          setPaymentError(error.message)
          onPaymentError && onPaymentError(error)
        } else if (paymentIntent.status === "requires_capture") {
          ev.complete("success")
          console.log("Pagamento digitale completato con successo:", paymentIntent)
          onPaymentSuccess && onPaymentSuccess(paymentIntent)
        } else {
          console.error("Stato pagamento inaspettato:", paymentIntent.status)
          ev.complete("fail")
          setPaymentError("Stato del pagamento non riconosciuto")
        }
      } catch (error) {
        console.error("Errore durante il pagamento digitale:", error)
        ev.complete("fail")
        setPaymentError("Errore durante il pagamento")
        onPaymentError && onPaymentError(error)
      } finally {
        setIsDigitalWalletProcessing(false)
        loadFunction && loadFunction(false)
      }
    })

    // Gestisce la cancellazione
    paymentRequest.on("cancel", () => {
      console.log("Pagamento annullato dall'utente")
      setIsDigitalWalletProcessing(false)
      loadFunction && loadFunction(false)
    })

    try {
      // Mostra il dialog di pagamento
      console.log("Showing payment request...")
      paymentRequest.show()
    } catch (error) {
      console.error("Errore nel mostrare payment request:", error)
      setPaymentError("Errore durante l'apertura del wallet digitale")
      setIsDigitalWalletProcessing(false)
      loadFunction && loadFunction(false)
    }
  }

  const handleSubmit = (event) => {
    if (paymentMethod === "card") {
      handleCardPayment(event)
    } else if (paymentMethod === "paypal") {
      event.preventDefault()
      // PayPal gestisce il submit tramite i suoi bottoni
    } else {
      event.preventDefault()
      handleDigitalWalletPayment()
    }
  }

  const isFormValid = customerInfo.name && customerInfo.email && !timerExpired

  // Determina quali metodi di pagamento mostrare
  const availablePaymentMethods = [
    { id: "card", label: "Carta di Credito", description: "Visa, Mastercard, etc.", icon: CreditCard },
    {
      id: "paypal",
      label: "PayPal",
      description: "Paga con PayPal",
      icon: () => (
        <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">P</span>
        </div>
      ),
    },
  ]

  if (canMakeGooglePayPayment) {
    availablePaymentMethods.push({
      id: "googlepay",
      label: "Google Pay",
      description: "Pagamento rapido",
      icon: Smartphone,
    })
  }

  if (canMakeApplePayPayment) {
    availablePaymentMethods.push({
      id: "applepay",
      label: "Apple Pay",
      description: "Touch ID / Face ID",
      icon: Smartphone,
    })
  }

  // Se non ci sono dati di prenotazione validi, mostra un messaggio di errore
  if (!bookingData || !totalAmount || totalAmount <= 0) {
    return (
      <Card className="w-full rounded-3xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Errore: Dati di prenotazione non validi. Riprova a effettuare la prenotazione.</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onCancel} variant="outline" className="w-full bg-transparent">
            Torna alla prenotazione
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full rounded-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Completa il pagamento
        </CardTitle>
        <div
          className={`flex items-center justify-center gap-2 mt-2 p-2 rounded-md ${
            timeLeft <= 60
              ? "bg-red-50 text-red-700"
              : timeLeft <= 180
                ? "bg-yellow-50 text-yellow-700"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span className="font-mono text-sm">
            Tempo rimanente per completare la transazione: {formatTime(timeLeft)}
          </span>
        </div>
        {timerExpired && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Tempo scaduto! La transazione è stata annullata.</span>
            </div>
          </div>
        )}
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Riepilogo prenotazione */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">Dettagli prenotazione</h3>
            <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Data:</span>
                <span>{bookingDate.toLocaleDateString("it-IT")}</span>
              </div>
              <div className="flex justify-between">
                <span>Orario:</span>
                <span>
                  {startTime} - {endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Durata:</span>
                <span>{formatDuration(duration)}</span>
              </div>
              <div className="flex justify-between">
                <span>Campo:</span>
                <span>{courtName}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotale:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {reservationData?.promoCode && (
                <div className="flex justify-between ">
                  <span>Codice Sconto:</span>
                  <span className=" text-green-500">{reservationData.promoCode.discount}</span>
                </div>
              )}
              {reservationData?.reservationId && (
                <div className="flex justify-between">
                  <span>ID Prenotazione:</span>
                  <span className="text-xs">{reservationData.reservationId}</span>
                </div>
              )}
              
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Totale:</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Informazioni sicurezza pagamento */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Lock className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 mb-1">Pagamento 100% Sicuro</h4>
                <p className="text-sm text-green-700 leading-relaxed md:max-w-full max-w-[30ch]">
                  I tuoi dati di pagamento sono protetti con <strong>crittografia SSL a 256-bit</strong> e gestiti
                  direttamente da <strong>Stripe</strong> e <strong>PayPal</strong>, processori di pagamento tra i più
                  sicuri al mondo. Non memorizziamo mai i dati della tua carta di credito sui nostri server.
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-green-600">
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    SSL Certificato
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold">Stripe</span>
                    Powered
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold">PayPal</span>
                    Secure
                  </span>
                  <span>PCI DSS Compliant</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informazioni cliente */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">I tuoi dati</h3>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Nome completo *</Label>
                <Input
                  id="customer-name"
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => handleCustomerInfoChange("name", e.target.value)}
                  placeholder="Mario Rossi"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email">Email *</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => handleCustomerInfoChange("email", e.target.value)}
                placeholder="mario.rossi@email.com"
                required
                readOnly
              />
            </div>
          </div>



          {/* Selezione metodo di pagamento */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Metodo di pagamento</h3>
            <div
              className={`grid gap-3 ${availablePaymentMethods.length <= 2 ? "grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}
            >
              {availablePaymentMethods.map((method) => {
                const IconComponent = method.icon
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setIsCardComplete(false);
                      setPaymentMethod(method.id)
                    }}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === method.id
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {method.id === "googlepay" ? (
                      <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-green-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">G</span>
                      </div>
                    ) : method.id === "applepay" ? (
                      <div className="h-6 w-6 bg-black rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">🍎</span>
                      </div>
                    ) : (
                      <IconComponent className="h-6 w-6" />
                    )}
                    <span className="text-sm font-medium">{method.label}</span>
                    <span className="text-xs text-gray-500">{method.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Informazioni carta di credito (solo se carta selezionata) */}
          {paymentMethod === "card" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700">Informazioni carta di credito</h3>
              <div className="border rounded-md p-3 bg-white">
                <CardElement options={cardElementOptions}
                 onChange={(event) => {
                  // event.complete = true quando tutti i campi necessari sono compilati correttamente
                  setIsCardComplete(event.complete);
                }} />
              </div>
            </div>
          )}

          {/* PayPal Buttons (solo se PayPal selezionato) */}
          
            <div className={"space-y-4 "+(paymentMethod !== "paypal" ? "hidden" : "")}>
              <h3 className="font-semibold text-sm text-gray-700">Pagamento PayPal</h3>
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">P</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Pagamento con PayPal</h4>
                    <p className="text-sm text-blue-700">
                      Verrai reindirizzato su PayPal per completare il pagamento in modo sicuro. Puoi usare il tuo
                      account PayPal o una carta di credito.
                    </p>
                  </div>
                </div>
                
                  <div ref={paypalRef} className={paypalLoaded?"paypal-buttons-container":"hidden"}>
                    {!paypalLoaded && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-blue-600 mt-2">Caricamento PayPal...</p>
                    </div>
                    )}
                  </div>
              </div>
            </div>

          {/* Informazioni Google Pay (solo se Google Pay selezionato) */}
          {paymentMethod === "googlepay" && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-green-500 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">G</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Pagamento con Google Pay</h4>
                  <p className="text-sm text-gray-700">
                    Usa le carte salvate nel tuo account Google per un pagamento rapido e sicuro. Potrai confermare con
                    la tua impronta digitale o PIN.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Informazioni Apple Pay (solo se Apple Pay selezionato) */}
          {paymentMethod === "applepay" && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 bg-black rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">🍎</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Pagamento con Apple Pay</h4>
                  <p className="text-sm text-gray-700">
                    Usa Touch ID, Face ID o il tuo passcode per completare il pagamento in modo sicuro con le carte
                    salvate nel tuo Wallet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messaggio di errore */}
          {paymentError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Informazioni sicurezza */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock className="h-3 w-3" />
            <span>
              I tuoi dati di pagamento sono protetti con crittografia SSL
              {(paymentMethod === "googlepay" || paymentMethod === "applepay") &&
                " e gestiti direttamente dal tuo wallet digitale"}
              {paymentMethod === "paypal" && " e gestiti direttamente da PayPal"}
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing || isDigitalWalletProcessing}
            className="flex-1 bg-transparent hover:bg-blue-100"
          >
            Annulla
          </Button>
          {paymentMethod !== "paypal" && (
            <Button
              type="submit"
              disabled={
                !isFormValid ||
                timerExpired ||
                (paymentMethod === "card" && (!stripe || isProcessing)) ||
                ((paymentMethod === "googlepay" || paymentMethod === "applepay") &&
                  (isDigitalWalletProcessing || !paymentRequest) || (paymentMethod === "card" && !isCardComplete))
              }
              className="flex-1 border-2 border-black hover:bg-blue-100"
            >
              {paymentMethod === "card" && isProcessing
                ? "Elaborazione..."
                : (paymentMethod === "googlepay" || paymentMethod === "applepay") && isDigitalWalletProcessing
                  ? "Apertura wallet..."
                  : timerExpired
                    ? "Tempo scaduto"
                    : paymentMethod === "googlepay"
                      ? `Paga con Google Pay ${formatPrice(totalAmount)}`
                      : paymentMethod === "applepay"
                        ? `Paga con Apple Pay ${formatPrice(totalAmount)}`
                        : `Paga con Carta ${formatPrice(totalAmount)}`}
            </Button>
            
          )}
        </CardFooter>
      </form>
    </Card>
  )
}

// Componente wrapper con Stripe Elements Provider
export default function PaymentForm({
  bookingData,
  reservationData,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  loadFunction,
}) {
  return (
    <Elements stripe={stripePromise}>
      <UnifiedPaymentForm
        bookingData={bookingData}
        reservationData={reservationData}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        onCancel={onCancel}
        loadFunction={loadFunction}
      />
    </Elements>
  )
}
