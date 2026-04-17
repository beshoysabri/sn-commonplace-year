import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import App from './App'

describe('App (Phase 2 wiring)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the sample year with 5 lessons in standalone mode', async () => {
    await act(async () => {
      render(<App />)
    })
    // Sample year renders all 5 canonical lesson numbers.
    expect(screen.getByText('23#1')).toBeInTheDocument()
    expect(screen.getByText('23#2')).toBeInTheDocument()
    expect(screen.getByText('23#3')).toBeInTheDocument()
    expect(screen.getByText('23#4')).toBeInTheDocument()
    expect(screen.getByText('23#5')).toBeInTheDocument()
  })

  it('shows year and theme-of-year in the chapter opener', async () => {
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByLabelText('Year 2023')).toBeInTheDocument()
    // "CODE" appears both in the header and the chapter opener — both valid.
    expect(screen.getAllByText('CODE').length).toBeGreaterThanOrEqual(1)
  })

  it('toggles important on lesson 23#1 when the priority button is clicked', async () => {
    const { container } = render(<App />)
    await act(async () => {})
    // Find the first lesson entry and click its priority button.
    const firstEntry = container.querySelector('.cp-book-entry')
    expect(firstEntry).toBeTruthy()
    const star = firstEntry!.querySelector('.cp-priority-toggle') as HTMLButtonElement
    expect(star).toBeTruthy()
    expect(star.getAttribute('aria-pressed')).toBe('false')
    await act(async () => {
      star.click()
    })
    expect(star.getAttribute('aria-pressed')).toBe('true')
  })
})
