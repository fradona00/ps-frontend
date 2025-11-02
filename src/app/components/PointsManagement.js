"use client"

import { useState, useEffect } from "react"
import { Edit, Trash2, Plus, Save, Star, AlertCircle, Trophy } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/Badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/Dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
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
import { request } from "../utils/request"

export default function PointsManagement({ loadFunction, token }) {
  const [pointsRates, setPointsRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Stati per il form di inserimento/modifica
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    sportName: "",
    duration: "",
    pointsRate: "",
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Stati per la cancellazione
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [rateToDelete, setRateToDelete] = useState(null)

  // Opzioni disponibili per sport e durata
  const sportOptions = [
    { value: "PADEL", label: "Padel" },
    { value: "FUTSAL", label: "Calcio a 5" }
  ]

  const durationOptions = [
    { value: 60, label: "1 ora" },
    { value: 90, label: "1 ora e 30 minuti" },
    { value: 120, label: "2 ore" },
    { value: 150, label: "2 ore e 30 minuti" },
    { value: 180, label: "3 ore" },
  ]

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
    fetchPointsRates()
  }, [])

  // Carica i tassi di punti
  const fetchPointsRates = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await request({
        url: "/api/admin/getPointsRate",
        method: "POST",
        body: {},
        token,
        loadFunction,
      })

      if (response.ok) {
        setPointsRates(response.data.pointsRates || [])
      } else {
        setError("Errore nel caricamento dei tassi di punti")
      }
    } catch (err) {
      setError("Errore di connessione")
      console.error("Errore nel caricamento tassi punti:", err)
    } finally {
      setLoading(false)
    }
  }

  // Formatta il nome dello sport
  const formatSportName = (sportName) => {
    const sport = sportOptions.find((s) => s.value === sportName)
    return sport ? sport.label : sportName
  }

  // Formatta la durata
  const formatDuration = (duration) => {
    const durationOption = durationOptions.find((d) => d.value === Number(duration))
    return durationOption ? durationOption.label : `${duration} minuti`
  }

  // Ottiene il colore del badge per lo sport
  const getSportBadgeColor = (sportName) => {
    switch (sportName) {
      case "PADEL":
        return "bg-green-100 text-green-800"
      case "FUTSAL":
        return "bg-blue-100 text-blue-800"
      case "TENNIS":
        return "bg-yellow-100 text-yellow-800"
      case "BASKET":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Apre il form per un nuovo tasso
  const handleAddNew = () => {
    setFormData({
      sportName: "",
      duration: "",
      pointsRate: "",
    })
    setFormErrors({})
    setIsEditing(false)
    setIsFormOpen(true)
  }

  // Apre il form per modificare un tasso
  const handleEdit = (rate) => {
    setFormData({
      sportName: rate.sportName,
      duration: rate.duration.toString(),
      pointsRate: rate.pointsRate.toString(),
    })
    setFormErrors({})
    setIsEditing(true)
    setIsFormOpen(true)
  }

  // Gestisce i cambiamenti nel form
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Rimuove l'errore per il campo modificato
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  // Valida il form
  const validateForm = () => {
    const errors = {}

    if (!formData.sportName) {
      errors.sportName = "Lo sport è obbligatorio"
    }

    if (!formData.duration) {
      errors.duration = "La durata è obbligatoria"
    }

    if (!formData.pointsRate.trim()) {
      errors.pointsRate = "Il tasso di punti è obbligatorio"
    } else if (isNaN(Number(formData.pointsRate)) || Number(formData.pointsRate) < 0) {
      errors.pointsRate = "Il tasso di punti deve essere un numero positivo"
    }

    // Verifica se esiste già una combinazione sport+durata (solo per nuovi inserimenti)
    if (!isEditing) {
      const exists = pointsRates.some(
        (rate) => rate.sportName === formData.sportName && rate.duration === Number(formData.duration),
      )
      if (exists) {
        errors.sportName = "Esiste già un tasso per questa combinazione sport/durata"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Gestisce il submit del form
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const response = await request({
        url: "/api/admin/upsertPointsRate",
        method: "POST",
        body: {
          sportName: formData.sportName,
          duration: Number(formData.duration),
          pointsRate: Number(formData.pointsRate),
        },
        token,
        loadFunction,
      })

      if (response.ok) {
        alert(isEditing ? "Tasso punti aggiornato con successo" : "Tasso punti creato con successo")
        setIsFormOpen(false)
        fetchPointsRates()
      } else {
        alert(response.data?.message || "Errore durante il salvataggio")
      }
    } catch (error) {
      console.error("Errore nel salvataggio:", error)
      alert("Errore durante il salvataggio")
    } finally {
      setSubmitting(false)
    }
  }

  // Apre il dialog di conferma cancellazione
  const handleDeleteClick = (rate) => {
    setRateToDelete(rate)
    setDeleteDialogOpen(true)
  }

  // Conferma la cancellazione
  const handleDeleteConfirm = async () => {
    if (!rateToDelete) return

    try {
      const response = await request({
        url: "/api/admin/deletePointsRate",
        method: "POST",
        body: {
          sportName: rateToDelete.sportName,
          duration: rateToDelete.duration,
        },
        token,
        loadFunction,
      })

      if (response.ok) {
        alert("Tasso punti eliminato con successo")
        fetchPointsRates()
      } else {
        alert(response.data?.message || "Errore durante l'eliminazione")
      }
    } catch (error) {
      console.error("Errore nell'eliminazione:", error)
      alert("Errore durante l'eliminazione")
    } finally {
      setDeleteDialogOpen(false)
      setRateToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento tassi di punti...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-red-600">Errore</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchPointsRates} variant="outline">
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
          <h2 className="text-xl font-bold">Gestione Tassi Punti</h2>
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo
          </Button>
        </div>

        {pointsRates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessun tasso configurato</h3>
              <p className="text-gray-600 mb-4">Non ci sono tassi di punti configurati.</p>
              <Button onClick={handleAddNew}>Configura il primo tasso</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3  text-black">
            {pointsRates.map((rate, index) => (
              <Card key={`${rate.sportName}-${rate.duration}`}>
                <CardContent className="p-4 bg-white shadow-sm rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSportBadgeColor(rate.sportName)}>{formatSportName(rate.sportName)}</Badge>
                        <span className="text-sm text-gray-600">{formatDuration(rate.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold text-lg">{rate.pointsRate} punti</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(rate)} className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifica
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(rate)}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <PointsRateFormDialog
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          isEditing={isEditing}
          formData={formData}
          formErrors={formErrors}
          submitting={submitting}
          sportOptions={sportOptions}
          durationOptions={durationOptions}
          onFormChange={handleFormChange}
          onSubmit={handleSubmit}
        />

        {/* Delete Dialog */}
        <DeletePointsRateDialog
          isOpen={deleteDialogOpen}
          setIsOpen={setDeleteDialogOpen}
          rate={rateToDelete}
          onConfirm={handleDeleteConfirm}
          formatSportName={formatSportName}
          formatDuration={formatDuration}
        />
      </div>
    )
  }

  // Vista desktop con tabella
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Gestione Tassi Punti</h2>
          <span className="text-sm text-gray-500">({pointsRates.length} configurazioni)</span>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Tasso
        </Button>
      </div>

      {pointsRates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun tasso configurato</h3>
            <p className="text-gray-600 mb-4">
              Configura i tassi di punti per determinare quanti punti gli utenti guadagnano per ogni prenotazione.
            </p>
            <Button onClick={handleAddNew}>Configura il primo tasso</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 bg-white text-black">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sport</TableHead>
                    <TableHead>Durata</TableHead>
                    <TableHead>Punti Assegnati</TableHead>
                    <TableHead>Punti per Ora</TableHead>
                    <TableHead className="text-center">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pointsRates.map((rate) => {
                    const pointsPerHour = (rate.pointsRate / rate.duration) * 60

                    return (
                      <TableRow key={`${rate.sportName}-${rate.duration}`} className="hover:bg-gray-50">
                        <TableCell>
                          <Badge className={getSportBadgeColor(rate.sportName)}>
                            {formatSportName(rate.sportName)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDuration(rate.duration)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold">{rate.pointsRate}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{pointsPerHour.toFixed(1)} punti/ora</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(rate)} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Modifica</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(rate)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Elimina</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <PointsRateFormDialog
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        isEditing={isEditing}
        formData={formData}
        formErrors={formErrors}
        submitting={submitting}
        sportOptions={sportOptions}
        durationOptions={durationOptions}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
      />

      {/* Delete Dialog */}
      <DeletePointsRateDialog
        isOpen={deleteDialogOpen}
        setIsOpen={setDeleteDialogOpen}
        rate={rateToDelete}
        onConfirm={handleDeleteConfirm}
        formatSportName={formatSportName}
        formatDuration={formatDuration}
      />
    </div>
  )
}

// Componente Dialog per il form di inserimento/modifica
function PointsRateFormDialog({
  isOpen,
  setIsOpen,
  isEditing,
  formData,
  formErrors,
  submitting,
  sportOptions,
  durationOptions,
  onFormChange,
  onSubmit,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifica Tasso Punti" : "Nuovo Tasso Punti"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica il tasso di punti per questa combinazione sport/durata."
              : "Configura quanti punti gli utenti guadagnano per questa attività."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sportName">Sport *</Label>
            <Select
              value={formData.sportName}
              onValueChange={(value) => onFormChange("sportName", value)}
              disabled={isEditing} // Non permettere di cambiare sport in modifica
            >
              <SelectTrigger className={formErrors.sportName ? "border-red-500" : ""}>
                <SelectValue placeholder="Seleziona uno sport" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {sportOptions.map((sport) => (
                  <SelectItem key={sport.value} value={sport.value}>
                    {sport.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.sportName && <p className="text-sm text-red-500">{formErrors.sportName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Durata *</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => onFormChange("duration", value)}
              disabled={isEditing} // Non permettere di cambiare durata in modifica
            >
              <SelectTrigger className={formErrors.duration ? "border-red-500" : ""}>
                <SelectValue placeholder="Seleziona una durata" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {durationOptions.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value.toString()}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.duration && <p className="text-sm text-red-500">{formErrors.duration}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pointsRate">Punti Assegnati *</Label>
            <Input
              id="pointsRate"
              type="number"
              min="0"
              step="1"
              value={formData.pointsRate}
              onChange={(e) => onFormChange("pointsRate", e.target.value)}
              placeholder="es. 10"
              className={formErrors.pointsRate ? "border-red-500" : ""}
            />
            {formErrors.pointsRate && <p className="text-sm text-red-500">{formErrors.pointsRate}</p>}
            {formData.duration && formData.pointsRate && (
              <p className="text-sm text-gray-500">
                Equivale a {((Number(formData.pointsRate) / Number(formData.duration)) * 60).toFixed(1)} punti per ora
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={submitting}>
              Annulla
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? "Aggiornamento..." : "Creazione..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Aggiorna" : "Crea"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Componente Dialog per la conferma cancellazione
function DeletePointsRateDialog({ isOpen, setIsOpen, rate, onConfirm, formatSportName, formatDuration }) {
  if (!rate) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            Conferma eliminazione
          </AlertDialogTitle>
          <AlertDialogDescription>
            Sei sicuro di voler eliminare il tasso di punti per "{formatSportName(rate.sportName)}" di durata "
            {formatDuration(rate.duration)}"? Questa azione non può essere annullata.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Elimina
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
