import { render, screen, waitFor, act } from '@testing-library/react'
import LazyImage from '@/components/LazyImage'

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
window.IntersectionObserver = mockIntersectionObserver

describe('LazyImage', () => {
  beforeEach(() => {
    mockIntersectionObserver.mockClear()
  })

  it('renders placeholder initially', () => {
    render(<LazyImage src="/test-image.jpg" alt="Test image" placeholder="Loading..." />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByAltText('Test image')).not.toBeInTheDocument()
  })

  it('renders default placeholder when no placeholder text provided', () => {
    const { container } = render(<LazyImage src="/test-image.jpg" alt="Test image" />)
    
    // Should render SVG icon placeholder
    const svgElement = container.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
    expect(svgElement).toHaveClass('w-8', 'h-8', 'text-gray-400')
  })

  it('sets up intersection observer on mount', () => {
    render(<LazyImage src="/test-image.jpg" alt="Test image" />)
    
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.1, rootMargin: '50px' }
    )
  })

  it('loads image when in viewport', async () => {
    let intersectionCallback: (entries: any[]) => void

    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback
      return {
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null,
      }
    })

    render(<LazyImage src="/test-image.jpg" alt="Test image" />)
    
    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }])
    })

    await waitFor(() => {
      expect(screen.getByAltText('Test image')).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    const { container } = render(
      <LazyImage src="/test-image.jpg" alt="Test image" className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles image load event', async () => {
    let intersectionCallback: (entries: any[]) => void

    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback
      return {
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null,
      }
    })

    render(<LazyImage src="/test-image.jpg" alt="Test image" />)
    
    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }])
    })

    const image = await screen.findByAltText('Test image')
    
    // Simulate image load
    act(() => {
      image.dispatchEvent(new Event('load'))
    })

    await waitFor(() => {
      expect(image).toHaveClass('opacity-100')
    })
  })
})