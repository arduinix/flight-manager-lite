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
} from '@mui/material'
import { RocketLaunch } from '@mui/icons-material'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <RocketLaunch sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Flight Manager Lite
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to Flight Manager Lite
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4 }}>
            Manage your model rocket payloads and flights
          </Typography>
          <Button
            variant="contained"
            size="large"
            component={Link}
            href="/payloads"
            sx={{ mr: 2 }}
          >
            View Payloads
          </Button>
        </Box>
      </Container>
    </>
  )
}

