import { createContext, useContext } from 'react'
import { DEFAULT_THEME } from './themes'

export const ThemeContext = createContext(DEFAULT_THEME)
export const useTheme = () => useContext(ThemeContext)
