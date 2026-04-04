import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

describe('Card Component', () => {
  describe('Card', () => {
    it('renders a div element', () => {
      render(<Card data-testid="card">Content</Card>)

      expect(screen.getByTestId('card').tagName).toBe('DIV')
    })

    it('renders children', () => {
      render(<Card>Card Content</Card>)

      expect(screen.getByText('Card Content')).toBeInTheDocument()
    })

    it('has correct base styles', () => {
      render(<Card data-testid="card">Content</Card>)

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('rounded-lg')
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('border-orange-100')
      expect(card).toHaveClass('bg-white')
      expect(card).toHaveClass('text-gray-950')
      expect(card).toHaveClass('shadow-sm')
    })

    it('merges custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>)

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-class')
      expect(card).toHaveClass('rounded-lg') // Still has base classes
    })

    it('forwards ref', () => {
      const ref = createRef<HTMLDivElement>()
      render(<Card ref={ref}>Content</Card>)

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('has correct displayName', () => {
      expect(Card.displayName).toBe('Card')
    })

    it('passes through HTML attributes', () => {
      render(<Card id="my-card" role="article" data-testid="card">Content</Card>)

      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('id', 'my-card')
      expect(card).toHaveAttribute('role', 'article')
    })
  })

  describe('CardHeader', () => {
    it('renders a div element', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>)

      expect(screen.getByTestId('header').tagName).toBe('DIV')
    })

    it('renders children', () => {
      render(<CardHeader>Header Content</CardHeader>)

      expect(screen.getByText('Header Content')).toBeInTheDocument()
    })

    it('has correct base styles', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>)

      const header = screen.getByTestId('header')
      expect(header).toHaveClass('flex')
      expect(header).toHaveClass('flex-col')
      expect(header).toHaveClass('space-y-1.5')
      expect(header).toHaveClass('p-6')
    })

    it('merges custom className', () => {
      render(<CardHeader className="custom-class" data-testid="header">Header</CardHeader>)

      expect(screen.getByTestId('header')).toHaveClass('custom-class')
    })

    it('forwards ref', () => {
      const ref = createRef<HTMLDivElement>()
      render(<CardHeader ref={ref}>Header</CardHeader>)

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('has correct displayName', () => {
      expect(CardHeader.displayName).toBe('CardHeader')
    })
  })

  describe('CardTitle', () => {
    it('renders an h3 element', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>)

      expect(screen.getByTestId('title').tagName).toBe('H3')
    })

    it('renders children', () => {
      render(<CardTitle>Card Title</CardTitle>)

      expect(screen.getByText('Card Title')).toBeInTheDocument()
    })

    it('has correct base styles', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>)

      const title = screen.getByTestId('title')
      expect(title).toHaveClass('text-2xl')
      expect(title).toHaveClass('font-semibold')
      expect(title).toHaveClass('leading-none')
      expect(title).toHaveClass('tracking-tight')
    })

    it('merges custom className', () => {
      render(<CardTitle className="text-4xl" data-testid="title">Title</CardTitle>)

      expect(screen.getByTestId('title')).toHaveClass('text-4xl')
    })

    it('forwards ref', () => {
      const ref = createRef<HTMLParagraphElement>()
      render(<CardTitle ref={ref}>Title</CardTitle>)

      expect(ref.current).toBeInstanceOf(HTMLHeadingElement)
    })

    it('has correct displayName', () => {
      expect(CardTitle.displayName).toBe('CardTitle')
    })
  })

  describe('CardDescription', () => {
    it('renders a p element', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>)

      expect(screen.getByTestId('desc').tagName).toBe('P')
    })

    it('renders children', () => {
      render(<CardDescription>Card Description</CardDescription>)

      expect(screen.getByText('Card Description')).toBeInTheDocument()
    })

    it('has correct base styles', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>)

      const desc = screen.getByTestId('desc')
      expect(desc).toHaveClass('text-sm')
      expect(desc).toHaveClass('text-gray-500')
    })

    it('merges custom className', () => {
      render(<CardDescription className="italic" data-testid="desc">Description</CardDescription>)

      expect(screen.getByTestId('desc')).toHaveClass('italic')
    })

    it('forwards ref', () => {
      const ref = createRef<HTMLParagraphElement>()
      render(<CardDescription ref={ref}>Description</CardDescription>)

      expect(ref.current).toBeInstanceOf(HTMLParagraphElement)
    })

    it('has correct displayName', () => {
      expect(CardDescription.displayName).toBe('CardDescription')
    })
  })

  describe('CardContent', () => {
    it('renders a div element', () => {
      render(<CardContent data-testid="content">Content</CardContent>)

      expect(screen.getByTestId('content').tagName).toBe('DIV')
    })

    it('renders children', () => {
      render(<CardContent>Card Content</CardContent>)

      expect(screen.getByText('Card Content')).toBeInTheDocument()
    })

    it('has correct base styles', () => {
      render(<CardContent data-testid="content">Content</CardContent>)

      const content = screen.getByTestId('content')
      expect(content).toHaveClass('p-6')
      expect(content).toHaveClass('pt-0')
    })

    it('merges custom className', () => {
      render(<CardContent className="bg-gray-50" data-testid="content">Content</CardContent>)

      expect(screen.getByTestId('content')).toHaveClass('bg-gray-50')
    })

    it('forwards ref', () => {
      const ref = createRef<HTMLDivElement>()
      render(<CardContent ref={ref}>Content</CardContent>)

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('has correct displayName', () => {
      expect(CardContent.displayName).toBe('CardContent')
    })
  })

  describe('CardFooter', () => {
    it('renders a div element', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)

      expect(screen.getByTestId('footer').tagName).toBe('DIV')
    })

    it('renders children', () => {
      render(<CardFooter>Card Footer</CardFooter>)

      expect(screen.getByText('Card Footer')).toBeInTheDocument()
    })

    it('has correct base styles', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)

      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('flex')
      expect(footer).toHaveClass('items-center')
      expect(footer).toHaveClass('p-6')
      expect(footer).toHaveClass('pt-0')
    })

    it('merges custom className', () => {
      render(<CardFooter className="justify-end" data-testid="footer">Footer</CardFooter>)

      expect(screen.getByTestId('footer')).toHaveClass('justify-end')
    })

    it('forwards ref', () => {
      const ref = createRef<HTMLDivElement>()
      render(<CardFooter ref={ref}>Footer</CardFooter>)

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('has correct displayName', () => {
      expect(CardFooter.displayName).toBe('CardFooter')
    })
  })

  describe('Full Card Composition', () => {
    it('renders complete card structure', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle data-testid="title">Product Card</CardTitle>
            <CardDescription data-testid="desc">A sample product card</CardDescription>
          </CardHeader>
          <CardContent data-testid="content">
            <p>Product details here</p>
          </CardContent>
          <CardFooter data-testid="footer">
            <button>Buy Now</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('title')).toBeInTheDocument()
      expect(screen.getByTestId('desc')).toBeInTheDocument()
      expect(screen.getByTestId('content')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByText('Product Card')).toBeInTheDocument()
      expect(screen.getByText('A sample product card')).toBeInTheDocument()
      expect(screen.getByText('Product details here')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Buy Now' })).toBeInTheDocument()
    })

    it('maintains correct nesting structure', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      )

      const card = screen.getByTestId('card')
      const header = screen.getByTestId('header')
      const content = screen.getByTestId('content')

      expect(card).toContainElement(header)
      expect(card).toContainElement(content)
    })

    it('works without all subcomponents', () => {
      render(
        <Card data-testid="card">
          <CardContent data-testid="content">
            Simple card with just content
          </CardContent>
        </Card>
      )

      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByTestId('content')).toBeInTheDocument()
      expect(screen.getByText('Simple card with just content')).toBeInTheDocument()
    })

    it('supports multiple CardContent sections', () => {
      render(
        <Card>
          <CardContent data-testid="content1">Section 1</CardContent>
          <CardContent data-testid="content2">Section 2</CardContent>
        </Card>
      )

      expect(screen.getByTestId('content1')).toBeInTheDocument()
      expect(screen.getByTestId('content2')).toBeInTheDocument()
    })
  })

  describe('Use Cases', () => {
    it('works as a product card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Fresh Organic Bananas</CardTitle>
            <CardDescription>6 Pack</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$3.99</p>
          </CardContent>
          <CardFooter>
            <button>Add to Cart</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Fresh Organic Bananas')).toBeInTheDocument()
      expect(screen.getByText('6 Pack')).toBeInTheDocument()
      expect(screen.getByText('$3.99')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeInTheDocument()
    })

    it('works as a stats card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">$12,345</p>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Total Sales')).toBeInTheDocument()
      expect(screen.getByText('Last 30 days')).toBeInTheDocument()
      expect(screen.getByText('$12,345')).toBeInTheDocument()
    })

    it('works as a form card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Login Form</CardTitle>
            <CardDescription>Enter your credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <input placeholder="Email" />
            <input placeholder="Password" type="password" />
          </CardContent>
          <CardFooter>
            <button type="submit">Submit</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Login Form')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })
  })
})
