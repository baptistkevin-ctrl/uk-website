import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, badgeVariants } from '@/components/ui/badge'

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('renders a badge element', () => {
      render(<Badge data-testid="badge">Test Badge</Badge>)

      expect(screen.getByTestId('badge')).toBeInTheDocument()
    })

    it('renders children content', () => {
      render(<Badge>Badge Content</Badge>)

      expect(screen.getByText('Badge Content')).toBeInTheDocument()
    })

    it('renders as a div element', () => {
      render(<Badge data-testid="badge">Test</Badge>)

      expect(screen.getByTestId('badge').tagName).toBe('DIV')
    })
  })

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Badge data-testid="badge">Default</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('bg-green-600')
      expect(badge).toHaveClass('text-white')
    })

    it('renders secondary variant', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('bg-gray-100')
      expect(badge).toHaveClass('text-gray-900')
    })

    it('renders destructive variant', () => {
      render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('bg-red-600')
      expect(badge).toHaveClass('text-white')
    })

    it('renders outline variant', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('text-gray-700')
      expect(badge).toHaveClass('border-gray-300')
    })

    it('renders success variant', () => {
      render(<Badge variant="success" data-testid="badge">Success</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('bg-green-100')
      expect(badge).toHaveClass('text-green-800')
    })

    it('renders warning variant', () => {
      render(<Badge variant="warning" data-testid="badge">Warning</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('bg-yellow-100')
      expect(badge).toHaveClass('text-yellow-800')
    })

    it('renders info variant', () => {
      render(<Badge variant="info" data-testid="badge">Info</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('bg-blue-100')
      expect(badge).toHaveClass('text-blue-800')
    })
  })

  describe('Base Styling', () => {
    it('has inline-flex display', () => {
      render(<Badge data-testid="badge">Test</Badge>)

      expect(screen.getByTestId('badge')).toHaveClass('inline-flex')
    })

    it('has rounded-full border radius', () => {
      render(<Badge data-testid="badge">Test</Badge>)

      expect(screen.getByTestId('badge')).toHaveClass('rounded-full')
    })

    it('has border', () => {
      render(<Badge data-testid="badge">Test</Badge>)

      expect(screen.getByTestId('badge')).toHaveClass('border')
    })

    it('has correct padding', () => {
      render(<Badge data-testid="badge">Test</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('px-2.5')
      expect(badge).toHaveClass('py-0.5')
    })

    it('has correct text styling', () => {
      render(<Badge data-testid="badge">Test</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('text-xs')
      expect(badge).toHaveClass('font-semibold')
    })

    it('has transition-colors', () => {
      render(<Badge data-testid="badge">Test</Badge>)

      expect(screen.getByTestId('badge')).toHaveClass('transition-colors')
    })
  })

  describe('Custom ClassName', () => {
    it('merges custom className', () => {
      render(<Badge className="custom-class" data-testid="badge">Test</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('custom-class')
      expect(badge).toHaveClass('inline-flex') // Still has base classes
    })

    it('allows overriding default classes', () => {
      render(<Badge className="bg-purple-500" data-testid="badge">Test</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('bg-purple-500')
    })

    it('combines multiple custom classes', () => {
      render(<Badge className="custom-1 custom-2 custom-3" data-testid="badge">Test</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('custom-1')
      expect(badge).toHaveClass('custom-2')
      expect(badge).toHaveClass('custom-3')
    })
  })

  describe('HTML Attributes', () => {
    it('passes through id attribute', () => {
      render(<Badge id="test-badge" data-testid="badge">Test</Badge>)

      expect(screen.getByTestId('badge')).toHaveAttribute('id', 'test-badge')
    })

    it('passes through data attributes', () => {
      render(<Badge data-custom="value" data-testid="badge">Test</Badge>)

      expect(screen.getByTestId('badge')).toHaveAttribute('data-custom', 'value')
    })

    it('passes through title attribute', () => {
      render(<Badge title="Badge tooltip" data-testid="badge">Test</Badge>)

      expect(screen.getByTestId('badge')).toHaveAttribute('title', 'Badge tooltip')
    })

    it('passes through role attribute', () => {
      render(<Badge role="status" data-testid="badge">Status</Badge>)

      expect(screen.getByTestId('badge')).toHaveAttribute('role', 'status')
    })
  })

  describe('Focus Styles', () => {
    it('has focus outline styles', () => {
      render(<Badge data-testid="badge">Test</Badge>)

      expect(screen.getByTestId('badge')).toHaveClass('focus:outline-none')
    })

    it('has focus ring styles', () => {
      render(<Badge data-testid="badge">Test</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('focus:ring-2')
      expect(badge).toHaveClass('focus:ring-green-500')
      expect(badge).toHaveClass('focus:ring-offset-2')
    })
  })

  describe('Children Types', () => {
    it('renders string children', () => {
      render(<Badge>String Content</Badge>)

      expect(screen.getByText('String Content')).toBeInTheDocument()
    })

    it('renders number children', () => {
      render(<Badge>{42}</Badge>)

      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('renders element children', () => {
      render(
        <Badge data-testid="badge">
          <span>Inner Span</span>
        </Badge>
      )

      expect(screen.getByText('Inner Span')).toBeInTheDocument()
    })

    it('renders multiple children', () => {
      render(
        <Badge data-testid="badge">
          <span>Icon</span>
          <span>Text</span>
        </Badge>
      )

      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })
  })

  describe('Use Cases', () => {
    it('works as a status indicator', () => {
      render(<Badge variant="success">Active</Badge>)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('works as a count badge', () => {
      render(<Badge variant="destructive">5</Badge>)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('works as a category tag', () => {
      render(<Badge variant="secondary">Electronics</Badge>)

      expect(screen.getByText('Electronics')).toBeInTheDocument()
    })

    it('works as a discount badge', () => {
      render(<Badge variant="warning">20% Off</Badge>)

      expect(screen.getByText('20% Off')).toBeInTheDocument()
    })

    it('works as an info badge', () => {
      render(<Badge variant="info">New</Badge>)

      expect(screen.getByText('New')).toBeInTheDocument()
    })
  })

  describe('badgeVariants Export', () => {
    it('exports badgeVariants function', () => {
      expect(typeof badgeVariants).toBe('function')
    })

    it('badgeVariants returns correct classes for default', () => {
      const classes = badgeVariants({ variant: 'default' })

      expect(classes).toContain('bg-green-600')
      expect(classes).toContain('text-white')
    })

    it('badgeVariants returns correct classes for destructive', () => {
      const classes = badgeVariants({ variant: 'destructive' })

      expect(classes).toContain('bg-red-600')
    })

    it('badgeVariants returns base classes without variant', () => {
      const classes = badgeVariants()

      expect(classes).toContain('inline-flex')
      expect(classes).toContain('rounded-full')
    })
  })
})
