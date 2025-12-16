'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Container,
  Typography,
  Button,
  Box,
  AppBar,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material'
import Link from 'next/link'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Flight {
  id: string
  payload_id: string
  flight_date: string
  name?: string
  description?: string
  location?: string
  custom_weight?: number
}

interface Payload {
  id: string
  name: string
  owner?: string
  default_weight?: number
}

export default function FlightsPage() {
  const router = useRouter()
  const params = useParams()
  // Handle optional catch-all route: slug might be undefined or an array
  const slug = (params.slug as string[] | undefined) || []
  
  // Handle catch-all route: /payloads/[payloadId]/flights -> slug = [payloadId, 'flights']
  // Extract payloadId from first segment
  const payloadId = slug[0] || ''

  const [payload, setPayload] = useState<Payload | null>(null)
  const [flights, setFlights] = useState<Flight[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null)
  const [formData, setFormData] = useState({
    flight_date: '',
    flight_time: '',
    name: '',
    description: '',
    location: '',
    custom_weight: '',
  })

  const fetchPayload = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/payloads/${payloadId}`)
      setPayload(response.data)
    } catch (error) {
      console.error('Error fetching payload:', error)
    }
  }, [payloadId])

  const fetchFlights = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/flights?payload_id=${payloadId}`)
      setFlights(response.data)
    } catch (error) {
      console.error('Error fetching flights:', error)
    }
  }, [payloadId])

  useEffect(() => {
    fetchPayload()
    fetchFlights()
  }, [payloadId, fetchPayload, fetchFlights])

  const handleOpenDialog = (flight?: Flight) => {
    if (flight) {
      setEditingFlight(flight)
      const date = new Date(flight.flight_date)
      setFormData({
        flight_date: date.toISOString().split('T')[0],
        flight_time: date.toTimeString().split(' ')[0].substring(0, 5),
        name: flight.name || '',
        description: flight.description || '',
        location: flight.location || '',
        custom_weight: flight.custom_weight?.toString() || '',
      })
    } else {
      // Set default to current date and time based on browser locale
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      
      setEditingFlight(null)
      setFormData({
        flight_date: `${year}-${month}-${day}`,
        flight_time: `${hours}:${minutes}`,
        name: '',
        description: '',
        location: '',
        custom_weight: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingFlight(null)
    setFormData({
      flight_date: '',
      flight_time: '',
      name: '',
      description: '',
      location: '',
      custom_weight: '',
    })
  }

  const handleSave = async () => {
    try {
      const dateTime = new Date(`${formData.flight_date}T${formData.flight_time}`)
      
      // Helper function to convert empty strings to undefined
      const cleanString = (value: string) => {
        const trimmed = value?.trim()
        return trimmed && trimmed.length > 0 ? trimmed : undefined
      }
      
      const flightData: any = {
        flight_date: dateTime.toISOString(),
      }
      
      // Only include optional fields if they have values
      const name = cleanString(formData.name)
      if (name !== undefined) flightData.name = name
      
      const description = cleanString(formData.description)
      if (description !== undefined) flightData.description = description
      
      const location = cleanString(formData.location)
      if (location !== undefined) flightData.location = location
      
      if (formData.custom_weight && formData.custom_weight.trim()) {
        const weight = parseFloat(formData.custom_weight)
        if (!isNaN(weight)) {
          flightData.custom_weight = weight
        }
      }

      const url = editingFlight 
        ? `${API_BASE_URL}/api/flights/${editingFlight.id}`
        : `${API_BASE_URL}/api/flights`
      
      console.log('Saving flight to:', url)
      console.log('Flight data:', flightData)
      
      if (editingFlight) {
        await axios.put(url, flightData)
      } else {
        await axios.post(url, {
          ...flightData,
          payload_id: payloadId,
        })
      }

      fetchFlights()
      handleCloseDialog()
    } catch (error: any) {
      console.error('Error saving flight:', error)
      let errorMessage = 'Unknown error occurred'
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.detail || error.response.data?.message || error.response.statusText || `Server error (${error.response.status})`
      } else if (error.request) {
        // Request made but no response received
        errorMessage = 'Network error: Could not reach the server. Please check if the backend is running.'
      } else {
        // Error setting up the request
        errorMessage = error.message || 'Error setting up request'
      }
      
      alert(`Error saving flight: ${errorMessage}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flight? All associated data will be deleted.')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/flights/${id}`)
      fetchFlights()
    } catch (error) {
      console.error('Error deleting flight:', error)
      alert('Error deleting flight. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" component={Link} href="/payloads" sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Flights - {payload?.name || 'Loading...'}
          </Typography>
          <Button color="inherit" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Flight
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Weight (g)</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flights.map((flight) => (
                <TableRow key={flight.id}>
                  <TableCell>
                    {formatDate(flight.flight_date)}
                    {flight.name && (
                      <Typography variant="body2" component="div" sx={{ mt: 0.5, fontWeight: 'medium' }}>
                        {flight.name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{flight.location || '-'}</TableCell>
                  <TableCell>
                    {flight.custom_weight ? `${flight.custom_weight}g` : payload?.default_weight ? `${payload.default_weight}g` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      component={Link}
                      href={`/flights/${flight.id}`}
                      sx={{ mr: 1 }}
                    >
                      <BarChartIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(flight)} sx={{ mr: 1 }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(flight.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingFlight ? 'Edit Flight' : 'Add New Flight'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            required
            value={formData.flight_date}
            onChange={(e) => setFormData({ ...formData, flight_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Time"
            type="time"
            fullWidth
            variant="outlined"
            required
            value={formData.flight_time}
            onChange={(e) => setFormData({ ...formData, flight_time: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="Optional flight name"
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="Optional flight description"
          />
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            variant="outlined"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="Optional location"
          />
          <TextField
            margin="dense"
            label="Custom Weight (grams)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.custom_weight}
            onChange={(e) => setFormData({ ...formData, custom_weight: e.target.value })}
            helperText={payload?.default_weight ? `Default: ${payload.default_weight}g (leave empty to use default)` : 'Optional - leave empty if not needed'}
            placeholder="Optional custom weight"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.flight_date || !formData.flight_time}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

