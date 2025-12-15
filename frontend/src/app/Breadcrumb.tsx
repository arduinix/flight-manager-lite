'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Breadcrumbs, Link, Typography, Box } from '@mui/material'
import { Home as HomeIcon } from '@mui/icons-material'
import NextLink from 'next/link'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:8000')

interface Payload {
  id: string
  name: string
}

interface Flight {
  id: string
  flight_date: string
}

export default function Breadcrumb() {
  const pathname = usePathname()
  const [payloadCache, setPayloadCache] = useState<Record<string, string>>({})
  const [flightCache, setFlightCache] = useState<Record<string, string>>({})
  const fetchingRef = useRef<Set<string>>(new Set())
  
  // Split pathname into segments and filter out empty strings
  const pathSegments = pathname.split('/').filter(Boolean)
  
  // Identify which segments need data fetching
  useEffect(() => {
    // Don't fetch on home page
    if (pathname === '/') {
      return
    }
    const fetchData = async () => {
      const payloadIds: string[] = []
      const flightIds: string[] = []
      
      pathSegments.forEach((segment, index) => {
        const prevSegment = index > 0 ? pathSegments[index - 1] : null
        
        // If segment is after "payloads" and not "flights", it's likely a payload ID
        if (prevSegment === 'payloads' && segment !== 'flights') {
          payloadIds.push(segment)
        }
        
        // If previous segment is "flights", current segment is likely a flight ID
        if (prevSegment === 'flights') {
          flightIds.push(segment)
        }
      })
      
      // Fetch payloads that aren't being fetched (ref prevents duplicates, cache check in render)
      const payloadPromises = payloadIds
        .filter(id => {
          const cacheKey = `payload-${id}`
          return !fetchingRef.current.has(cacheKey)
        })
        .map(id => {
          const cacheKey = `payload-${id}`
          fetchingRef.current.add(cacheKey)
          return axios.get(`${API_BASE_URL}/api/payloads/${id}`)
            .then(response => {
              setPayloadCache(prev => {
                // Only update if not already set (avoid unnecessary re-renders)
                if (prev[id] === response.data.name) return prev
                return { ...prev, [id]: response.data.name }
              })
              fetchingRef.current.delete(cacheKey)
            })
            .catch(() => {
              fetchingRef.current.delete(cacheKey)
              // Silently fail - will show ID as fallback
            })
        })
      
      // Fetch flights that aren't being fetched (ref prevents duplicates, cache check in render)
      const flightPromises = flightIds
        .filter(id => {
          const cacheKey = `flight-${id}`
          return !fetchingRef.current.has(cacheKey)
        })
        .map(id => {
          const cacheKey = `flight-${id}`
          fetchingRef.current.add(cacheKey)
          return axios.get(`${API_BASE_URL}/api/flights/${id}`)
            .then(response => {
              const flightDate = new Date(response.data.flight_date)
              const formattedTime = flightDate.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
              setFlightCache(prev => {
                // Only update if not already set (avoid unnecessary re-renders)
                if (prev[id] === formattedTime) return prev
                return { ...prev, [id]: formattedTime }
              })
              fetchingRef.current.delete(cacheKey)
            })
            .catch(() => {
              fetchingRef.current.delete(cacheKey)
              // Silently fail - will show ID as fallback
            })
        })
      
      await Promise.all([...payloadPromises, ...flightPromises])
    }
    
    fetchData()
  }, [pathname]) // Re-fetch when pathname changes
  
  // Don't show breadcrumb on home page
  if (pathname === '/') {
    return null
  }
  
  // Build breadcrumb items
  const breadcrumbItems = [
    {
      label: 'Home',
      href: '/',
      icon: <HomeIcon sx={{ fontSize: 20, verticalAlign: 'middle' }} />,
    },
    ...pathSegments.map((segment, index) => {
      // Build href by joining all segments up to current index
      const href = '/' + pathSegments.slice(0, index + 1).join('/')
      
      // Format label (capitalize, replace hyphens with spaces, handle special cases)
      let label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      // Handle special cases
      if (segment === 'payloads') {
        label = 'Payloads'
      } else if (segment === 'flights') {
        label = 'Flights'
      } else {
        // Check if this is a payload ID (segment after "payloads" and not "flights")
        const prevSegment = index > 0 ? pathSegments[index - 1] : null
        if (prevSegment === 'payloads' && segment !== 'flights') {
          label = payloadCache[segment] || label
        }
        // Check if this is a flight ID (segment after "flights")
        else if (prevSegment === 'flights') {
          label = flightCache[segment] || label
        }
      }
      
      // Last item is not a link
      const isLast = index === pathSegments.length - 1
      
      return {
        label,
        href: isLast ? undefined : href,
      }
    }),
  ]

  return (
    <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', py: 1, px: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" separator="›">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1
          
          if (isLast || !item.href) {
            return (
              <Typography key={item.href || item.label} color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {index === 0 && item.icon}
                {item.label}
              </Typography>
            )
          }
          
          return (
            <Link
              key={item.href}
              component={NextLink}
              href={item.href}
              color="inherit"
              underline="hover"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              {index === 0 && item.icon}
              {item.label}
            </Link>
          )
        })}
      </Breadcrumbs>
    </Box>
  )
}

