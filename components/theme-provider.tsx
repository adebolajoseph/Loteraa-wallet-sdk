'use client'

import React from 'react'
import { ThemeProvider as Provider } from 'next-themes'
import type { ThemeProviderProps as ProviderOptions } from 'next-themes'

export function UIThemeProvider({ children, ...options }: ProviderOptions) {
  return <Provider {...options}>{children}</Provider>
}
