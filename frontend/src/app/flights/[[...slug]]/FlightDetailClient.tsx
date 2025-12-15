'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Container,
  Typography,
  Button,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  BarChart as BarChartIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material'
import Link from 'next/link'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:8000')

interface Flight {
  id: string
  payload_id: string
  flight_date: string
  location?: string
  custom_weight?: number
}

interface CSVFile {
  id: string
  flight_id: string
  filename: string
  file_path: string
  uploaded_at: string
}

interface Chart {
  id: string
  flight_id: string
  name: string
  file_path: string
  created_at: string
}

export default function FlightDetailPage() {
  const router = useRouter()
  const params = useParams()
  // Handle optional catch-all route: slug might be undefined or an array
  const slug = params.slug as string[] | undefined
  const flightId = slug?.[0] || ''
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [flight, setFlight] = useState<Flight | null>(null)
  const [csvFiles, setCsvFiles] = useState<CSVFile[]>([])
  const [charts, setCharts] = useState<Chart[]>([])
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deleteChartDialog, setDeleteChartDialog] = useState<{ open: boolean; chart: Chart | null }>({
    open: false,
    chart: null,
  })

  const fetchFlight = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/flights/${flightId}`)
      setFlight(response.data)
    } catch (error) {
      console.error('Error fetching flight:', error)
    }
  }, [flightId])

  const fetchCSVFiles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/flights/${flightId}/csv`)
      setCsvFiles(response.data)
    } catch (error) {
      console.error('Error fetching CSV files:', error)
    }
  }, [flightId])

  const fetchCharts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/flights/${flightId}/charts`)
      setCharts(response.data)
    } catch (error) {
      console.error('Error fetching charts:', error)
    }
  }, [flightId])

  useEffect(() => {
    fetchFlight()
    fetchCSVFiles()
    fetchCharts()
  }, [flightId, fetchFlight, fetchCSVFiles, fetchCharts])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      await axios.post(`${API_BASE_URL}/api/flights/${flightId}/csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      fetchCSVFiles()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteCSV = async (csvId: string) => {
    if (!confirm('Are you sure you want to delete this CSV file?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/csv/${csvId}`)
      fetchCSVFiles()
    } catch (error) {
      console.error('Error deleting CSV file:', error)
      alert('Error deleting CSV file. Please try again.')
    }
  }

  const handleGenerateCharts = async () => {
    setGenerating(true)
    try {
      await axios.post(`${API_BASE_URL}/api/flights/${flightId}/charts/generate`)
      fetchCharts()
      alert('Charts generated successfully!')
    } catch (error: any) {
      console.error('Error generating charts:', error)
      alert(`Error generating charts: ${error.response?.data?.detail || error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteChartClick = (chart: Chart) => {
    setDeleteChartDialog({ open: true, chart })
  }

  const handleDeleteChartConfirm = async () => {
    if (!deleteChartDialog.chart) return

    try {
      await axios.delete(`${API_BASE_URL}/api/charts/${deleteChartDialog.chart.id}`)
      fetchCharts()
      setDeleteChartDialog({ open: false, chart: null })
    } catch (error) {
      console.error('Error deleting chart:', error)
      alert('Error deleting chart. Please try again.')
    }
  }

  const handleDeleteChartCancel = () => {
    setDeleteChartDialog({ open: false, chart: null })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" component={Link} href={`/payloads/${flight?.payload_id}/flights`} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Flight Details
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {flight && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Flight Information
            </Typography>
            <Typography>Date & Time: {formatDate(flight.flight_date)}</Typography>
            {flight.location && <Typography>Location: {flight.location}</Typography>}
          </Paper>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            CSV Files
          </Typography>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            sx={{ mb: 2 }}
          >
            {uploading ? 'Uploading...' : 'Upload CSV File'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          {uploading && <LinearProgress sx={{ mt: 1 }} />}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Filename</TableCell>
                  <TableCell>Uploaded At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {csvFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>{file.filename}</TableCell>
                    <TableCell>{formatDate(file.uploaded_at)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleDeleteCSV(file.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Charts
            </Typography>
            <Button
              variant="contained"
              startIcon={<BarChartIcon />}
              onClick={handleGenerateCharts}
              disabled={generating || csvFiles.length === 0}
            >
              {generating ? 'Generating...' : 'Generate Charts'}
            </Button>
          </Box>
          {generating && <LinearProgress sx={{ mb: 2 }} />}

          {charts.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
              {charts.map((chart) => (
                <Paper key={chart.id} sx={{ p: 2, position: 'relative' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1">
                      {chart.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteChartClick(chart)}
                      sx={{ ml: 1 }}
                      color="error"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Created: {formatDate(chart.created_at)}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <iframe
                      src={`${API_BASE_URL}/api/charts/${chart.id}`}
                      style={{ width: '100%', height: '400px', border: 'none' }}
                      title={chart.name}
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No charts available. Upload CSV files and click &quot;Generate Charts&quot; to create visualizations.
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>

      <Dialog open={deleteChartDialog.open} onClose={handleDeleteChartCancel}>
        <DialogTitle>Delete Chart</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the chart &quot;{deleteChartDialog.chart?.name}&quot;?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteChartCancel}>Cancel</Button>
          <Button onClick={handleDeleteChartConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

