"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Star,
  Users,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  User,
  Award,
  TimerIcon,
  BicepsFlexed,
} from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/Badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/Dialog"
import { request } from "../utils/request"

export default function UsersManagement({ loadFunction, token }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Stati per la ricerca e paginazione
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPageDesktop = 10
  const itemsPerPageMobile = 5

  // Stati per la modifica punti
  const [isEditPointsOpen, setIsEditPointsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newPoints, setNewPoints] = useState("")
  const [pointsError, setPointsError] = useState("")
  const [submitting, setSubmitting] = useState(false)

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
    fetchUsers()
  }, [])

  // Reset pagina quando cambia il termine di ricerca
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Carica gli utenti
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await request({
        url: "/api/admin/getUsers",
        method: "POST",
        body: {},
        token,
        loadFunction,
      })

      if (response.ok) {
        setUsers(response.data.users || [])
      } else {
        setError("Errore nel caricamento degli utenti")
      }
    } catch (err) {
      setError("Errore di connessione")
      console.error("Errore nel caricamento utenti:", err)
    } finally {
      setLoading(false)
    }
  }

  // Filtra gli utenti in base al termine di ricerca
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users

    const searchLower = searchTerm.toLowerCase()
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.surname?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phoneNumber?.toLowerCase().includes(searchLower) ||
        `${user.name} ${user.surname}`.toLowerCase().includes(searchLower),
    )
  }, [users, searchTerm])

  // Calcola paginazione
  const itemsPerPage = isMobile ? itemsPerPageMobile : itemsPerPageDesktop
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  // Gestisce il cambio pagina
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Apre il dialog per modificare i punti
  const handleEditPoints = (user) => {
    setSelectedUser(user)
    setNewPoints(user.points?.toString() || "0")
    setPointsError("")
    setIsEditPointsOpen(true)
  }

  // Valida i punti inseriti
  const validatePoints = (points) => {
    if (!points.trim()) {
      return "I punti sono obbligatori"
    }
    if (isNaN(Number(points))) {
      return "I punti devono essere un numero"
    }
    if (Number(points) < 0) {
      return "I punti non possono essere negativi"
    }
    return ""
  }

  // Gestisce la modifica dei punti
  const handleSubmitPoints = async () => {
    const error = validatePoints(newPoints)
    if (error) {
      setPointsError(error)
      return
    }

    setSubmitting(true)

    try {
      const response = await request({
        url: "/api/admin/modifyPoints",
        method: "POST",
        body: {
          userId: selectedUser.userId,
          points: Number(newPoints),
        },
        token,
        loadFunction,
      })

      if (response.ok) {
        alert("Punti aggiornati con successo")
        setIsEditPointsOpen(false)
        fetchUsers() // Ricarica la lista utenti
      } else {
        alert(response.data?.message || "Errore durante l'aggiornamento dei punti")
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento punti:", error)
      alert("Errore durante l'aggiornamento dei punti")
    } finally {
      setSubmitting(false)
    }
  }

  // Formatta il nome completo
  const formatFullName = (user) => {
    return `${user.name || ""} ${user.surname || ""}`.trim() || "Nome non disponibile"
  }

  // Formatta il numero di telefono
  const formatPhoneNumber = (phone) => {
    if (!phone) return "Non disponibile"
    // Formatta il numero se è italiano
    if (phone.startsWith("+39") || phone.startsWith("39")) {
      const cleanPhone = phone.replace(/^\+?39/, "")
      return `+39 ${cleanPhone}`
    }
    return phone
  }

  // Componente per la paginazione
  const Pagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Mostrando {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} di {filteredUsers.length} utenti
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
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento utenti...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-red-600">Errore</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchUsers} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Riprova
        </Button>
      </div>
    )
  }

  // Vista mobile con card
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Gestione Utenti</h2>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>

        {/* Statistiche rapide */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center bg-white">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-gray-600">Utenti totali</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center bg-white">
              <div className="text-2xl font-bold text-green-600">{filteredUsers.length}</div>
              <div className="text-sm text-gray-600">Risultati</div>
            </CardContent>
          </Card>
        </div>

        {/* Campo di ricerca */}
        <div className="relative bg-white text-black rounded-md shadow-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cerca per nome, email o telefono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista utenti */}
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{searchTerm ? "Nessun utente trovato" : "Nessun utente"}</h3>
              <p className="text-gray-600">
                {searchTerm ? "Prova a modificare i termini di ricerca." : "Non ci sono utenti registrati nel sistema."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentUsers.map((user) => (
              <Card key={user.userId}>
                <CardContent className="p-4 bg-white text-black">
                  <div className="flex flex-col justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <h3 className="font-semibold">{formatFullName(user)}</h3>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{formatPhoneNumber(user.phoneNumber)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="font-medium">{user.points || 0} punti</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row items-center gap-2">
                      <Badge
                        className={user.marketing === "Y" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {user.marketing === "Y" ? "Marketing" : "No Marketing"}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleEditPoints(user)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Punti
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Pagination />

        {/* Dialog modifica punti */}
        <EditPointsDialog
          isOpen={isEditPointsOpen}
          setIsOpen={setIsEditPointsOpen}
          user={selectedUser}
          newPoints={newPoints}
          setNewPoints={setNewPoints}
          pointsError={pointsError}
          setPointsError={setPointsError}
          submitting={submitting}
          onSubmit={handleSubmitPoints}
          formatFullName={formatFullName}
          validatePoints={validatePoints}
        />
      </div>
    )
  }

  // Vista desktop con tabella
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Gestione Utenti</h2>
          <span className="text-sm text-gray-500">
            ({filteredUsers.length} di {users.length} utenti)
          </span>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center bg-white rounded-md shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-sm text-gray-600">Utenti totali</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center bg-white rounded-md shadow-sm">
            <div className="text-2xl font-bold text-green-600">{users.filter((u) => u.marketing === "Y").length}</div>
            <div className="text-sm text-gray-600">Marketing attivo</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center bg-white rounded-md shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {users.reduce((sum, u) => sum + (u.points || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Punti totali</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center bg-white rounded-md shadow-sm">
            <div className="text-2xl font-bold text-orange-600">
              {users.length > 0 ? Math.round(users.reduce((sum, u) => sum + (u.points || 0), 0) / users.length) : 0}
            </div>
            <div className="text-sm text-gray-600">Media punti</div>
          </CardContent>
        </Card>
      </div>

      {/* Campo di ricerca */}
      <div className="relative max-w-md bg-white rounded-md shadow-sm text-black">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Cerca per nome, email o telefono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabella */}
      <Card>
        <CardContent className="p-0 bg-white rounded-md shadow-sm text-black">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{searchTerm ? "Nessun utente trovato" : "Nessun utente"}</h3>
              <p className="text-gray-600">
                {searchTerm ? "Prova a modificare i termini di ricerca." : "Non ci sono utenti registrati nel sistema."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefono</TableHead>
                    <TableHead>Marketing</TableHead>
                    <TableHead>Punti</TableHead>
                    <TableHead>Ore Giocate Padel</TableHead>
                    <TableHead>Ore Giocate Calcio</TableHead>
                    <TableHead>Livello Padel Playtomic</TableHead>
                    <TableHead className="text-center">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.map((user) => (
                    <TableRow key={user.userId} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          {formatFullName(user)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="truncate max-w-xs">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          {formatPhoneNumber(user.phoneNumber)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.marketing === "Y" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }
                        >
                          {user.marketing === "Y" ? "Attivo" : "Non attivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{user.points || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TimerIcon className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{user.padelHrs || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TimerIcon className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{user.futsalHrs || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BicepsFlexed className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{user.padelLvl || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Button variant="ghost" size="sm" onClick={() => handleEditPoints(user)} className="h-8 px-3">
                            <Edit className="h-4 w-4 mr-1" />
                            Modifica punti
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination />

      {/* Dialog modifica punti */}
      <EditPointsDialog
        isOpen={isEditPointsOpen}
        setIsOpen={setIsEditPointsOpen}
        user={selectedUser}
        newPoints={newPoints}
        setNewPoints={setNewPoints}
        pointsError={pointsError}
        setPointsError={setPointsError}
        submitting={submitting}
        onSubmit={handleSubmitPoints}
        formatFullName={formatFullName}
        validatePoints={validatePoints}
      />
    </div>
  )
}

// Componente Dialog per la modifica punti
function EditPointsDialog({
  isOpen,
  setIsOpen,
  user,
  newPoints,
  setNewPoints,
  pointsError,
  setPointsError,
  submitting,
  onSubmit,
  formatFullName,
  validatePoints,
}) {
  if (!user) return null

  const handlePointsChange = (value) => {
    setNewPoints(value)
    if (pointsError) {
      const error = validatePoints(value)
      setPointsError(error)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[400px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Modifica Punti
          </DialogTitle>
          <DialogDescription>
            Modifica i punti per <strong>{formatFullName(user)}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">Utente:</div>
              <div className="font-medium">{formatFullName(user)}</div>
              <div className="text-sm text-gray-600 mt-1">{user.email}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentPoints">Punti attuali</Label>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold">{user.points || 0} punti</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPoints">Nuovi punti *</Label>
            <Input
              id="newPoints"
              type="number"
              min="0"
              step="1"
              value={newPoints}
              onChange={(e) => handlePointsChange(e.target.value)}
              placeholder="Inserisci i nuovi punti"
              className={pointsError ? "border-red-500" : ""}
              autoFocus
            />
            {pointsError && <p className="text-sm text-red-500">{pointsError}</p>}
          </div>

          {newPoints && !pointsError && (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-sm text-blue-800">
                <strong>Variazione:</strong> {Number(newPoints) - (user.points || 0) >= 0 ? "+" : ""}
                {Number(newPoints) - (user.points || 0)} punti
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={submitting}>
              Annulla
            </Button>
            <Button type="submit" disabled={submitting || !!pointsError}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Aggiornamento...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Aggiorna punti
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
