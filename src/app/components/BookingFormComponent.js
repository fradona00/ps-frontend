"use client"

import { useState } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { BOOKING_TYPES } from "../lib/types"
import { AlertCircle, CheckCircle } from "lucide-react"
import { request } from "../utils/request"

export default function BookingForm({ date, slot, bookingType, onSubmit, onCancel, loadFunction, token }) {
  const [userName, setUserName] = useState("")
  const [courtNumber, setCourtNumber] = useState(1)
  const [promoCode, setPromoCode] = useState("")
  const [isCheckingPromo, setIsCheckingPromo] = useState(false)
  const [promoError, setPromoError] = useState("")
  const [appliedPromo, setAppliedPromo] = useState(null)

  // Calcola la durata della prenotazione
  const calculateDuration = () => {
    const startParts = slot.startTime.split(":").map(Number)
    const endParts = slot.endTime.split(":").map(Number)

    const startMinutes = startParts[0] * 60 + startParts[1]
    const endMinutes = (endParts[0] * 60 + endParts[1])>0 ? endParts[0] * 60 + endParts[1] : 24*60
    const diffMinutes = endMinutes - startMinutes

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60

    if (hours === 0) {
      return `${minutes} minuti`
    } else if (minutes === 0) {
      return hours === 1 ? "1 ora" : `${hours} ore`
    } else {
      return `${hours} ${hours === 1 ? "ora" : "ore"} e ${minutes} minuti`
    }
  }

  // Ottiene il nome visualizzato del tipo di prenotazione
  const getBookingTypeName = (type) => {
    switch (type) {
      case BOOKING_TYPES.PADEL_INDOOR:
        return "Padel Coperto"
      case BOOKING_TYPES.PADEL_OUTDOOR:
        return "Padel all'aperto"
      case BOOKING_TYPES.CALCETTO:
        return "Calcio a 5"
      default:
        return "Sconosciuto"
    }
  }

  // Ottiene il colore del bottone in base al tipo di prenotazione
  const getButtonColor = (type) => {
    switch (type) {
      case BOOKING_TYPES.PADEL_INDOOR:
        return "bg-emerald-600 hover:bg-emerald-700"
      case BOOKING_TYPES.PADEL_OUTDOOR:
        return "bg-green-600 hover:bg-green-700"
      case BOOKING_TYPES.CALCETTO:
        return "bg-blue-600 hover:bg-blue-700"
      default:
        return ""
    }
  }

  // Ottiene il numero di campi disponibili in base al tipo
  const getCourtCount = (type) => {
    switch (type) {
      case BOOKING_TYPES.PADEL_INDOOR:
        return 2 // Esempio: 2 campi indoor
      case BOOKING_TYPES.PADEL_OUTDOOR:
        return 4 // Esempio: 4 campi outdoor
      case BOOKING_TYPES.CALCETTO:
        return 2 // Esempio: 2 campi da calcetto
      default:
        return 1
    }
  }

  const handleCheckPromoCode = async () => {
    if (!promoCode.trim()) return

    setIsCheckingPromo(true)
    setPromoError("")

    try {
      const response = await request({
        url:"/api/user/checkPromoCode", 
        method: "POST",
        body: {codice:promoCode},
        loadFunction,
        token
    })

      const data = response.data

      if (response.ok && data.valid) {
        setAppliedPromo(data.promotion)
        setPromoError("")
      } else {
        setPromoError(data.message || "Codice sconto non valido")
        setAppliedPromo(null)
      }
    } catch (error) {
      setPromoError("Codice sconto non valido")
      setAppliedPromo(null)
    } finally {
      setIsCheckingPromo(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    onSubmit({
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      type: bookingType,
      courtNumber,
      userName,
      promoCode: appliedPromo,
    })
  }

  return (
    <Card className="md:w-1/2 w-full mx-auto bg-white">
      <CardHeader>
        <CardTitle>Conferma prenotazione</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-4 ">
              <div>
                <Label>Data</Label>
                <div className="p-2 border rounded-md">{format(date, "EEEE d MMMM yyyy", { locale: it })}</div>
              </div>
              <div>
                <Label>Durata</Label>
                <div className="p-2 border rounded-md">{calculateDuration()}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Orario</Label>
            <div className="p-2 border rounded-md">
              {slot.startTime} - {slot.endTime}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo di campo</Label>
            <div className="p-2 border rounded-md">{getBookingTypeName(bookingType)}</div>
          </div>

          {/* Campo Codice Sconto */}
          <div className="space-y-2">
            <Label htmlFor="promo-code">Codice Sconto (opzionale) <a className="text-xs underline text-slate-400" target="_blank" href="/profile?tab=PROMO">Controlla le promozioni qui!</a></Label>
            <div className="flex gap-2">
              <Input
                id="promo-code"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Inserisci codice sconto"
                className="flex-1"
                disabled={isCheckingPromo || appliedPromo}
              />
              <Button
                type="button"
                onClick={handleCheckPromoCode}
                disabled={!promoCode.trim() || isCheckingPromo || appliedPromo}
                variant="outline"
                className="px-4 bg-transparent"
              >
                {isCheckingPromo ? "Verifica..." : "Applica"}
              </Button>
            </div>

            {/* Messaggio di errore */}
            {promoError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{promoError}</span>
              </div>
            )}

            {/* Messaggio di successo */}
            {appliedPromo && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>
                  Codice "{promoCode}" applicato!
                  {appliedPromo.discount.includes === "%"
                    ? ` Sconto del ${appliedPromo.discount}%`
                    : ` Sconto di ${appliedPromo.discount}€`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAppliedPromo(null)
                    setPromoCode("")
                  }}
                  className="ml-auto text-red-600 hover:text-red-700"
                >
                  Rimuovi
                </Button>
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between flex-col md:flex-row">
        <Button className="order-2 my-2 md:order-1 bg-transparent" variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button onClick={handleSubmit} className={getButtonColor(bookingType) + " order-1 md:order-2"}>
          Vai al pagamento
        </Button>
      </CardFooter>
    </Card>
  )
}
