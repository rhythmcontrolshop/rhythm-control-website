'use client'

import { useState } from 'react'

interface PasswordInputProps {
  id: string
  name: string
  label: string
  placeholder?: string
  required?: boolean
  autoComplete?: string
  minLength?: number
}

export default function PasswordInput({
  id, name, label, placeholder = '••••••••',
  required = true, autoComplete = 'current-password', minLength
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="text-xs block mb-2" style={{ color: 'var(--rc-color-text)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          className="w-full text-sm px-4 py-3 pr-10 focus:outline-none"
          style={{
            border: 'var(--rc-border-main)',
            color: 'var(--rc-color-text)',
            letterSpacing: '0.07em',
            backgroundColor: 'var(--rc-color-bg)',
          }}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--rc-color-muted)' }}
        >
          {showPassword ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
