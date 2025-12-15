'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Modal,
  Backdrop,
  Fade,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flight as FlightIcon,
} from '@mui/icons-material'
import Link from 'next/link'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:8000')

interface Payload {
  id: string
  name: string
  owner?: string
  default_weight?: number
}

export default function PayloadsListClient() {
  const router = useRouter()
  const [payloads, setPayloads] = useState<Payload[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingPayload, setEditingPayload] = useState<Payload | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [payloadToDelete, setPayloadToDelete] = useState<Payload | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    default_weight: '',
  })

  useEffect(() => {
    fetchPayloads()
  }, [])

  const fetchPayloads = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/payloads`)
      setPayloads(response.data)
    } catch (error) {
      console.error('Error fetching payloads:', error)
    }
  }

  const handleOpenDialog = (payload?: Payload) => {
    if (payload) {
      setEditingPayload(payload)
      setFormData({
        name: payload.name,
        owner: payload.owner || '',
        default_weight: payload.default_weight?.toString() || '',
      })
    } else {
      setEditingPayload(null)
      setFormData({ name: '', owner: '', default_weight: '' })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingPayload(null)
    setFormData({ name: '', owner: '', default_weight: '' })
  }

  const handleSave = async () => {
    try {
      const payloadData = {
        name: formData.name,
        owner: formData.owner || undefined,
        default_weight: formData.default_weight ? parseFloat(formData.default_weight) : undefined,
      }

      if (editingPayload) {
        await axios.put(`${API_BASE_URL}/api/payloads/${editingPayload.id}`, payloadData)
      } else {
        await axios.post(`${API_BASE_URL}/api/payloads`, payloadData)
      }

      fetchPayloads()
      handleCloseDialog()
    } catch (error) {
      console.error('Error saving payload:', error)
      alert('Error saving payload. Please try again.')
    }
  }

  const handleDeleteClick = (payload: Payload) => {
    setPayloadToDelete(payload)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!payloadToDelete) return

    try {
      await axios.delete(`${API_BASE_URL}/api/payloads/${payloadToDelete.id}`)
      fetchPayloads()
      setDeleteDialogOpen(false)
      setPayloadToDelete(null)
    } catch (error) {
      console.error('Error deleting payload:', error)
      alert('Error deleting payload. Please try again.')
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setPayloadToDelete(null)
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Payloads
          </Typography>
          <Button color="inherit" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Payload
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Default Weight (g)</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payloads.map((payload) => (
                <TableRow key={payload.id}>
                  <TableCell>{payload.name}</TableCell>
                  <TableCell>{payload.owner || '-'}</TableCell>
                  <TableCell>{payload.default_weight ? `${payload.default_weight}g` : '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      component={Link}
                      href={`/payloads/${payload.id}/flights`}
                      sx={{ mr: 1 }}
                    >
                      <FlightIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(payload)} sx={{ mr: 1 }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(payload)}>
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
        <DialogTitle>{editingPayload ? 'Edit Payload' : 'Add New Payload'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Owner"
            fullWidth
            variant="outlined"
            value={formData.owner}
            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Default Weight (grams)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.default_weight}
            onChange={(e) => setFormData({ ...formData, default_weight: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.name}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Modal
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={deleteDialogOpen}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 400 },
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 24,
              p: 0,
              outline: 'none',
            }}
          >
            <Box sx={{ p: 3, pb: 2 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                Delete Payload
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, mt: 2 }}>
                Are you sure you want to delete <strong>{payloadToDelete?.name}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All associated flights will also be deleted. This action cannot be undone.
              </Typography>
            </Box>
            <Box sx={{ px: 3, pb: 3, pt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleDeleteCancel} variant="outlined">
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteConfirm} 
                color="error" 
                variant="contained"
              >
                Delete
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  )
}

