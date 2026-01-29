'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { Label } from './label'
import { Input } from './input'
import { Textarea } from './textarea'
import { FormError } from './form-error'

// ============================================================================
// Types
// ============================================================================

/**
 * Supported input types for the form field
 */
export type FormFieldInputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'month'
  | 'week'
  | 'color'
  | 'file'
  | 'hidden'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'

/**
 * Base props shared across all form field variants
 */
export interface FormFieldBaseProps {
  /**
   * Unique identifier for the field
   */
  id?: string
  /**
   * Field name for form binding
   */
  name: string
  /**
   * Label text displayed above the input
   */
  label?: string
  /**
   * Helper text displayed below the input
   */
  description?: string
  /**
   * Error message to display
   */
  error?: string
  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean
  /**
   * Whether the field is disabled
   * @default false
   */
  disabled?: boolean
  /**
   * Additional class names for the container
   */
  className?: string
  /**
   * Additional class names for the label
   */
  labelClassName?: string
  /**
   * Additional class names for the input
   */
  inputClassName?: string
  /**
   * Whether to hide the label visually (still accessible to screen readers)
   * @default false
   */
  hideLabel?: boolean
  /**
   * Custom label component (overrides label prop)
   */
  labelComponent?: React.ReactNode
  /**
   * Input type
   * @default 'text'
   */
  type?: FormFieldInputType
}

/**
 * Props for text-like inputs
 */
export interface FormFieldInputProps
  extends FormFieldBaseProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'name' | 'id'> {
  type?: Exclude<FormFieldInputType, 'textarea' | 'select'>
}

/**
 * Props for textarea
 */
export interface FormFieldTextareaProps
  extends FormFieldBaseProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'id'> {
  type: 'textarea'
  /**
   * Number of rows for the textarea
   */
  rows?: number
}

/**
 * Props for select
 */
export interface FormFieldSelectProps
  extends FormFieldBaseProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'id'> {
  type: 'select'
  /**
   * Select options
   */
  options: Array<{ value: string; label: string; disabled?: boolean }>
  /**
   * Placeholder option text
   */
  placeholder?: string
}

/**
 * Props for checkbox
 */
export interface FormFieldCheckboxProps
  extends FormFieldBaseProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'name' | 'id'> {
  type: 'checkbox'
  /**
   * Checkbox label (displayed inline)
   */
  checkboxLabel?: string
}

/**
 * Props for radio group
 */
export interface FormFieldRadioProps extends FormFieldBaseProps {
  type: 'radio'
  /**
   * Radio options
   */
  options: Array<{ value: string; label: string; disabled?: boolean }>
  /**
   * Current value
   */
  value?: string
  /**
   * Change handler
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  /**
   * Blur handler
   */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

/**
 * Union type for all form field props
 */
export type FormFieldProps =
  | FormFieldInputProps
  | FormFieldTextareaProps
  | FormFieldSelectProps
  | FormFieldCheckboxProps
  | FormFieldRadioProps

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Required indicator asterisk
 */
const RequiredIndicator = () => (
  <span className="text-red-500 ml-0.5" aria-hidden="true">
    *
  </span>
)

/**
 * Screen reader only text for required fields
 */
const RequiredText = () => (
  <span className="sr-only">(required)</span>
)

/**
 * Description/helper text component
 */
const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500 mt-1.5', className)}
    {...props}
  />
))
FieldDescription.displayName = 'FieldDescription'

// ============================================================================
// Input Variants
// ============================================================================

/**
 * Renders a standard input field
 */
const InputField = React.forwardRef<HTMLInputElement, FormFieldInputProps>(
  ({ inputClassName, error, 'aria-describedby': describedBy, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn(
        error && 'border-red-500 focus-visible:ring-red-500',
        inputClassName
      )}
      aria-describedby={describedBy}
      {...props}
    />
  )
)
InputField.displayName = 'InputField'

/**
 * Renders a textarea field
 */
const TextareaField = React.forwardRef<
  HTMLTextAreaElement,
  Omit<FormFieldTextareaProps, 'type'>
>(({ inputClassName, error, 'aria-describedby': describedBy, rows = 4, ...props }, ref) => (
  <Textarea
    ref={ref}
    rows={rows}
    className={cn(
      error && 'border-red-500 focus-visible:ring-red-500',
      inputClassName
    )}
    aria-describedby={describedBy}
    {...props}
  />
))
TextareaField.displayName = 'TextareaField'

/**
 * Renders a select field
 */
const SelectField = React.forwardRef<
  HTMLSelectElement,
  Omit<FormFieldSelectProps, 'type'>
