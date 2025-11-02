"use client"

import { useState, useEffect, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import {
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronRight,
  Search,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/Badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export default function UserReservationsTable({
  reservations = [],
  courts = [],
  loading = false,
  onRefresh,
  onViewDetails,
  onCancelReservation,
}) {
  const [isMobile, setIsMobile] = useState(false)
  const [expandedRows, setExpandedRows] = useState({})

  // Stati per paginazione
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage,setItemsPerPage] = useState(5)

  // Stati per ricerca e filtri
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [courtTypeFilter, setCourtTypeFilter] = useState("all")

  // Stati per ordinamento
  const [sortBy, setSortBy] = useState("START_DATE")
  const [sortOrder, setSortOrder] = useState("desc") // desc = più recenti prima

  // Rileva se il dispositivo è mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setItemsPerPage(window.innerWidth < 768 ? 3 : 5) // 3 per mobile, 5 per desktop
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, courtTypeFilter])

  // Formatta la data in modo leggibile
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString)
      return format(date, "EEEE d MMMM yyyy", { locale: it })
    } catch (error) {
      return dateString
    }
  }

  // Formatta l'orario
  const formatTime = (dateString) => {
    try {
      const date = parseISO(dateString)
      return format(date, "HH:mm", { locale: it })
    } catch (error) {
      return dateString
    }
  }

  // Formatta la durata da minuti a ore e minuti
  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return "0 min"

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

  // Ottiene il nome del campo dal RESOURCE_ID
  const getCourtName = (resourceId) => {
    const court = courts.find((court) => court.resource_id === resourceId)
    return court ? court.name : `Campo ${resourceId}`
  }

  // Ottiene il tipo di sport dal RESOURCE_ID
  const getCourtType = (resourceId) => {
    const court = courts.find((court) => court.resource_id === resourceId)
    if (!court) return "Sconosciuto"

    if (court.sport_id === "PADEL") {
      return court.properties?.resource_type === "indoor" ? "Padel Coperto" : "Padel all'aperto"
    } else if (court.sport_id === "FUTSAL") {
      return "Calcio a 5"
    }
    return court.sport_id || "Sconosciuto"
  }

  // Determina se la prenotazione è nel passato, presente o futuro
  const getReservationStatus = (startDate, endDate) => {
    const now = new Date()
    const start = parseISO(startDate)
    const end = parseISO(endDate)

    if (end < now) {
      return { status: "completed", label: "Completata", color: "bg-gray-100 text-gray-800" }
    } else if (start <= now && now <= end) {
      return { status: "active", label: "In corso", color: "bg-green-100 text-green-800" }
    } else {
      return { status: "upcoming", label: "Prossima", color: "bg-blue-100 text-blue-800" }
    }
  }

  // Gestisce l'espansione/collasso delle righe nella vista mobile
  const toggleRowExpansion = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  // Gestisce l'ordinamento
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  // Ottiene l'icona di ordinamento
  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  // Filtra e ordina le prenotazioni
  const filteredAndSortedReservations = useMemo(() => {
    const filtered = reservations.filter((reservation) => {
      // Filtro per testo di ricerca
      const searchLower = searchTerm.toLowerCase()
      const courtName = getCourtName(reservation.RESOURCE_ID).toLowerCase()
      const courtType = getCourtType(reservation.RESOURCE_ID).toLowerCase()
      const date = formatDate(reservation.START_DATE).toLowerCase()

      const matchesSearch =
        courtName.includes(searchLower) || courtType.includes(searchLower) || date.includes(searchLower)

      if (!matchesSearch) return false

      // Filtro per stato
      if (statusFilter !== "all") {
        const status = getReservationStatus(reservation.START_DATE, reservation.END_DATE).status
        if (status !== statusFilter) return false
      }

      // Filtro per tipo campo
      if (courtTypeFilter !== "all") {
        const courtType = getCourtType(reservation.RESOURCE_ID)
        if (courtType !== courtTypeFilter) return false
      }

      return true
    })

    // Ordinamento
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case "START_DATE":
          aValue = new Date(a.START_DATE)
          bValue = new Date(b.START_DATE)
          break
        case "DURATION":
          aValue = a.DURATION || 0
          bValue = b.DURATION || 0
          break
        case "COURT_NAME":
          aValue = getCourtType(a.RESOURCE_ID)
          bValue = getCourtType(b.RESOURCE_ID)
          break
        case "COURT_TYPE":
          aValue = getCourtType(a.RESOURCE_ID)
          bValue = getCourtType(b.RESOURCE_ID)
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [reservations, searchTerm, statusFilter, courtTypeFilter, sortBy, sortOrder, courts])

  // Calcola paginazione
  const totalPages = Math.ceil(filteredAndSortedReservations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentReservations = filteredAndSortedReservations.slice(startIndex, endIndex)

  // Gestisce il cambio pagina
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Calcola statistiche sui dati filtrati
  const stats = {
    total: filteredAndSortedReservations.length,
    upcoming: filteredAndSortedReservations.filter(
      (r) => getReservationStatus(r.START_DATE, r.END_DATE).status === "upcoming",
    ).length,
    completed: filteredAndSortedReservations.filter(
      (r) => getReservationStatus(r.START_DATE, r.END_DATE).status === "completed",
    ).length,
    totalHours: filteredAndSortedReservations.reduce((acc, r) => acc + (r.DURATION || 0), 0) / 60,
  }

  // Ottiene i tipi di campo unici per il filtro
  const uniqueCourtTypes = [...new Set(reservations.map((r) => getCourtType(r.RESOURCE_ID)))]

  // Componente per la paginazione
  const Pagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-white">
          Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAndSortedReservations.length)} di{" "}
          {filteredAndSortedReservations.length} prenotazioni
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
          <span className="text-sm text-white">
            Pagina {currentPage} di {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
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
    return (
      <div className="space-y-4">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento prenotazioni...</p>
        </div>
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="md:text-2xl text-lg font-bold text-[#FFD100]">Le tue prenotazioni</h2>
          {onRefresh && (
            <Button className={"bg-white text-xs md:text-lg  hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194]"} onClick={onRefresh} variant="outline">
              Aggiorna
            </Button>
          )}
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuna prenotazione trovata</h3>
            <p className="text-gray-600">Non hai ancora effettuato nessuna prenotazione.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vista mobile con card
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#FFD100]">Le tue prenotazioni</h2>
          {onRefresh && (
            <Button className={"bg-white hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194]"} onClick={onRefresh} variant="outline" size="sm">
              Aggiorna
            </Button>
          )}
        </div>

        {/* Statistiche rapide */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
              <div className="text-sm text-gray-600">Prossime</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="md:p-4 py-4 text-center bg-white rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
              <div className="text-sm text-center text-gray-600">Completate</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista prenotazioni */}
        {filteredAndSortedReservations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 bg-white">
              <p className="text-gray-600">Nessuna prenotazione trovata con i filtri selezionati.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentReservations.map((reservation, index) => {
              const status = getReservationStatus(reservation.START_DATE, reservation.END_DATE)
              const isExpanded = expandedRows[startIndex + index]

              return (
                <Card key={startIndex + index} className="overflow-hidden">
                  {/* Header card */}
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <div className="flex flex-col">
                      <div className="font-medium">{getCourtType(reservation.RESOURCE_ID)}</div>
                      <div className="text-sm text-gray-500">{formatDate(reservation.START_DATE)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={status.color}>{status.label}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(startIndex + index)}
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Informazioni principali sempre visibili */}
                  <div className="p-4 bg-white">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>
                            {formatTime(reservation.START_DATE)} - {formatTime(reservation.END_DATE)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{formatDuration(reservation.DURATION)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dettagli espandibili */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t bg-gray-50 space-y-3">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tipo campo:</span>
                          <span>{getCourtType(reservation.RESOURCE_ID)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Data inizio:</span>
                          <span>
                            {formatDate(reservation.START_DATE)} {formatTime(reservation.START_DATE)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Data fine:</span>
                          <span>
                            {formatDate(reservation.END_DATE)} {formatTime(reservation.END_DATE)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        <Pagination />
      </div>
    )
  }

  // Vista desktop con tabella
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-[#FFD100]">Le tue prenotazioni</h2>
          <span className="text-sm text-white">({stats.total} prenotazioni)</span>
        </div>
        {onRefresh && (
          <Button
            className="bg-white hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194]"
            onClick={onRefresh}
            variant="outline"
          >
            Aggiorna
          </Button>
        )}
      </div>


      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center bg-white rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Totali</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center bg-white rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.upcoming}</div>
            <div className="text-sm text-gray-600">Prossime</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center bg-white rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center bg-white rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.totalHours.toFixed(1)}h</div>
            <div className="text-sm text-gray-600">Ore totali</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabella */}
      <Card>
        <CardContent className="p-0 bg-white rounded-lg">
          {filteredAndSortedReservations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Nessuna prenotazione trovata con i filtri selezionati.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("COURT_NAME")}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Campo {getSortIcon("COURT_NAME")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("COURT_TYPE")}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Tipo {getSortIcon("COURT_TYPE")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("START_DATE")}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Data {getSortIcon("START_DATE")}
                      </Button>
                    </TableHead>
                    <TableHead>Orario</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("DURATION")}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Durata {getSortIcon("DURATION")}
                      </Button>
                    </TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentReservations.map((reservation, index) => {
                    const status = getReservationStatus(reservation.START_DATE, reservation.END_DATE)

                    return (
                      <TableRow key={startIndex + index} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            {getCourtType(reservation.RESOURCE_ID)}
                          </div>
                        </TableCell>
                        <TableCell>{getCourtType(reservation.RESOURCE_ID)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            {formatDate(reservation.START_DATE)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            {formatTime(reservation.START_DATE)} - {formatTime(reservation.END_DATE)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDuration(reservation.DURATION)}</TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination />
    </div>
  )
}
