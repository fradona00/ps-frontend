"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/TextArea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/Dialog"
import { Badge } from "./ui/Badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Pencil, Trash2, Plus, Star, Gift, Zap, Sparkles } from "lucide-react"
import { request } from "../utils/request"

export default function PromotionsForm({ token }) {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    points: "",
    discount: "",
    type: "discount",
  })
  const [errors, setErrors] = useState({})

  // Carica le promozioni
  const fetchPromotions = async () => {
    setLoading(true)
    try {
      const response = await request({
        url: "/api/user/getAvailablePromo",
        method: "POST",
        body: {},
        token,
      })

      if (response.ok) {
        setPromotions(response.data.promotions || [])
      } else {
        console.error("Errore nel caricamento promozioni:", response.data?.message)
      }
    } catch (error) {
      console.error("Errore nel caricamento promozioni:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchPromotions()
    }
  }, [token])

  // Gestisce l'apertura del dialog per nuova promozione
  const handleNewPromotion = () => {
    setEditingPromotion(null)
    setFormData({
      title: "",
      description: "",
      points: "",
      discount: "",
      type: "discount",
    })
    setErrors({})
    setDialogOpen(true)
  }

  // Gestisce l'apertura del dialog per modifica promozione
  const handleEditPromotion = (promotion) => {
    setEditingPromotion(promotion)
    setFormData({
      title: promotion.title || "",
      description: promotion.description || "",
      points: promotion.points?.toString() || "",
      discount: promotion.discount || "",
      type: promotion.type || "discount",
    })
    setErrors({})
    setDialogOpen(true)
  }

  // Validazione form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Il titolo è obbligatorio"
    }

    if (!formData.description.trim()) {
      newErrors.description = "La descrizione è obbligatoria"
    }

    if (!formData.points.trim()) {
      newErrors.points = "I punti sono obbligatori"
    } else if (isNaN(formData.points) || Number(formData.points) < 0) {
      newErrors.points = "I punti devono essere un numero positivo"
    }

    if (!formData.type) {
      newErrors.type = "La tipologia è obbligatoria"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Gestisce il submit del form
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const url = "/api/admin/upsertPromotion";

    const method = "POST"

    const body = {
      id: editingPromotion ? editingPromotion.id : undefined,
      title: formData.title.trim(),
      description: formData.description.trim(),
      points: Number(formData.points),
      discount: formData.discount.trim() || null,
      type: formData.type,
    }

    try {
      const response = await request({
        url,
        method,
        body,
        token,
      })

      if (response.ok) {
        alert(editingPromotion ? "Promozione modificata con successo!" : "Promozione creata con successo!")
        setDialogOpen(false)
        fetchPromotions()
      } else {
        alert(response.data?.message || "Errore nel salvataggio della promozione")
      }
    } catch (error) {
      console.error("Errore nel salvataggio:", error)
      alert("Errore nel salvataggio della promozione")
    }
  }

  // Gestisce l'eliminazione di una promozione
  const handleDeletePromotion = async (promotionId) => {
    if (!confirm("Sei sicuro di voler eliminare questa promozione?")) {
      return
    }

    try {
      const response = await request({
        url: `/api/admin/promotions/${promotionId}`,
        method: "DELETE",
        token,
      })

      if (response.ok) {
        alert("Promozione eliminata con successo!")
        fetchPromotions()
      } else {
        alert(response.data?.message || "Errore nell'eliminazione della promozione")
      }
    } catch (error) {
      console.error("Errore nell'eliminazione:", error)
      alert("Errore nell'eliminazione della promozione")
    }
  }

  // Determina il tipo di promozione per l'icona
  const getPromotionTypeInfo = (title, description, type) => {
    if (type === "other") {
      return { icon: <Gift className="h-4 w-4" />, color: "bg-purple-100 text-purple-800", label: "PREMIO" }
    }

    const text = (title + " " + description).toLowerCase()

    if (text.includes("sconto") || text.includes("discount") || text.includes("%")) {
      return { icon: <Zap className="h-4 w-4" />, color: "bg-orange-100 text-orange-800", label: "SCONTO" }
    } else if (text.includes("gratis") || text.includes("free") || text.includes("omaggio")) {
      return { icon: <Gift className="h-4 w-4" />, color: "bg-green-100 text-green-800", label: "GRATIS" }
    } else if (text.includes("premium") || text.includes("vip") || text.includes("esclusiv")) {
      return { icon: <Star className="h-4 w-4" />, color: "bg-purple-100 text-purple-800", label: "PREMIUM" }
    } else {
      return { icon: <Sparkles className="h-4 w-4" />, color: "bg-blue-100 text-blue-800", label: "SPECIALE" }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Caricamento promozioni...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestione Promozioni</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewPromotion} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Promozione
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white">
            <DialogHeader>
              <DialogTitle>{editingPromotion ? "Modifica Promozione" : "Nuova Promozione"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Titolo */}
              <div>
                <Label htmlFor="title">Titolo *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Inserisci il titolo della promozione"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Descrizione */}
              <div>
                <Label htmlFor="description">Descrizione *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Inserisci la descrizione della promozione"
                  rows={3}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              {/* Punti */}
              <div>
                <Label htmlFor="points">Punti Richiesti *</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  placeholder="Inserisci i punti necessari"
                  className={errors.points ? "border-red-500" : ""}
                />
                {errors.points && <p className="text-red-500 text-sm mt-1">{errors.points}</p>}
              </div>

              {/* Tipologia */}
              <div>
                <Label htmlFor="type">Tipologia *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                    <SelectValue placeholder="Seleziona tipologia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Sconto</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
              </div>

              {/* Sconto - solo per tipo discount */}
              {formData.type === "discount" && (
                <div>
                  <Label htmlFor="discount">Sconto</Label>
                  <Input
                    id="discount"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder="es. -10% oppure -10"
                    pattern="^-\d+$|^(100|[1-9]?[0-9])%$"
                  />
                  <p className="text-gray-500 text-sm mt-1">Formato: percentuale (-10%) o importo fisso (-10)</p>
                </div>
              )}

              {/* Pulsanti */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingPromotion ? "Modifica" : "Crea"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabella promozioni */}
      <Card>
        <CardHeader>
          <CardTitle>Promozioni Attive ({promotions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessuna promozione</h3>
              <p className="text-gray-600">Crea la prima promozione per iniziare</p>
            </div>
          ) : (
            <>
              {/* Vista desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titolo</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead>Punti</TableHead>
                      <TableHead>Tipologia</TableHead>
                      <TableHead>Sconto</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions.map((promotion) => {
                      const typeInfo = getPromotionTypeInfo(promotion.title, promotion.description, promotion.type)
                      return (
                        <TableRow key={promotion.id}>
                          <TableCell className="font-medium">{promotion.title}</TableCell>
                          <TableCell className="max-w-xs truncate">{promotion.description}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              {promotion.points}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={typeInfo.color}>
                              <div className="flex items-center gap-1">
                                {typeInfo.icon}
                                {typeInfo.label}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {promotion.discount ? (
                              <span className="text-green-600 font-medium">{promotion.discount}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditPromotion(promotion)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePromotion(promotion.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Vista mobile */}
              <div className="md:hidden space-y-4">
                {promotions.map((promotion) => {
                  const typeInfo = getPromotionTypeInfo(promotion.title, promotion.description, promotion.type)
                  return (
                    <Card key={promotion.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{promotion.title}</h3>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditPromotion(promotion)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePromotion(promotion.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{promotion.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{promotion.points} punti</span>
                          </div>
                          <Badge className={typeInfo.color}>
                            <div className="flex items-center gap-1">
                              {typeInfo.icon}
                              {typeInfo.label}
                            </div>
                          </Badge>
                        </div>
                        {promotion.discount && (
                          <div className="mt-2 pt-2 border-t">
                            <span className="text-sm text-gray-500">Sconto: </span>
                            <span className="text-green-600 font-medium">{promotion.discount}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