>(({ inputClassName, error, options, placeholder, 'aria-describedby': describedBy, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      error && 'border-red-500 focus-visible:ring-red-500',
      inputClassName
    )}
    aria-describedby={describedBy}
    {...props}
  >
    {placeholder && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {options.map((option) => (
      <option key={option.value} value={option.value} disabled={option.disabled}>
        {option.label}
      </option>
    ))}
  </select>
))
SelectField.displayName = 'SelectField'

/**
 * Renders a checkbox field
 */
const CheckboxField = React.forwardRef<
  HTMLInputElement,
  Omit<FormFieldCheckboxProps, 'type'> & { fieldId: string }
>(({ inputClassName, error, checkboxLabel, label, fieldId, 'aria-describedby': describedBy, ...props }, ref) => (
  <div className="flex items-center gap-2">
    <input
      ref={ref}
      type="checkbox"
      id={fieldId}
      className={cn(
        'h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0',
        error && 'border-red-500',
        inputClassName
      )}
      aria-describedby={describedBy}
      {...props}
    />
    {(checkboxLabel || label) && (
      <label
        htmlFor={fieldId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {checkboxLabel || label}
      </label>
    )}
  </div>
))
CheckboxField.displayName = 'CheckboxField'

/**
 * Renders a radio group
 */
const RadioGroupField = React.forwardRef<
  HTMLDivElement,
  Omit<FormFieldRadioProps, 'type'> & { fieldId: string; 'aria-describedby'?: string }
>(({ options, name, value, onChange, onBlur, error, inputClassName, fieldId, 'aria-describedby': describedBy, disabled, ...props }, ref) => (
  <div
    ref={ref}
    role="radiogroup"
    aria-describedby={describedBy}
    className="space-y-2"
  >
    {options.map((option, index) => (
      <div key={option.value} className="flex items-center gap-2">
        <input
          type="radio"
          id={`${fieldId}-${index}`}
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled || option.disabled}
          className={cn(
            'h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0',
            error && 'border-red-500',
            inputClassName
          )}
        />
        <label
          htmlFor={`${fieldId}-${index}`}
          className={cn(
            'text-sm font-medium leading-none',
            (disabled || option.disabled) && 'cursor-not-allowed opacity-70'
          )}
        >
          {option.label}
        </label>
      </div>
    ))}
  </div>
))
RadioGroupField.displayName = 'RadioGroupField'

// ============================================================================
// Main FormField Component
// ============================================================================

/**
 * A comprehensive form field component that wraps label, input, and error message
 * with full accessibility support.
 *
 * @example
 * ```tsx
 * // Basic text input
 * <FormField
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   required
 *   placeholder="you@example.com"
 *   error={errors.email}
 *   {...register('email')}
 * />
 *
 * // Textarea
 * <FormField
 *   name="bio"
 *   label="Biography"
 *   type="textarea"
 *   description="Tell us about yourself"
 *   rows={6}
 *   {...register('bio')}
 * />
 *
 * // Select
 * <FormField
 *   name="country"
 *   label="Country"
 *   type="select"
 *   options={[
 *     { value: 'uk', label: 'United Kingdom' },
 *     { value: 'us', label: 'United States' },
 *   ]}
 *   placeholder="Select a country"
 *   {...register('country')}
 * />
 *
 * // Checkbox
 * <FormField
 *   name="terms"
 *   type="checkbox"
 *   checkboxLabel="I agree to the terms and conditions"
 *   error={errors.terms}
 *   {...register('terms')}
 * />
 *
 * // Radio group
 * <FormField
 *   name="plan"
 *   label="Subscription Plan"
 *   type="radio"
 *   options={[
 *     { value: 'free', label: 'Free' },
 *     { value: 'pro', label: 'Professional' },
 *     { value: 'enterprise', label: 'Enterprise' },
 *   ]}
 *   {...register('plan')}
 * />
 * ```
 */
const FormField = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLDivElement,
  FormFieldProps
