"use client"

import { useState, useEffect,useRef } from "react"
import { format, parseISO, startOfDay, endOfDay } from "date-fns"
import { it } from "date-fns/locale"
import { Edit, Trash2, ChevronDown, Calendar, ChevronLeft, ChevronRight, AlertCircle, Copy, Search } from "lucide-react"
import { Button } from "./ui/button"
import { request } from "../utils/request"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar as CalendarComponent } from "./ui/calendar"
import { Badge } from "./ui/Badge.js"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/Dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/CheckBox.js"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/AlertDialog"

export default function ReservationsTable({ loadFunction, token }) {
  const [reservationsData, setReservationsData] = useState([])
  const [courts, setCourts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedRows, setExpandedRows] = useState({})
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [searchText, setSearchText] = useState("")
  const [allReservations, setAllReservations] = useState([])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [hours, setHours] = useState("")
  const [minutes, setMinutes] = useState("")
  const hasFetched = useRef(false)

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
    "24:00",
  ]

  // Stati per la paginazione
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Stati per i popup di modifica e cancellazione
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [editFormData, setEditFormData] = useState({
    date: null,
    startTime: "",
    duration: "",
    resourceId: "",
  })
  const [isRefund, setIsRefund] = useState(false)
  const [totalPagesState, setTotalPagesState] = useState(1)

  // Aggiorna la durata in minuti quando cambiano ore o minuti
  useEffect(() => {
    const totalMinutes = (Number.parseInt(hours) || 0) * 60 + (Number.parseInt(minutes) || 0)
    setEditFormData({ ...editFormData, duration: totalMinutes })
  }, [hours, minutes])

  // Aggiorna ore e minuti quando cambia formData.duration
  useEffect(() => {
    if (editFormData.duration) {
      setHours(Math.floor(editFormData.duration / 60).toString())
      setMinutes((editFormData.duration % 60).toString().padStart(2, "0"))
    }
  }, [editFormData.duration])

  // Rileva se il dispositivo è mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  useEffect(() => {
    // Carica i dati all'avvio del componente
    if (hasFetched.current) return // Evita di ricaricare se già fatto
    fetchCourts()
    fetchReservations()
    hasFetched.current = true // Segna come già caricato
  }, []) // Rimuovi le dipendenze per caricare solo all'avvio

  // Funzione per recuperare i dati dei campi
  async function fetchCourts() {
    try {
      const courtsResponse = await request({
        url: "/api/services/getCourts",
        method: "POST",
        body: {},
        loadFunction,
      })

      if (courtsResponse && courtsResponse.data) {
        setCourts(courtsResponse.data)
      }
    } catch (err) {
      setError("Errore nel recupero dei campi: " + err.message)
    }
  }

  // Funzione per recuperare le prenotazioni
  async function fetchReservations() {
    setLoading(true)
    try {
      // Prepara il body della richiesta senza filtri data
      const requestBody = {}

      const response = await request({
        url: "/api/admin/getReservations",
        method: "POST",
        body: requestBody,
        token,
        loadFunction,
      })

      const fetchedReservations = response.data.reservations || []

      if (fetchedReservations) {
        // Salva tutte le prenotazioni
        setAllReservations(fetchedReservations)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Aggiungi una funzione per filtrare le prenotazioni
  const getFilteredReservations = () => {
    return allReservations.filter((reservation) => {
      const reservationDate = parseISO(reservation.startDate)

      // Filtro per data inizio - se presente, filtra prenotazioni dalla data specificata in poi
      if (startDate) {
        if (reservationDate < startOfDay(startDate)) {
          return false
        }
      }

      // Filtro per data fine - se presente, filtra prenotazioni fino alla data specificata
      if (endDate) {
        if (reservationDate > endOfDay(endDate)) {
          return false
        }
      }

      // Filtro per testo
      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase()
        const nameMatch = `${reservation.name || ""} ${reservation.surname || ""}`.toLowerCase().includes(searchLower)
        const emailMatch = (reservation.email || "").toLowerCase().includes(searchLower)
        const phoneMatch = (reservation.phoneNumber || "").toLowerCase().includes(searchLower)
        const courtMatch = getCourtName(reservation.resourceId).toLowerCase().includes(searchLower)

        if (!nameMatch && !emailMatch && !phoneMatch && !courtMatch) {
          return false
        }
      }

      return true
    })
  }

  const [reservations, setReservations] = useState([])

  useEffect(() => {
    setReservations(getFilteredReservations())
    setCurrentPage(1)
    setTotalPagesState(Math.ceil(getFilteredReservations().length / itemsPerPage))
  }, [startDate, endDate, searchText, allReservations])

  // Ottieni le prenotazioni per la pagina corrente
  const getCurrentPageReservations = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return reservations.slice(startIndex, endIndex)
  }

  // Funzione per ottenere il nome del campo dal resourceId
  function getCourtName(resourceId) {
    const court = courts.find((court) => court.resource_id === resourceId)
    return court ? court.name : "Campo non trovato"
  }

  // Funzione per formattare la data
  function formatDate(dateString) {
    try {
      const date = parseISO(dateString)
      return format(date, "dd/MM/yyyy HH:mm", { locale: it })
    } catch (error) {
      return dateString
    }
  }

  // Funzione per formattare la durata in ore e minuti
  function formatDuration(minutes) {
    if (!minutes) return "-"

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) {
      return `${mins} min`
    } else if (mins === 0) {
      return hours === 1 ? "1 ora" : `${hours} ore`
    } else {
      return `${hours}h ${mins}m`
    }
  }

  // Metodo per aprire il dialog di modifica
  const handleEdit = (reservation) => {
    setSelectedReservation(reservation)

    // Estrai la data e l'ora dalla stringa di data
    const reservationDate = parseISO(reservation.startDate)
    const hours = reservationDate.getHours().toString().padStart(2, "0")
    const minutes = reservationDate.getMinutes().toString().padStart(2, "0")

    setEditFormData({
      date: reservationDate,
      startTime: `${hours}:${minutes}`,
      duration: reservation.duration,
      resourceId: reservation.resourceId,
    })

    setIsEditDialogOpen(true)
  }

  // Metodo per gestire la modifica della prenotazione
  const handleModifica = async () => {
    // Recupera i valori dal form e l'id della prenotazione
    const { date, startTime, duration, resourceId } = editFormData
    const reservationId = selectedReservation.reservationId

    console.log("Modifica prenotazione:", {
      reservationId,
      date: format(date, "yyyy-MM-dd"),
      startTime,
      duration, // Ora è già in minuti grazie alla conversione nel componente EditReservationDialog
      resourceId,
    })

    //reservationId, startDate,duration,resourceId

    const reservationStart = new Date(date)
    reservationStart.setHours(Number.parseInt(startTime.split(":")[0]), Number.parseInt(startTime.split(":")[1]), 0, 0)
    const startDate =
      reservationStart.toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" }) + "T" + startTime + ":00"

    const updateResponse = await request({
      url: "/api/admin/updateReservation",
      method: "POST",
      body: {
        reservationId,
        startDate,
        duration,
        resourceId,
      },
      token,
      loadFunction,
    })
    if (updateResponse && updateResponse.ok) {
      alert("Prenotazione aggiornata con successo")
    } else {
      alert("Errore durante l'aggiornamento della prenotazione, controlla la disponibilità su Playtomic")
    }

    // Qui implementerai la chiamata API per modificare la prenotazione

    setIsEditDialogOpen(false)
    setSelectedReservation(null)
    fetchReservations()
  }

  // Metodo per aprire il dialog di cancellazione
  const handleDelete = (reservation) => {
    setSelectedReservation(reservation)
    setIsRefund(false)
    setIsDeleteDialogOpen(true)
  }

  // Metodo per gestire la cancellazione della prenotazione
  const handleConfermaDelete = () => {
    setIsConfirmDeleteOpen(true)
  }

  // Metodo per eseguire la cancellazione effettiva
  const executeDelete = async () => {
    console.log("Cancella prenotazione:", selectedReservation.reservationId, "con rimborso:", isRefund)
    // Qui implementerai la chiamata API per cancellare la prenotazione
    const reservationId = selectedReservation.reservationId
    const refund = isRefund ? "S" : "N"
    setIsConfirmDeleteOpen(false)
    setIsDeleteDialogOpen(false)
    const cancelResponse = await request({
      url: "/api/admin/cancelReservation",
      method: "POST",
      body: {
        reservationId,
        refund,
      },
      token,
      loadFunction,
    })
    if (cancelResponse && cancelResponse.ok) {
      alert("Prenotazione cancellata con successo")
    } else {
      alert("Errore durante la cancellazione della prenotazione")
    }

    fetchReservations()
  }

  // Gestisce l'espansione/collasso delle righe nella vista mobile
  const toggleRowExpansion = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Gestisce la selezione della data
  const handleDateSelect = (date) => {
    setStartDate(date)
    setIsCalendarOpen(false)
    setCurrentPage(1) // Resetta alla prima pagina quando cambia la data
  }

  // Modifica la funzione clearDateFilter
  const clearFilters = () => {
    setStartDate(null)
    setEndDate(null)
    setSearchText("")
    setCurrentPage(1)
  }

  // Gestisce il cambio pagina
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPagesState) {
      setCurrentPage(newPage)
    }
  }

  // Componente per la paginazione
  const Pagination = () => {
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          {reservations.length > 0 ? (
            <>
              Mostrando {Math.min(reservations.length, (currentPage - 1) * itemsPerPage + 1)}-
              {Math.min(reservations.length, currentPage * itemsPerPage)} di {reservations.length} prenotazioni
              {allReservations.length > reservations.length && (
                <span className="ml-1 text-blue-500">(filtrate da {allReservations.length} totali)</span>
              )}
            </>
          ) : (
            <>Nessuna prenotazione corrisponde ai filtri</>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Pagina precedente</span>
          </Button>
          <span className="text-sm">
            Pagina {currentPage} di {totalPagesState || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPagesState || totalPagesState === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Pagina successiva</span>
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center p-8">Caricamento prenotazioni in corso...</div>
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Errore: {error}</div>
  }

  if (allReservations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold">Prenotazioni</h2>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <DateFilter
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              searchText={searchText}
              setSearchText={setSearchText}
              clearFilters={clearFilters}
            />
            <Button onClick={fetchReservations} variant="outline" className="w-full md:w-auto">
              Aggiorna
            </Button>
          </div>
        </div>
        <div className="text-center p-8 bg-gray-50 rounded-lg">Nessuna prenotazione trovata</div>
      </div>
    )
  }

  const currentReservations = getCurrentPageReservations()

  // Vista mobile con card ottimizzate
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold">Prenotazioni</h2>
          <div className="flex flex-col gap-2 w-full">
            <DateFilter
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              searchText={searchText}
              setSearchText={setSearchText}
              clearFilters={clearFilters}
            />
            <Button onClick={fetchReservations} variant="outline" className="w-full md:w-auto">
              Aggiorna
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {currentReservations.map((reservation) => (
            <div
              key={reservation.reservationId}
              className="bg-white text-black rounded-lg shadow border overflow-hidden"
            >
              {/* Intestazione card con info principali e stato */}
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <div className="flex flex-col">
                  <div className="font-medium">
                    {reservation.name} {reservation.surname}
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(reservation.startDate)}</div>
                </div>
                <Badge
                  className={`${
                    reservation.valid === "Y" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  } hover:bg-opacity-80`}
                >
                  {reservation.valid === "Y" ? "Valida" : "Non valida"}
                </Badge>
              </div>

              {/* Informazioni principali sempre visibili */}
              <div className="p-3 flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">{getCourtName(reservation.resourceId)}</div>
                  <div className="text-sm text-gray-500">Durata: {formatDuration(reservation.duration)}</div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(reservation)}
                    className="h-8 w-8 p-0"
                    disabled={reservation.valid !== "Y"}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Modifica</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(reservation)}
                    className="h-8 w-8 p-0 text-red-500"
                    disabled={reservation.valid === "R"}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Cancella</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRowExpansion(reservation.reservationId)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expandedRows[reservation.reservationId] ? "rotate-180" : ""}`}
                    />
                    <span className="sr-only">Dettagli</span>
                  </Button>
                </div>
              </div>

              {/* Dettagli espandibili */}
              {expandedRows[reservation.reservationId] && (
                <div className="p-3 pt-0 border-t text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-500">Email:</div>
                    <div className="truncate">{reservation.email}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-500">Telefono:</div>
                    <div>{reservation.phoneNumber}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-500">Marketing:</div>
                    <div>{reservation.marketing === "Y" ? "Sì" : "No"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-500">Ultimo aggiornamento:</div>
                    <div>{formatDate(reservation.lastUpd)}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {totalPagesState > 1 && <Pagination />}

        {/* Dialog di modifica */}
        <EditReservationDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          reservation={selectedReservation}
          formData={editFormData}
          setFormData={setEditFormData}
          courts={courts}
          onSubmit={handleModifica}
          getCourtName={getCourtName}
          hours={hours}
          setHours={setHours}
          minutes={minutes}
          setMinutes={setMinutes}
          AVAILABLE_TIMES={AVAILABLE_TIMES}
        />

        {/* Dialog di cancellazione */}
        <DeleteReservationDialog
          isOpen={isDeleteDialogOpen}
          setIsOpen={setIsDeleteDialogOpen}
          reservation={selectedReservation}
          isRefund={isRefund}
          setIsRefund={setIsRefund}
          onConfirm={handleConfermaDelete}
          getCourtName={getCourtName}
          formatDate={formatDate}
        />

        {/* Dialog di conferma cancellazione */}
        <ConfirmDeleteDialog
          isOpen={isConfirmDeleteOpen}
          setIsOpen={setIsConfirmDeleteOpen}
          isRefund={isRefund}
          onConfirm={executeDelete}
        />
      </div>
    )
  }

  // Vista desktop con tabella
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Prenotazioni</h2>
          <span className="text-sm text-gray-500">
            ({getFilteredReservations().length} {getFilteredReservations().length === 1 ? "risultato" : "risultati"})
          </span>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <DateFilter
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            searchText={searchText}
            setSearchText={setSearchText}
            clearFilters={clearFilters}
          />
          <Button onClick={fetchReservations} variant="outline">
            Aggiorna
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full bg-white text-black">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-4 border-b text-left font-medium text-gray-500">Nome</th>
              <th className="py-2 px-4 border-b text-left font-medium text-gray-500">Email</th>
              <th className="py-2 px-4 border-b text-left font-medium text-gray-500">Telefono</th>
              <th className="py-2 px-4 border-b text-left font-medium text-gray-500">Campo</th>
              <th className="py-2 px-4 border-b text-left font-medium text-gray-500">Data Inizio</th>
              <th className="py-2 px-4 border-b text-left font-medium text-gray-500">Durata</th>
              <th className="py-2 px-4 border-b text-left font-medium text-gray-500">Stato</th>
              <th className="py-2 px-4 border-b text-left font-medium text-gray-500">Marketing</th>
              <th className="py-2 px-4 border-b text-left font-medium text-gray-500">Ultimo Aggiornamento</th>
              <th className="py-2 px-4 border-b text-center font-medium text-gray-500">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {currentReservations.map((reservation) => (
              <tr key={reservation.reservationId} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">
                  {reservation.name} {reservation.surname}
                </td>
                <td className="py-3 px-4 border-b">{reservation.email}</td>
                <td className="py-3 px-4 border-b">{reservation.phoneNumber}</td>
                <td className="py-3 px-4 border-b">{getCourtName(reservation.resourceId)}</td>
                <td className="py-3 px-4 border-b">{formatDate(reservation.startDate)}</td>
                <td className="py-3 px-4 border-b">{formatDuration(reservation.duration)}</td>
                <td className="py-3 px-4 border-b">
                  <Badge
                    className={`${
                      reservation.valid === "Y" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    } hover:bg-opacity-80`}
                  >
                    {reservation.valid === "Y"
                      ? "Valida"
                      : reservation.valid === "R"
                        ? "Rimborsata"
                        : reservation.valid === "C"
                          ? "Cancellata"
                          : "Non valida"}
                  </Badge>
                </td>
                <td className="py-3 px-4 border-b">{reservation.marketing === "Y" ? "Sì" : "No"}</td>
                <td className="py-3 px-4 border-b">{formatDate(reservation.lastUpd)}</td>
                <td className="py-3 px-4 border-b">
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(reservation)}
                      className="h-8 w-8 p-0"
                      disabled={reservation.valid !== "Y"}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Modifica</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(reservation)}
                      className="h-8 w-8 p-0 text-red-500"
                      disabled={reservation.valid === "R"}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Cancella</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPagesState > 1 && <Pagination />}

      {/* Dialog di modifica */}
      <EditReservationDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        reservation={selectedReservation}
        formData={editFormData}
        setFormData={setEditFormData}
        courts={courts}
        onSubmit={handleModifica}
        getCourtName={getCourtName}
        hours={hours}
        setHours={setHours}
        minutes={minutes}
        setMinutes={setMinutes}
        AVAILABLE_TIMES={AVAILABLE_TIMES}
      />

      {/* Dialog di cancellazione */}
      <DeleteReservationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        reservation={selectedReservation}
        isRefund={isRefund}
        setIsRefund={setIsRefund}
        onConfirm={handleConfermaDelete}
        getCourtName={getCourtName}
        formatDate={formatDate}
      />

      {/* Dialog di conferma cancellazione */}
      <ConfirmDeleteDialog
        isOpen={isConfirmDeleteOpen}
        setIsOpen={setIsConfirmDeleteOpen}
        isRefund={isRefund}
        onConfirm={executeDelete}
      />
    </div>
  )
}

// Modifica il componente DateFilter per includere i nuovi filtri
function DateFilter({ startDate, setStartDate, endDate, setEndDate, searchText, setSearchText, clearFilters }) {
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <div className="flex items-center gap-2">
        <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 min-w-[120px]">
              <Calendar className="h-4 w-4" />
              {startDate ? format(startDate, "dd/MM/yyyy", { locale: it }) : "Data da"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                setStartDate(date)
                setIsStartDateOpen(false)
              }}
              initialFocus
              locale={it}
              className={"bg-white"}
              fromDate={undefined}
              disabled={undefined}
              calendarHistoryDisabled={undefined}
              startMonth={new Date(new Date().getFullYear(), new Date().getMonth() - 24)} // Imposta il mese iniziale del calendario
            />
          </PopoverContent>
        </Popover>

        <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 min-w-[120px]">
              <Calendar className="h-4 w-4" />
              {endDate ? format(endDate, "dd/MM/yyyy", { locale: it }) : "Data a"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={endDate}
              onSelect={(date) => {
                setEndDate(date)
                setIsEndDateOpen(false)
              }}
              initialFocus
              locale={it}
              className={"bg-white"}
              fromDate={undefined}
              disabled={undefined}
              calendarHistoryDisabled={undefined}
              startMonth={new Date(new Date().getFullYear(), new Date().getMonth() - 24)} // Imposta il mese iniziale del calendario
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Cerca per nome, email, telefono..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)} // Rimuovi clearFilters()
          className="pl-10"
        />
      </div>

      {(startDate || endDate || searchText) && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
          Rimuovi filtri
        </Button>
      )}
    </div>
  )
}

// Modifica il componente EditReservationDialog per incorporare direttamente il calendario invece di usare un Popover

function EditReservationDialog({
  isOpen,
  setIsOpen,
  reservation,
  formData,
  setFormData,
  courts,
  onSubmit,
  getCourtName,
  hours,
  setHours,
  minutes,
  setMinutes,
  AVAILABLE_TIMES,
}) {
  const [showCalendar, setShowCalendar] = useState(false)
  // Importa format e it dalla libreria date-fns
  const { format } = require("date-fns")
  const { it } = require("date-fns/locale")

  if (!reservation) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Modifica Prenotazione</DialogTitle>
          <DialogDescription>
            Modifica i dettagli della prenotazione di {reservation.name} {reservation.surname}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Data
            </Label>
            <div className="col-span-3">
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => setShowCalendar(!showCalendar)}
                type="button"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {formData.date ? format(formData.date, "dd/MM/yyyy", { locale: it }) : "Seleziona data"}
              </Button>

              {showCalendar && (
                <div className="mt-2 p-2 border rounded-md bg-white shadow-md">
                  <CalendarComponent
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      setFormData({ ...formData, date })
                      setShowCalendar(false)
                    }}
                    initialFocus
                    locale={it}
                    className="bg-white w-fit"
                    fromDate={undefined}
                    disabled={undefined}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">
              Ora inizio
            </Label>
            <div className="col-span-3">
              <Select
                value={formData.startTime}
                onValueChange={(value) => setFormData({ ...formData, startTime: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {AVAILABLE_TIMES.map((time) => (
                    <SelectItem key={time} value={time} className="cursor-pointer">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Durata
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <div className="w-20">
                <Label htmlFor="hours" className="text-xs text-gray-500 mb-1 block">
                  Ore
                </Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="text-center"
                />
              </div>
              <span className="text-lg font-medium">:</span>
              <div className="w-20">
                <Label htmlFor="minutes" className="text-xs text-gray-500 mb-1 block">
                  Minuti
                </Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="text-center"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="resourceId" className="text-right">
              Campo
            </Label>
            <div className="col-span-3">
              <Select
                value={formData.resourceId}
                onValueChange={(value) => setFormData({ ...formData, resourceId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona campo" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {courts.map((court) => (
                    <SelectItem key={court.resource_id} value={court.resource_id} className="cursor-pointer">
                      {court.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annulla
          </Button>
          <Button onClick={onSubmit}>Conferma modifica</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Componente per il dialog di cancellazione prenotazione
function DeleteReservationDialog({
  isOpen,
  setIsOpen,
  reservation,
  isRefund,
  setIsRefund,
  onConfirm,
  getCourtName,
  formatDate,
}) {
  if (!reservation) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" /> Cancella Prenotazione
          </DialogTitle>
          <DialogDescription>Stai per cancellare la seguente prenotazione:</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500">Nome e cognome:</div>
            <div className="font-medium">
              {reservation.name} {reservation.surname}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500">Data e ora:</div>
            <div>{formatDate(reservation.startDate)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500">Campo:</div>
            <div>{getCourtName(reservation.resourceId)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500">ID ordine:</div>
            <div>{reservation.reservationId}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500">ID transazione Stripe/Paypal:</div>
            <div className="flex items-center">
              <span className="truncate mr-2">{reservation.paymentSessionId || "N/A"}</span>
              {reservation.paymentSessionId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(reservation.paymentSessionId)
                      .then(() => {
                        alert("ID copiato negli appunti")
                      })
                      .catch((err) => {
                        console.error("Errore durante la copia: ", err)
                        alert("Impossibile copiare l'ID")
                      })
                  }}
                >
                  <Copy className="h-3 w-3" />
                  <span className="sr-only">Copia ID</span>
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-4">
            <Checkbox id="refund" checked={isRefund} onCheckedChange={(checked) => setIsRefund(checked === true)} />
            <Label
              htmlFor="refund"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Effettua rimborso completo
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annulla
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Conferma cancellazione
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Componente per il dialog di conferma cancellazione
function ConfirmDeleteDialog({ isOpen, setIsOpen, isRefund, onConfirm }) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
          <AlertDialogDescription>
            {isRefund
              ? "Sei sicuro di voler eliminare la prenotazione e rimborsare la cifra completa?"
              : "Sei sicuro di voler eliminare la prenotazione?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Conferma
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
