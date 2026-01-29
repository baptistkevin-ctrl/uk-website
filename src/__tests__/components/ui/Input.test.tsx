import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'
import { createRef } from 'react'

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders an input element', () => {
      render(<Input data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toBeInTheDocument()
      expect(screen.getByTestId('test-input').tagName).toBe('INPUT')
    })

    it('renders with default type text', () => {
      render(<Input data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).not.toHaveAttribute('type')
    })

    it('renders with specified type', () => {
      render(<Input type="email" data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'email')
    })

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter your email" />)

      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    })

    it('renders with default value', () => {
      render(<Input defaultValue="initial value" data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toHaveValue('initial value')
    })

    it('renders with controlled value', () => {
      render(<Input value="controlled value" onChange={() => {}} data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toHaveValue('controlled value')
    })
  })

  describe('Input Types', () => {
    const inputTypes = ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date']

    inputTypes.forEach(type => {
      it(`supports type="${type}"`, () => {
        render(<Input type={type} data-testid="test-input" />)

        expect(screen.getByTestId('test-input')).toHaveAttribute('type', type)
      })
    })

    it('supports file input type', () => {
      render(<Input type="file" data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'file')
    })
  })

  describe('Styling', () => {
    it('applies default classes', () => {
      render(<Input data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      expect(input).toHaveClass('flex')
      expect(input).toHaveClass('h-10')
      expect(input).toHaveClass('w-full')
      expect(input).toHaveClass('rounded-md')
      expect(input).toHaveClass('border')
    })

    it('merges custom className', () => {
      render(<Input className="custom-class" data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      expect(input).toHaveClass('custom-class')
      expect(input).toHaveClass('flex') // Still has default classes
    })

    it('allows overriding default classes', () => {
      render(<Input className="h-12" data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      expect(input).toHaveClass('h-12')
    })
  })

  describe('States', () => {
    it('can be disabled', () => {
      render(<Input disabled data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toBeDisabled()
    })

    it('applies disabled styles', () => {
      render(<Input disabled data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      expect(input).toHaveClass('disabled:cursor-not-allowed')
      expect(input).toHaveClass('disabled:opacity-50')
    })

    it('can be required', () => {
      render(<Input required data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toBeRequired()
    })

    it('can be readonly', () => {
      render(<Input readOnly value="readonly value" data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toHaveAttribute('readonly')
    })
  })

  describe('User Interactions', () => {
    it('handles typing', async () => {
      const user = userEvent.setup()
      render(<Input data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      await user.type(input, 'Hello World')

      expect(input).toHaveValue('Hello World')
    })

    it('calls onChange when typing', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      await user.type(input, 'test')

      expect(handleChange).toHaveBeenCalledTimes(4) // Once per character
    })

    it('can clear input value', async () => {
      const user = userEvent.setup()
      render(<Input defaultValue="initial" data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      await user.clear(input)

      expect(input).toHaveValue('')
    })

    it('handles paste', async () => {
      const user = userEvent.setup()
      render(<Input data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      await user.click(input)
      await user.paste('pasted content')

      expect(input).toHaveValue('pasted content')
    })
  })

  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = createRef<HTMLInputElement>()
      render(<Input ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('ref can be used to focus input', () => {
      const ref = createRef<HTMLInputElement>()
      render(<Input ref={ref} data-testid="test-input" />)

      ref.current?.focus()

      expect(screen.getByTestId('test-input')).toHaveFocus()
    })

    it('ref can be used to get value', async () => {
      const user = userEvent.setup()
      const ref = createRef<HTMLInputElement>()
      render(<Input ref={ref} data-testid="test-input" />)

      await user.type(screen.getByTestId('test-input'), 'test value')

      expect(ref.current?.value).toBe('test value')
    })
  })

  describe('HTML Attributes', () => {
    it('passes through id attribute', () => {
      render(<Input id="email-input" data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toHaveAttribute('id', 'email-input')
    })

    it('passes through name attribute', () => {
      render(<Input name="email" data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toHaveAttribute('name', 'email')
    })

    it('passes through aria attributes', () => {
      render(
        <Input
          aria-label="Email address"
          aria-describedby="email-hint"
          data-testid="test-input"
        />
      )

      const input = screen.getByTestId('test-input')
      expect(input).toHaveAttribute('aria-label', 'Email address')
      expect(input).toHaveAttribute('aria-describedby', 'email-hint')
    })

    it('passes through min/max for number inputs', () => {
      render(<Input type="number" min={0} max={100} data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
    })

    it('passes through pattern attribute', () => {
      render(<Input pattern="[A-Za-z]+" data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toHaveAttribute('pattern', '[A-Za-z]+')
    })

    it('passes through maxLength attribute', () => {
      render(<Input maxLength={50} data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toHaveAttribute('maxLength', '50')
    })

    it('passes through autoComplete attribute', () => {
      render(<Input autoComplete="email" data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toHaveAttribute('autoComplete', 'email')
    })
  })

  describe('Accessibility', () => {
    it('can be labeled with htmlFor', () => {
      render(
        <>
          <label htmlFor="test-id">Email</label>
          <Input id="test-id" />
        </>
      )

      expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })

    it('can be labeled with aria-label', () => {
      render(<Input aria-label="Search products" />)

      expect(screen.getByLabelText('Search products')).toBeInTheDocument()
    })

    it('supports aria-invalid for error states', () => {
      render(<Input aria-invalid="true" data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toHaveAttribute('aria-invalid', 'true')
    })

    it('supports aria-required', () => {
      render(<Input aria-required="true" data-testid="test-input" />)

      expect(screen.getByTestId('test-input')).toHaveAttribute('aria-required', 'true')
    })
  })

  describe('Focus Styles', () => {
    it('has focus-visible styles', () => {
      render(<Input data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      expect(input).toHaveClass('focus-visible:outline-none')
      expect(input).toHaveClass('focus-visible:ring-2')
      expect(input).toHaveClass('focus-visible:ring-green-500')
    })
  })

  describe('Display Name', () => {
    it('has correct displayName', () => {
      expect(Input.displayName).toBe('Input')
    })
  })
})
