"use client"

import { useState, useEffect } from "react"
import { format, isSameDay } from "date-fns"
import { it } from "date-fns/locale"
import { Calendar } from "./ui/calendar"
import { Button } from "./ui/button"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import TimeSlots from "./TimeSlotsComponent"
import BookingForm from "./BookingFormComponent"
import PaymentForm from "./PaymentForm"
import { BOOKING_TYPES } from "../lib/types"
import { request } from "../utils/request"
import { DateTime, Interval } from "luxon"

export default function BookingCalendar(params) {
  const loadFunction = params.loadFunction
  const [selectedDate, setSelectedDate] = useState(new Date())
  const selectedSlot = params.selectedSlot
  const setSelectedSlot = params.setSelectedSlot
  const [bookingType, setBookingType] = useState(BOOKING_TYPES.PADEL_INDOOR)
  const [bookings, setBookings] = useState()
  const [occupancy, setOccupancy] = useState([]) // Stato per le prenotazioni esistenti
  const [startTime, setStartTime] = useState(null)
  const [selectionMode, setSelectionMode] = useState("start")
  const [calendarOpen, setCalendarOpen] = useState(false) // Stato per controllare l'apertura del calendario
  const [courts, setCourts] = useState([]) // Stato per le informazioni sui campi
  const [indoorPadelAvailable, setIndoorPadelAvailable] = useState(false) // Stato per la disponibilità del Padel Indoor
  const [outdoorPadelAvailable, setOutdoorPadelAvailable] = useState(false) // Stato per la disponibilità del Padel Outdoor
  const [calcettoAvailable, setCalcettoAvailable] = useState(false) // Stato per la disponibilità del Calcetto
  var resources = [] // Stato per le informazioni sui campi
  const [bookingsForSelectedDate, setBookingsForSelectedDate] = useState([])
  const checkLogin = params.checkLogin // Funzione per controllare il login dell'utente

  const showPaymentForm = params.showPaymentForm // Stato per mostrare il form di pagamento
  const setShowPaymentForm = params.setShowPaymentForm // Funzione per impostare lo stato del form di pagamento
  // Nuovi stati per il flusso di pagamento
  const [paymentData, setPaymentData] = useState(null)
  const [reservationData, setReservationData] = useState(null)
  const [closedDays, setClosedDays] = useState([]) // Stato per i giorni di chiusura

  // Calcola la durata della prenotazione
  const calculateDuration = (booking) => {
    const startParts = booking.startTime.split(":").map(Number)
    const endParts = booking.endTime.split(":").map(Number)

    const startMinutes = startParts[0] * 60 + startParts[1]
    const endMinutes = (endParts[0] * 60 + endParts[1]) > 0 ? endParts[0] * 60 + endParts[1] : 24*60
    const diffMinutes = endMinutes - startMinutes

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60

    return hours * 60 + minutes // Restituisce la durata in minuti
  }

  // Verifica se una data è in un giorno di chiusura
  const isDateClosed = (date) => {
    return closedDays.some((closedPeriod) => {
      const startDate = new Date(closedPeriod.start)
      const endDate = new Date(closedPeriod.end)

      // Normalizza le date per confrontare solo giorno/mese/anno
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const periodStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      const periodEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

      return checkDate >= periodStart && checkDate <= periodEnd
    })
  }

  function getAvailableResourceIds(booking) {
    const TYPE_TO_RESOURCE = {
      PADEL_INDOOR: "PADEL_INDOOR",
      PADEL_OUTDOOR: "PADEL_OUTDOOR",
      CALCIO_A_5: "CALCIO A 5",
    }

    const resourceType = TYPE_TO_RESOURCE[booking.type]
    if (!resourceType) return []

    const resourceIds = courts.filter((c) => c.resource_type === resourceType).map((c) => c.resource_id)

    const bookingStart = DateTime.fromISO(booking.start, { zone: "utc" }).setZone("Europe/Rome")
    const bookingEnd = DateTime.fromISO(booking.end, { zone: "utc" }).setZone("Europe/Rome")
    const bookingInterval = Interval.fromDateTimes(bookingStart, bookingEnd)

    const available = []

    for (const resourceId of resourceIds) {
      const resourceOccupancy = occupancy.find((o) => o.resource_id === resourceId)
      const locks = resourceOccupancy?.locks || []

      const hasOverlap = locks.some((lock) => {
        const lockStart = DateTime.fromISO(lock.start, { zone: "utc" }).setZone("Europe/Rome")
        const lockEnd = DateTime.fromISO(lock.end, { zone: "utc" }).setZone("Europe/Rome")
        const lockInterval = Interval.fromDateTimes(lockStart, lockEnd)

        return bookingInterval.overlaps(lockInterval)
      })

      if (!hasOverlap) {
        available.push(resourceId)
      }
    }

    return available
  }

  function convertOccupancyToBookings(occupancy, requestDate) {
    const indoorPadelIds = resources.filter((c) => c.resource_type === "PADEL_INDOOR").map((c) => c.resource_id)
    const outdoorPadelIds = resources.filter((c) => c.resource_type === "PADEL_OUTDOOR").map((c) => c.resource_id)
    const calcettoIds = resources.filter((c) => c.resource_type === "CALCIO A 5").map((c) => c.resource_id)

    const BOOKING_TYPES = {
      PADEL_INDOOR: "PADEL_INDOOR",
      PADEL_OUTDOOR: "PADEL_OUTDOOR",
      CALCETTO: "CALCIO_A_5",
    }

    const bookingsArr = []

    const groupLocksByType = (resourceIds, type) => {
      const relevantLocks = occupancy
        .filter((entry) => resourceIds.includes(entry.resource_id))
        .map((entry) =>
          entry.locks.map((lock) => {
            const start = DateTime.fromISO(lock.start, { zone: "utc" }, { zone: "Europe/Rome" })
            const end = DateTime.fromISO(lock.end, { zone: "utc" }, { zone: "Europe/Rome" })

            return {
              start: start.toJSDate(),
              end: end.toJSDate(),
              date: start.startOf("day").toJSDate(),
            }
          }),
        )

      if (relevantLocks.length === 0) return

      const commonIntervals = intersectIntervals(relevantLocks, resourceIds)

      commonIntervals.forEach((interval, index) => {
        bookingsArr.push({
          id: `${type}_${index}`,
          date: new Date(interval.start.getFullYear(), interval.start.getMonth(), interval.start.getDate()),
          startTime: formatTime(interval.start),
          endTime: formatTime(interval.end),
          type: type,
        })
      })
    }

    const intersectIntervals = (lists, resourceList) => {
      let result = lists[0]
      if (lists.length <= 1 && resourceList.length == lists.length) {
        return result
      }
      if (lists.length <= 1 || resourceList.length != lists.length) {
        return []
      }

      for (let i = 1; i < lists.length; i++) {
        result = getOverlaps(result, lists[i])
        if (result.length === 0) break
      }
      return result
    }

    const getOverlaps = (listA, listB) => {
      const overlaps = []
      for (const a of listA) {
        for (const b of listB) {
          const start = new Date(Math.max(a.start, b.start))
          const end = new Date(Math.min(a.end, b.end))
          if (start < end) {
            overlaps.push({ start, end })
          }
        }
      }
      return overlaps
    }

    const formatTime = (date) => {
      return date.toTimeString().slice(0, 5) // "HH:MM"
    }

    groupLocksByType(indoorPadelIds, BOOKING_TYPES.PADEL_INDOOR)
    groupLocksByType(outdoorPadelIds, BOOKING_TYPES.PADEL_OUTDOOR)
    groupLocksByType(calcettoIds, BOOKING_TYPES.CALCETTO)

    setBookings(bookingsArr)
    const bookingsForSelectedDate = bookingsArr.filter((booking) => isSameDay(booking.date, requestDate))
    setBookingsForSelectedDate(bookingsForSelectedDate)
  }

  async function loadCourtsAndBookings(date) {
    // Carica i giorni di chiusura
    const closedDaysResponse = await request({
      url: "/api/services/getClosedDays",
      method: "POST",
      body: {},
      loadFunction,
    })
    setClosedDays(closedDaysResponse.data || [])

    const courtsResponse = await request({
      url: "/api/services/getCourts",
      method: "POST",
      body: {},
      loadFunction,
    })

    courtsResponse.data.forEach((court) => {
      if (court.sport_id == "PADEL") {
        if (court.properties.resource_type == "indoor") {
          court.resource_type = "PADEL_INDOOR"
          setIndoorPadelAvailable(true)
        }
        if (court.properties.resource_type == "outdoor") {
          court.resource_type = "PADEL_OUTDOOR"
          setOutdoorPadelAvailable(true)
        }
      }
      if (court.sport_id == "FUTSAL") {
        court.resource_type = "CALCIO A 5"
        setCalcettoAvailable(true)
      }
    })
    setCourts(courtsResponse.data)
    resources = courtsResponse.data

    const requestDate = date ? date : selectedDate

    const occupancyResponse = await request({
      url: "/api/services/getOccupancy",
      method: "POST",
      body: { localDay: requestDate.toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" }) },
      loadFunction,
    })
    setOccupancy(occupancyResponse.data)
    convertOccupancyToBookings(occupancyResponse.data, requestDate)
  }

  useEffect(() => {
    loadCourtsAndBookings()
  }, [])

  // Annulla la selezione corrente
  const cancelSelection = () => {
    setStartTime(null)
    setSelectionMode("start")
  }

  // Gestisce la prenotazione di un nuovo slot
  const handleBooking = async (newBooking) => {
    const token = checkLogin() // Controlla se l'utente è loggato prima di procedere con la prenotazione
    console.log(newBooking)
    console.log(startTime)

    try {
      // Trova il primo campo disponibile
      const availableResourceIds = getAvailableResourceIds(newBooking)
      if (availableResourceIds.length === 0) {
        alert("Non ci sono campi disponibili per i parametri selezionati. Ti preghiamo di riprovare più tardi.")
        return
      }

      let bookingResponse
      let currentResourceId
      for (const resourceId of availableResourceIds) {
        currentResourceId = resourceId
        // Chiama makeReservation (che ora crea anche il Payment Intent a backend)
        bookingResponse = await request({
          url: "/api/services/makeReservation",
          method: "POST",
          token: token,
          body: {
            startDate:
              newBooking.date.toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" }) +
              "T" +
              newBooking.startTime +
              ":00",
            duration: calculateDuration(newBooking),
            resourceId: resourceId,
            sportName: newBooking.type.includes("PADEL") ? "PADEL" : "FUTSAL",
            promoCode: newBooking.promoCode?newBooking.promoCode.codice :null,
          },
          loadFunction,
        })
        if (bookingResponse.ok) {
          break
        }
      }

      console.log(bookingResponse)

      if (bookingResponse.ok) {
        const court = courts.find((c) => c.resource_id === currentResourceId)

        // Prepara i dati per il form di pagamento
        const bookingDataForPayment = {
          date: newBooking.date,
          startTime: newBooking.startTime,
          endTime: newBooking.endTime,
          duration: calculateDuration(newBooking),
          type: newBooking.type,
          courtName: court?.name || "Campo selezionato",
          resourceId: currentResourceId,
          amount: bookingResponse.data.amount,
          subtotal: bookingResponse.data.subtotal,
          currency: "eur",
          clientSecret: bookingResponse.data.clientSecret,
          promoCode: newBooking.promoCode || null,
        }

        // Salva i dati della risposta makeReservation (che include paymentIntentId/clientSecret)
        setReservationData({
          ...bookingResponse.data,
          promoCode: newBooking.promoCode || null,
          // Assicurati che questi campi siano presenti nella risposta di makeReservation
          clientSecret: bookingResponse.data.clientSecret,
        })

        // Prepara i dati di pagamento
        setPaymentData(bookingDataForPayment)

        // Mostra il form di pagamento
        setShowPaymentForm(true)
      } else {
        alert("Errore nella creazione della prenotazione. Riprova.")
      }
    } catch (error) {
      console.error("Errore nel processo di prenotazione:", error)
      alert("Errore nel processo di prenotazione. Riprova.")
    }

    loadCourtsAndBookings()
    setSelectedSlot(null)
  }

  // Gestisce il successo del pagamento
  const handlePaymentSuccess = async (paymentIntent) => {
    console.log("Pagamento completato con successo:", paymentIntent)
    window.removeEventListener('unload');

    try {
      // Chiama confirmReservation dopo il successo del pagamento
      const confirmResponse = await request({
        url: "/api/services/confirmReservation",
        method: "POST",
        body: {
          orderId: reservationData?.orderId,
          paypalAuthorizationId: paymentIntent.paypal? paymentIntent?.metadata.paypal_authorization_id: null,
          paypalOrderId: paymentIntent.paypal? paymentIntent?.metadata.paypal_order_id: null,
          promoCode: reservationData?.promoCode ? reservationData.promoCode.codice : null,
        },
        loadFunction,
        token: checkLogin(),
      })

      if (confirmResponse.ok) {
        // Reindirizza alla pagina di conferma ordine
        loadFunction(true)
        window.location.href = `/confirmOrder?orderId=${reservationData?.orderId}`
      } else {
        // Mostra alert di errore e ricarica i dati
        alert("Errore durante il pagamento, riprovare piu' tardi.")
        setShowPaymentForm(false)
        loadCourtsAndBookings()
      }
    } catch (error) {
      console.error("Errore nella conferma della prenotazione:", error)
      alert("Errore durante il pagamento, riprovare piu' tardi.")
      setShowPaymentForm(false)
      loadCourtsAndBookings()
    }
  }

  // Gestisce gli errori di pagamento
  const handlePaymentError = (error) => {
    console.error("Errore nel pagamento:", error)

    // Reset dello stato
    setShowPaymentForm(false)
    setPaymentData(null)
    setReservationData(null)
    setSelectedSlot(null)

    // Ricarica i dati per aggiornare la disponibilità
    loadCourtsAndBookings()
  }

  // Gestisce l'annullamento del pagamento
  const handlePaymentCancel = () => {
    const cancelResponse = request({
      url: "/api/services/cancelOrder",
      method: "POST",
      body: {
        orderId: reservationData?.orderId,
      },
      loadFunction,
      token: checkLogin(),
    })
    setShowPaymentForm(false)
    setPaymentData(null)
    setReservationData(null)
    setSelectedSlot(null)
  }

  // Funzione per ottenere il colore del bottone in base al tipo di prenotazione
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

  // Gestisce la selezione della data e chiude il calendario
  const handleDateSelect = async (date) => {
    if (date) {
      setSelectedDate(date)
      await loadCourtsAndBookings(date)
      setCalendarOpen(false) // Chiude il calendario dopo la selezione
    }
  }

  // Se stiamo mostrando il form di pagamento, renderizza solo quello
  if (showPaymentForm && paymentData) {
    return (
      <div className="rounded-3xl bg-white md:w-fit mx-auto w-5/6">
        <PaymentForm
          bookingData={paymentData}
          reservationData={reservationData}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          onCancel={handlePaymentCancel}
          loadFunction={loadFunction}
        />
      </div>
    )
  }

  return (
    <div className="">
      <div className="flex flex-col md:flex-row gap-8">
        {!selectedSlot ? (
          <div className="md:w-1/2">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Data selezionata</h2>

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={it}
                    calendarHistoryDisabled={true}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        ) : (
          ""
        )}

        {!selectedSlot ? (
          <div className="md:w-1/2">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Tipo di campo</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {indoorPadelAvailable ? (
                  <Button
                    variant={bookingType === BOOKING_TYPES.PADEL_INDOOR ? "default" : "outline"}
                    onClick={() => {
                      cancelSelection()
                      setBookingType(BOOKING_TYPES.PADEL_INDOOR)
                    }}
                    className={
                      bookingType === BOOKING_TYPES.PADEL_INDOOR ? getButtonColor(BOOKING_TYPES.PADEL_INDOOR) : ""
                    }
                  >
                    Padel Coperto
                  </Button>
                ) : (
                  ""
                )}
                {outdoorPadelAvailable ? (
                  <Button
                    variant={bookingType === BOOKING_TYPES.PADEL_OUTDOOR ? "default" : "outline"}
                    onClick={() => {
                      cancelSelection()
                      setBookingType(BOOKING_TYPES.PADEL_OUTDOOR)
                    }}
                    className={
                      bookingType === BOOKING_TYPES.PADEL_OUTDOOR ? getButtonColor(BOOKING_TYPES.PADEL_OUTDOOR) : ""
                    }
                  >
                    Padel all'aperto
                  </Button>
                ) : (
                  ""
                )}
                {calcettoAvailable ? (
                  <Button
                    variant={bookingType === BOOKING_TYPES.CALCETTO ? "default" : "outline"}
                    onClick={() => {
                      cancelSelection()
                      setBookingType(BOOKING_TYPES.CALCETTO)
                    }}
                    className={bookingType === BOOKING_TYPES.CALCETTO ? getButtonColor(BOOKING_TYPES.CALCETTO) : ""}
                  >
                    CALCIO A 5
                  </Button>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
        ) : (
          ""
        )}
      </div>

      {!selectedSlot ? (
        isDateClosed(selectedDate) ? (
          <div className="p-8 text-center border rounded-lg bg-red-50 border-red-200">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-red-800 mb-2">Giorno di chiusura</h3>
                <p className="text-red-600">Prova a selezionare un'altra data</p>
              </div>
            </div>
          </div>
        ) : (
          <TimeSlots
            date={selectedDate}
            bookings={bookingsForSelectedDate}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            bookingType={bookingType}
            startTime={startTime}
            setStartTime={setStartTime}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}
            checkLogin={checkLogin}
          />
        )
      ) : (
        ""
      )}

      {selectedSlot && (
        <BookingForm
          date={selectedDate}
          slot={selectedSlot}
          bookingType={bookingType}
          onSubmit={handleBooking}
          onCancel={() => setSelectedSlot(null)}
          loadFunction ={loadFunction}
          token ={checkLogin()}
        />
      )}

      {!selectedSlot ? (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Legenda</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-emerald-500 rounded-full mr-2"></div>
              <span>Padel Indoor</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span>Padel Outdoor</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              <span>Calcio a 5</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>
              <span>Non disponibile</span>
            </div>
          </div>
          <div className="my-2 font-light text-sm">
              Hai bisogno di pagare in <a className="font-medium">contanti</a> o hai richieste speciali? <a href="/#contatti" className="font-bold underline">Contattaci</a>
            </div>
        </div>
      ) : (
        ""
      )}
    </div>
  )
}
