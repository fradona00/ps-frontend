"use client"
import { isSameDay, isAfter, isBefore, isEqual, isToday, addHours } from "date-fns"
import { Button } from "./ui/button"
import { BOOKING_TYPES } from "../lib/types"
import { el } from "date-fns/locale"

// Orari disponibili per le prenotazioni (incrementi di 30 minuti)
const AVAILABLE_TIMES = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
    "22:30",
    "23:00",
    "23:30",
    "00:00",
]

export default function TimeSlots({
  date,
  bookings,
  selectedSlot,
  onSelectSlot,
  bookingType,
  startTime,
  setStartTime,
  selectionMode,
  setSelectionMode,
  checkLogin
}) {
  // Filtra le prenotazioni per il tipo di campo selezionato
  const bookingsForSelectedType = bookings.filter((booking) => booking.type === bookingType)

  // Converte una stringa oraria in un oggetto Date per confronti
  const timeToDate = (timeString) => {
    // Aggiungi un controllo per verificare se timeString è definito
    if (!timeString) {
      //console.error("timeToDate: timeString is undefined")
      return new Date(date) // Restituisci la data corrente senza modificare l'orario
    }

    const [hours, minutes] = timeString.split(":").map(Number)
    var result;
    if (hours == 0 && minutes == 0) {
      result = new Date(date)
      result.setDate(result.getDate() + 1) // Imposta alla mezzanotte
    }else{
      result = new Date(date)
    }
    result.setHours(hours, minutes, 0, 0)
    return result
  }

  // Verifica se un orario è già passato rispetto all'ora corrente
  const isTimePassed = (time) => {
    // Controlla solo per la data odierna
    if (!isToday(date)) {
      return false
    }

    const now = new Date()

    // Ottieni l'orario corrente senza buffer
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    // Estrai ora e minuti dall'orario dello slot
    const [slotHour, slotMinute] = time.split(":").map(Number)

    // Confronta direttamente l'ora e i minuti dello slot con l'orario corrente
    if (slotHour < currentHour && slotHour > 0) {
      return true
    } else if (slotHour === currentHour && slotMinute < currentMinute) {
      return true
    }

    return false
  }

  // Verifica se un orario è l'inizio di una prenotazione esistente
  const isStartOfBooking = (time) => {
    const timeDate = timeToDate(time)

    return bookingsForSelectedType.find((booking) => {
      const bookingStart = timeToDate(booking.startTime)
      return isSameDay(booking.date, date) && isEqual(timeDate, bookingStart)
    })
  }

  // Verifica se un orario è all'interno di una prenotazione esistente (esclusi inizio e fine)
  const isTimeInBooking = (time) => {
    const timeDate = timeToDate(time)

    return bookingsForSelectedType.find((booking) => {
      const bookingStart = timeToDate(booking.startTime)
      const bookingEnd = timeToDate(booking.endTime)

      return (
        isSameDay(booking.date, date) &&
        // Escludiamo sia l'orario di inizio che l'orario di fine di una prenotazione esistente
        // per permettere prenotazioni consecutive
        isAfter(timeDate, bookingStart) &&
        isBefore(timeDate, bookingEnd)
      )
    })
  }

  // Verifica se un orario è disponibile per la selezione
  const isTimeAvailable = (time) => {
    // Se l'orario è già passato, non è disponibile
    if (isTimePassed(time)) {
      return false
    }

    // Se l'orario è all'interno di una prenotazione esistente, non è disponibile
    if (isTimeInBooking(time)) {
      return false
    }

    // Se stiamo selezionando l'orario di fine, verifichiamo che sia dopo l'orario di inizio
    if (selectionMode === "end" && startTime) {
      const timeDate = timeToDate(time)
      const startDate = timeToDate(startTime)
      const oneHourAfterStart = addHours(startDate, 1)

      // Verifica che l'orario di fine sia almeno un'ora dopo l'orario di inizio
      if (!isAfter(timeDate, oneHourAfterStart) && !isEqual(timeDate, oneHourAfterStart)) {
        return false
      }

      // Verifica che non ci siano prenotazioni tra l'orario di inizio e questo orario
      for (const t of AVAILABLE_TIMES) {
        const currentTimeDate = timeToDate(t)
        if (isAfter(currentTimeDate, startDate) && isBefore(currentTimeDate, timeDate) && isTimeInBooking(t)) {
          return false
        }
      }
    }

    return true
  }

  // Verifica se un orario permette una prenotazione di almeno 1 ora
  const hasMinimumDurationAvailable = (time) => {
    // Trova l'indice dell'orario corrente nell'array AVAILABLE_TIMES
    const currentIndex = AVAILABLE_TIMES.indexOf(time)
    if (currentIndex === -1) return false

    // Calcola quanti slot da 30 minuti servono per un'ora (4 slot)
    const slotsNeededForOneHour = 2

    // Verifica se ci sono abbastanza slot disponibili dopo l'orario corrente
    if (currentIndex + slotsNeededForOneHour >= AVAILABLE_TIMES.length) {
      return false // Non ci sono abbastanza slot rimanenti nella giornata
    }

    // Verifica che tutti gli slot nei successivi 60 minuti siano disponibili
    for (let i = 1; i <= slotsNeededForOneHour; i++) {
      // Se siamo all'ultimo slot (esattamente un'ora dopo), possiamo permettere che sia l'inizio di una prenotazione
      if (i === slotsNeededForOneHour) continue

      const nextSlotTime = AVAILABLE_TIMES[currentIndex + i]
      if (isTimeInBooking(nextSlotTime) || isStartOfBooking(nextSlotTime)) {
        return false // C'è una sovrapposizione che impedisce di avere un'ora continuativa
      }
    }

    return true
  }

  // Verifica se un orario è selezionabile come orario di fine
  const isSelectableAsEndTime = (time) => {
    if (!startTime) return false

    const timeDate = timeToDate(time)
    const startDate = timeToDate(startTime)
    const oneHourAfterStart = addHours(startDate, 1)

    // L'orario deve essere almeno un'ora dopo l'orario di inizio
    if (!isAfter(timeDate, oneHourAfterStart) && !isEqual(timeDate, oneHourAfterStart)) {
      return false
    }

    // Se l'orario è l'inizio di una prenotazione esistente, è selezionabile come orario di fine
    if (isStartOfBooking(time)) {
      return true
    }

    // Verifica che non ci siano prenotazioni tra l'orario di inizio e questo orario
    for (const t of AVAILABLE_TIMES) {
      const currentTimeDate = timeToDate(t)
      if (isAfter(currentTimeDate, startDate) && isBefore(currentTimeDate, timeDate) && isTimeInBooking(t)) {
        return false
      }
    }

    return !isTimeInBooking(time)
  }

  // Trova l'ultimo slot selezionabile come orario di fine
  const findLastSelectableEndTime = () => {
    if (!startTime || selectionMode !== "end") return null

    let lastSelectableTime = null
    let foundNonSelectable = false

    // Trova l'indice dell'orario di inizio
    const startIndex = AVAILABLE_TIMES.indexOf(startTime)
    if (startIndex === -1) return null

    // Calcola l'indice minimo per un'ora di prenotazione (4 slot da 15 minuti)
    const minEndIndex = startIndex + 2 // Un'ora dopo l'inizio

    // Itera attraverso tutti gli slot dopo l'orario minimo di fine
    for (let i = minEndIndex; i < AVAILABLE_TIMES.length; i++) {
      const time = AVAILABLE_TIMES[i]

      // Se troviamo uno slot non selezionabile, interrompiamo la ricerca
      if (!isSelectableAsEndTime(time)) {
        foundNonSelectable = true
        break
      }

      // Aggiorna l'ultimo slot selezionabile
      lastSelectableTime = time
    }

    return lastSelectableTime
  }

  // Filtra gli orari disponibili
  const getFilteredTimes = () => {
    // Prima filtra gli orari passati
    let times = AVAILABLE_TIMES.filter((time) => !isTimePassed(time))

    // Se stiamo selezionando l'orario di fine, filtra gli orari
    if (selectionMode === "end" && startTime) {
      const lastSelectableTime = findLastSelectableEndTime()
      const startIndex = AVAILABLE_TIMES.indexOf(startTime)

      if (lastSelectableTime) {
        // Trova l'indice dell'ultimo slot selezionabile
        const lastIndex = AVAILABLE_TIMES.indexOf(lastSelectableTime)

        // Filtra gli orari per mostrare solo quelli tra l'orario di inizio e l'ultimo slot selezionabile
        times = times.filter((time) => {
          const index = AVAILABLE_TIMES.indexOf(time)
          return index >= startIndex && index <= lastIndex
        })
      } else {
        // Se non c'è un ultimo slot selezionabile, mostra solo l'orario di inizio
        times = times.filter((time) => time === startTime)
      }
    }

    return times
  }

  // Ottieni gli orari filtrati
  const filteredTimes = getFilteredTimes()

  // Gestisce il click su un orario
  const handleTimeClick = (time) => {
    if (selectionMode === "start") {
      // Verifica se l'orario ha almeno un'ora disponibile successivamente
      if (hasMinimumDurationAvailable(time)) {
        setStartTime(time)
        setSelectionMode("end")
      }
    } else if (selectionMode === "end" && startTime) {
      onSelectSlot({ startTime: startTime, endTime: time })
      setStartTime(null)
      setSelectionMode("start")
    }
  }

  // Annulla la selezione corrente
  const cancelSelection = () => {
    setStartTime(null)
    setSelectionMode("start")
  }

  // Determina lo stile del bottone in base allo stato
  const getButtonStyle = (time) => {
    // Se l'orario è già passato
    if (isTimePassed(time)) {
      return "bg-gray-200 hover:bg-gray-200 cursor-not-allowed opacity-50"
    }

    // Se l'orario è all'interno di una prenotazione esistente
    if (isTimeInBooking(time)) {
      return "bg-gray-200 hover:bg-gray-200 cursor-not-allowed opacity-50"
    }

    // Se l'orario è l'inizio di una prenotazione esistente
    const startOfBooking = isStartOfBooking(time)
    if (startOfBooking && selectionMode === "start") {
      return "bg-gray-200 hover:bg-gray-200 cursor-not-allowed opacity-50"
    }

    // Se stiamo selezionando l'orario di inizio e questo orario non ha almeno un'ora disponibile successivamente
    if (selectionMode === "start" && !hasMinimumDurationAvailable(time)) {
      return "bg-gray-200 hover:bg-gray-200 cursor-not-allowed opacity-50"
    }

    if (selectionMode === "end" && startTime) {
      // Evidenzia l'orario di inizio
      if (time === startTime) {
        switch (bookingType) {
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

      // Evidenzia gli orari tra l'inizio e il mouse hover (se disponibili)
      const timeDate = timeToDate(time)
      const startDate = timeToDate(startTime)
      const oneHourAfterStart = addHours(startDate, 1)

      // Verifica che l'orario sia almeno un'ora dopo l'orario di inizio
      if ((isAfter(timeDate, oneHourAfterStart) || isEqual(timeDate, oneHourAfterStart)) && isTimeAvailable(time)) {
        switch (bookingType) {
          case BOOKING_TYPES.PADEL_INDOOR:
            return "bg-emerald-200 hover:bg-emerald-300"
          case BOOKING_TYPES.PADEL_OUTDOOR:
            return "bg-green-200 hover:bg-green-300"
          case BOOKING_TYPES.CALCETTO:
            return "bg-blue-200 hover:bg-blue-300"
          default:
            return ""
        }
      }
    }

    return ""
  }

  // Calcola la durata tra due orari
  const calculateDuration = (start, end) => {
    const startDate = timeToDate(start)
    const endDate = timeToDate(end)
    const diffMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60)

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

  // Verifica se ci sono slot disponibili dopo aver filtrato quelli passati
  const hasAvailableSlots = filteredTimes.length > 0

  return (
    <div>
      <div className="mb-4">
        {selectionMode === "start" ? (
          <p className="text-lg md:text-xl font-semibold">Seleziona l'orario di inizio desiderato per {getBookingTypeName(bookingType)}</p>
        ) : (
          <div className="flex justify-between items-center">
            <p className="text-lg md:text-xl font-semibold">Seleziona l'orario di fine (inizio: {startTime})</p>
            <Button variant="outline" size="sm" onClick={cancelSelection}>
              Annulla
            </Button>
          </div>
        )}
      </div>

      {hasAvailableSlots ? (
        <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
          {filteredTimes.map((time) => {
            const isBooked = isTimeInBooking(time)
            const isBookingStart = isStartOfBooking(time)
            const hasMinDuration = hasMinimumDurationAvailable(time)
            const canBeSelected =
              selectionMode === "start"
                ? !isBooked && !isTimePassed(time) && !isBookingStart && hasMinDuration
                : !isBooked && !isTimePassed(time) && isSelectableAsEndTime(time)

            return (
              <Button
                key={time}
                variant="outline"
                className={`md:h-16 h-8 flex flex-col items-center justify-center ${getButtonStyle(time)}`}
                disabled={
                  isTimePassed(time) ||
                  isBooked ||
                  (selectionMode === "start" && (!hasMinDuration || isBookingStart)) ||
                  (selectionMode === "end" && !canBeSelected && !isBookingStart)
                }
                onClick={() => {
                  checkLogin();
                  if (selectionMode === "start") {
                    if (hasMinDuration && !isBookingStart) {
                      handleTimeClick(time)
                    }
                  } else {
                    if (canBeSelected || isBookingStart) {
                      handleTimeClick(time)
                    }
                  }
                }}
              >
                <span className="text-sm">{time}</span>
                {/* Mostra "Non disponibile" solo quando si è in modalità di selezione dell'orario di inizio */}
                {selectionMode === "start" && (
                  <>
                    {(isBooked || isBookingStart || !hasMinDuration) && (
                      <span className="text-xs text-gray-500">Non disponibile</span>
                    )}
                  </>
                )}
              </Button>
            )
          })}
        </div>
      ) : (
        <div className="p-6 text-center border rounded-md bg-gray-50">
          <p className="text-gray-500">
            {isToday(date)
              ? "Non ci sono più slot disponibili per oggi. Prova a selezionare un'altra data."
              : "Non ci sono slot disponibili per questa data."}
          </p>
        </div>
      )}
    </div>
  )
}