>((props, ref) => {
  const {
    id,
    name,
    label,
    description,
    error,
    required = false,
    disabled = false,
    className,
    labelClassName,
    hideLabel = false,
    labelComponent,
    type = 'text',
    ...restProps
  } = props

  // Generate unique IDs
  const generatedId = React.useId()
  const fieldId = id || `field-${generatedId}`
  const errorId = `${fieldId}-error`
  const descriptionId = description ? `${fieldId}-description` : undefined

  // Build aria-describedby
  const describedByParts: string[] = []
  if (error) describedByParts.push(errorId)
  if (descriptionId) describedByParts.push(descriptionId)
  const describedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined

  // Don't show label for checkbox (it's inline)
  const showTopLabel = type !== 'checkbox' && (label || labelComponent)

  // Render the appropriate input type
  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      name,
      disabled,
      'aria-invalid': !!error,
      'aria-describedby': describedBy,
      'aria-required': required,
    }

    switch (type) {
      case 'textarea':
        return (
          <TextareaField
            ref={ref as React.Ref<HTMLTextAreaElement>}
            {...commonProps}
            {...(restProps as Omit<FormFieldTextareaProps, 'type'>)}
            error={error}
          />
        )

      case 'select':
        return (
          <SelectField
            ref={ref as React.Ref<HTMLSelectElement>}
            {...commonProps}
            {...(restProps as Omit<FormFieldSelectProps, 'type'>)}
            error={error}
          />
        )

      case 'checkbox':
        return (
          <CheckboxField
            ref={ref as React.Ref<HTMLInputElement>}
            fieldId={fieldId}
            {...commonProps}
            {...(restProps as Omit<FormFieldCheckboxProps, 'type'>)}
            label={label}
            error={error}
          />
        )

      case 'radio':
        return (
          <RadioGroupField
            ref={ref as React.Ref<HTMLDivElement>}
            fieldId={fieldId}
            {...commonProps}
            {...(restProps as Omit<FormFieldRadioProps, 'type'>)}
            error={error}
          />
        )

      default:
        return (
          <InputField
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            {...commonProps}
            {...(restProps as Omit<FormFieldInputProps, 'type'>)}
            error={error}
          />
        )
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label */}
      {showTopLabel && (
        labelComponent ? (
          labelComponent
        ) : (
          <Label
            htmlFor={fieldId}
            className={cn(
              hideLabel && 'sr-only',
              error && 'text-red-700',
              labelClassName
            )}
          >
            {label}
            {required && <RequiredIndicator />}
            {required && <RequiredText />}
          </Label>
        )
      )}

      {/* Input */}
      {renderInput()}

      {/* Description */}
      {description && !error && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}

      {/* Error message */}
      {error && (
        <FormError
          id={errorId}
          message={error}
          inline
          aria-live="polite"
        />
      )}
    </div>
  )
})
FormField.displayName = 'FormField'

// ============================================================================
// FormFieldGroup Component
// ============================================================================

export interface FormFieldGroupProps extends React.HTMLAttributes<HTMLFieldSetElement> {
  /**
   * Group legend/title
   */
  legend?: string
  /**
   * Description text
   */
  description?: string
  /**
   * Whether to visually hide the legend
   */
  hideLegend?: boolean
  /**
   * Error message for the group
   */
  error?: string
}

/**
 * Groups related form fields with a fieldset and legend
 *
 * @example
 * ```tsx
 * <FormFieldGroup legend="Contact Information">
 *   <FormField name="firstName" label="First Name" />
 *   <FormField name="lastName" label="Last Name" />
 *   <FormField name="email" label="Email" type="email" />
 * </FormFieldGroup>
 * ```
 */
const FormFieldGroup = React.forwardRef<HTMLFieldSetElement, FormFieldGroupProps>(
  ({ legend, description, hideLegend, error, className, children, ...props }, ref) => {
    const groupId = React.useId()
    const errorId = `${groupId}-error`

    return (
      <fieldset
        ref={ref}
        className={cn('space-y-4', className)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      >
        {legend && (
          <legend
            className={cn(
              'text-base font-semibold text-gray-900',
              hideLegend && 'sr-only'
            )}
          >
            {legend}
          </legend>
        )}
        {description && (
          <p className="text-sm text-gray-500 -mt-2">{description}</p>
        )}
        {children}
        {error && (
          <FormError id={errorId} message={error} inline />
        )}
      </fieldset>
    )
  }
)
FormFieldGroup.displayName = 'FormFieldGroup'

// ============================================================================
// FormFieldRow Component
// ============================================================================

export interface FormFieldRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns (1-4)
   * @default 2
   */
  columns?: 1 | 2 | 3 | 4
}

/**
 * Arranges form fields in a responsive row
 *
 * @example
 * ```tsx
 * <FormFieldRow columns={2}>
 *   <FormField name="firstName" label="First Name" />
 *   <FormField name="lastName" label="Last Name" />
 * </FormFieldRow>
 * ```
 */
const FormFieldRow = React.forwardRef<HTMLDivElement, FormFieldRowProps>(
  ({ columns = 2, className, children, ...props }, ref) => {
    const gridClass = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    }[columns]

    return (
      <div
        ref={ref}
        className={cn('grid gap-4', gridClass, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FormFieldRow.displayName = 'FormFieldRow'

// ============================================================================
// Exports
// ============================================================================

export {
  FormField,
  FormFieldGroup,
  FormFieldRow,
  FieldDescription,
  RequiredIndicator,
}
