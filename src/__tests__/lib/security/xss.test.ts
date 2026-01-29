import { describe, it, expect } from 'vitest'
import {
  sanitizeText,
  sanitizeBasicHtml,
  sanitizeRichHtml,
  sanitizeEmailHtml,
  escapeHtml,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeSearchQuery,
  sanitizeObject,
  stripHtml,
  truncateText,
} from '@/lib/security/xss'

describe('XSS Protection', () => {
  describe('sanitizeText', () => {
    it('removes all HTML tags', () => {
      expect(sanitizeText('<b>Bold</b>')).toBe('Bold')
      expect(sanitizeText('<script>alert("xss")</script>')).toBe('')
      expect(sanitizeText('<div><p>Nested</p></div>')).toBe('Nested')
    })

    it('handles null and undefined', () => {
      expect(sanitizeText(null)).toBe('')
      expect(sanitizeText(undefined)).toBe('')
    })

    it('trims whitespace', () => {
      expect(sanitizeText('  Hello World  ')).toBe('Hello World')
    })

    it('removes malicious content', () => {
      expect(sanitizeText('<img src="x" onerror="alert(1)">')).toBe('')
      expect(sanitizeText('<svg onload="alert(1)">')).toBe('')
    })
  })

  describe('sanitizeBasicHtml', () => {
    it('allows basic formatting tags', () => {
      expect(sanitizeBasicHtml('<b>Bold</b>')).toBe('<b>Bold</b>')
      expect(sanitizeBasicHtml('<i>Italic</i>')).toBe('<i>Italic</i>')
      expect(sanitizeBasicHtml('<em>Emphasis</em>')).toBe('<em>Emphasis</em>')
      expect(sanitizeBasicHtml('<strong>Strong</strong>')).toBe('<strong>Strong</strong>')
      expect(sanitizeBasicHtml('<br>')).toMatch(/<br\s*\/?>/)
    })

    it('removes disallowed tags', () => {
      expect(sanitizeBasicHtml('<script>alert(1)</script>')).toBe('')
      expect(sanitizeBasicHtml('<div>Content</div>')).toBe('Content')
      expect(sanitizeBasicHtml('<a href="#">Link</a>')).toBe('Link')
    })

    it('removes event handlers', () => {
      expect(sanitizeBasicHtml('<b onclick="alert(1)">Bold</b>')).toBe('<b>Bold</b>')
    })
  })

  describe('sanitizeRichHtml', () => {
    it('allows heading tags', () => {
      expect(sanitizeRichHtml('<h1>Title</h1>')).toBe('<h1>Title</h1>')
      expect(sanitizeRichHtml('<h2>Subtitle</h2>')).toBe('<h2>Subtitle</h2>')
    })

    it('allows list tags', () => {
      expect(sanitizeRichHtml('<ul><li>Item</li></ul>')).toBe('<ul><li>Item</li></ul>')
      expect(sanitizeRichHtml('<ol><li>Item</li></ol>')).toBe('<ol><li>Item</li></ol>')
    })

    it('allows links with safe attributes', () => {
      const result = sanitizeRichHtml('<a href="https://example.com">Link</a>')
      expect(result).toContain('href="https://example.com"')
      expect(result).toContain('target="_blank"')
      expect(result).toContain('rel="noopener noreferrer"')
    })

    it('removes javascript: URLs', () => {
      const result = sanitizeRichHtml('<a href="javascript:alert(1)">Link</a>')
      expect(result).not.toContain('javascript:')
    })

    it('allows code blocks', () => {
      expect(sanitizeRichHtml('<code>const x = 1</code>')).toBe('<code>const x = 1</code>')
      expect(sanitizeRichHtml('<pre>formatted</pre>')).toBe('<pre>formatted</pre>')
    })

    it('removes script tags', () => {
      expect(sanitizeRichHtml('<script>alert(1)</script>')).toBe('')
    })
  })

  describe('sanitizeEmailHtml', () => {
    it('allows table elements', () => {
      const html = '<table><tr><td>Cell</td></tr></table>'
      expect(sanitizeEmailHtml(html)).toContain('<table>')
      expect(sanitizeEmailHtml(html)).toContain('<td>')
    })

    it('allows images', () => {
      const result = sanitizeEmailHtml('<img src="https://example.com/img.jpg" alt="Test">')
      expect(result).toContain('src="https://example.com/img.jpg"')
      expect(result).toContain('alt="Test"')
    })

    it('allows inline styles', () => {
      const result = sanitizeEmailHtml('<div style="color: red;">Red text</div>')
      // The library may normalize styles, so check if style attribute is present
      expect(result).toContain('style=')
      expect(result).toContain('Red text')
    })

    it('removes script tags', () => {
      expect(sanitizeEmailHtml('<script>alert(1)</script>')).toBe('')
    })
  })

  describe('escapeHtml', () => {
    it('escapes HTML entities', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
      expect(escapeHtml('&')).toBe('&amp;')
      expect(escapeHtml('"')).toBe('&quot;')
      expect(escapeHtml("'")).toBe('&#039;')
    })

    it('escapes multiple characters', () => {
      expect(escapeHtml('<a href="test">')).toBe('&lt;a href=&quot;test&quot;&gt;')
    })

    it('handles null and undefined', () => {
      expect(escapeHtml(null)).toBe('')
      expect(escapeHtml(undefined)).toBe('')
    })

    it('preserves safe text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World')
    })
  })

  describe('sanitizeUrl', () => {
    it('allows safe protocols', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
      expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com')
      expect(sanitizeUrl('tel:+441234567890')).toBe('tel:+441234567890')
      expect(sanitizeUrl('/relative/path')).toBe('/relative/path')
    })

    it('blocks dangerous protocols', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('')
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('')
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('')
      expect(sanitizeUrl('file:///etc/passwd')).toBe('')
    })

    it('handles null and undefined', () => {
      expect(sanitizeUrl(null)).toBe('')
      expect(sanitizeUrl(undefined)).toBe('')
    })

    it('trims whitespace', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com')
    })

    it('blocks unknown protocols', () => {
      expect(sanitizeUrl('custom:protocol')).toBe('')
    })
  })

  describe('sanitizeFilename', () => {
    it('removes path traversal sequences', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd')
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('windowssystem32')
    })

    it('removes slashes', () => {
      expect(sanitizeFilename('path/to/file.txt')).toBe('pathtofile.txt')
      expect(sanitizeFilename('path\\to\\file.txt')).toBe('pathtofile.txt')
    })

    it('removes invalid characters', () => {
      expect(sanitizeFilename('file<name>.txt')).toBe('filename.txt')
      expect(sanitizeFilename('file:name.txt')).toBe('filename.txt')
      expect(sanitizeFilename('file"name".txt')).toBe('filename.txt')
      expect(sanitizeFilename('file|name.txt')).toBe('filename.txt')
      expect(sanitizeFilename('file?name.txt')).toBe('filename.txt')
      expect(sanitizeFilename('file*name.txt')).toBe('filename.txt')
    })

    it('handles null and undefined', () => {
      expect(sanitizeFilename(null)).toBe('')
      expect(sanitizeFilename(undefined)).toBe('')
    })

    it('preserves valid filenames', () => {
      expect(sanitizeFilename('image.jpg')).toBe('image.jpg')
      expect(sanitizeFilename('document-v2.pdf')).toBe('document-v2.pdf')
    })
  })

  describe('sanitizeSearchQuery', () => {
    it('removes dangerous characters', () => {
      expect(sanitizeSearchQuery('<script>')).toBe('script')
      // Removes ', ", ; and trims whitespace
      expect(sanitizeSearchQuery("'; DROP TABLE users;--")).toBe('DROP TABLE users--')
      expect(sanitizeSearchQuery('query"test')).toBe('querytest')
    })

    it('limits length to 500 characters', () => {
      const longQuery = 'a'.repeat(600)
      expect(sanitizeSearchQuery(longQuery).length).toBe(500)
    })

    it('handles null and undefined', () => {
      expect(sanitizeSearchQuery(null)).toBe('')
      expect(sanitizeSearchQuery(undefined)).toBe('')
    })

    it('trims whitespace', () => {
      expect(sanitizeSearchQuery('  search term  ')).toBe('search term')
    })

    it('preserves safe search terms', () => {
      expect(sanitizeSearchQuery('organic bananas')).toBe('organic bananas')
      expect(sanitizeSearchQuery('milk 2%')).toBe('milk 2%')
    })
  })

  describe('sanitizeObject', () => {
    it('sanitizes string values', () => {
      const input = {
        name: '<script>alert(1)</script>',
        value: 'Safe value',
      }
      const result = sanitizeObject(input)
      expect(result.name).toBe('')
      expect(result.value).toBe('Safe value')
    })

    it('recursively sanitizes nested objects', () => {
      const input = {
        outer: {
          inner: '<b>Bold</b>',
        },
      }
      const result = sanitizeObject(input)
      expect(result.outer.inner).toBe('Bold')
    })

    it('sanitizes array values', () => {
      const input = {
        items: ['<script>x</script>', 'safe'],
      }
      const result = sanitizeObject(input)
      expect(result.items).toEqual(['', 'safe'])
    })

    it('preserves non-string values', () => {
      const input = {
        count: 42,
        active: true,
        price: 9.99,
      }
      const result = sanitizeObject(input)
      expect(result.count).toBe(42)
      expect(result.active).toBe(true)
      expect(result.price).toBe(9.99)
    })

    it('allows HTML in specified fields', () => {
      const input = {
        title: '<b>Title</b>',
        description: '<p>Description</p>',
      }
      const result = sanitizeObject(input, ['description'])
      expect(result.title).toBe('Title')
      expect(result.description).toContain('<p>')
    })
  })

  describe('stripHtml', () => {
    it('removes all HTML and returns plain text', () => {
      expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World')
      expect(stripHtml('<div><span>Nested</span></div>')).toBe('Nested')
    })

    it('normalizes whitespace', () => {
      expect(stripHtml('<p>Hello</p>   <p>World</p>')).toBe('Hello World')
    })

    it('handles null and undefined', () => {
      expect(stripHtml(null)).toBe('')
      expect(stripHtml(undefined)).toBe('')
    })
  })

  describe('truncateText', () => {
    it('truncates long text', () => {
      const result = truncateText('This is a very long text that needs truncation', 20)
      expect(result.length).toBeLessThanOrEqual(20)
      expect(result.endsWith('...')).toBe(true)
    })

    it('preserves short text', () => {
      expect(truncateText('Short text', 50)).toBe('Short text')
    })

    it('strips HTML before truncating', () => {
      const result = truncateText('<p>Hello <b>World</b></p>', 8)
      expect(result).toBe('Hello...')
    })

    it('uses custom suffix', () => {
      const result = truncateText('Long text here', 10, '…')
      expect(result.endsWith('…')).toBe(true)
    })

    it('handles null and undefined', () => {
      expect(truncateText(null, 10)).toBe('')
      expect(truncateText(undefined, 10)).toBe('')
    })
  })

  describe('XSS Attack Vectors', () => {
    const xssVectorsWithHtml = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(1)">',
      '<body onload="alert(1)">',
      '<iframe src="javascript:alert(1)">',
      '<input onfocus="alert(1)" autofocus>',
      '<marquee onstart="alert(1)">',
      '<video><source onerror="alert(1)">',
      '<details open ontoggle="alert(1)">',
      '"><script>alert(1)</script>',
      '<a href="javascript:alert(1)">click</a>',
      '<div style="background:url(javascript:alert(1))">',
      '<!--<script>alert(1)</script>-->',
    ]

    it('blocks all common XSS attack vectors in sanitizeText', () => {
      xssVectorsWithHtml.forEach(vector => {
        const result = sanitizeText(vector)
        // sanitizeText removes all HTML tags
        expect(result).not.toContain('<script')
        expect(result).not.toContain('onerror=')
        expect(result).not.toContain('onload=')
        expect(result).not.toContain('<img')
        expect(result).not.toContain('<svg')
        expect(result).not.toContain('<iframe')
      })
    })

    it('blocks XSS in URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('')
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
      expect(sanitizeUrl('  javascript:alert(1)')).toBe('')
      expect(sanitizeUrl('JAVASCRIPT:ALERT(1)')).toBe('')
    })
  })
})
