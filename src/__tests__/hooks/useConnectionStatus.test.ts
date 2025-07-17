import { renderHook, waitFor, act } from '@testing-library/react'
import useConnectionStatus from '@/hooks/useConnectionStatus'

// Mock fetch
global.fetch = jest.fn()

describe('useConnectionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })

  it('returns online status', () => {
    const { result } = renderHook(() => useConnectionStatus())
    
    expect(result.current.isOnline).toBe(true)
  })

  it('detects offline status', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
    })

    const { result } = renderHook(() => useConnectionStatus())
    
    expect(result.current.isOnline).toBe(false)
    expect(result.current.connectionSpeed).toBe('offline')
  })

  it('tests connection speed when online', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    })

    const { result } = renderHook(() => useConnectionStatus())
    
    await waitFor(() => {
      expect(result.current.connectionSpeed).toBe('fast')
    })
  })

  it('detects slow connection', async () => {
    // Mock slow response
    ;(fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ ok: true }), 3000)
      )
    )

    const { result } = renderHook(() => useConnectionStatus())
    
    await waitFor(() => {
      expect(result.current.connectionSpeed).toBe('slow')
    }, { timeout: 5000 })
  })

  it('handles fetch errors', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useConnectionStatus())
    
    await waitFor(() => {
      expect(result.current.connectionSpeed).toBe('slow')
    })
  })

  it('responds to online/offline events', async () => {
    const { result } = renderHook(() => useConnectionStatus())
    
    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      window.dispatchEvent(new Event('offline'))
    })
    
    await waitFor(() => {
      expect(result.current.isOnline).toBe(false)
    })

    // Simulate going online
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true })
      window.dispatchEvent(new Event('online'))
    })
    
    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
    })
  })
})